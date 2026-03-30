"use client";

import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import React from "react";

interface CartProductActionProps {
  className?: string;
  productId: string;
}

export const CartProductAction: React.FC<CartProductActionProps> = ({
  className,
  productId,
}) => {
  const { handleAdd, isBusy, quantity } = useCartProductControls(productId);

  return (
    <Button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void handleAdd();
      }}
      className={cn(
        "shadow-custom absolute top-[10px] right-[10px] cursor-default bg-secondary/70 disabled:opacity-100",
        isBusy && "animate-pulse",
        className,
      )}
      variant="secondary"
      size="icon"
      aria-label={quantity ? `Товаров в корзине: ${quantity}` : "Добавить в корзину"}
    >
      {quantity ? <p>{quantity}</p> : <Plus />}
    </Button>
  );
};
