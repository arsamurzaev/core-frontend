"use client";

import {
  applySaleUnitRelationQuantities,
  clearSaleUnitRelationAtIndex,
  deriveSaleUnitRelationDrafts,
  formatSaleUnitMoney,
  getSaleUnitDisplayName,
  normalizeSaleUnitRows,
  removeSaleUnitRelationAtIndex,
  resolveSaleUnitDiscountPreview,
  resolveSaleUnitRelationDraft,
  toPositiveSaleUnitNumber,
  type SaleUnitRelationDraftsByIndex,
} from "@/core/modules/product/editor/model/product-sale-units-field-model";
import {
  createDefaultSaleUnitFormValue,
  type SaleUnitFormValue,
  type SaleUnitsFormValue,
} from "@/core/modules/product/editor/model/product-variants";
import {
  useCatalogSaleUnitControllerGetAll,
  type CatalogSaleUnitDto,
} from "@/shared/api/generated/react-query";
import {
  getCatalogPriceInputProps,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { Button } from "@/shared/ui/button";
import { confirmDelete } from "@/shared/ui/confirmation";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ProductSaleUnitsFieldProps {
  canEditPrices?: boolean;
  disabled?: boolean;
  discountPercent?: number;
  priceFormatMode?: CatalogPriceFormatMode;
  priceFallback?: string;
  saleUnits: SaleUnitsFormValue | undefined;
  settingsAction?: React.ReactNode;
  title?: string;
  onChange: (saleUnits: SaleUnitsFormValue) => void;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function sortCatalogSaleUnits(
  units: CatalogSaleUnitDto[],
): CatalogSaleUnitDto[] {
  return units.slice().sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }

    return left.name.localeCompare(right.name, "ru");
  });
}

function resolveInitialRelationMultiplier(
  currentBaseQuantity: unknown,
  parentBaseQuantity: unknown,
): string {
  const currentQuantity = toPositiveSaleUnitNumber(currentBaseQuantity);
  const parentQuantity = toPositiveSaleUnitNumber(parentBaseQuantity);

  if (currentQuantity === null || parentQuantity === null) {
    return "";
  }

  const ratio = currentQuantity / parentQuantity;
  return Number.isFinite(ratio) && ratio > 0 ? String(ratio) : "";
}

function resolveRelationCalculatedPrice(params: {
  priceFormatMode: CatalogPriceFormatMode;
  relation: SaleUnitRelationDraftsByIndex[number];
  units: SaleUnitsFormValue;
}): string | null {
  const { priceFormatMode, relation, units } = params;
  const multiplier = toPositiveSaleUnitNumber(relation.multiplier);
  const parentIndex = relation.parentIndex;

  if (multiplier === null || parentIndex === null) {
    return null;
  }

  const parentUnit = units[parentIndex];
  const parentPrice = toPositiveSaleUnitNumber(parentUnit?.price);

  if (parentPrice === null) {
    return null;
  }

  const totalPrice = multiplier * parentPrice;

  return `${formatSaleUnitMoney(totalPrice, priceFormatMode)} ₽`;
}

