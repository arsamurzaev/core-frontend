"use client";

import {
  applySaleUnitRelationQuantities,
  clearSaleUnitRelationAtIndex,
  deriveSaleUnitRelationDrafts,
  formatSaleUnitMoney,
  formatSaleUnitQuantity,
  getSaleUnitDisplayName,
  normalizeSaleUnitRows,
  removeSaleUnitRelationAtIndex,
  resetSaleUnitRelationQuantity,
  resolveSaleUnitDiscountPreview,
  resolveSaleUnitRelationDraft,
  toPositiveSaleUnitNumber,
  toSaleUnitRelationMultiplier,
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
import { Link2, Plus, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ProductSaleUnitsFieldProps {
  canEditPrices?: boolean;
  disabled?: boolean;
  discountPercent?: number;
  priceFormatMode?: CatalogPriceFormatMode;
  priceFallback?: string;
  renderPriceListFields?: (params: {
    index: number;
    unit: SaleUnitFormValue;
  }) => React.ReactNode;
  saleUnits: SaleUnitsFormValue | undefined;
  settingsAction?: React.ReactNode;
  hidePrices?: boolean;
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

function resolveSaleUnitRelationParentOptions(
  units: SaleUnitsFormValue,
  index: number,
) {
  return units
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
}

function resolveSelectedCatalogUnitBaseQuantity(params: {
  currentUnit: SaleUnitFormValue;
  index: number;
  selectedUnit: CatalogSaleUnitDto;
}): string {
  const { currentUnit, index, selectedUnit } = params;
  const catalogQuantity = toPositiveSaleUnitNumber(
    selectedUnit.defaultBaseQuantity,
  );
  const currentQuantity = normalizeText(currentUnit.baseQuantity);
  const currentCatalogSaleUnitId = normalizeText(currentUnit.catalogSaleUnitId);
  const isFreshSelection = !normalizeText(currentUnit.catalogSaleUnitId);
  const isCatalogUnitChange = currentCatalogSaleUnitId !== selectedUnit.id;
  const shouldUseCatalogDefault =
    catalogQuantity !== null &&
    (isCatalogUnitChange ||
      !currentQuantity ||
      (isFreshSelection && index === 0 && currentQuantity === "1"));

  if (shouldUseCatalogDefault) {
    return formatSaleUnitQuantity(catalogQuantity);
  }

  if (currentQuantity) {
    return currentQuantity;
  }

  return catalogQuantity !== null
    ? formatSaleUnitQuantity(catalogQuantity)
    : "1";
}

function resolveRelationCalculatedPrice(params: {
  priceFormatMode: CatalogPriceFormatMode;
  relation: SaleUnitRelationDraftsByIndex[number];
  units: SaleUnitsFormValue;
}): string | null {
  const { priceFormatMode, relation, units } = params;
  const multiplier = toSaleUnitRelationMultiplier(relation.multiplier);
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
  renderPriceListFields,
  saleUnits,
  settingsAction,
  hidePrices = false,
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
    () =>
      deriveSaleUnitRelationDrafts(units, {
        onlyChangedFromCatalogDefault: true,
      }),
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

  React.useEffect(() => {
    if (!hidePrices || units.length === 0) {
      return;
    }

    let changed = false;
    const nextUnits = units.map((unit) => {
      if (normalizeText(unit.price)) {
        return unit;
      }

      changed = true;
      return {
        ...unit,
        price: "0",
      };
    });

    if (changed) {
      onChange(normalizeSaleUnitRows(nextUnits));
    }
  }, [hidePrices, onChange, units]);

  const handleAdd = React.useCallback(() => {
    const nextPriceFallback = hidePrices
      ? "0"
      : units.length === 0
        ? priceFallback
        : "";
    const nextUnit = createDefaultSaleUnitFormValue(nextPriceFallback);

    onChange(
      normalizeSaleUnitRows([
        ...units,
        {
          ...nextUnit,
          baseQuantity: units.length === 0 ? "1" : "",
        },
      ]),
    );
  }, [hidePrices, onChange, priceFallback, units]);

  const handleRemove = React.useCallback(
    (index: number) => {
      const effectiveRelations = {
        ...derivedRelationByIndex,
        ...relationByIndex,
      };
      const nextRelations = removeSaleUnitRelationAtIndex(
        effectiveRelations,
        index,
      );
      const nextUnits = units
        .filter((_, itemIndex) => itemIndex !== index)
        .map((unit, nextIndex) => {
          const originalIndex = nextIndex >= index ? nextIndex + 1 : nextIndex;
          const originalRelation = effectiveRelations[originalIndex];

          return originalRelation?.parentIndex === index
            ? resetSaleUnitRelationQuantity(unit)
            : unit;
        });

      onChange(
        normalizeSaleUnitRows(
          applySaleUnitRelationQuantities(nextUnits, nextRelations),
        ),
      );
      setRelationByIndex(nextRelations);
    },
    [derivedRelationByIndex, onChange, relationByIndex, units],
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
          catalogDefaultBaseQuantity: formatSaleUnitQuantity(
            selectedUnit.defaultBaseQuantity,
          ),
          label: selectedUnit.name,
          baseQuantity: resolveSelectedCatalogUnitBaseQuantity({
            currentUnit,
            index,
            selectedUnit,
          }),
          price: hidePrices && !currentUnit.price ? "0" : currentUnit.price,
        },
        { clearRelation: true },
      );
    },
    [catalogUnits, handleUnitChange, hidePrices, units],
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

      setRelationByIndex(nextRelations);
      onChange(
        normalizeSaleUnitRows(
          applySaleUnitRelationQuantities(units, nextRelations),
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
      const nextUnits = units.map((unit, itemIndex) =>
        itemIndex === index ? resetSaleUnitRelationQuantity(unit) : unit,
      );

      setRelationByIndex(nextRelations);
      onChange(normalizeSaleUnitRows(nextUnits));
    },
    [onChange, relationByIndex, units],
  );

  const handleRelationEnable = React.useCallback(
    (index: number) => {
      const currentUnit = units[index];
      const parentOptions = resolveSaleUnitRelationParentOptions(units, index);
      const parent = parentOptions[parentOptions.length - 1];

      if (!currentUnit || !parent) {
        return;
      }

      handleRelationChange(index, {
        parentIndex: parent.index,
        multiplier: "",
      });
    },
    [handleRelationChange, units],
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
            const priceListFields =
              hidePrices && renderPriceListFields
                ? renderPriceListFields({ index, unit })
                : null;
            const hasPriceListFields = Boolean(priceListFields);
            const showPriceColumn = !hidePrices || hasPriceListFields;
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
            const parentOptions = resolveSaleUnitRelationParentOptions(
              units,
              index,
            );
            const hasRelationDraft =
              relation.parentIndex !== null ||
              Boolean(normalizeText(relation.multiplier));

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

                <div
                  className={
                    !showPriceColumn
                      ? "grid min-w-0 gap-2"
                      : hidePrices && hasPriceListFields
                        ? "grid min-w-0 gap-2"
                        : "grid min-w-0 gap-2 lg:grid-cols-[minmax(220px,1.35fr)_minmax(128px,0.65fr)]"
                  }
                >
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
                                  : "border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                              ].join(" ")}
                            >
                              {catalogUnit.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {!hidePrices ? (
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
                  ) : priceListFields ? (
                    <div className="min-w-0">{priceListFields}</div>
                  ) : null}
                </div>

                {parentOptions.length > 0 ? (
                  hasRelationDraft ? (
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-xs text-foreground">Содержит</span>
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Input
                          value={relation.multiplier}
                          type="number"
                          min={1}
                          step="any"
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

                            handleRelationChange(index, {
                              parentIndex,
                              multiplier: relation.multiplier,
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
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={disabled}
                        className="h-8 border border-border bg-background px-2.5 text-xs text-foreground shadow-none hover:border-foreground/30 hover:bg-muted/30 hover:text-foreground"
                        title="Связать с другой единицей"
                        onClick={() => handleRelationEnable(index)}
                      >
                        <Link2 className="size-4" />
                        Связать с другой единицей
                      </Button>
                    </div>
                  )
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
