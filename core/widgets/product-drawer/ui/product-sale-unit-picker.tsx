"use client";

import type { ProductSaleUnit } from "@/core/modules/product/model/sale-units";
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

          return (
            <Button
              key={unit.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onChange(unit.id)}
              className={cn(
                "h-auto min-h-16 flex-col items-start justify-center rounded-lg px-3 py-2 text-left",
                isSelected && "shadow-custom",
              )}
            >
              <span className="max-w-full truncate text-sm font-semibold">
                {unit.label}
              </span>
              <span className="text-[11px] font-normal opacity-80">
                {formatCatalogPrice(unit.price, priceFormatMode)} {currency}
              </span>
              <span className="text-[10px] font-normal opacity-70">
                Внутри: {unit.baseQuantity}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
