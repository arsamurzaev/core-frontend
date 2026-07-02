"use client";

import {
  buildCheckoutSummary,
  type CheckoutData,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import React from "react";

interface CartCheckoutLockedSummaryProps {
  data: CheckoutData;
  method: CheckoutMethod;
}

export const CartCheckoutLockedSummary: React.FC<
  CartCheckoutLockedSummaryProps
> = ({ data, method }) => {
  const lines = buildCheckoutSummary({ data, method });

  return (
    <section className="space-y-2 rounded-control border border-line-default p-3">
      <h3 className="text-base font-semibold">Способ заказа</h3>
      <div className="space-y-1 text-sm text-text-muted">
        {lines.map((line) => (
          <p key={line} className="whitespace-pre-wrap">
            {line}
          </p>
        ))}
      </div>
    </section>
  );
};
