"use client";

import type { CartProductLinesSummary } from "@/core/modules/cart/model/cart-product-card-footer-state";
import { cn } from "@/shared/lib/utils";
import React from "react";

const RU_NUMBER_FORMAT = new Intl.NumberFormat("ru");
const PIECE_LABEL = "\u0448\u0442.";

interface CartProductCardFooterSummaryProps {
  className?: string;
  isDetailed: boolean;
  onClick: (event: React.SyntheticEvent) => void;
  summary: CartProductLinesSummary;
}

export function CartProductCardFooterSummary({
  className,
  isDetailed,
  onClick,
  summary,
}: CartProductCardFooterSummaryProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-secondary mt-1 cursor-default rounded-lg px-2.5 py-2 text-right",
        isDetailed ? "ml-auto w-fit max-w-full shrink-0" : "w-full",
        className,
      )}
    >
      <p className="text-base leading-none font-bold whitespace-nowrap">
        {RU_NUMBER_FORMAT.format(summary.totalPrice)}{" "}
        <span className="font-normal">{summary.currency}</span>
      </p>
      <p className="text-muted-foreground mt-1 text-xs leading-none font-medium whitespace-nowrap">
        {RU_NUMBER_FORMAT.format(summary.totalQuantity)} {PIECE_LABEL},{" "}
        {summary.linesCount} {summary.variantLabel}
      </p>
    </div>
  );
}
