"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import {
  formatNullableCatalogPrice,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { Badge } from "@/shared/ui/badge";
import React from "react";

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
  priceFormatMode: CatalogPriceFormatMode;
}

export const CartCardPrice: React.FC<CartCardPriceProps> = ({
  item,
  priceFormatMode,
}) => {
  const discountPercent = item.hasDiscount
    ? getCartCardDiscountPercent(item)
    : 0;
  const shouldShowDiscount = discountPercent > 0;
  const hasKnownPrice = item.displayLineTotal !== null;

  return (
    <div className="flex items-end gap-3">
      <p className="text-sm leading-none font-bold sm:text-lg">
        {formatNullableCatalogPrice(item.displayLineTotal, priceFormatMode)}
        {hasKnownPrice ? ` ${item.currency}` : null}
      </p>
      {shouldShowDiscount ? (
        <>
          <p className="text-xs leading-none font-bold text-text-muted line-through">
            {formatNullableCatalogPrice(
              item.originalLineTotal,
              priceFormatMode,
            )}{" "}
            {item.currency}
          </p>
          <Badge className="absolute right-0 bottom-2">
            -{discountPercent}%
          </Badge>
        </>
      ) : null}
    </div>
  );
};
