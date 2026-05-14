"use client";

import {
  createDefaultSaleUnitFormValue,
  type SaleUnitFormValue,
  type SaleUnitsFormValue,
} from "@/core/modules/product/editor/model/product-variants";
import {
  clearSaleUnitDraftNameAtIndex,
  formatSaleUnitMoney,
  formatSaleUnitQuantity,
  getSaleUnitDisplayName,
  normalizeSaleUnitRows,
  removeSaleUnitDraftNameAtIndex,
  resolveSaleUnitDiscountPreview,
  toPositiveSaleUnitNumber,
} from "@/core/modules/product/editor/model/product-sale-units-field-model";
import {
  getCatalogSaleUnitControllerGetAllQueryKey,
  type CatalogSaleUnitDto,
  useCatalogSaleUnitControllerCreate,
  useCatalogSaleUnitControllerGetAll,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ProductSaleUnitsFieldProps {
  disabled?: boolean;
  discountPercent?: number;
  priceFallback?: string;
  saleUnits: SaleUnitsFormValue | undefined;
  title?: string;
  onChange: (saleUnits: SaleUnitsFormValue) => void;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const ProductSaleUnitsField: React.FC<ProductSaleUnitsFieldProps> = ({
  disabled,
  discountPercent = 0,
  priceFallback,
  saleUnits,
  title = "Единицы продажи",
  onChange,
}) => {
  const queryClient = useQueryClient();
  const [draftNameByIndex, setDraftNameByIndex] = React.useState<
    Record<number, string>
  >({});

  const catalogUnitsQuery = useCatalogSaleUnitControllerGetAll(undefined, {
    query: {
      staleTime: 60_000,
    },
  });
  const createCatalogUnit = useCatalogSaleUnitControllerCreate<unknown>();

  const units = React.useMemo(() => saleUnits ?? [], [saleUnits]);
  const catalogUnits = React.useMemo(
    () => catalogUnitsQuery.data ?? [],
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

  const handleAdd = React.useCallback(() => {
    onChange(
      normalizeSaleUnitRows([
        ...units,
        createDefaultSaleUnitFormValue(units.length === 0 ? priceFallback : ""),
      ]),
    );
  }, [onChange, priceFallback, units]);

  const handleRemove = React.useCallback(
    (index: number) => {
      onChange(
        normalizeSaleUnitRows(
          units.filter((_, itemIndex) => itemIndex !== index),
        ),
      );
      setDraftNameByIndex((current) =>
        removeSaleUnitDraftNameAtIndex(current, index),
      );
    },
    [onChange, units],
  );

  const handleUnitChange = React.useCallback(
    (index: number, patch: Partial<SaleUnitFormValue>) => {
      onChange(
        normalizeSaleUnitRows(
          units.map((unit, itemIndex) =>
            itemIndex === index ? { ...unit, ...patch } : unit,
          ),
        ),
      );
    },
    [onChange, units],
  );

  const handleDefaultChange = React.useCallback(
    (index: number, checked: boolean) => {
      if (!checked) {
        return;
      }

      onChange(
        units.map((unit, itemIndex) => ({
          ...unit,
          isDefault: itemIndex === index,
        })),
      );
    },
    [onChange, units],
  );

  const handleSelectCatalogUnit = React.useCallback(
    (index: number, catalogUnitId: string) => {
      const selectedUnit = catalogUnits.find((unit) => unit.id === catalogUnitId);
      const currentUnit = units[index];

      if (!selectedUnit || !currentUnit) {
        return;
      }

      const isAlreadySelected = units.some(
        (unit, itemIndex) =>
          itemIndex !== index && unit.catalogSaleUnitId === catalogUnitId,
      );
      if (isAlreadySelected) {
        toast.error("Этот формат уже добавлен.");
        return;
      }

      const shouldUseCatalogQuantity =
        !currentUnit.catalogSaleUnitId &&
        (!currentUnit.baseQuantity || currentUnit.baseQuantity === "1");

      handleUnitChange(index, {
        catalogSaleUnitId: selectedUnit.id,
        catalogSaleUnitName: selectedUnit.name,
        label: selectedUnit.name,
        baseQuantity: shouldUseCatalogQuantity
          ? formatSaleUnitQuantity(selectedUnit.defaultBaseQuantity)
          : currentUnit.baseQuantity,
      });
      setDraftNameByIndex((current) =>
        clearSaleUnitDraftNameAtIndex(current, index),
      );
    },
    [catalogUnits, handleUnitChange, units],
  );

  const handleDraftNameChange = React.useCallback(
    (index: number, value: string) => {
      setDraftNameByIndex((current) => ({
        ...current,
        [index]: value,
      }));
    },
    [],
  );

  const handleCreateCatalogUnit = React.useCallback(
    async (index: number) => {
      const name = normalizeText(draftNameByIndex[index]);
      const currentUnit = units[index];

      if (!name) {
        toast.error("Введите название формата продажи.");
        return;
      }

      if (!currentUnit) {
        return;
      }

      try {
        const createdUnit = await createCatalogUnit.mutateAsync({
          data: {
            name,
            defaultBaseQuantity:
              toPositiveSaleUnitNumber(currentUnit.baseQuantity) ?? undefined,
          },
        });

        await queryClient.invalidateQueries({
          queryKey: getCatalogSaleUnitControllerGetAllQueryKey(),
        });

        handleUnitChange(index, {
          catalogSaleUnitId: createdUnit.id,
          catalogSaleUnitName: createdUnit.name,
          label: createdUnit.name,
          baseQuantity:
            currentUnit.baseQuantity ||
            formatSaleUnitQuantity(createdUnit.defaultBaseQuantity),
        });

        setDraftNameByIndex((current) =>
          clearSaleUnitDraftNameAtIndex(current, index),
        );

        toast.success("Формат продажи добавлен.");
      } catch (error) {
        toast.error(extractApiErrorMessage(error));
      }
    },
    [
      createCatalogUnit,
      draftNameByIndex,
      handleUnitChange,
      queryClient,
      units,
    ],
  );

  const isCatalogUnitBusy = createCatalogUnit.isPending;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-medium">{title}</div>
          <p className="text-xs leading-5 text-muted-foreground">
            Форматы сохраняются в этом каталоге. Количество и цена задаются для
            конкретного товара.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
          className="h-8 shrink-0 px-3"
          title="Добавить формат продажи"
        >
          <Plus className="size-4" />
          Добавить
        </Button>
      </div>

      {units.length > 0 ? (
        <div className="space-y-3">
          {units.map((unit, index) => {
            const draftName = draftNameByIndex[index] ?? "";
            const selectedName = getSaleUnitDisplayName(unit);
            const preview = resolveSaleUnitDiscountPreview(
              unit.price || priceFallback,
              discountPercent,
            );
            const isCreateDisabled =
              Boolean(disabled) || isCatalogUnitBusy || !draftName.trim();

            return (
              <div
                key={`${unit.id ?? unit.catalogSaleUnitId ?? "new"}-${index}`}
                className="space-y-3 rounded-md border border-border/70 bg-background p-3"
              >
                <div className="grid gap-3 lg:grid-cols-[minmax(210px,1.35fr)_minmax(110px,0.55fr)_minmax(120px,0.65fr)]">
                  <div className="min-w-0 space-y-1.5">
                    <span className="text-xs text-muted-foreground">
                      Формат продажи
                    </span>
                    <Select
                      value={unit.catalogSaleUnitId || undefined}
                      disabled={disabled || catalogUnitsQuery.isLoading}
                      onValueChange={(value) =>
                        handleSelectCatalogUnit(index, value)
                      }
                    >
                      <SelectTrigger className="h-9 min-w-0">
                        <SelectValue
                          placeholder={
                            catalogUnitsQuery.isLoading
                              ? "Загружаем форматы"
                              : "Выберите формат"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogUnits.map((catalogUnit: CatalogSaleUnitDto) => (
                          <SelectItem
                            key={catalogUnit.id}
                            value={catalogUnit.id}
                            disabled={
                              selectedCatalogUnitIds.has(catalogUnit.id) &&
                              unit.catalogSaleUnitId !== catalogUnit.id
                            }
                          >
                            {catalogUnit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedName && !unit.catalogSaleUnitId ? (
                      <div className="rounded-md bg-muted px-2.5 py-2 text-xs leading-5 text-muted-foreground">
                        Сейчас указано: {selectedName}. Выберите существующий
                        формат или создайте его ниже.
                      </div>
                    ) : null}

                    <div className="flex min-w-0 gap-2">
                      <Input
                        value={draftName}
                        disabled={disabled || isCatalogUnitBusy}
                        placeholder="Новый формат"
                        onChange={(event) =>
                          handleDraftNameChange(index, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void handleCreateCatalogUnit(index);
                          }
                        }}
                        className="h-9 min-w-0 px-3 text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isCreateDisabled}
                        onClick={() => void handleCreateCatalogUnit(index)}
                        className="h-9 shrink-0 px-3"
                      >
                        Создать
                      </Button>
                    </div>
                  </div>

                  <label className="min-w-0 space-y-1.5">
                    <span className="text-xs text-muted-foreground">
                      Кол-во внутри
                    </span>
                    <Input
                      value={unit.baseQuantity}
                      type="number"
                      min={0.0001}
                      step="0.001"
                      inputMode="decimal"
                      disabled={disabled}
                      placeholder="12"
                      title="Количество базовых единиц внутри"
                      onChange={(event) =>
                        handleUnitChange(index, {
                          baseQuantity: event.target.value,
                        })
                      }
                      className="h-9 px-3 text-sm"
                    />
                    {preview ? (
                      <span className="block text-xs text-muted-foreground">
                        {formatSaleUnitMoney(preview.basePrice)}{" -> "}
                        <span className="font-medium text-foreground">
                          {formatSaleUnitMoney(preview.finalPrice)}
                        </span>{" "}
                        (-{discountPercent}%)
                      </span>
                    ) : null}
                  </label>

                  <label className="min-w-0 space-y-1.5">
                    <span className="text-xs text-muted-foreground">
                      Цена
                    </span>
                    <Input
                      value={unit.price}
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      disabled={disabled}
                      placeholder="1200"
                      onChange={(event) =>
                        handleUnitChange(index, { price: event.target.value })
                      }
                      className="h-9 px-3 text-sm"
                    />
                  </label>
                </div>

                {catalogUnits.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {catalogUnits.slice(0, 5).map((catalogUnit) => {
                      const isSelected = unit.catalogSaleUnitId === catalogUnit.id;
                      const isUsedElsewhere =
                        selectedCatalogUnitIds.has(catalogUnit.id) && !isSelected;

                      return (
                        <button
                          key={catalogUnit.id}
                          type="button"
                          disabled={disabled || isUsedElsewhere}
                          onClick={() =>
                            handleSelectCatalogUnit(index, catalogUnit.id)
                          }
                          className={[
                            "min-h-7 rounded-full border px-2.5 text-xs transition-colors disabled:opacity-50",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted",
                          ].join(" ")}
                        >
                          {catalogUnit.name}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex min-h-9 items-center gap-2 rounded-md border border-border/70 px-3 text-sm text-muted-foreground">
                    <Switch
                      size="sm"
                      checked={unit.isDefault}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        handleDefaultChange(index, checked === true)
                      }
                    />
                    Показывать первым
                  </label>

                  <button
                    type="button"
                    disabled={disabled}
                    title="Удалить формат"
                    onClick={() => handleRemove(index)}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 sm:justify-start"
                  >
                    <Trash2 className="size-4" />
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border px-3 py-3 text-sm leading-5 text-muted-foreground">
          Дополнительные форматы не нужны, если товар продается только одним
          способом. Цена возьмется из карточки варианта.
        </div>
      )}
    </div>
  );
};
