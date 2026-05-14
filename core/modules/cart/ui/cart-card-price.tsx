"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { Badge } from "@/shared/ui/badge";
import React from "react";

function formatCartCardPrice(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? Intl.NumberFormat("ru").format(value)
    : "?";
}

export function getCartCardDiscountPercent(item: CartItemView): number {
  if (
    item.originalLineTotal === null ||
    item.displayLineTotal === null ||
    !Number.isFinite(item.originalLineTotal) ||
    !Number.isFinite(item.displayLineTotal) ||
    item.originalLineTotal <= 0 ||
    item.originalLineTotal <= item.displayLineTotal
  ) {
    return 0;
  }

  return Math.max(
    1,
    Math.round(
      ((item.originalLineTotal - item.displayLineTotal) /
        item.originalLineTotal) *
        100,
    ),
  );
}

interface CartCardPriceProps {
  item: CartItemView;
}

export const CartCardPrice: React.FC<CartCardPriceProps> = ({ item }) => {
  const discountPercent = item.hasDiscount
    ? getCartCardDiscountPercent(item)
    : 0;
  const shouldShowDiscount = discountPercent > 0;
  const hasKnownPrice = item.displayLineTotal !== null;

  return (
    <div className="flex items-end gap-3">
      <p className="text-sm leading-none font-bold sm:text-lg">
        {formatCartCardPrice(item.displayLineTotal)}
        {hasKnownPrice ? ` ${item.currency}` : null}
      </p>
      {shouldShowDiscount ? (
        <>
          <p className="text-muted text-xs leading-none font-bold line-through">
            {formatCartCardPrice(item.originalLineTotal)} {item.currency}
          </p>
          <Badge className="absolute right-0 bottom-2">
            -{discountPercent}%
          </Badge>
        </>
      ) : null}
    </div>
  );
};
