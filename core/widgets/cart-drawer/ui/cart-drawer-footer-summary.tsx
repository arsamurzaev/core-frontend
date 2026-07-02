"use client";

import {
  formatCatalogPrice,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import React from "react";

interface CartDrawerFooterSummaryProps {
  currency: string;
  hasDiscount: boolean;
  price: number;
  priceFormatMode: CatalogPriceFormatMode;
  totalPrice: number;
}

export const CartDrawerFooterSummary: React.FC<
  CartDrawerFooterSummaryProps
> = ({ currency, hasDiscount, price, priceFormatMode, totalPrice }) => {
  return (
    <div className="min-w-27.5">
      <h4 className="w-27.5 text-xs">Заказ на сумму</h4>
      <h4 className="text-lg font-bold whitespace-nowrap sm:text-xl">
        {formatCatalogPrice(price, priceFormatMode)} {currency}
      </h4>
      {hasDiscount ? (
        <p className="text-text-muted text-xs line-through">
          {formatCatalogPrice(totalPrice, priceFormatMode)} {currency}
        </p>
      ) : null}
    </div>
  );
};
