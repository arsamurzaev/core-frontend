"use client";

import { type CatalogPriceList } from "@/core/modules/catalog-price-list/model/catalog-price-list-api";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import React from "react";

interface ProductPriceListPriceInputGridProps {
  className?: string;
  disabled?: boolean;
  fieldClassName?: string;
  inputClassName?: string;
  isFetching?: boolean;
  labelPrefix?: string;
  layout?: "form-row" | "compact";
  priceLists: CatalogPriceList[];
  rowLabel?: string;
  getValue: (priceList: CatalogPriceList) => string;
  onChange: (priceList: CatalogPriceList, value: string) => void;
}

export const PRODUCT_PRICE_LIST_PRICE_GRID_CLASS_NAME = "space-y-3";

function normalizePriceInputValue(value: string): string {
  const cleaned = value.replace(/\s+/g, "").replace(/[^\d.,]/g, "");
  const separatorIndex = cleaned.search(/[.,]/);

  if (separatorIndex < 0) {
    return cleaned;
  }

  const integerPart = cleaned.slice(0, separatorIndex);
  const separator = cleaned[separatorIndex];
  const decimalPart = cleaned.slice(separatorIndex + 1).replace(/[.,]/g, "");

  return `${integerPart}${separator}${decimalPart}`;
}

export const ProductPriceListPriceInputGrid: React.FC<
  ProductPriceListPriceInputGridProps
> = ({
  className,
  disabled = false,
  fieldClassName,
  inputClassName,
  isFetching = false,
  labelPrefix = "Цена",
  layout = "form-row",
  priceLists,
  rowLabel,
  getValue,
  onChange,
}) => {
  const isDisabled = disabled || isFetching;
  const isCompact = layout === "compact";

  return (
    <div
      className={cn(
        isCompact
          ? "flex min-w-0 flex-wrap gap-3"
          : PRODUCT_PRICE_LIST_PRICE_GRID_CLASS_NAME,
        className,
      )}
      aria-busy={isFetching || undefined}
    >
      {priceLists.map((priceList) => {
        const value = getValue(priceList);
        const ariaLabel = rowLabel
          ? `${labelPrefix}(${priceList.name}): ${rowLabel}`
          : `${labelPrefix}(${priceList.name})`;

        return (
          <label
            key={priceList.id}
            className={cn(
              isCompact
                ? "block min-w-[128px] max-w-44 flex-1 space-y-1"
                : "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(100px,200px)_minmax(217px,1fr)] sm:items-center",
              fieldClassName,
            )}
          >
            <span
              className={cn(
                "min-w-0 truncate",
                isCompact
                  ? "block text-xs text-muted-foreground"
                  : "text-sm text-foreground",
              )}
            >
              {labelPrefix}({priceList.name})
            </span>

            <Input
              aria-label={ariaLabel}
              value={value}
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              placeholder="...0"
              disabled={isDisabled}
              enterKeyHint="next"
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) =>
                onChange(
                  priceList,
                  normalizePriceInputValue(event.target.value),
                )
              }
              className={cn(
                isCompact
                  ? "h-8 min-w-0 px-2.5 text-sm"
                  : "min-w-0 text-center",
                inputClassName,
              )}
            />
          </label>
        );
      })}
    </div>
  );
};
