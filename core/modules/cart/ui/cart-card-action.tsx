"use client";

import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import React from "react";

interface CartCardActionProps {
  className?: string;
  productId: string;
}

export const CartCardAction: React.FC<CartCardActionProps> = ({
  className,
  productId,
}) => {
  const { handleDecrement, handleIncrement, quantity } =
    useCartProductControls(productId);

  const handleStopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      onClick={handleStopPropagation}
      onPointerDown={handleStopPropagation}
      className={cn(
        "bg-secondary flex cursor-default items-center justify-center rounded-full",
        className,
      )}
    >
      <Button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleDecrement();
        }}
        variant="ghost"
        size="icon"
        aria-label="Уменьшить количество"
      >
        -
      </Button>
      <p>{quantity}</p>
      <Button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleIncrement();
        }}
        variant="ghost"
        size="icon"
        aria-label="Увеличить количество"
      >
        +
      </Button>
    </div>
  );
};
