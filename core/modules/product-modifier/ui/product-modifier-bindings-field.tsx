"use client";

import { formatProductVariantLabel } from "@/core/modules/product";
import {
  useCatalogModifierState,
  useProductModifiers,
  type ProductModifierGroupBindingPayload,
} from "@/core/modules/product-modifier/model/product-modifier-api";
import type {
  CatalogModifierGroup,
  CatalogModifierGroupOption,
  ProductModifierGroup,
  ProductModifierOption,
} from "@/core/modules/product-modifier/model/product-modifier-types";
import type {
  ProductVariantDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { getCatalogPriceFormatMode } from "@/core/catalog-runtime/pricing";
import { getCatalogPriceInputProps } from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Switch } from "@/shared/ui/switch";
import { ArrowDown, ArrowUp, Plus, RefreshCw, Trash2 } from "lucide-react";
import React from "react";

const PRODUCT_SCOPE_KEY = "product";

export type ProductModifierOptionBindingDraft = {
  catalogModifierOptionId: string | null;
  code?: string;
  displayOrder: number;
  isAvailable: boolean;
  isDefault: boolean;
  localId: string;
  maxQuantity: string;
  name: string;
  price: string;
};

export type ProductModifierGroupBindingDraft = {
  catalogModifierGroupId: string | null;
  code?: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  isRequired: boolean;
  localId: string;
  maxSelected: string;
  minSelected: string;
  name: string;
  options: ProductModifierOptionBindingDraft[];
  variantId: string | null;
};

type ModifierScope = {
  id: string;
  label: string;
  subtitle: string;
  variantId: string | null;
};

interface ProductModifierBindingsFieldProps {
  disabled?: boolean;
  drafts?: ProductModifierGroupBindingDraft[];
  onChange?: (drafts: ProductModifierGroupBindingDraft[]) => void;
  onReadyChange?: (ready: boolean) => void;
  product: ProductWithDetailsDto;
}

interface ProductModifierCreateBindingsFieldProps {
  disabled?: boolean;
  drafts: ProductModifierGroupBindingDraft[];
  onChange: (drafts: ProductModifierGroupBindingDraft[]) => void;
}

function normalizeOptionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function requireText(value: string, message: string): string {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    throw new Error(message);
  }

  return normalized;
}

function parseNumber(value: string, message: string): number {
  const parsed = Number(value.trim().replace(",", "."));

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(message);
  }

  return parsed;
}

function parseInteger(value: string, message: string): number {
  const parsed = parseNumber(value, message);

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

  const parsed = parseInteger(normalized, "Введите целое число.");
  if (parsed < 1) {
    throw new Error("Лимит должен быть больше нуля.");
  }

  return parsed;
}

function toInputNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

function getScopeKey(variantId: string | null | undefined): string {
  return variantId ?? PRODUCT_SCOPE_KEY;
}

function sortByDisplayOrder<T extends { displayOrder: number; name: string }>(
  items: T[],
): T[] {
  return items.slice().sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }

    return left.name.localeCompare(right.name, "ru");
  });
}

function sortCatalogGroupOptions(
  options: CatalogModifierGroupOption[],
): CatalogModifierGroupOption[] {
  return options
    .filter((option) => !option.option.deleteAt && option.isActive)
    .slice()
    .sort((left, right) => {
      if (left.displayOrder !== right.displayOrder) {
        return left.displayOrder - right.displayOrder;
      }

      return left.option.name.localeCompare(right.option.name, "ru");
    });
}

function resolveNextScopeOrder(
  drafts: ProductModifierGroupBindingDraft[],
  variantId: string | null,
): number {
  return (
    drafts
      .filter((group) => group.variantId === variantId)
      .reduce((max, group) => Math.max(max, group.displayOrder), -1) + 1
  );
}

function buildDraftOptionFromCatalog(
  groupOption: CatalogModifierGroupOption,
): ProductModifierOptionBindingDraft {
  const price =
    groupOption.defaultPrice ?? groupOption.option.defaultPrice ?? "0";

  return {
    catalogModifierOptionId: groupOption.optionId,
    displayOrder: groupOption.displayOrder,
    isAvailable: groupOption.isActive && groupOption.option.isActive,
    isDefault: groupOption.isDefault,
    localId: `catalog-option:${groupOption.optionId}`,
    maxQuantity: "",
    name: groupOption.option.name,
    price: toInputNumber(price),
  };
}

