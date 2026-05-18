"use client";

import { canShowCartProductFooterPrice } from "@/core/modules/cart/model/cart-product-card-footer-state";
import {
  formatCatalogPrice,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";

interface CartProductCardFooterPriceProps {
  className?: string;
  currency: string;
  displayPrice: number | null | undefined;
  hasDiscount: boolean;
  priceFormatMode: CatalogPriceFormatMode;
  pricePrefix: string | null;
}

export function CartProductCardFooterPrice({
  className,
  currency,
  displayPrice,
  hasDiscount,
  priceFormatMode,
  pricePrefix,
}: CartProductCardFooterPriceProps) {
  if (!canShowCartProductFooterPrice(displayPrice)) {
    return null;
  }
  const price = Number(displayPrice);

  return (
    <p
      className={cn(
        "text-base font-bold whitespace-nowrap",
        !hasDiscount && "mt-4",
        className,
      )}
    >
      {pricePrefix ? `${pricePrefix} ` : null}
      {formatCatalogPrice(price, priceFormatMode)}{" "}
      <span className="font-normal">{currency}</span>
    </p>
  );
}
