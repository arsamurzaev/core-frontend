"use client";

import { invalidateProductQueries } from "@/core/modules/product";
import {
  archiveCatalogModifierGroup,
  archiveCatalogModifierOption,
  createCatalogModifierGroup,
  createCatalogModifierOption,
  productModifierQueryKeys,
  updateCatalogModifierGroup,
  updateCatalogModifierOption,
  useCatalogModifierState,
  type CatalogModifierGroupOptionPayload,
} from "@/core/modules/product-modifier";
import {
  type CatalogModifierGroup,
  type CatalogModifierGroupOption,
  type CatalogModifierOption,
} from "@/core/modules/product-modifier";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import {
  getCatalogPriceFormatMode,
  getCatalogPriceInputProps,
} from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { AdminPanel, AdminPanelButton } from "@/shared/ui/admin-panel";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { confirmDelete } from "@/shared/ui/confirmation";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Save,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

type OptionDraft = {
  name: string;
  defaultPrice: string;
};

type GroupDraft = {
  name: string;
  description: string;
  isActive: boolean;
  isRequired: boolean;
  minSelected: string;
  maxSelected: string;
};

const emptyOptionDraft: OptionDraft = {
  name: "",
  defaultPrice: "0",
};

const emptyGroupDraft: GroupDraft = {
  name: "",
  description: "",
  isActive: true,
  isRequired: false,
  minSelected: "0",
  maxSelected: "",
};

function normalizeOptionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function normalizeNullableText(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function requireText(value: string, message: string): string {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    throw new Error(message);
  }
  return normalized;
}

function parseNonNegativeNumber(value: string, message: string): number {
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(message);
  }

  return parsed;
}

function parseNonNegativeInteger(value: string, message: string): number {
  const parsed = parseNonNegativeNumber(value, message);

  if (!Number.isInteger(parsed)) {
    throw new Error(message);
  }

  return parsed;
}

function parseOptionalPositiveInteger(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = parseNonNegativeInteger(
    normalized,
    "Введите лимит целым числом.",
  );
  if (parsed < 1) {
    throw new Error("Максимум должен быть больше нуля.");
  }

  return parsed;
}

function parseOptionalPrice(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  return parseNonNegativeNumber(value, "Введите корректную цену.");
}

function priceToInput(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }

  return Number.isInteger(parsed) ? String(parsed) : String(parsed);
}

function resolveErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : extractApiErrorMessage(error);
}

function sortOptions(
  options: CatalogModifierOption[],
): CatalogModifierOption[] {
  return options
    .filter((option) => !option.deleteAt)
    .slice()
    .sort((left, right) => {
      if (left.displayOrder !== right.displayOrder) {
        return left.displayOrder - right.displayOrder;
      }

      return left.name.localeCompare(right.name, "ru");
    });
}

function sortGroups(groups: CatalogModifierGroup[]): CatalogModifierGroup[] {
  return groups
    .filter((group) => !group.deleteAt)
    .slice()
    .sort((left, right) => {
      if (left.displayOrder !== right.displayOrder) {
        return left.displayOrder - right.displayOrder;
      }

      return left.name.localeCompare(right.name, "ru");
    });
}

function sortGroupOptions(
  options: CatalogModifierGroupOption[],
): CatalogModifierGroupOption[] {
  return options
    .filter((option) => !option.option.deleteAt)
    .slice()
    .sort((left, right) => {
      if (left.displayOrder !== right.displayOrder) {
        return left.displayOrder - right.displayOrder;
      }

      return left.option.name.localeCompare(right.option.name, "ru");
    });
}

function resolveNextDisplayOrder<T extends { displayOrder: number }>(
  items: T[],
): number {
  return items.reduce((max, item) => Math.max(max, item.displayOrder), -1) + 1;
}

function toOptionDraft(option: CatalogModifierOption): OptionDraft {
  return {
    name: option.name,
    defaultPrice: priceToInput(option.defaultPrice),
  };
}

function toGroupDraft(group: CatalogModifierGroup): GroupDraft {
  return {
    name: group.name,
    description: group.description ?? "",
    isActive: group.isActive,
    isRequired: group.isRequired,
    minSelected: String(group.minSelected),
    maxSelected: group.maxSelected === null ? "" : String(group.maxSelected),
  };
}

