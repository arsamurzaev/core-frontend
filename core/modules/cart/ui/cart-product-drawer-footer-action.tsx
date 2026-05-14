"use client";

import {
  getCartProductDrawerAddLabel,
  shouldShowCartProductDrawerAddButton,
} from "@/core/modules/cart/model/cart-product-drawer-footer-state";
import { CartProductDrawerAddButton } from "@/core/modules/cart/ui/cart-product-drawer-add-button";
import { CartQuantityControl } from "@/core/modules/cart/ui/cart-quantity-control";
import type { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import { cn } from "@/shared/lib/utils";
import { Minus, Plus } from "lucide-react";
import React from "react";

type CartProductDrawerControls = Pick<
  ReturnType<typeof useCartProductControls>,
  | "handleAdd"
  | "handleDecrement"
  | "handleIncrement"
  | "isBusy"
  | "isIncrementDisabled"
  | "quantity"
>;

interface CartProductDrawerFooterActionProps {
  className?: string;
  controls: CartProductDrawerControls;
  disabled?: boolean;
}

export const CartProductDrawerFooterAction: React.FC<
  CartProductDrawerFooterActionProps
> = ({ className, controls, disabled = false }) => {
  const {
    handleAdd,
    handleDecrement,
    handleIncrement,
    isBusy,
    isIncrementDisabled,
    quantity,
  } = controls;

  if (shouldShowCartProductDrawerAddButton(quantity)) {
    return (
      <CartProductDrawerAddButton
        ariaLabel={getCartProductDrawerAddLabel(disabled)}
        className={className}
        disabled={disabled || isBusy || isIncrementDisabled}
        isBusy={isBusy}
        onAdd={handleAdd}
      />
    );
  }

  return (
    <CartQuantityControl
      className={cn(
        "bg-primary flex min-w-[104px] cursor-default items-center gap-2.5 rounded-full px-2.5 py-3 text-white",
        isBusy && "animate-pulse",
        className,
      )}
      decrementContent={<Minus size={12} />}
      decrementDisabled={disabled || isBusy}
      incrementContent={<Plus size={12} />}
      incrementDisabled={disabled || isBusy || isIncrementDisabled}
      onDecrement={handleDecrement}
      onIncrement={handleIncrement}
      value={quantity}
      valueClassName="flex-1 text-center"
    />
  );
};
