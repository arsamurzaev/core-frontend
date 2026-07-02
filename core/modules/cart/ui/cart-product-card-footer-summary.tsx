"use client";

import type { CartProductLinesSummary } from "@/core/modules/cart/model/cart-product-card-footer-state";
import {
  formatCatalogPrice,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";
import React from "react";

const QUANTITY_NUMBER_FORMAT = new Intl.NumberFormat("ru-RU");
const PIECE_LABEL = "\u0448\u0442.";

interface CartProductCardFooterSummaryProps {
  className?: string;
  isDetailed: boolean;
  onClick: (event: React.SyntheticEvent) => void;
  priceFormatMode: CatalogPriceFormatMode;
  summary: CartProductLinesSummary;
}

export function CartProductCardFooterSummary({
  className,
  isDetailed,
  onClick,
  priceFormatMode,
  summary,
}: CartProductCardFooterSummaryProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "mt-1 cursor-default rounded-control bg-surface-muted px-2.5 py-2 text-right",
        isDetailed ? "ml-auto w-fit max-w-full shrink-0" : "w-full",
        className,
      )}
    >
      <p className="text-base leading-none font-bold whitespace-nowrap">
        {formatCatalogPrice(summary.totalPrice, priceFormatMode)}{" "}
        <span className="font-normal">{summary.currency}</span>
      </p>
      <p className="mt-1 text-xs leading-none font-medium whitespace-nowrap text-text-muted">
        {QUANTITY_NUMBER_FORMAT.format(summary.totalQuantity)} {PIECE_LABEL},{" "}
        {summary.linesCount} {summary.variantLabel}
      </p>
    </div>
  );
}
