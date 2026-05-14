"use client";

import { CartCheckoutTabs } from "@/core/widgets/cart-drawer/ui/cart-checkout-tabs";
import type {
  CheckoutConfig,
  CheckoutData,
  CheckoutLocation,
  CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import React from "react";

interface CartDrawerReadonlyCheckoutProps {
  checkoutConfig: CheckoutConfig;
  checkoutData: CheckoutData;
  checkoutLocation: CheckoutLocation;
  checkoutMethod: CheckoutMethod | null;
  normalizedComment: string;
  onCheckoutChange: (method: CheckoutMethod, data: CheckoutData) => void;
  shouldShowReadonlyComment: boolean;
}

export const CartDrawerReadonlyCheckout: React.FC<
  CartDrawerReadonlyCheckoutProps
> = ({
  checkoutConfig,
  checkoutData,
  checkoutLocation,
  checkoutMethod,
  normalizedComment,
  onCheckoutChange,
  shouldShowReadonlyComment,
}) => {
  return (
    <>
      {checkoutMethod ? (
        <CartCheckoutTabs
          config={checkoutConfig}
          data={checkoutData}
          location={checkoutLocation}
          locked
          method={checkoutMethod}
          onChange={onCheckoutChange}
        />
      ) : null}

      {shouldShowReadonlyComment ? (
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Комментарий:</h3>
          <p className="whitespace-pre-wrap text-sm">{normalizedComment}</p>
        </div>
      ) : null}
    </>
  );
};
