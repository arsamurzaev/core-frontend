"use client";

import {
  archiveCatalogPriceList,
  catalogPriceListQueryKeys,
  createCatalogPriceList,
  setActiveCatalogPriceList,
  updateCatalogPriceList,
  useCatalogPriceLists,
  type CatalogPriceList,
} from "@/core/modules/catalog-price-list";
import { invalidateProductQueries } from "@/core/modules/product";
import {
  type CatalogControllerGetCurrentQueryResult,
  getCatalogControllerGetCurrentFeaturesQueryKey,
  getCatalogControllerGetCurrentQueryKey,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { confirmDelete } from "@/shared/ui/confirmation";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ChevronRight, Loader2, Plus, Save } from "lucide-react";
import React from "react";
import { toast } from "sonner";

type PriceListDraft = {
  name: string;
  description: string;
  displayOrder: string;
  isActive: boolean;
};

type CatalogCurrentWithActivePriceList =
  CatalogControllerGetCurrentQueryResult & {
    settings:
      | (CatalogControllerGetCurrentQueryResult["settings"] & {
          activePriceListId?: string | null;
        })
      | null;
  };

const emptyDraft: PriceListDraft = {
  name: "",
  description: "",
  displayOrder: "0",
  isActive: true,
};

const LEGACY_PRICE_VALUE = "__legacy__";

function toDraft(priceList: CatalogPriceList): PriceListDraft {
  return {
    name: priceList.name,
    description: priceList.description ?? "",
    displayOrder: String(priceList.displayOrder ?? 0),
    isActive: priceList.isActive,
  };
}

function parseDisplayOrder(value: string): number {
  const parsed = Number(value.trim() || "0");
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error("Порядок должен быть целым числом от 0.");
  }
  return parsed;
}

function normalizeText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

type ActivePriceListSelectorProps = {
  disabled: boolean;
  isChildCatalog: boolean;
  onValueChange: (value: string) => void;
  priceLists: CatalogPriceList[];
  value: string;
};

const ActivePriceListSelector: React.FC<ActivePriceListSelectorProps> = ({
  disabled,
  isChildCatalog,
  onValueChange,
  priceLists,
  value,
}) => {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Label>Активный прайс</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            {isChildCatalog
              ? "Выберите прайс родительского каталога для этой витрины."
              : "Выберите, какие цены будет использовать родительский каталог."}
          </p>
        </div>
      </div>

      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        className="mt-4 gap-2"
      >
        <Label
          htmlFor="catalog-active-price-list-legacy"
          className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
        >
          <RadioGroupItem
            id="catalog-active-price-list-legacy"
            value={LEGACY_PRICE_VALUE}
          />
          <span className="grid gap-1">
            <span className="text-sm font-medium">Старая цена</span>
            <span className="text-xs text-muted-foreground">
              Каталог будет работать по ценам товаров, вариаций и единиц
              продажи.
            </span>
          </span>
        </Label>

        {priceLists.map((priceList) => (
          <Label
            key={priceList.id}
            htmlFor={`catalog-active-price-list-${priceList.id}`}
            className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
          >
            <RadioGroupItem
              id={`catalog-active-price-list-${priceList.id}`}
              value={priceList.id}
              disabled={!priceList.isActive}
            />
            <span className="grid gap-1">
              <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {priceList.name}
                {!priceList.isActive ? (
                  <Badge variant="secondary">Отключен</Badge>
                ) : null}
              </span>
              {priceList.description ? (
                <span className="text-xs text-muted-foreground">
                  {priceList.description}
                </span>
              ) : null}
            </span>
          </Label>
        ))}
      </RadioGroup>

      {priceLists.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Активных прайс-листов пока нет.
        </p>
      ) : null}
    </div>
  );
};

interface EditCatalogPriceListsDrawerProps {
  disabled?: boolean;
}

export const EditCatalogPriceListsDrawer: React.FC<
  EditCatalogPriceListsDrawerProps
