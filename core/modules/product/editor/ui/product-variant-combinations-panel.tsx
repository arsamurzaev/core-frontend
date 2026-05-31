"use client";

import {
  type VariantCombinationFormValue,
  type VariantMatrixRow,
} from "@/core/modules/product/editor/model/product-variants";
import { ProductVariantCombinationCard } from "@/core/modules/product/editor/ui/product-variant-combination-card";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import { type CatalogPriceFormatMode } from "@/shared/lib/price-format";
import React from "react";

interface ProductVariantCombinationsPanelProps {
  canEditPrices?: boolean;
  canUseCatalogSaleUnits?: boolean;
  disabled?: boolean;
  discountPercent: number;
  matrixRows: VariantMatrixRow[];
  missingValueAttributes: AttributeDto[];
  priceFormatMode?: CatalogPriceFormatMode;
  priceFallback?: string;
  variantAttributes: AttributeDto[];
  onCombinationChange: (
    key: string,
    next: VariantCombinationFormValue,
  ) => void;
}

export const ProductVariantCombinationsPanel: React.FC<
  ProductVariantCombinationsPanelProps
> = ({
  canEditPrices = true,
  canUseCatalogSaleUnits = false,
  disabled,
  discountPercent,
  matrixRows,
  missingValueAttributes,
  priceFormatMode = "integer",
  priceFallback,
  variantAttributes,
  onCombinationChange,
}) => {
  const enabledCount = matrixRows.filter(
    (row) => row.item.status !== "DISABLED",
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">Комбинации</div>
        <div className="text-xs text-muted-foreground">
          {enabledCount}/{matrixRows.length} включено
        </div>
      </div>

      {missingValueAttributes.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-5 text-amber-800">
          Выберите значения для:{" "}
          {missingValueAttributes
            .map((attribute) => attribute.displayName)
            .join(", ")}
          .
        </div>
      ) : matrixRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-3 text-sm leading-5 text-muted-foreground">
          Выберите значения в карточках выше.
        </div>
      ) : (
        <div className="space-y-3">
          {matrixRows.map((row) => (
            <ProductVariantCombinationCard
              key={row.key}
              canEditPrices={canEditPrices}
              canUseCatalogSaleUnits={canUseCatalogSaleUnits}
              disabled={disabled}
              discountPercent={discountPercent}
              priceFormatMode={priceFormatMode}
              priceFallback={priceFallback}
              row={row}
              variantAttributes={variantAttributes}
              onChange={onCombinationChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
