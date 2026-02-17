import { Button } from "@/shared/ui/button";
import { CardFooter } from "@/shared/ui/card";
import React from "react";

interface ProductCardPriceProps {
  amount: number;
  currency: string;
  ctaText: string;
  hasDiscount: boolean;
  originalAmount?: number;
  discountPercent?: number;
}

function formatPrice(value: number): string {
  return Intl.NumberFormat("ru").format(value);
}

export const ProductCardPrice: React.FC<ProductCardPriceProps> = ({
  amount,
  currency,
  ctaText,
  hasDiscount,
  originalAmount,
  discountPercent,
}) => {
  return (
    <CardFooter className="mt-3 flex items-end justify-between gap-3">
      <div className="space-y-1">
        {hasDiscount && originalAmount !== undefined && (
          <p className="text-muted-foreground text-xs line-through">
            {formatPrice(originalAmount)} {currency}
          </p>
        )}
        <p className="text-base font-bold">
          {formatPrice(amount)} <span className="font-normal">{currency}</span>
          {hasDiscount && discountPercent ? (
            <span className="ml-2 text-xs font-medium text-emerald-700">
              -{discountPercent}%
            </span>
          ) : null}
        </p>
      </div>
      <Button size="sm">{ctaText}</Button>
    </CardFooter>
  );
};
