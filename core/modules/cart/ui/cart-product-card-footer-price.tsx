"use client";

import { canShowCartProductFooterPrice } from "@/core/modules/cart/model/cart-product-card-footer-state";
import { cn } from "@/shared/lib/utils";

const RU_NUMBER_FORMAT = new Intl.NumberFormat("ru");

interface CartProductCardFooterPriceProps {
  className?: string;
  currency: string;
  displayPrice: number | null | undefined;
  hasDiscount: boolean;
  pricePrefix: string | null;
}

export function CartProductCardFooterPrice({
  className,
  currency,
  displayPrice,
  hasDiscount,
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
      {RU_NUMBER_FORMAT.format(price)}{" "}
      <span className="font-normal">{currency}</span>
    </p>
  );
}