> = ({ disabled = false }) => {
  const queryClient = useQueryClient();
  const { catalog } = useCatalogState();
  const isChildCatalog = Boolean(catalog?.parentId);
  const settings = catalog?.settings as {
    activePriceListId?: string | null;
  } | null;
  const activePriceListId = settings?.activePriceListId ?? null;
  const [open, setOpen] = React.useState(false);
  const [selectedActiveValue, setSelectedActiveValue] =
    React.useState(LEGACY_PRICE_VALUE);
  const [committedActivePriceListId, setCommittedActivePriceListId] =
    React.useState<string | null | undefined>(undefined);
  const [createDraft, setCreateDraft] = React.useState(emptyDraft);
  const [draftsById, setDraftsById] = React.useState<
    Record<string, PriceListDraft>
  >({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const priceListsQuery = useCatalogPriceLists(
    { includeInactive: !isChildCatalog },
    { enabled: open && !disabled },
  );
  const createMutation = useMutation({ mutationFn: createCatalogPriceList });
  const updateMutation = useMutation({ mutationFn: updateCatalogPriceList });
  const archiveMutation = useMutation({ mutationFn: archiveCatalogPriceList });
  const setActiveMutation = useMutation({
    mutationFn: setActiveCatalogPriceList,
  });
  const priceLists = React.useMemo(
    () =>
      [...(priceListsQuery.data ?? [])].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder ||
          left.name.localeCompare(right.name),
      ),
    [priceListsQuery.data],
  );
  const effectiveActivePriceListId =
    committedActivePriceListId !== undefined
      ? committedActivePriceListId
      : activePriceListId;
  const activeSelectorPriceLists = React.useMemo(() => {
    const active = priceLists.filter((priceList) => priceList.isActive);
    const selected = effectiveActivePriceListId
      ? priceLists.find(
          (priceList) => priceList.id === effectiveActivePriceListId,
        )
      : null;

    if (!selected || active.some((priceList) => priceList.id === selected.id)) {
      return active;
    }

    return [selected, ...active];
  }, [effectiveActivePriceListId, priceLists]);
  const savedActiveValue = React.useMemo(() => {
    if (!effectiveActivePriceListId) return LEGACY_PRICE_VALUE;
    return activeSelectorPriceLists.some(
      (priceList) => priceList.id === effectiveActivePriceListId,
    )
      ? effectiveActivePriceListId
      : LEGACY_PRICE_VALUE;
  }, [effectiveActivePriceListId, activeSelectorPriceLists]);
  const hasActiveSelectionChanges = selectedActiveValue !== savedActiveValue;
  const isBusy =
    disabled ||
    createMutation.isPending ||
    updateMutation.isPending ||
    archiveMutation.isPending ||
    setActiveMutation.isPending;

  React.useEffect(() => {
    setDraftsById(
      Object.fromEntries(priceLists.map((item) => [item.id, toDraft(item)])),
    );
  }, [priceLists]);

  React.useEffect(() => {
    setCommittedActivePriceListId(undefined);
  }, [catalog?.id]);

  React.useEffect(() => {
    if (
      committedActivePriceListId !== undefined &&
      activePriceListId === committedActivePriceListId
    ) {
      setCommittedActivePriceListId(undefined);
    }
  }, [activePriceListId, committedActivePriceListId]);

  React.useEffect(() => {
    if (open) {
      setSelectedActiveValue(savedActiveValue);
    }
  }, [open, savedActiveValue]);

  const refresh = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: catalogPriceListQueryKeys.all,
      }),
      queryClient.invalidateQueries({
        queryKey: getCatalogControllerGetCurrentQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getCatalogControllerGetCurrentFeaturesQueryKey(),
      }),
      invalidateProductQueries(queryClient),
    ]);
  }, [queryClient]);

  const handleError = React.useCallback((error: unknown) => {
    const message = extractApiErrorMessage(error);
    setErrorMessage(message);
    toast.error(message);
  }, []);

  const handleCreate = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const name = normalizeText(createDraft.name);
      if (!name) throw new Error("Название обязательно.");
      await createMutation.mutateAsync({
        name,
        description: normalizeText(createDraft.description) ?? null,
        displayOrder: parseDisplayOrder(createDraft.displayOrder),
        isActive: createDraft.isActive,
      });
      setCreateDraft(emptyDraft);
      await refresh();
      toast.success("Прайс-лист создан");
    } catch (error) {
      handleError(error);
    }
  }, [createDraft, createMutation, handleError, refresh]);

  const handleSave = React.useCallback(
    async (priceList: CatalogPriceList) => {
      try {
        setErrorMessage(null);
        const draft = draftsById[priceList.id] ?? toDraft(priceList);
        const name = normalizeText(draft.name);
        if (!name) throw new Error("Название обязательно.");
        await updateMutation.mutateAsync({
          id: priceList.id,
          payload: {
            name,
            description: normalizeText(draft.description) ?? null,
            displayOrder: parseDisplayOrder(draft.displayOrder),
            isActive: draft.isActive,
          },
        });
        await refresh();
        toast.success("Прайс-лист сохранен");
      } catch (error) {
        handleError(error);
      }
    },
    [draftsById, handleError, refresh, updateMutation],
  );

  const handleArchive = React.useCallback(
    async (priceList: CatalogPriceList) => {
      const confirmed = await confirmDelete({
        title: "Архивировать прайс-лист",
        description: priceList.name,
      });
      if (!confirmed) return;
      try {
        setErrorMessage(null);
        await archiveMutation.mutateAsync(priceList.id);
        await refresh();
        toast.success("Прайс-лист архивирован");
      } catch (error) {
        handleError(error);
      }
    },
    [archiveMutation, handleError, refresh],
  );

  const handleActiveSave = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const nextActivePriceListId =
        selectedActiveValue === LEGACY_PRICE_VALUE ? null : selectedActiveValue;
      const saved = await setActiveMutation.mutateAsync(nextActivePriceListId);
      const savedActivePriceListId = saved.activePriceListId ?? null;
      const savedActiveValue =
        savedActivePriceListId === null
          ? LEGACY_PRICE_VALUE
          : savedActivePriceListId;

      setCommittedActivePriceListId(savedActivePriceListId);
      setSelectedActiveValue(savedActiveValue);
      queryClient.setQueriesData<CatalogCurrentWithActivePriceList>(
        { queryKey: getCatalogControllerGetCurrentQueryKey() },
        (current) =>
          current
            ? {
                ...current,
                settings: current.settings
                  ? {
                      ...current.settings,
                      activePriceListId: savedActivePriceListId,
                    }
                  : current.settings,
              }
            : current,
      );
      await refresh();
      toast.success("Активный прайс сохранен");
    } catch (error) {
      handleError(error);
    }
  }, [
    handleError,
    queryClient,
    refresh,
    selectedActiveValue,
    setActiveMutation,
  ]);

  return (
    <AppDrawer
      nested
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setErrorMessage(null);
      }}
      dismissible={!isBusy}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full min-w-0 items-start justify-between rounded-2xl border border-black/10 px-4 py-4 text-left whitespace-normal hover:bg-muted/30"
          disabled={disabled}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Прайс-листы
              </span>
              <Badge variant="secondary">Бета</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isChildCatalog
                ? "Активный прайс для витрины."
                : "Прайсы для торговых представителей и родительского каталога."}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Прайс-листы"
            description={
              isChildCatalog
                ? "Выберите прайс-лист родительского каталога."
                : "Создавайте прайсы, управляйте доступностью и выберите прайс для родительского каталога."
            }
            withCloseButton={!isBusy}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-5">
              {priceListsQuery.isLoading ? (
                <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Загрузка...
                </div>
              ) : (
                <>
                  <ActivePriceListSelector
                    disabled={isBusy}
                    isChildCatalog={isChildCatalog}
                    onValueChange={setSelectedActiveValue}
                    priceLists={activeSelectorPriceLists}
                    value={selectedActiveValue}
                  />

                  {!isChildCatalog ? (
                    <>
                      <div className="rounded-lg border p-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                          <Input
                            value={createDraft.name}
                            onChange={(event) =>
                              setCreateDraft((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            placeholder="Название"
                            disabled={isBusy}
                          />
                          <Input
                            value={createDraft.displayOrder}
                            onChange={(event) =>
                              setCreateDraft((current) => ({
                                ...current,
                                displayOrder: event.target.value,
                              }))
                            }
                            inputMode="numeric"
                            disabled={isBusy}
                          />
                          <Button
                            type="button"
                            className="h-10"
                            onClick={() => void handleCreate()}
                            disabled={isBusy}
                          >
                            <Plus className="size-4" />
                            Добавить
                          </Button>
                        </div>
                        <Textarea
                          value={createDraft.description}
                          onChange={(event) =>
                            setCreateDraft((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          className="mt-3 min-h-20"
                          placeholder="Описание"
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-3">
                        {priceLists.map((priceList) => {
                          const draft =
                            draftsById[priceList.id] ?? toDraft(priceList);

                          return (
                            <div
                              key={priceList.id}
                              className="rounded-lg border p-3"
                            >
                              <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto_auto]">
                                <Input
                                  value={draft.name}
                                  onChange={(event) =>
                                    setDraftsById((current) => ({
                                      ...current,
                                      [priceList.id]: {
                                        ...draft,
                                        name: event.target.value,
                                      },
                                    }))
                                  }
                                  disabled={isBusy}
                                />
                                <Input
                                  value={draft.displayOrder}
                                  onChange={(event) =>
                                    setDraftsById((current) => ({
                                      ...current,
                                      [priceList.id]: {
                                        ...draft,
                                        displayOrder: event.target.value,
                                      },
                                    }))
                                  }
                                  inputMode="numeric"
                                  disabled={isBusy}
                                />
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={draft.isActive}
                                    onCheckedChange={(checked) =>
                                      setDraftsById((current) => ({
                                        ...current,
                                        [priceList.id]: {
                                          ...draft,
                                          isActive: checked,
                                        },
                                      }))
                                    }
                                    disabled={isBusy}
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    Активен
                                  </span>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={() => void handleSave(priceList)}
                                    disabled={isBusy}
                                  >
                                    <Save className="size-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={() =>
                                      void handleArchive(priceList)
                                    }
                                    disabled={isBusy}
                                  >
                                    <Archive className="size-4" />
                                  </Button>
                                </div>
                              </div>
                              <Textarea
                                value={draft.description}
                                onChange={(event) =>
                                  setDraftsById((current) => ({
                                    ...current,
                                    [priceList.id]: {
                                      ...draft,
                                      description: event.target.value,
                                    },
                                  }))
                                }
                                className="mt-3 min-h-20"
                                disabled={isBusy}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </>
              )}

              {errorMessage ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            btnText="Сохранить"
            handleClick={() => void handleActiveSave()}
            isAutoClose={false}
            isFooterBtnDisabled={isBusy || !hasActiveSelectionChanges}
            loading={setActiveMutation.isPending}
            buttonType="button"
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
