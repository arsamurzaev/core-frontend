"use client";

import type { CartLineModifierSelection } from "@/core/modules/cart/model/cart-line-key";
import { CartQuantityControl } from "@/core/modules/cart/ui/cart-quantity-control";
import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import { cn } from "@/shared/lib/utils";
import React from "react";

interface CartCardActionProps {
  className?: string;
  guestName?: string | null;
  guestSessionId?: string | null;
  maxQuantity?: number;
  modifiers?: CartLineModifierSelection[] | null;
  productId: string;
  quantity?: number;
  saleUnitId?: string | null;
  variantId?: string | null;
}

export const CartCardAction = React.memo(function CartCardAction({
  className,
  guestName,
  guestSessionId,
  maxQuantity,
  modifiers,
  productId,
  quantity: quantityOverride,
  saleUnitId,
  variantId,
}: CartCardActionProps) {
  const {
    handleDecrement,
    handleIncrement,
    isBusy,
    isIncrementDisabled,
    quantity,
  } =
    useCartProductControls(
      {
        guestName,
        guestSessionId,
        modifiers,
        productId,
        saleUnitId,
        variantId,
      },
      undefined,
      {
        maxQuantity,
        quantityOverride,
        quantityScope: "line",
      },
    );

  const handleStopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <CartQuantityControl
      buttonKind="ui-button"
      buttonSize="icon"
      buttonVariant="ghost"
      className={cn(
        "flex cursor-default items-center justify-center rounded-pill bg-surface-muted",
        className,
      )}
      decrementContent="-"
      decrementDisabled={isBusy}
      incrementContent="+"
      incrementDisabled={isBusy || isIncrementDisabled}
      onClick={handleStopPropagation}
      onDecrement={handleDecrement}
      onIncrement={handleIncrement}
      onPointerDown={handleStopPropagation}
      value={quantity}
    />
  );
});
