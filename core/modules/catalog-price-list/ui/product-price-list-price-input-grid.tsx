"use client";

import { type CatalogPriceList } from "@/core/modules/catalog-price-list/model/catalog-price-list-api";
import {
  formatCatalogPrice,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
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
  getHint?: (priceList: CatalogPriceList) => string | null;
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

function toPositivePriceListNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

export function formatPriceListRelationHint(
  parentPrice: unknown,
  multiplier: unknown,
  priceFormatMode: CatalogPriceFormatMode = "integer",
): string | null {
  const parsedParentPrice = toPositivePriceListNumber(parentPrice);
  const parsedMultiplier = toPositivePriceListNumber(multiplier);

  if (parsedParentPrice === null || parsedMultiplier === null) {
    return null;
  }

  return `${formatCatalogPrice(
    parsedParentPrice * parsedMultiplier,
    priceFormatMode,
  )} ₽`;
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
  getHint,
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
        const hint = getHint?.(priceList) ?? null;
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
                "flex min-w-0 items-center gap-1",
                isCompact
                  ? "text-xs text-muted-foreground"
                  : "text-sm text-foreground",
              )}
            >
              <span className="min-w-0 truncate">
                {labelPrefix}({priceList.name})
              </span>
              {hint ? (
                <span className="shrink-0 text-muted-foreground">({hint})</span>
              ) : null}
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