function buildDraftOptionFromProduct(
  option: ProductModifierOption,
): ProductModifierOptionBindingDraft {
  return {
    catalogModifierOptionId: option.catalogModifierOptionId,
    code: option.code,
    displayOrder: option.displayOrder,
    isAvailable: option.isAvailable,
    isDefault: option.isDefault,
    localId: option.id,
    maxQuantity: option.maxQuantity === null ? "" : String(option.maxQuantity),
    name: option.name,
    price: toInputNumber(option.price),
  };
}

function buildDraftFromCatalogGroup(
  group: CatalogModifierGroup,
  variantId: string | null,
  displayOrder: number,
): ProductModifierGroupBindingDraft {
  return {
    catalogModifierGroupId: group.id,
    code: group.code,
    description: group.description ?? "",
    displayOrder,
    isActive: group.isActive,
    isRequired: group.isRequired,
    localId: `catalog-group:${getScopeKey(variantId)}:${group.id}`,
    maxSelected: group.maxSelected === null ? "" : String(group.maxSelected),
    minSelected: String(group.minSelected),
    name: group.name,
    options: sortCatalogGroupOptions(group.options).map(
      buildDraftOptionFromCatalog,
    ),
    variantId,
  };
}

function buildDraftFromProductGroup(
  group: ProductModifierGroup,
): ProductModifierGroupBindingDraft {
  return {
    catalogModifierGroupId: group.catalogModifierGroupId,
    code: group.code,
    description: group.description ?? "",
    displayOrder: group.displayOrder,
    isActive: group.isActive,
    isRequired: group.isRequired,
    localId: group.id,
    maxSelected: group.maxSelected === null ? "" : String(group.maxSelected),
    minSelected: String(group.minSelected),
    name: group.name,
    options: sortByDisplayOrder(group.options).map(buildDraftOptionFromProduct),
    variantId: group.variantId,
  };
}

function mergeDraftWithCatalogGroup(
  draft: ProductModifierGroupBindingDraft,
  group: CatalogModifierGroup,
): ProductModifierGroupBindingDraft {
  return {
    ...buildDraftFromCatalogGroup(group, draft.variantId, draft.displayOrder),
    localId: draft.localId,
  };
}

export function buildProductModifierBindingsPayload(
  drafts: ProductModifierGroupBindingDraft[],
): ProductModifierGroupBindingPayload[] {
  return drafts
    .slice()
    .sort((left, right) => {
      const scopeOrder = getScopeKey(left.variantId).localeCompare(
        getScopeKey(right.variantId),
      );
      if (scopeOrder !== 0) return scopeOrder;

      return left.displayOrder - right.displayOrder;
    })
    .map((group) => ({
      catalogModifierGroupId: group.catalogModifierGroupId ?? undefined,
      code: group.catalogModifierGroupId ? undefined : group.code,
      description: group.description.trim() ? group.description.trim() : null,
      displayOrder: group.displayOrder,
      isActive: group.isActive,
      isRequired: group.isRequired,
      maxSelected: parseOptionalPositiveInteger(group.maxSelected),
      minSelected: parseInteger(
        group.minSelected,
        "Введите минимум целым числом.",
      ),
      name: requireText(group.name, "Введите название группы модификаторов."),
      options: group.options
        .slice()
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((option) => ({
          catalogModifierOptionId: option.catalogModifierOptionId ?? undefined,
          code: option.catalogModifierOptionId ? undefined : option.code,
          displayOrder: option.displayOrder,
          isAvailable: option.isAvailable,
          isDefault: option.isDefault,
          maxQuantity: parseOptionalPositiveInteger(option.maxQuantity),
          name: requireText(option.name, "Введите название опции."),
          price: parseNumber(option.price, "Введите корректную цену опции."),
        })),
      variantId: group.variantId,
    }));
}

function getVariantLabel(variant: ProductVariantDto): string {
  return (
    formatProductVariantLabel(variant, {
      fallbackToVariantKey: true,
      includeAttributeNames: true,
    }) ??
    variant.sku ??
    "Вариант"
  );
}

function buildScopes(
  product: ProductWithDetailsDto,
  drafts: ProductModifierGroupBindingDraft[],
): ModifierScope[] {
  const variantDraftIds = new Set(
    drafts
      .map((group) => group.variantId)
      .filter((id): id is string => Boolean(id)),
  );
  const variants = (product.variants ?? []).filter(
    (variant) => product.variants.length > 1 || variantDraftIds.has(variant.id),
  );

  return [
    {
      id: PRODUCT_SCOPE_KEY,
      label: "Весь товар",
      subtitle: "Для всех вариантов",
      variantId: null,
    },
    ...variants.map((variant) => ({
      id: variant.id,
      label: getVariantLabel(variant),
      subtitle: variant.sku,
      variantId: variant.id,
    })),
  ];
}

