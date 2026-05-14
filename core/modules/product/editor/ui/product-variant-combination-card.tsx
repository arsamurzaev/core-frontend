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
import { ProductSaleUnitsField } from "@/core/modules/product/editor/ui/product-sale-units-field";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import React from "react";

interface ProductVariantCombinationCardProps {
  canUseCatalogSaleUnits?: boolean;
  disabled?: boolean;
  discountPercent: number;
  priceFallback?: string;
  row: VariantMatrixRow;
  variantAttributes: AttributeDto[];
  onChange: (key: string, next: VariantCombinationFormValue) => void;
}

export const ProductVariantCombinationCard: React.FC<
  ProductVariantCombinationCardProps
> = ({
  canUseCatalogSaleUnits = false,
  disabled,
  discountPercent,
  priceFallback,
  row,
  variantAttributes,
  onChange,
}) => {
  const item = row.item ?? createDefaultVariantCombinationFormValue();
  const preview = resolveVariantDiscountPreview(
    item.price ?? priceFallback,
    discountPercent,
  );

  function handleStatusChange(status: VariantStatus) {
    onChange(row.key, { ...item, status });
  }

  function handleStockChange(value: string) {
    const parsed = parseInt(value, 10);
    onChange(row.key, {
      ...item,
      stock: isNaN(parsed) || parsed < 0 ? 0 : parsed,
    });
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-3",
        item.status === "DISABLED"
          ? "border-border bg-muted/20"
          : "border-border bg-background",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="break-words text-sm font-medium">{row.label}</div>
          <div className="mt-1 text-xs text-muted-foreground">
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
                "h-8 rounded-full px-3 text-xs",
                item.status === status && VARIANT_STATUS_CLASS[status],
              )}
            >
              {VARIANT_STATUS_LABEL[status]}
            </Button>
          ))}
        </div>
      </div>

      {item.status === "DISABLED" ? (
        <div className="rounded-md border border-dashed border-border px-3 py-3 text-sm leading-5 text-muted-foreground">
          Комбинация выключена и не будет показана покупателю.
        </div>
      ) : (
        <div className="space-y-3">
          {item.status === "ACTIVE" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <label className="block max-w-44 space-y-1">
                <span className="text-xs text-muted-foreground">Остаток</span>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={item.stock === 0 ? "" : item.stock}
                  placeholder="0"
                  disabled={disabled}
                  onChange={(event) => handleStockChange(event.target.value)}
                  className="h-9 px-3 text-sm"
                />
              </label>

              {preview ? (
                <div className="rounded-md border border-border/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
                  {formatVariantMoney(preview.basePrice)}{" -> "}
                  <span className="font-medium text-foreground">
                    {formatVariantMoney(preview.finalPrice)}
                  </span>{" "}
                  (-{discountPercent}%)
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Покупатель увидит комбинацию как временно недоступную.
            </div>
          )}

          {canUseCatalogSaleUnits ? (
            <ProductSaleUnitsField
              disabled={disabled}
              discountPercent={discountPercent}
              priceFallback={item.price ?? priceFallback}
              saleUnits={item.saleUnits}
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