function toGroupOptionPayload(
  option: CatalogModifierGroupOption,
): CatalogModifierGroupOptionPayload {
  return {
    optionId: option.optionId,
    defaultPrice:
      option.defaultPrice === null
        ? null
        : parseOptionalPrice(option.defaultPrice),
    isDefault: option.isDefault,
    isActive: option.isActive,
    displayOrder: option.displayOrder,
  };
}

function buildGroupOptionsPayload(
  group: CatalogModifierGroup,
  update: (
    options: CatalogModifierGroupOptionPayload[],
  ) => CatalogModifierGroupOptionPayload[],
): CatalogModifierGroupOptionPayload[] {
  return update(sortGroupOptions(group.options).map(toGroupOptionPayload)).map(
    (option, index) => ({
      ...option,
      displayOrder: index,
    }),
  );
}

function ModifiersSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(240px,320px)_1fr]">
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-panel" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-panel" />
    </div>
  );
}

interface EditCatalogModifiersDrawerProps {
  disabled?: boolean;
}

export const EditCatalogModifiersDrawer: React.FC<
  EditCatalogModifiersDrawerProps
> = ({ disabled = false }) => {
  const queryClient = useQueryClient();
  const { catalog } = useCatalogState();
  const priceFormatMode = getCatalogPriceFormatMode(catalog);
  const priceInputProps = getCatalogPriceInputProps(priceFormatMode);
  const [open, setOpen] = React.useState(false);
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(
    null,
  );
  const [createOptionDraft, setCreateOptionDraft] =
    React.useState<OptionDraft>(emptyOptionDraft);
  const [createGroupDraft, setCreateGroupDraft] =
    React.useState<GroupDraft>(emptyGroupDraft);
  const [optionDraftsById, setOptionDraftsById] = React.useState<
    Record<string, OptionDraft>
  >({});
  const [groupDraftsById, setGroupDraftsById] = React.useState<
    Record<string, GroupDraft>
  >({});
  const [groupOptionPricesById, setGroupOptionPricesById] = React.useState<
    Record<string, string>
  >({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const stateQuery = useCatalogModifierState(
    { includeInactive: true, includeArchived: false },
    { enabled: open && !disabled },
  );
  const createOptionMutation = useMutation({
    mutationFn: createCatalogModifierOption,
  });
  const updateOptionMutation = useMutation({
    mutationFn: updateCatalogModifierOption,
  });
  const archiveOptionMutation = useMutation({
    mutationFn: archiveCatalogModifierOption,
  });
  const createGroupMutation = useMutation({
    mutationFn: createCatalogModifierGroup,
  });
  const updateGroupMutation = useMutation({
    mutationFn: updateCatalogModifierGroup,
  });
  const archiveGroupMutation = useMutation({
    mutationFn: archiveCatalogModifierGroup,
  });

  const options = React.useMemo(
    () => sortOptions(stateQuery.data?.options ?? []),
    [stateQuery.data?.options],
  );
  const groups = React.useMemo(
    () => sortGroups(stateQuery.data?.groups ?? []),
    [stateQuery.data?.groups],
  );
  const selectedGroup = React.useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );
  const selectedGroupOptions = React.useMemo(
    () => (selectedGroup ? sortGroupOptions(selectedGroup.options) : []),
    [selectedGroup],
  );
  const selectedGroupOptionByOptionId = React.useMemo(
    () =>
      new Map(
        selectedGroupOptions.map((groupOption) => [
          groupOption.optionId,
          groupOption,
        ]),
      ),
    [selectedGroupOptions],
  );
  const groupDraft =
    selectedGroup && groupDraftsById[selectedGroup.id]
      ? groupDraftsById[selectedGroup.id]
      : selectedGroup
        ? toGroupDraft(selectedGroup)
        : emptyGroupDraft;
  const isMutating =
    createOptionMutation.isPending ||
    updateOptionMutation.isPending ||
    archiveOptionMutation.isPending ||
    createGroupMutation.isPending ||
    updateGroupMutation.isPending ||
    archiveGroupMutation.isPending;
  const isBusy = disabled || isMutating;

  React.useEffect(() => {
    setOptionDraftsById(
      Object.fromEntries(
        options.map((option) => [option.id, toOptionDraft(option)]),
      ),
    );
  }, [options]);

  React.useEffect(() => {
    setGroupDraftsById(
      Object.fromEntries(
        groups.map((group) => [group.id, toGroupDraft(group)]),
      ),
    );
  }, [groups]);

  React.useEffect(() => {
    setGroupOptionPricesById(
      Object.fromEntries(
        groups.flatMap((group) =>
          group.options.map((option) => [
            `${group.id}:${option.optionId}`,
            priceToInput(option.defaultPrice),
          ]),
        ),
      ),
    );
  }, [groups]);

  React.useEffect(() => {
    if (!open || selectedGroupId) {
      return;
    }

    setSelectedGroupId(groups[0]?.id ?? null);
  }, [groups, open, selectedGroupId]);

  React.useEffect(() => {
    if (
      !selectedGroupId ||
      groups.some((group) => group.id === selectedGroupId)
    ) {
      return;
    }

    setSelectedGroupId(groups[0]?.id ?? null);
  }, [groups, selectedGroupId]);

  const refreshModifiers = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: productModifierQueryKeys.all,
      }),
      invalidateProductQueries(queryClient),
    ]);
  }, [queryClient]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      setErrorMessage(null);

      if (nextOpen) {
        void stateQuery.refetch();
      }
    },
    [stateQuery],
  );

  const handleError = React.useCallback((error: unknown) => {
    const message = resolveErrorMessage(error);
    setErrorMessage(message);
    toast.error(message);
  }, []);

  const handleCreateOption = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      await createOptionMutation.mutateAsync({
        name: requireText(
          createOptionDraft.name,
          "Введите название модификатора.",
        ),
        defaultPrice: parseNonNegativeNumber(
          createOptionDraft.defaultPrice,
          "Введите корректную цену.",
        ),
        displayOrder: resolveNextDisplayOrder(options),
      });
      setCreateOptionDraft(emptyOptionDraft);
      toast.success("Модификатор добавлен.");
      await refreshModifiers();
    } catch (error) {
      handleError(error);
    }
  }, [
    createOptionDraft,
    createOptionMutation,
    handleError,
    options,
    refreshModifiers,
  ]);

  const handleUpdateOption = React.useCallback(
    async (option: CatalogModifierOption) => {
      const draft = optionDraftsById[option.id] ?? toOptionDraft(option);

      try {
        setErrorMessage(null);
        await updateOptionMutation.mutateAsync({
          id: option.id,
          payload: {
            name: requireText(draft.name, "Введите название модификатора."),
            defaultPrice: parseNonNegativeNumber(
              draft.defaultPrice,
              "Введите корректную цену.",
            ),
          },
        });
        toast.success("Модификатор сохранен.");
        await refreshModifiers();
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, optionDraftsById, refreshModifiers, updateOptionMutation],
  );

  const handleToggleOptionActive = React.useCallback(
    async (option: CatalogModifierOption, isActive: boolean) => {
      try {
        setErrorMessage(null);
        await updateOptionMutation.mutateAsync({
          id: option.id,
          payload: { isActive },
        });
        await refreshModifiers();
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, refreshModifiers, updateOptionMutation],
  );

  const handleMoveOption = React.useCallback(
    async (option: CatalogModifierOption, direction: -1 | 1) => {
      const index = options.findIndex((item) => item.id === option.id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= options.length) {
        return;
      }

      const nextOptions = options.slice();
      [nextOptions[index], nextOptions[targetIndex]] = [
        nextOptions[targetIndex],
        nextOptions[index],
      ];

      try {
        setErrorMessage(null);
        await Promise.all(
          nextOptions.map((item, nextIndex) =>
            item.displayOrder === nextIndex
              ? Promise.resolve()
              : updateOptionMutation.mutateAsync({
                  id: item.id,
                  payload: { displayOrder: nextIndex },
                }),
          ),
        );
        await refreshModifiers();
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, options, refreshModifiers, updateOptionMutation],
  );

  const handleArchiveOption = React.useCallback(
    async (option: CatalogModifierOption) => {
      const confirmed = await confirmDelete({
        title: "Архивировать модификатор?",
        description: `Модификатор "${option.name}" исчезнет из новых настроек групп. В уже сохраненных товарах привязки сохранятся.`,
        confirmText: "Архивировать",
        cancelText: "Отмена",
        tone: "destructive",
      });

      if (!confirmed) return;

      try {
        setErrorMessage(null);
        await archiveOptionMutation.mutateAsync(option.id);
        toast.success("Модификатор архивирован.");
        await refreshModifiers();
      } catch (error) {
        handleError(error);
      }
    },
    [archiveOptionMutation, handleError, refreshModifiers],
  );

  const handleCreateGroup = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      const isRequired = createGroupDraft.isRequired;
      const minSelected = parseNonNegativeInteger(
        createGroupDraft.minSelected,
        "Введите минимум целым числом.",
      );
      const maxSelected = parseOptionalPositiveInteger(
        createGroupDraft.maxSelected,
      );
      const group = await createGroupMutation.mutateAsync({
        name: requireText(createGroupDraft.name, "Введите название группы."),
        description: normalizeNullableText(createGroupDraft.description),
        isActive: createGroupDraft.isActive,
        isRequired,
        minSelected,
        maxSelected,
        displayOrder: resolveNextDisplayOrder(groups),
      });
      setCreateGroupDraft(emptyGroupDraft);
      setSelectedGroupId(group.id);
      toast.success("Группа модификаторов создана.");
      await refreshModifiers();
    } catch (error) {
      handleError(error);
    }
  }, [
    createGroupDraft,
    createGroupMutation,
    groups,
    handleError,
    refreshModifiers,
  ]);

  const handleUpdateGroup = React.useCallback(async () => {
    if (!selectedGroup) {
      return;
    }

    try {
      setErrorMessage(null);
      await updateGroupMutation.mutateAsync({
        id: selectedGroup.id,
        payload: {
          name: requireText(groupDraft.name, "Введите название группы."),
          description: normalizeNullableText(groupDraft.description),
          isActive: groupDraft.isActive,
          isRequired: groupDraft.isRequired,
          minSelected: parseNonNegativeInteger(
            groupDraft.minSelected,
            "Введите минимум целым числом.",
          ),
          maxSelected: parseOptionalPositiveInteger(groupDraft.maxSelected),
        },
      });
      toast.success("Группа сохранена.");
      await refreshModifiers();
    } catch (error) {
      handleError(error);
    }
  }, [
    groupDraft,
    handleError,
    refreshModifiers,
    selectedGroup,
    updateGroupMutation,
  ]);

  const handleMoveGroup = React.useCallback(
    async (group: CatalogModifierGroup, direction: -1 | 1) => {
      const index = groups.findIndex((item) => item.id === group.id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= groups.length) {
        return;
      }

      const nextGroups = groups.slice();
      [nextGroups[index], nextGroups[targetIndex]] = [
        nextGroups[targetIndex],
        nextGroups[index],
      ];

      try {
        setErrorMessage(null);
        await Promise.all(
          nextGroups.map((item, nextIndex) =>
            item.displayOrder === nextIndex
              ? Promise.resolve()
              : updateGroupMutation.mutateAsync({
                  id: item.id,
                  payload: { displayOrder: nextIndex },
                }),
          ),
        );
        await refreshModifiers();
      } catch (error) {
        handleError(error);
      }
    },
    [groups, handleError, refreshModifiers, updateGroupMutation],
  );

  const handleArchiveGroup = React.useCallback(
    async (group: CatalogModifierGroup) => {
      const confirmed = await confirmDelete({
        title: "Архивировать группу?",
        description: `Группа "${group.name}" исчезнет из новых настроек товаров. В уже сохраненных товарах привязки сохранятся.`,
        confirmText: "Архивировать",
        cancelText: "Отмена",
        tone: "destructive",
      });

      if (!confirmed) return;

      try {
        setErrorMessage(null);
        await archiveGroupMutation.mutateAsync(group.id);
        toast.success("Группа архивирована.");
        await refreshModifiers();
      } catch (error) {
        handleError(error);
      }
    },
    [archiveGroupMutation, handleError, refreshModifiers],
  );

  const patchSelectedGroupOptions = React.useCallback(
    async (
      update: (
        options: CatalogModifierGroupOptionPayload[],
      ) => CatalogModifierGroupOptionPayload[],
    ) => {
      if (!selectedGroup) {
        return;
      }

      try {
        setErrorMessage(null);
        await updateGroupMutation.mutateAsync({
          id: selectedGroup.id,
          payload: {
            options: buildGroupOptionsPayload(selectedGroup, update),
          },
        });
        await refreshModifiers();
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, refreshModifiers, selectedGroup, updateGroupMutation],
  );

  const handleToggleGroupOption = React.useCallback(
    async (option: CatalogModifierOption, checked: boolean) => {
      await patchSelectedGroupOptions((current) => {
        const exists = current.some((item) => item.optionId === option.id);
        if (!checked) {
          return current.filter((item) => item.optionId !== option.id);
        }
        if (exists) {
          return current;
        }

        return [
          ...current,
          {
            optionId: option.id,
            defaultPrice: null,
            isDefault: false,
            isActive: true,
            displayOrder: current.length,
          },
        ];
      });
    },
    [patchSelectedGroupOptions],
  );

  const handlePatchGroupOption = React.useCallback(
    async (
      optionId: string,
      patch: Partial<CatalogModifierGroupOptionPayload>,
    ) => {
      await patchSelectedGroupOptions((current) =>
        current.map((item) =>
          item.optionId === optionId
            ? {
                ...item,
                ...patch,
              }
            : item,
        ),
      );
    },
    [patchSelectedGroupOptions],
  );

  const handleSaveGroupOptionPrice = React.useCallback(
    async (optionId: string) => {
      if (!selectedGroup) {
        return;
      }

      try {
        const draftKey = `${selectedGroup.id}:${optionId}`;
        const value = groupOptionPricesById[draftKey] ?? "";
        await handlePatchGroupOption(optionId, {
          defaultPrice: parseOptionalPrice(value),
        });
      } catch (error) {
        handleError(error);
      }
    },
    [groupOptionPricesById, handleError, handlePatchGroupOption, selectedGroup],
  );

  const handleMoveGroupOption = React.useCallback(
    async (optionId: string, direction: -1 | 1) => {
      await patchSelectedGroupOptions((current) => {
        const index = current.findIndex((item) => item.optionId === optionId);
        const targetIndex = index + direction;
        if (index < 0 || targetIndex < 0 || targetIndex >= current.length) {
          return current;
        }

        const next = current.slice();
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        return next.map((item, displayOrder) => ({
          ...item,
          displayOrder,
        }));
      });
    },
    [patchSelectedGroupOptions],
  );

  const defaultTrigger = (
    <AdminPanelButton disabled={disabled}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-text-primary">
            Модификаторы товаров
          </span>
          <Badge variant="secondary">
            {groups.length > 0 ? `${groups.length} групп` : "Бета"}
          </Badge>
        </div>
        <p className="mt-1 break-words text-sm text-text-muted whitespace-normal">
          Глобальные добавки и группы выбора: сыр, соусы, топпинги и другие
          опции к товару.
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-text-muted" />
    </AdminPanelButton>
  );

  return (
    <AppDrawer
      nested
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isMutating}
      trigger={defaultTrigger}
    >
      <AppDrawer.Content className="w-full max-w-5xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Модификаторы товаров"
            description="Создавайте глобальные опции и собирайте их в группы выбора для товаров."
            withCloseButton={!isMutating}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium">Справочник каталога</h3>
                  <p className="mt-1 text-sm text-text-muted">
                    Опции общие для каталога, а группы задают правила выбора и
                    порядок показа.
                  </p>
                </div>

                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-8"
                  disabled={isBusy || stateQuery.isFetching}
                  title="Обновить"
                  onClick={() => void stateQuery.refetch()}
                >
                  <RefreshCw
                    className={cn(
                      "size-4",
                      stateQuery.isFetching && "animate-spin",
                    )}
                  />
                </Button>
              </div>

              {stateQuery.isLoading ? <ModifiersSkeleton /> : null}

              {stateQuery.isError ? (
                <AdminPanel
                  padding="sm"
                  variant="muted"
                  className="text-sm text-text-muted"
                >
                  Не удалось загрузить модификаторы.
                </AdminPanel>
              ) : null}

              {!stateQuery.isLoading && !stateQuery.isError ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
                  <AdminPanel className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium">Опции</h3>
                      <p className="mt-1 text-sm text-text-muted">
                        То, что покупатель добавляет к товару.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <div className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]">
                        <Input
                          value={createOptionDraft.name}
                          disabled={isBusy}
                          placeholder="Например: Больше сыра"
                          onChange={(event) =>
                            setCreateOptionDraft((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void handleCreateOption();
                            }
                          }}
                        />
                        <Input
                          type="number"
                          min={0}
                          {...priceInputProps}
                          value={createOptionDraft.defaultPrice}
                          disabled={isBusy}
                          placeholder="Цена"
                          onChange={(event) =>
                            setCreateOptionDraft((current) => ({
                              ...current,
                              defaultPrice: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void handleCreateOption();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          className="size-9"
                          disabled={isBusy || !createOptionDraft.name.trim()}
                          title="Добавить модификатор"
                          onClick={() => void handleCreateOption()}
                        >
                          {createOptionMutation.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Plus className="size-4" />
                          )}
                        </Button>
                      </div>

                      {options.length === 0 ? (
                        <AdminPanel
                          padding="sm"
                          variant="dashed"
                          className="text-sm"
                        >
                          Модификаторов пока нет.
                        </AdminPanel>
                      ) : null}

                      {options.map((option, index) => {
                        const draft =
                          optionDraftsById[option.id] ?? toOptionDraft(option);

                        return (
                          <AdminPanel
                            key={option.id}
                            padding="sm"
                            className="space-y-2"
                          >
                            <div className="flex min-w-0 items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="truncate text-sm font-medium">
                                    {option.name}
                                  </span>
                                  {!option.isActive ? (
                                    <Badge variant="outline">Отключен</Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-text-muted">
                                  #{index + 1}
                                </p>
                              </div>
                              <Switch
                                size="sm"
                                checked={option.isActive}
                                disabled={isBusy}
                                onCheckedChange={(checked) =>
                                  void handleToggleOptionActive(option, checked)
                                }
                              />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-[1fr_7rem]">
                              <Input
                                value={draft.name}
                                disabled={isBusy}
                                onChange={(event) =>
                                  setOptionDraftsById((current) => ({
                                    ...current,
                                    [option.id]: {
                                      ...draft,
                                      name: event.target.value,
                                    },
                                  }))
                                }
                              />
                              <Input
                                type="number"
                                min={0}
                                {...priceInputProps}
                                value={draft.defaultPrice}
                                disabled={isBusy}
                                onChange={(event) =>
                                  setOptionDraftsById((current) => ({
                                    ...current,
                                    [option.id]: {
                                      ...draft,
                                      defaultPrice: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-8"
                                disabled={isBusy || index === 0}
                                title="Выше"
                                onClick={() =>
                                  void handleMoveOption(option, -1)
                                }
                              >
                                <ArrowUp className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-8"
                                disabled={
                                  isBusy || index === options.length - 1
                                }
                                title="Ниже"
                                onClick={() => void handleMoveOption(option, 1)}
                              >
                                <ArrowDown className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-8"
                                disabled={isBusy}
                                title="Сохранить"
                                onClick={() => void handleUpdateOption(option)}
                              >
                                {updateOptionMutation.isPending ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Save className="size-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-8 text-text-muted hover:bg-status-danger-surface hover:text-status-danger"
                                disabled={isBusy}
                                title="Архивировать"
                                onClick={() => void handleArchiveOption(option)}
                              >
                                <Archive className="size-4" />
                              </Button>
                            </div>
                          </AdminPanel>
                        );
                      })}
                    </div>
                  </AdminPanel>

                  <section className="space-y-4">
                    <AdminPanel className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium">Группы</h3>
                        <p className="mt-1 text-sm text-text-muted">
                          Например: добавки к пицце, соусы, начинка.
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Input
                          value={createGroupDraft.name}
                          disabled={isBusy}
                          placeholder="Новая группа"
                          onChange={(event) =>
                            setCreateGroupDraft((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void handleCreateGroup();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          className="size-9"
                          disabled={isBusy || !createGroupDraft.name.trim()}
                          title="Создать группу"
                          onClick={() => void handleCreateGroup()}
                        >
                          {createGroupMutation.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Plus className="size-4" />
                          )}
                        </Button>
                      </div>

                      {groups.length === 0 ? (
                        <AdminPanel
                          padding="sm"
                          variant="dashed"
                          className="text-sm"
                        >
                          Групп пока нет.
                        </AdminPanel>
                      ) : (
                        <div className="grid gap-2">
                          {groups.map((group, index) => (
                            <div
                              key={group.id}
                              className={cn(
                                "flex min-w-0 items-center gap-2 rounded-control border border-line-default p-2",
                                selectedGroupId === group.id &&
                                  "bg-surface-muted",
                              )}
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-auto min-w-0 flex-1 justify-start px-2 py-1.5 text-left"
                                disabled={isBusy}
                                onClick={() => setSelectedGroupId(group.id)}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-medium">
                                    {group.name}
                                  </span>
                                  <span className="block truncate text-xs text-text-muted">
                                    {group.options.length} опций
                                  </span>
                                </span>
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                disabled={isBusy || index === 0}
                                title="Выше"
                                onClick={() => void handleMoveGroup(group, -1)}
                              >
                                <ArrowUp className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                disabled={isBusy || index === groups.length - 1}
                                title="Ниже"
                                onClick={() => void handleMoveGroup(group, 1)}
                              >
                                <ArrowDown className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8 text-text-muted hover:bg-status-danger-surface hover:text-status-danger"
                                disabled={isBusy}
                                title="Архивировать"
                                onClick={() => void handleArchiveGroup(group)}
                              >
                                <Archive className="size-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </AdminPanel>

                    {selectedGroup ? (
                      <AdminPanel className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-medium">
                              {selectedGroup.name}
                            </h3>
                            <p className="mt-1 text-sm text-text-muted">
                              Правила выбора и список опций внутри группы.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => void handleUpdateGroup()}
                          >
                            {updateGroupMutation.isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Save className="size-4" />
                            )}
                            Сохранить
                          </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Название</Label>
                            <Input
                              value={groupDraft.name}
                              disabled={isBusy}
                              onChange={(event) =>
                                setGroupDraftsById((current) => ({
                                  ...current,
                                  [selectedGroup.id]: {
                                    ...groupDraft,
                                    name: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label>Описание</Label>
                            <Textarea
                              value={groupDraft.description}
                              disabled={isBusy}
                              rows={2}
                              onChange={(event) =>
                                setGroupDraftsById((current) => ({
                                  ...current,
                                  [selectedGroup.id]: {
                                    ...groupDraft,
                                    description: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Минимум</Label>
                              <Input
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={groupDraft.minSelected}
                                disabled={isBusy}
                                onChange={(event) =>
                                  setGroupDraftsById((current) => ({
                                    ...current,
                                    [selectedGroup.id]: {
                                      ...groupDraft,
                                      minSelected: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Максимум</Label>
                              <Input
                                type="number"
                                min={1}
                                inputMode="numeric"
                                value={groupDraft.maxSelected}
                                disabled={isBusy}
                                placeholder="без лимита"
                                onChange={(event) =>
                                  setGroupDraftsById((current) => ({
                                    ...current,
                                    [selectedGroup.id]: {
                                      ...groupDraft,
                                      maxSelected: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="grid content-end gap-3">
                            <label className="flex items-center gap-2 text-sm">
                              <Switch
                                checked={groupDraft.isRequired}
                                disabled={isBusy}
                                onCheckedChange={(checked) =>
                                  setGroupDraftsById((current) => ({
                                    ...current,
                                    [selectedGroup.id]: {
                                      ...groupDraft,
                                      isRequired: checked,
                                    },
                                  }))
                                }
                              />
                              Обязательная
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <Switch
                                checked={groupDraft.isActive}
                                disabled={isBusy}
                                onCheckedChange={(checked) =>
                                  setGroupDraftsById((current) => ({
                                    ...current,
                                    [selectedGroup.id]: {
                                      ...groupDraft,
                                      isActive: checked,
                                    },
                                  }))
                                }
                              />
                              Активная
                            </label>
                          </div>
                        </div>

                        <hr />

                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium">
                              Опции в группе
                            </h4>
                            <p className="mt-1 text-sm text-text-muted">
                              Цена в группе может переопределять цену из
                              справочника. Пустое поле использует базовую цену.
                            </p>
                          </div>

                          {options.length === 0 ? (
                            <AdminPanel
                              padding="sm"
                              variant="dashed"
                              className="text-sm"
                            >
                              Сначала добавьте хотя бы одну опцию.
                            </AdminPanel>
                          ) : (
                            <div className="grid gap-2">
                              {options.map((option) => {
                                const groupOption =
                                  selectedGroupOptionByOptionId.get(option.id);
                                const checked = Boolean(groupOption);
                                const draftKey = `${selectedGroup.id}:${option.id}`;
                                const priceDraft =
                                  groupOptionPricesById[draftKey] ??
                                  priceToInput(groupOption?.defaultPrice);
                                const groupOptionIndex = groupOption
                                  ? selectedGroupOptions.findIndex(
                                      (item) => item.optionId === option.id,
                                    )
                                  : -1;

                                return (
                                  <AdminPanel
                                    key={option.id}
                                    padding="sm"
                                    className={cn(
                                      "grid gap-3",
                                      !option.isActive && "opacity-70",
                                    )}
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <Checkbox
                                        checked={checked}
                                        disabled={isBusy || !option.isActive}
                                        onCheckedChange={(value) =>
                                          void handleToggleGroupOption(
                                            option,
                                            value === true,
                                          )
                                        }
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                                          <span className="break-words text-sm font-medium">
                                            {option.name}
                                          </span>
                                          {!option.isActive ? (
                                            <Badge variant="outline">
                                              Отключен
                                            </Badge>
                                          ) : null}
                                          {groupOption?.isDefault ? (
                                            <Badge variant="secondary">
                                              По умолчанию
                                            </Badge>
                                          ) : null}
                                        </div>
                                        <p className="text-xs text-text-muted">
                                          База:{" "}
                                          {priceToInput(option.defaultPrice) ||
                                            0}{" "}
                                          ₽
                                        </p>
                                      </div>
                                    </div>

                                    {groupOption ? (
                                      <div className="grid gap-2 md:grid-cols-[8rem_1fr_auto]">
                                        <Input
                                          type="number"
                                          min={0}
                                          {...priceInputProps}
                                          value={priceDraft}
                                          disabled={isBusy}
                                          placeholder="базовая"
                                          onChange={(event) =>
                                            setGroupOptionPricesById(
                                              (current) => ({
                                                ...current,
                                                [draftKey]: event.target.value,
                                              }),
                                            )
                                          }
                                          onBlur={() =>
                                            void handleSaveGroupOptionPrice(
                                              option.id,
                                            )
                                          }
                                        />
                                        <div className="flex flex-wrap items-center gap-3">
                                          <label className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                              checked={groupOption.isDefault}
                                              disabled={isBusy}
                                              onCheckedChange={(value) =>
                                                void handlePatchGroupOption(
                                                  option.id,
                                                  {
                                                    isDefault: value === true,
                                                  },
                                                )
                                              }
                                            />
                                            По умолчанию
                                          </label>
                                          <label className="flex items-center gap-2 text-sm">
                                            <Switch
                                              size="sm"
                                              checked={groupOption.isActive}
                                              disabled={isBusy}
                                              onCheckedChange={(checkedValue) =>
                                                void handlePatchGroupOption(
                                                  option.id,
                                                  {
                                                    isActive: checkedValue,
                                                  },
                                                )
                                              }
                                            />
                                            Доступна
                                          </label>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="size-8"
                                            disabled={
                                              isBusy || groupOptionIndex <= 0
                                            }
                                            title="Выше"
                                            onClick={() =>
                                              void handleMoveGroupOption(
                                                option.id,
                                                -1,
                                              )
                                            }
                                          >
                                            <ArrowUp className="size-4" />
                                          </Button>
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="size-8"
                                            disabled={
                                              isBusy ||
                                              groupOptionIndex ===
                                                selectedGroupOptions.length - 1
                                            }
                                            title="Ниже"
                                            onClick={() =>
                                              void handleMoveGroupOption(
                                                option.id,
                                                1,
                                              )
                                            }
                                          >
                                            <ArrowDown className="size-4" />
                                          </Button>
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="size-8"
                                            disabled={isBusy}
                                            title="Сохранить цену"
                                            onClick={() =>
                                              void handleSaveGroupOptionPrice(
                                                option.id,
                                              )
                                            }
                                          >
                                            <Check className="size-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </AdminPanel>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </AdminPanel>
                    ) : null}
                  </section>
                </div>
              ) : null}

              {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            btnText="Готово"
            buttonType="button"
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