function buildRequiredDraftPatch(
  checked: boolean,
  currentMinSelected: string,
): Pick<ProductModifierGroupBindingDraft, "isRequired" | "minSelected"> {
  const parsedMin = Number(currentMinSelected.trim().replace(",", "."));
  const minSelected =
    checked && (!Number.isFinite(parsedMin) || parsedMin < 1)
      ? "1"
      : checked
        ? currentMinSelected
        : "0";

  return {
    isRequired: checked,
    minSelected,
  };
}

function BindingsSkeleton() {
  return (
    <section className="space-y-3 rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-32 w-full rounded-panel" />
    </section>
  );
}

export const ProductModifierBindingsField: React.FC<
  ProductModifierBindingsFieldProps
> = ({
  disabled = false,
  drafts: controlledDrafts,
  onChange,
  onReadyChange,
  product,
}) => {
  const { catalog } = useCatalogState();
  const priceFormatMode = getCatalogPriceFormatMode(catalog);
  const priceInputProps = getCatalogPriceInputProps(priceFormatMode);
  const [localDrafts, setLocalDrafts] = React.useState<
    ProductModifierGroupBindingDraft[]
  >([]);
  const drafts = controlledDrafts ?? localDrafts;
  const draftsRef = React.useRef(drafts);
  const [selectedScopeKey, setSelectedScopeKey] =
    React.useState(PRODUCT_SCOPE_KEY);
  const [selectedCatalogGroupByScope, setSelectedCatalogGroupByScope] =
    React.useState<Record<string, string>>({});

  const catalogStateQuery = useCatalogModifierState(
    { includeInactive: true, includeArchived: false },
    { enabled: !disabled },
  );
  const productModifiersQuery = useProductModifiers(product.id, {
    enabled: !disabled,
  });
  const setDrafts = React.useCallback(
    (updater: React.SetStateAction<ProductModifierGroupBindingDraft[]>) => {
      const nextDrafts =
        typeof updater === "function"
          ? (
              updater as (
                current: ProductModifierGroupBindingDraft[],
              ) => ProductModifierGroupBindingDraft[]
            )(draftsRef.current)
          : updater;

      draftsRef.current = nextDrafts;

      if (onChange) {
        onChange(nextDrafts);
      } else {
        setLocalDrafts(nextDrafts);
      }
    },
    [onChange],
  );

  const catalogGroups = React.useMemo(
    () =>
      sortByDisplayOrder(
        (catalogStateQuery.data?.groups ?? []).filter(
          (group) => !group.deleteAt,
        ),
      ),
    [catalogStateQuery.data?.groups],
  );
  const scopes = React.useMemo(
    () => buildScopes(product, drafts),
    [drafts, product],
  );
  const selectedScope =
    scopes.find((scope) => scope.id === selectedScopeKey) ?? scopes[0];
  const selectedScopeGroups = React.useMemo(
    () =>
      sortByDisplayOrder(
        drafts.filter((group) => group.variantId === selectedScope.variantId),
      ),
    [drafts, selectedScope.variantId],
  );
  const availableCatalogGroups = React.useMemo(() => {
    const attachedCatalogIds = new Set(
      selectedScopeGroups
        .map((group) => group.catalogModifierGroupId)
        .filter((id): id is string => Boolean(id)),
    );

    return catalogGroups.filter(
      (group) => group.isActive && !attachedCatalogIds.has(group.id),
    );
  }, [catalogGroups, selectedScopeGroups]);
  const selectedCatalogGroupCandidate =
    selectedCatalogGroupByScope[selectedScope.id];
  const selectedCatalogGroupId = availableCatalogGroups.some(
    (group) => group.id === selectedCatalogGroupCandidate,
  )
    ? (selectedCatalogGroupCandidate ?? "")
    : (availableCatalogGroups[0]?.id ?? "");
  const isLoading =
    catalogStateQuery.isLoading || productModifiersQuery.isLoading;
  const hasLoadError =
    catalogStateQuery.isError || productModifiersQuery.isError;
  const isReady =
    catalogStateQuery.isSuccess && productModifiersQuery.isSuccess;
  const isBusy = disabled;

  React.useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  React.useEffect(() => {
    onReadyChange?.(isReady && !hasLoadError);
  }, [hasLoadError, isReady, onReadyChange]);

  React.useEffect(() => {
    if (!productModifiersQuery.data) {
      return;
    }

    setDrafts(
      sortByDisplayOrder(productModifiersQuery.data).map(
        buildDraftFromProductGroup,
      ),
    );
  }, [productModifiersQuery.data, setDrafts]);

  React.useEffect(() => {
    if (scopes.some((scope) => scope.id === selectedScopeKey)) {
      return;
    }

    setSelectedScopeKey(PRODUCT_SCOPE_KEY);
  }, [scopes, selectedScopeKey]);

  const updateGroupDraft = React.useCallback(
    (localId: string, patch: Partial<ProductModifierGroupBindingDraft>) => {
      setDrafts((current) =>
        current.map((group) =>
          group.localId === localId ? { ...group, ...patch } : group,
        ),
      );
    },
    [setDrafts],
  );

  const updateOptionDraft = React.useCallback(
    (
      groupLocalId: string,
      optionLocalId: string,
      patch: Partial<ProductModifierOptionBindingDraft>,
    ) => {
      setDrafts((current) =>
        current.map((group) =>
          group.localId === groupLocalId
            ? {
                ...group,
                options: group.options.map((option) =>
                  option.localId === optionLocalId
                    ? { ...option, ...patch }
                    : option,
                ),
              }
            : group,
        ),
      );
    },
    [setDrafts],
  );

  const handleAddCatalogGroup = React.useCallback(() => {
    const group = catalogGroups.find(
      (item) => item.id === selectedCatalogGroupId,
    );
    if (!group) {
      return;
    }

    setDrafts((current) => [
      ...current,
      buildDraftFromCatalogGroup(
        group,
        selectedScope.variantId,
        resolveNextScopeOrder(current, selectedScope.variantId),
      ),
    ]);
    setSelectedCatalogGroupByScope((current) => {
      const next = { ...current };
      delete next[selectedScope.id];
      return next;
    });
  }, [catalogGroups, selectedCatalogGroupId, selectedScope, setDrafts]);

  const handleRemoveGroup = React.useCallback(
    (localId: string) => {
      setDrafts((current) =>
        current.filter((group) => group.localId !== localId),
      );
    },
    [setDrafts],
  );

  const handleMoveGroup = React.useCallback(
    (groupLocalId: string, direction: -1 | 1) => {
      setDrafts((current) => {
        const scopeGroups = sortByDisplayOrder(
          current.filter(
            (group) => group.variantId === selectedScope.variantId,
          ),
        );
        const index = scopeGroups.findIndex(
          (group) => group.localId === groupLocalId,
        );
        const targetIndex = index + direction;
        if (index < 0 || targetIndex < 0 || targetIndex >= scopeGroups.length) {
          return current;
        }

        const reordered = scopeGroups.slice();
        [reordered[index], reordered[targetIndex]] = [
          reordered[targetIndex],
          reordered[index],
        ];
        const orderById = new Map(
          reordered.map((group, displayOrder) => [group.localId, displayOrder]),
        );

        return current.map((group) =>
          orderById.has(group.localId)
            ? { ...group, displayOrder: orderById.get(group.localId) ?? 0 }
            : group,
        );
      });
    },
    [selectedScope.variantId, setDrafts],
  );

  const handleMoveOption = React.useCallback(
    (groupLocalId: string, optionLocalId: string, direction: -1 | 1) => {
      setDrafts((current) =>
        current.map((group) => {
          if (group.localId !== groupLocalId) {
            return group;
          }

          const options = group.options.slice().sort((left, right) => {
            if (left.displayOrder !== right.displayOrder) {
              return left.displayOrder - right.displayOrder;
            }

            return left.name.localeCompare(right.name, "ru");
          });
          const index = options.findIndex(
            (option) => option.localId === optionLocalId,
          );
          const targetIndex = index + direction;
          if (index < 0 || targetIndex < 0 || targetIndex >= options.length) {
            return group;
          }

          [options[index], options[targetIndex]] = [
            options[targetIndex],
            options[index],
          ];

          return {
            ...group,
            options: options.map((option, displayOrder) => ({
              ...option,
              displayOrder,
            })),
          };
        }),
      );
    },
    [setDrafts],
  );

  const handleResetGroupFromCatalog = React.useCallback(
    (draft: ProductModifierGroupBindingDraft) => {
      const group = catalogGroups.find(
        (item) => item.id === draft.catalogModifierGroupId,
      );
      if (!group) {
        return;
      }

      setDrafts((current) =>
        current.map((item) =>
          item.localId === draft.localId
            ? mergeDraftWithCatalogGroup(draft, group)
            : item,
        ),
      );
    },
    [catalogGroups, setDrafts],
  );

  if (isLoading) {
    return <BindingsSkeleton />;
  }

  if (hasLoadError) {
    return (
      <section className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
        <div className="text-sm text-text-muted">
          Не удалось загрузить модификаторы товара.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">Модификаторы товара</h3>
            <Badge variant="secondary">Бета</Badge>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Назначьте группы добавок для всего товара или отдельных вариантов.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {scopes.map((scope) => {
          const count = drafts.filter(
            (group) => group.variantId === scope.variantId,
          ).length;

          return (
            <Button
              key={scope.id}
              type="button"
              variant={selectedScope.id === scope.id ? "secondary" : "outline"}
              className="h-auto min-w-40 shrink-0 justify-start px-3 py-2 text-left"
              disabled={isBusy}
              onClick={() => setSelectedScopeKey(scope.id)}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {scope.label}
                </span>
                <span className="block truncate text-xs text-text-muted">
                  {count > 0 ? `${count} групп` : scope.subtitle}
                </span>
              </span>
            </Button>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        {availableCatalogGroups.length > 0 ? (
          <Select
            value={selectedCatalogGroupId}
            disabled={isBusy}
            onValueChange={(value) =>
              setSelectedCatalogGroupByScope((current) => ({
                ...current,
                [selectedScope.id]: value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите группу" />
            </SelectTrigger>
            <SelectContent>
              {availableCatalogGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="rounded-control border border-dashed border-line-subtle px-3 py-2 text-sm text-text-muted">
            Все доступные группы уже добавлены в выбранную область.
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={isBusy || !selectedCatalogGroupId}
          onClick={handleAddCatalogGroup}
        >
          <Plus className="size-4" />
          Добавить
        </Button>
      </div>

      {selectedScopeGroups.length === 0 ? (
        <div className="rounded-panel border border-dashed border-line-subtle p-3 text-sm text-text-muted">
          Для выбранной области модификаторы пока не назначены.
        </div>
      ) : (
        <div className="space-y-3">
          {selectedScopeGroups.map((group, groupIndex) => {
            const catalogGroup = catalogGroups.find(
              (item) => item.id === group.catalogModifierGroupId,
            );
            const options = group.options
              .slice()
              .sort((left, right) => left.displayOrder - right.displayOrder);

            return (
              <div
                key={group.localId}
                className="space-y-3 rounded-panel border border-line-subtle bg-surface-subtle p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="break-words text-sm font-medium">
                        {group.name}
                      </span>
                      {catalogGroup ? (
                        <Badge variant="outline">Справочник</Badge>
                      ) : (
                        <Badge variant="secondary">Локальная</Badge>
                      )}
                      {!group.isActive ? (
                        <Badge variant="outline">Отключена</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {options.length} опций
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {catalogGroup ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8"
                        disabled={isBusy}
                        title="Обновить из справочника"
                        onClick={() => handleResetGroupFromCatalog(group)}
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      disabled={isBusy || groupIndex === 0}
                      title="Выше"
                      onClick={() => handleMoveGroup(group.localId, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      disabled={
                        isBusy || groupIndex === selectedScopeGroups.length - 1
                      }
                      title="Ниже"
                      onClick={() => handleMoveGroup(group.localId, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8 text-text-muted hover:bg-status-danger-surface hover:text-status-danger"
                      disabled={isBusy}
                      title="Убрать группу"
                      onClick={() => handleRemoveGroup(group.localId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Название</Label>
                    <Input
                      value={group.name}
                      disabled={isBusy}
                      onChange={(event) =>
                        updateGroupDraft(group.localId, {
                          name: event.target.value,
                        })
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
                        value={group.minSelected}
                        disabled={isBusy}
                        onChange={(event) =>
                          updateGroupDraft(group.localId, {
                            minSelected: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Максимум</Label>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={group.maxSelected}
                        disabled={isBusy}
                        placeholder="без лимита"
                        onChange={(event) =>
                          updateGroupDraft(group.localId, {
                            maxSelected: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid content-end gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={group.isRequired}
                        disabled={isBusy}
                        onCheckedChange={(checked) =>
                          updateGroupDraft(
                            group.localId,
                            buildRequiredDraftPatch(checked, group.minSelected),
                          )
                        }
                      />
                      Обязательная
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={group.isActive}
                        disabled={isBusy}
                        onCheckedChange={(checked) =>
                          updateGroupDraft(group.localId, {
                            isActive: checked,
                          })
                        }
                      />
                      Активная
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Опции</div>
                  {options.length === 0 ? (
                    <div className="rounded-control border border-dashed border-line-subtle p-3 text-sm text-text-muted">
                      В группе нет опций.
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {options.map((option, optionIndex) => (
                        <div
                          key={option.localId}
                          className={cn(
                            "grid gap-2 rounded-control border border-line-subtle bg-surface-raised/70 p-2.5",
                            !option.isAvailable && "opacity-70",
                          )}
                        >
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {option.name}
                              </div>
                              {option.catalogModifierOptionId ? (
                                <div className="text-xs text-text-muted">
                                  Опция справочника
                                </div>
                              ) : null}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                disabled={isBusy || optionIndex === 0}
                                title="Выше"
                                onClick={() =>
                                  handleMoveOption(
                                    group.localId,
                                    option.localId,
                                    -1,
                                  )
                                }
                              >
                                <ArrowUp className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                disabled={
                                  isBusy || optionIndex === options.length - 1
                                }
                                title="Ниже"
                                onClick={() =>
                                  handleMoveOption(
                                    group.localId,
                                    option.localId,
                                    1,
                                  )
                                }
                              >
                                <ArrowDown className="size-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-[1fr_7rem_7rem]">
                            <Input
                              value={option.name}
                              disabled={isBusy}
                              onChange={(event) =>
                                updateOptionDraft(
                                  group.localId,
                                  option.localId,
                                  { name: event.target.value },
                                )
                              }
                            />
                            <Input
                              type="number"
                              min={0}
                              {...priceInputProps}
                              value={option.price}
                              disabled={isBusy}
                              onChange={(event) =>
                                updateOptionDraft(
                                  group.localId,
                                  option.localId,
                                  { price: event.target.value },
                                )
                              }
                            />
                            <Input
                              type="number"
                              min={1}
                              inputMode="numeric"
                              value={option.maxQuantity}
                              placeholder="лимит"
                              disabled={isBusy}
                              onChange={(event) =>
                                updateOptionDraft(
                                  group.localId,
                                  option.localId,
                                  { maxQuantity: event.target.value },
                                )
                              }
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={option.isDefault}
                                disabled={isBusy}
                                onCheckedChange={(checked) =>
                                  updateOptionDraft(
                                    group.localId,
                                    option.localId,
                                    { isDefault: checked === true },
                                  )
                                }
                              />
                              По умолчанию
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <Switch
                                size="sm"
                                checked={option.isAvailable}
                                disabled={isBusy}
                                onCheckedChange={(checked) =>
                                  updateOptionDraft(
                                    group.localId,
                                    option.localId,
                                    { isAvailable: checked },
                                  )
                                }
                              />
                              Доступна
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export const ProductModifierCreateBindingsField: React.FC<
  ProductModifierCreateBindingsFieldProps
> = ({ disabled = false, drafts, onChange }) => {
  const { catalog } = useCatalogState();
  const priceFormatMode = getCatalogPriceFormatMode(catalog);
  const priceInputProps = getCatalogPriceInputProps(priceFormatMode);
  const [selectedCatalogGroupId, setSelectedCatalogGroupId] =
    React.useState("");
  const catalogStateQuery = useCatalogModifierState(
    { includeInactive: true, includeArchived: false },
    { enabled: !disabled },
  );
  const catalogGroups = React.useMemo(
    () =>
      sortByDisplayOrder(
        (catalogStateQuery.data?.groups ?? []).filter(
          (group) => !group.deleteAt,
        ),
      ),
    [catalogStateQuery.data?.groups],
  );
  const productScopeGroups = React.useMemo(
    () =>
      sortByDisplayOrder(drafts.filter((group) => group.variantId === null)),
    [drafts],
  );
  const availableCatalogGroups = React.useMemo(() => {
    const attachedIds = new Set(
      productScopeGroups
        .map((group) => group.catalogModifierGroupId)
        .filter((id): id is string => Boolean(id)),
    );

    return catalogGroups.filter(
      (group) => group.isActive && !attachedIds.has(group.id),
    );
  }, [catalogGroups, productScopeGroups]);
  const selectedCandidate = selectedCatalogGroupId;
  const resolvedCatalogGroupId = availableCatalogGroups.some(
    (group) => group.id === selectedCandidate,
  )
    ? selectedCandidate
    : (availableCatalogGroups[0]?.id ?? "");
  const isBusy = disabled || catalogStateQuery.isFetching;

  const updateGroupDraft = React.useCallback(
    (localId: string, patch: Partial<ProductModifierGroupBindingDraft>) => {
      onChange(
        drafts.map((group) =>
          group.localId === localId ? { ...group, ...patch } : group,
        ),
      );
    },
    [drafts, onChange],
  );

  const updateOptionDraft = React.useCallback(
    (
      groupLocalId: string,
      optionLocalId: string,
      patch: Partial<ProductModifierOptionBindingDraft>,
    ) => {
      onChange(
        drafts.map((group) =>
          group.localId === groupLocalId
            ? {
                ...group,
                options: group.options.map((option) =>
                  option.localId === optionLocalId
                    ? { ...option, ...patch }
                    : option,
                ),
              }
            : group,
        ),
      );
    },
    [drafts, onChange],
  );

  const handleAddCatalogGroup = React.useCallback(() => {
    const group = catalogGroups.find(
      (item) => item.id === resolvedCatalogGroupId,
    );
    if (!group) {
      return;
    }

    onChange([
      ...drafts,
      buildDraftFromCatalogGroup(
        group,
        null,
        resolveNextScopeOrder(drafts, null),
      ),
    ]);
    setSelectedCatalogGroupId("");
  }, [catalogGroups, drafts, onChange, resolvedCatalogGroupId]);

  const handleRemoveGroup = React.useCallback(
    (localId: string) => {
      onChange(drafts.filter((group) => group.localId !== localId));
    },
    [drafts, onChange],
  );

  const handleMoveGroup = React.useCallback(
    (groupLocalId: string, direction: -1 | 1) => {
      const index = productScopeGroups.findIndex(
        (group) => group.localId === groupLocalId,
      );
      const targetIndex = index + direction;
      if (
        index < 0 ||
        targetIndex < 0 ||
        targetIndex >= productScopeGroups.length
      ) {
        return;
      }

      const reordered = productScopeGroups.slice();
      [reordered[index], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[index],
      ];
      const orderById = new Map(
        reordered.map((group, displayOrder) => [group.localId, displayOrder]),
      );

      onChange(
        drafts.map((group) =>
          orderById.has(group.localId)
            ? { ...group, displayOrder: orderById.get(group.localId) ?? 0 }
            : group,
        ),
      );
    },
    [drafts, onChange, productScopeGroups],
  );

  const handleMoveOption = React.useCallback(
    (groupLocalId: string, optionLocalId: string, direction: -1 | 1) => {
      onChange(
        drafts.map((group) => {
          if (group.localId !== groupLocalId) {
            return group;
          }

          const options = group.options
            .slice()
            .sort((left, right) => left.displayOrder - right.displayOrder);
          const index = options.findIndex(
            (option) => option.localId === optionLocalId,
          );
          const targetIndex = index + direction;
          if (index < 0 || targetIndex < 0 || targetIndex >= options.length) {
            return group;
          }

          [options[index], options[targetIndex]] = [
            options[targetIndex],
            options[index],
          ];

          return {
            ...group,
            options: options.map((option, displayOrder) => ({
              ...option,
              displayOrder,
            })),
          };
        }),
      );
    },
    [drafts, onChange],
  );

  const handleResetGroupFromCatalog = React.useCallback(
    (draft: ProductModifierGroupBindingDraft) => {
      const group = catalogGroups.find(
        (item) => item.id === draft.catalogModifierGroupId,
      );
      if (!group) {
        return;
      }

      onChange(
        drafts.map((item) =>
          item.localId === draft.localId
            ? mergeDraftWithCatalogGroup(draft, group)
            : item,
        ),
      );
    },
    [catalogGroups, drafts, onChange],
  );

  if (catalogStateQuery.isLoading) {
    return <BindingsSkeleton />;
  }

  if (catalogStateQuery.isError) {
    return (
      <section className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
        <div className="text-sm text-text-muted">
          Не удалось загрузить модификаторы.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium">Модификаторы товара</h3>
          <Badge variant="secondary">Бета</Badge>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          При создании можно назначить группы для всего товара. Для отдельных
          вариантов используйте редактор после сохранения.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        {availableCatalogGroups.length > 0 ? (
          <Select
            value={resolvedCatalogGroupId}
            disabled={isBusy}
            onValueChange={setSelectedCatalogGroupId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите группу" />
            </SelectTrigger>
            <SelectContent>
              {availableCatalogGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="rounded-control border border-dashed border-line-subtle px-3 py-2 text-sm text-text-muted">
            Все доступные группы уже добавлены.
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={isBusy || !resolvedCatalogGroupId}
          onClick={handleAddCatalogGroup}
        >
          <Plus className="size-4" />
          Добавить
        </Button>
      </div>

      {productScopeGroups.length === 0 ? (
        <div className="rounded-panel border border-dashed border-line-subtle p-3 text-sm text-text-muted">
          Модификаторы пока не назначены.
        </div>
      ) : (
        <div className="space-y-3">
          {productScopeGroups.map((group, groupIndex) => {
            const catalogGroup = catalogGroups.find(
              (item) => item.id === group.catalogModifierGroupId,
            );
            const options = group.options
              .slice()
              .sort((left, right) => left.displayOrder - right.displayOrder);

            return (
              <div
                key={group.localId}
                className="space-y-3 rounded-panel border border-line-subtle bg-surface-subtle p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="break-words text-sm font-medium">
                        {group.name}
                      </span>
                      {catalogGroup ? (
                        <Badge variant="outline">Справочник</Badge>
                      ) : null}
                      {!group.isActive ? (
                        <Badge variant="outline">Отключена</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {options.length} опций
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {catalogGroup ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8"
                        disabled={isBusy}
                        title="Обновить из справочника"
                        onClick={() => handleResetGroupFromCatalog(group)}
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      disabled={isBusy || groupIndex === 0}
                      title="Выше"
                      onClick={() => handleMoveGroup(group.localId, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8"
                      disabled={
                        isBusy || groupIndex === productScopeGroups.length - 1
                      }
                      title="Ниже"
                      onClick={() => handleMoveGroup(group.localId, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-8 text-text-muted hover:bg-status-danger-surface hover:text-status-danger"
                      disabled={isBusy}
                      title="Убрать группу"
                      onClick={() => handleRemoveGroup(group.localId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Название</Label>
                    <Input
                      value={group.name}
                      disabled={isBusy}
                      onChange={(event) =>
                        updateGroupDraft(group.localId, {
                          name: event.target.value,
                        })
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
                        value={group.minSelected}
                        disabled={isBusy}
                        onChange={(event) =>
                          updateGroupDraft(group.localId, {
                            minSelected: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Максимум</Label>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={group.maxSelected}
                        disabled={isBusy}
                        placeholder="без лимита"
                        onChange={(event) =>
                          updateGroupDraft(group.localId, {
                            maxSelected: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid content-end gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={group.isRequired}
                        disabled={isBusy}
                        onCheckedChange={(checked) =>
                          updateGroupDraft(
                            group.localId,
                            buildRequiredDraftPatch(checked, group.minSelected),
                          )
                        }
                      />
                      Обязательная
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={group.isActive}
                        disabled={isBusy}
                        onCheckedChange={(checked) =>
                          updateGroupDraft(group.localId, {
                            isActive: checked,
                          })
                        }
                      />
                      Активная
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Опции</div>
                  <div className="grid gap-2">
                    {options.map((option, optionIndex) => (
                      <div
                        key={option.localId}
                        className={cn(
                          "grid gap-2 rounded-control border border-line-subtle bg-surface-raised/70 p-2.5",
                          !option.isAvailable && "opacity-70",
                        )}
                      >
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium">
                            {option.name}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              disabled={isBusy || optionIndex === 0}
                              title="Выше"
                              onClick={() =>
                                handleMoveOption(
                                  group.localId,
                                  option.localId,
                                  -1,
                                )
                              }
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              disabled={
                                isBusy || optionIndex === options.length - 1
                              }
                              title="Ниже"
                              onClick={() =>
                                handleMoveOption(
                                  group.localId,
                                  option.localId,
                                  1,
                                )
                              }
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-[1fr_7rem_7rem]">
                          <Input
                            value={option.name}
                            disabled={isBusy}
                            onChange={(event) =>
                              updateOptionDraft(group.localId, option.localId, {
                                name: event.target.value,
                              })
                            }
                          />
                          <Input
                            type="number"
                            min={0}
                            {...priceInputProps}
                            value={option.price}
                            disabled={isBusy}
                            onChange={(event) =>
                              updateOptionDraft(group.localId, option.localId, {
                                price: event.target.value,
                              })
                            }
                          />
                          <Input
                            type="number"
                            min={1}
                            inputMode="numeric"
                            value={option.maxQuantity}
                            placeholder="лимит"
                            disabled={isBusy}
                            onChange={(event) =>
                              updateOptionDraft(group.localId, option.localId, {
                                maxQuantity: event.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={option.isDefault}
                              disabled={isBusy}
                              onCheckedChange={(checked) =>
                                updateOptionDraft(
                                  group.localId,
                                  option.localId,
                                  { isDefault: checked === true },
                                )
                              }
                            />
                            По умолчанию
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Switch
                              size="sm"
                              checked={option.isAvailable}
                              disabled={isBusy}
                              onCheckedChange={(checked) =>
                                updateOptionDraft(
                                  group.localId,
                                  option.localId,
                                  { isAvailable: checked },
                                )
                              }
                            />
                            Доступна
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