export const ProductSaleUnitsField: React.FC<ProductSaleUnitsFieldProps> = ({
  canEditPrices = true,
  disabled,
  discountPercent = 0,
  priceFormatMode = "integer",
  priceFallback,
  saleUnits,
  settingsAction,
  title = "Единицы продажи",
  onChange,
}) => {
  const priceInputProps = getCatalogPriceInputProps(priceFormatMode);
  const [relationByIndex, setRelationByIndex] =
    React.useState<SaleUnitRelationDraftsByIndex>({});

  const catalogUnitsQuery = useCatalogSaleUnitControllerGetAll(undefined, {
    query: {
      staleTime: 60_000,
    },
  });

  const units = React.useMemo(() => saleUnits ?? [], [saleUnits]);
  const derivedRelationByIndex = React.useMemo(
    () => deriveSaleUnitRelationDrafts(units),
    [units],
  );
  const catalogUnits = React.useMemo(
    () => sortCatalogSaleUnits(catalogUnitsQuery.data ?? []),
    [catalogUnitsQuery.data],
  );
  const selectedCatalogUnitIds = React.useMemo(
    () =>
      new Set(
        units
          .map((unit) => normalizeText(unit.catalogSaleUnitId))
          .filter(Boolean),
      ),
    [units],
  );
  const canBindSaleUnit = React.useMemo(
    () =>
      catalogUnits.some(
        (catalogUnit) => !selectedCatalogUnitIds.has(catalogUnit.id),
      ),
    [catalogUnits, selectedCatalogUnitIds],
  );

  const handleAdd = React.useCallback(() => {
    const nextUnit = createDefaultSaleUnitFormValue(
      units.length === 0 ? priceFallback : "",
    );

    onChange(
      normalizeSaleUnitRows([
        ...units,
        {
          ...nextUnit,
          baseQuantity: units.length === 0 ? "1" : "",
        },
      ]),
    );
  }, [onChange, priceFallback, units]);

  const handleRemove = React.useCallback(
    (index: number) => {
      const nextRelations = removeSaleUnitRelationAtIndex(
        relationByIndex,
        index,
      );

      onChange(
        normalizeSaleUnitRows(
          applySaleUnitRelationQuantities(
            units.filter((_, itemIndex) => itemIndex !== index),
            nextRelations,
          ),
        ),
      );
      setRelationByIndex(nextRelations);
    },
    [onChange, relationByIndex, units],
  );

  const handleConfirmRemove = React.useCallback(
    async (index: number) => {
      const unit = units[index];
      const name = unit ? getSaleUnitDisplayName(unit) : "";
      const confirmed = await confirmDelete({
        title: "Удалить единицу продажи?",
        description: name
          ? `Единица продажи "${name}" будет удалена из товара.`
          : "Единица продажи будет удалена из товара.",
        confirmText: "Удалить",
        cancelText: "Отмена",
        tone: "destructive",
      });

      if (confirmed) {
        handleRemove(index);
      }
    },
    [handleRemove, units],
  );

  const handleUnitChange = React.useCallback(
    (
      index: number,
      patch: Partial<SaleUnitFormValue>,
      options: { clearRelation?: boolean } = {},
    ) => {
      const nextRelations = options.clearRelation
        ? clearSaleUnitRelationAtIndex(relationByIndex, index)
        : relationByIndex;

      onChange(
        normalizeSaleUnitRows(
          applySaleUnitRelationQuantities(
            units.map((unit, itemIndex) =>
              itemIndex === index ? { ...unit, ...patch } : unit,
            ),
            nextRelations,
          ),
        ),
      );
      if (nextRelations !== relationByIndex) {
        setRelationByIndex(nextRelations);
      }
    },
    [onChange, relationByIndex, units],
  );

  const handleSelectCatalogUnit = React.useCallback(
    (index: number, catalogUnitId: string) => {
      const selectedUnit = catalogUnits.find(
        (unit) => unit.id === catalogUnitId,
      );
      const currentUnit = units[index];

      if (!selectedUnit || !currentUnit) {
        return;
      }

      const isAlreadySelected = units.some(
        (unit, itemIndex) =>
          itemIndex !== index && unit.catalogSaleUnitId === catalogUnitId,
      );
      if (isAlreadySelected) {
        toast.error("Эта единица продажи уже привязана.");
        return;
      }

      handleUnitChange(
        index,
        {
          catalogSaleUnitId: selectedUnit.id,
          catalogSaleUnitName: selectedUnit.name,
          label: selectedUnit.name,
          baseQuantity: currentUnit.baseQuantity || (index === 0 ? "1" : ""),
        },
        { clearRelation: true },
      );
    },
    [catalogUnits, handleUnitChange, units],
  );

  const handleRelationChange = React.useCallback(
    (index: number, patch: Partial<SaleUnitRelationDraftsByIndex[number]>) => {
      const currentRelation = resolveSaleUnitRelationDraft(
        relationByIndex[index],
        derivedRelationByIndex[index],
      );
      const nextRelation = {
        ...currentRelation,
        ...patch,
      };
      const nextRelations = {
        ...relationByIndex,
        [index]: nextRelation,
      };
      const shouldClearBaseQuantity =
        patch.multiplier !== undefined &&
        toPositiveSaleUnitNumber(nextRelation.multiplier) === null;
      const nextUnits = shouldClearBaseQuantity
        ? units.map((unit, itemIndex) =>
            itemIndex === index
              ? { ...unit, baseQuantity: itemIndex === 0 ? "1" : "" }
              : unit,
          )
        : units;

      setRelationByIndex(nextRelations);
      onChange(
        normalizeSaleUnitRows(
          applySaleUnitRelationQuantities(nextUnits, nextRelations),
        ),
      );
    },
    [derivedRelationByIndex, onChange, relationByIndex, units],
  );

  const handleRelationClear = React.useCallback(
    (index: number) => {
      const nextRelations = {
        ...clearSaleUnitRelationAtIndex(relationByIndex, index),
        [index]: {
          multiplier: "",
          parentIndex: null,
        },
      };

      setRelationByIndex(nextRelations);
      onChange(
        normalizeSaleUnitRows(
          units.map((unit, itemIndex) =>
            itemIndex === index
              ? { ...unit, baseQuantity: itemIndex === 0 ? "1" : "" }
              : unit,
          ),
        ),
      );
    },
    [onChange, relationByIndex, units],
  );

  const bindSaleUnitButton = canBindSaleUnit ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleAdd}
      disabled={disabled}
      className="h-8 shrink-0 px-2.5"
      title="Привязать единицы продажи"
    >
      <Plus className="size-4" />
      Привязать единицы
    </Button>
  ) : null;

  return (
    <div className="w-full min-w-0 space-y-3 overflow-hidden rounded-md border border-border bg-muted/10 p-2 sm:p-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0 flex-1 truncate text-sm font-medium">
          {title}
        </div>
        {settingsAction ? (
          <div className="flex shrink-0 items-center gap-2">
            {settingsAction}
          </div>
        ) : null}
      </div>

      {units.length === 0 && bindSaleUnitButton ? (
        <div className="flex justify-start">{bindSaleUnitButton}</div>
      ) : null}

      {units.length > 0 ? (
        <div className="space-y-2">
          {units.map((unit, index) => {
            const selectedName = getSaleUnitDisplayName(unit);
            const preview = resolveSaleUnitDiscountPreview(
              unit.price || priceFallback,
              discountPercent,
            );
            const relation = resolveSaleUnitRelationDraft(
              relationByIndex[index],
              derivedRelationByIndex[index],
            );
            const relationCalculatedPrice = resolveRelationCalculatedPrice({
              priceFormatMode,
              relation,
              units,
            });
            const parentOptions = units
              .map((candidate, candidateIndex) => ({
                baseQuantity: toPositiveSaleUnitNumber(candidate.baseQuantity),
                index: candidateIndex,
                name: getSaleUnitDisplayName(candidate),
              }))
              .filter(
                (candidate) =>
                  candidate.index < index &&
                  Boolean(candidate.name) &&
                  candidate.baseQuantity !== null,
              );

            return (
              <div
                key={`${unit.id ?? unit.catalogSaleUnitId ?? "new"}-${index}`}
                className="relative w-full min-w-0 space-y-2 overflow-hidden rounded-md border border-border/70 bg-background p-2.5 lg:pt-8"
              >
                <button
                  type="button"
                  disabled={disabled}
                  title="Удалить единицу"
                  onClick={() => void handleConfirmRemove(index)}
                  className="absolute top-1 right-2 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>

                <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(220px,1.35fr)_minmax(128px,0.65fr)]">
                  <div className="min-w-0 space-y-2">
                    <span className="text-xs text-foreground">
                      Единицы продажи
                    </span>
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      {selectedName && !unit.catalogSaleUnitId ? (
                        <button
                          type="button"
                          disabled={disabled}
                          className="min-h-8 rounded-full border border-primary bg-primary/10 px-2.5 text-xs font-medium text-primary disabled:opacity-50"
                        >
                          {selectedName}
                        </button>
                      ) : null}

                      {catalogUnitsQuery.isLoading ? (
                        <span className="min-h-8 rounded-full border px-2.5 text-xs leading-8 text-muted-foreground">
                          Загрузка...
                        </span>
                      ) : (
                        catalogUnits.map((catalogUnit: CatalogSaleUnitDto) => {
                          const isSelected =
                            unit.catalogSaleUnitId === catalogUnit.id;
                          const isUsedElsewhere =
                            selectedCatalogUnitIds.has(catalogUnit.id) &&
                            !isSelected;

                          return (
                            <button
                              key={catalogUnit.id}
                              type="button"
                              disabled={disabled || isUsedElsewhere}
                              onClick={() =>
                                handleSelectCatalogUnit(index, catalogUnit.id)
                              }
                              className={[
                                "min-h-8 rounded-full border px-2.5 text-xs transition-colors disabled:opacity-40",
                                isSelected
                                  ? "border-primary bg-primary/10 font-medium text-primary"
                                  : "border-border text-muted-foreground hover:bg-muted",
                              ].join(" ")}
                            >
                              {catalogUnit.name}
                            </button>
                          );
                        })
                      )}

                    </div>
                  </div>

                  <label className="min-w-0 space-y-1">
                    <span className="flex min-w-0 items-center gap-1 text-xs text-foreground">
                      <span className="shrink-0">Цена</span>
                      {relationCalculatedPrice ? (
                        <span className="min-w-0 truncate">
                          ({relationCalculatedPrice})
                        </span>
                      ) : null}
                    </span>
                    <Input
                      value={unit.price}
                      type="number"
                      min={0}
                      step={priceInputProps.step}
                      inputMode={priceInputProps.inputMode}
                      disabled={disabled || !canEditPrices}
                      placeholder="1200"
                      onChange={(event) =>
                        handleUnitChange(index, { price: event.target.value })
                      }
                      className="h-8 min-w-0 px-2.5 text-sm"
                    />
                    {preview ? (
                      <span className="block text-xs text-muted-foreground">
                        {formatSaleUnitMoney(
                          preview.basePrice,
                          priceFormatMode,
                        )}
                        {" -> "}
                        <span className="font-medium text-foreground">
                          {formatSaleUnitMoney(
                            preview.finalPrice,
                            priceFormatMode,
                          )}
                        </span>
                      </span>
                    ) : null}
                  </label>
                </div>

                {parentOptions.length > 0 ? (
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs text-foreground">
                      Содержит
                    </span>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Input
                        value={relation.multiplier}
                        type="number"
                        min={0.0001}
                        step="0.001"
                        inputMode="decimal"
                        disabled={disabled}
                        placeholder="4"
                        className="h-8 min-w-[0] flex-1 px-2.5 text-sm"
                        onChange={(event) =>
                          handleRelationChange(index, {
                            multiplier: event.target.value,
                          })
                        }
                      />
                      <Select
                        value={
                          relation.parentIndex !== null
                            ? String(relation.parentIndex)
                            : undefined
                        }
                        disabled={disabled}
                        onValueChange={(value) => {
                          const parentIndex = Number(value);
                          const parentUnit = units[parentIndex];

                          handleRelationChange(index, {
                            parentIndex,
                            multiplier:
                              relation.multiplier ||
                              resolveInitialRelationMultiplier(
                                unit.baseQuantity,
                                parentUnit?.baseQuantity,
                              ),
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 min-w-[82px] max-w-[30%] flex-[0_0_30%]">
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                        <SelectContent>
                          {parentOptions.map((parent) => (
                            <SelectItem
                              key={parent.index}
                              value={String(parent.index)}
                            >
                              {parent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {relation.parentIndex !== null ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={disabled}
                          className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Сбросить связь"
                          onClick={() => handleRelationClear(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {units.length > 0 && bindSaleUnitButton ? (
        <div className="flex justify-start">{bindSaleUnitButton}</div>
      ) : null}

    </div>
  );
};
