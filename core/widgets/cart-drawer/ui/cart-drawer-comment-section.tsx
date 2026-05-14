"use client";

import { CartCheckoutTabs } from "@/core/widgets/cart-drawer/ui/cart-checkout-tabs";
import type {
  CheckoutConfig,
  CheckoutData,
  CheckoutLocation,
  CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import { Textarea } from "@/shared/ui/textarea";
import React from "react";

interface CartDrawerCommentSectionProps {
  checkoutConfig: CheckoutConfig;
  checkoutData: CheckoutData;
  checkoutError?: string | null;
  checkoutLocked: boolean;
  checkoutLocation: CheckoutLocation;
  checkoutMethod: CheckoutMethod | null;
  comment: string;
  commentPlaceholder: string;
  disabled: boolean;
  hasCheckoutMethods: boolean;
  onCheckoutChange: (method: CheckoutMethod, data: CheckoutData) => void;
  onCommentChange: (comment: string) => void;
}

export const CartDrawerCommentSection: React.FC<
  CartDrawerCommentSectionProps
> = ({
  checkoutConfig,
  checkoutData,
  checkoutError,
  checkoutLocked,
  checkoutLocation,
  checkoutMethod,
  comment,
  commentPlaceholder,
  disabled,
  hasCheckoutMethods,
  onCheckoutChange,
  onCommentChange,
}) => {
  return (
    <>
      {hasCheckoutMethods ? (
        <CartCheckoutTabs
          config={checkoutConfig}
          data={checkoutData}
          disabled={disabled}
          error={checkoutError}
          location={checkoutLocation}
          locked={checkoutLocked}
          method={checkoutMethod}
          onChange={onCheckoutChange}
        />
      ) : null}

      <p className="text-sm">
        Пожалуйста, впишите в поле ваши пожелания или комментарий к заказу.
        Это нужно для того, чтобы мы лучше поняли, что нужно
        вам.
      </p>

      <div className="space-y-3">
        <h3 className="text-xl font-bold">Комментарий к заказу</h3>

        <Textarea
          minRows={4}
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          className="border-muted shadow-custom min-h-25 rounded-lg border p-3"
          placeholder={commentPlaceholder}
        />
      </div>
    </>
  );
};
