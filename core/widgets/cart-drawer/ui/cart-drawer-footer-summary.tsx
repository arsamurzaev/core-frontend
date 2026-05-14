"use client";

import React from "react";

interface CartDrawerFooterSummaryProps {
  currency: string;
  hasDiscount: boolean;
  price: number;
  totalPrice: number;
}

function formatPrice(value: number) {
  return Intl.NumberFormat("ru-RU").format(value);
}

export const CartDrawerFooterSummary: React.FC<
  CartDrawerFooterSummaryProps
> = ({ currency, hasDiscount, price, totalPrice }) => {
  return (
    <div className="min-w-27.5">
      <h4 className="w-27.5 text-xs">Заказ на сумму</h4>
      <h4 className="text-lg font-bold whitespace-nowrap sm:text-xl">
        {formatPrice(price)} {currency}
      </h4>
      {hasDiscount ? (
        <p className="text-muted text-xs line-through">
          {formatPrice(totalPrice)} {currency}
        </p>
      ) : null}
    </div>
  );
};
