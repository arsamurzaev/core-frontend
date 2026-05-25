"use client";

import {
  getProductSaleUnitContainsText,
  type ProductSaleUnit,
} from "@/core/modules/product/model/sale-units";
import {
  formatCatalogPrice,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import React from "react";

interface ProductSaleUnitPickerProps {
  currency: string;
  onChange: (saleUnitId: string) => void;
  priceFormatMode: CatalogPriceFormatMode;
  saleUnits: ProductSaleUnit[];
  selectedSaleUnitId: string | null;
}

export function ProductSaleUnitPicker({
  currency,
  onChange,
  priceFormatMode,
  saleUnits,
  selectedSaleUnitId,
}: ProductSaleUnitPickerProps) {
  if (saleUnits.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2 px-4 pb-4">
      <div className="text-sm font-medium text-muted-foreground">
        Единица продажи
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {saleUnits.map((unit) => {
          const isSelected = selectedSaleUnitId === unit.id;
          const containsText =
            getProductSaleUnitContainsText(unit) ?? "Минимальная единица";

          return (
            <Button
              key={unit.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onChange(unit.id)}
              className={cn(
                "h-auto min-h-16 flex-col items-start justify-center gap-0.5 rounded-lg px-3 py-2 text-left",
                isSelected && "shadow-custom",
              )}
            >
              <span className="max-w-full truncate text-xs font-normal">
                {unit.label}
              </span>
              <span className="text-sm font-semibold opacity-90">
                {formatCatalogPrice(unit.price, priceFormatMode)} {currency}
              </span>
              <span className="max-w-full truncate text-[10px] font-normal opacity-70">
                {containsText}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
