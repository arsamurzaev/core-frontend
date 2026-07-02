"use client";

import {
  createDefaultVariantCombinationFormValue,
  type VariantCombinationFormValue,
  type VariantMatrixRow,
  type VariantStatus,
} from "@/core/modules/product/editor/model/product-variants";
import {
  formatVariantMoney,
  getEnumValueLabel,
  resolveVariantDiscountPreview,
  VARIANT_STATUS_CLASS,
  VARIANT_STATUS_LABEL,
  VARIANT_STATUS_OPTIONS,
} from "@/core/modules/product/editor/model/product-variants-field-model";
import {
  ProductSaleUnitsField,
  type SaleUnitPriceListRelationHint,
} from "@/core/modules/product/editor/ui/product-sale-units-field";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import {
  getCatalogPriceInputProps,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import React from "react";

interface ProductVariantCombinationCardProps {
  canEditPrices?: boolean;
  canUseCatalogSaleUnits?: boolean;
  disabled?: boolean;
  discountPercent: number;
  hideBasePrices?: boolean;
  priceFormatMode?: CatalogPriceFormatMode;
  priceFallback?: string;
  renderSaleUnitPriceListFields?: (params: {
    index: number;
    relation?: SaleUnitPriceListRelationHint;
    row: VariantMatrixRow;
    unit: NonNullable<VariantCombinationFormValue["saleUnits"]>[number];
  }) => React.ReactNode;
  renderVariantPriceListFields?: (params: {
    item: VariantCombinationFormValue;
    row: VariantMatrixRow;
  }) => React.ReactNode;
  row: VariantMatrixRow;
  variantAttributes: AttributeDto[];
  onChange: (key: string, next: VariantCombinationFormValue) => void;
}

export const ProductVariantCombinationCard: React.FC<
  ProductVariantCombinationCardProps
> = ({
  canEditPrices = true,
  canUseCatalogSaleUnits = false,
  disabled,
  discountPercent,
  hideBasePrices = false,
  priceFormatMode = "integer",
  priceFallback,
  renderSaleUnitPriceListFields,
  renderVariantPriceListFields,
  row,
  variantAttributes,
  onChange,
}) => {
  const item = row.item ?? createDefaultVariantCombinationFormValue();
  const preview = resolveVariantDiscountPreview(
    item.price ?? priceFallback,
    discountPercent,
  );
  const priceInputProps = getCatalogPriceInputProps(priceFormatMode);
  const hasSaleUnitRows =
    canUseCatalogSaleUnits &&
    (item.saleUnits ?? []).some(
      (unit) =>
        Boolean(unit.id?.trim()) ||
        Boolean(unit.catalogSaleUnitId?.trim()) ||
        Boolean(unit.label?.trim()),
    );
  const variantPriceListFields =
    hideBasePrices && !hasSaleUnitRows && renderVariantPriceListFields
      ? renderVariantPriceListFields({ item, row })
      : null;

  function handleStatusChange(status: VariantStatus) {
    onChange(row.key, { ...item, status });
  }

  function handleStockChange(value: string) {
    if (value.trim().length === 0) {
      onChange(row.key, {
        ...item,
        stock: null,
      });
      return;
    }

    const parsed = parseInt(value, 10);
    onChange(row.key, {
      ...item,
      stock: isNaN(parsed) || parsed < 0 ? 0 : parsed,
    });
  }

  function handlePriceChange(value: string) {
    onChange(row.key, {
      ...item,
      price: value.trim().length > 0 ? value : undefined,
    });
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-control border p-3",
        item.status === "DISABLED"
          ? "border-line-subtle bg-surface-subtle"
          : "border-line-subtle bg-surface-base",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="break-words text-sm font-medium">{row.label}</div>
          <div className="mt-1 text-xs text-text-muted">
            {row.attributes
              .map((attributeValue) => {
                const attribute = variantAttributes.find(
                  (item) => item.id === attributeValue.attributeId,
                );
                return attribute
                  ? `${attribute.displayName}: ${getEnumValueLabel(
                      attribute,
                      attributeValue.enumValueId,
                    )}`
                  : attributeValue.enumValueId;
              })
              .join(" • ")}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {VARIANT_STATUS_OPTIONS.map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => handleStatusChange(status)}
              className={cn(
                "h-8 rounded-pill px-3 text-xs",
                item.status === status && VARIANT_STATUS_CLASS[status],
              )}
            >
              {VARIANT_STATUS_LABEL[status]}
            </Button>
          ))}
        </div>
      </div>

      {item.status === "DISABLED" ? (
        <div className="rounded-control border border-dashed border-line-subtle px-3 py-3 text-sm leading-5 text-text-muted">
          Комбинация выключена и не будет показана покупателю.
        </div>
      ) : (
        <div className="space-y-3">
          {!hideBasePrices ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <label className="block max-w-44 space-y-1">
                <span className="text-xs text-text-muted">Цена</span>
                <Input
                  type="number"
                  min={0}
                  step={priceInputProps.step}
                  inputMode={priceInputProps.inputMode}
                  value={item.price ?? ""}
                  placeholder={priceFallback || "0"}
                  disabled={disabled || !canEditPrices}
                  onChange={(event) => handlePriceChange(event.target.value)}
                  className="h-9 px-3 text-sm"
                />
              </label>

              {preview ? (
                <div className="rounded-control border border-line-subtle px-3 py-2 text-xs leading-5 text-text-muted">
                  {formatVariantMoney(preview.basePrice, priceFormatMode)}
                  {" -> "}
                  <span className="font-medium text-text-primary">
                    {formatVariantMoney(preview.finalPrice, priceFormatMode)}
                  </span>{" "}
                  (-{discountPercent}%)
                </div>
              ) : null}
            </div>
          ) : variantPriceListFields ? (
            <div className="min-w-0">{variantPriceListFields}</div>
          ) : null}

          {item.status === "ACTIVE" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <label className="block max-w-44 space-y-1">
                <span className="text-xs text-text-muted">Остаток</span>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={item.stock ?? ""}
                  placeholder="Без лимита"
                  disabled={disabled}
                  onChange={(event) => handleStockChange(event.target.value)}
                  className="h-9 px-3 text-sm"
                />
              </label>
            </div>
          ) : (
            <div className="rounded-control border border-status-warning/30 bg-status-warning-surface px-3 py-2 text-sm text-status-warning-foreground">
              Покупатель увидит комбинацию как временно недоступную.
            </div>
          )}

          {canUseCatalogSaleUnits ? (
            <ProductSaleUnitsField
              canEditPrices={canEditPrices}
              disabled={disabled}
              discountPercent={discountPercent}
              priceFormatMode={priceFormatMode}
              priceFallback={item.price ?? priceFallback}
              renderPriceListFields={
                renderSaleUnitPriceListFields
                  ? ({ index, relation, unit }) =>
                      renderSaleUnitPriceListFields({
                        index,
                        relation,
                        row,
                        unit,
                      })
                  : undefined
              }
              saleUnits={item.saleUnits}
              hidePrices={hideBasePrices}
              title={`Единицы продажи: ${row.label}`}
              onChange={(saleUnits) =>
                onChange(row.key, {
                  ...item,
                  saleUnits,
                })
              }
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
