"use client";

import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import React from "react";

interface CartProductActionProps {
  className?: string;
  product: ProductWithAttributesDto;
}

export const CartProductAction = React.memo(function CartProductAction({
  className,
  product,
}: CartProductActionProps) {
  const { handleAdd, isBusy, quantity } = useCartProductControls(
    product.id,
    product,
  );

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
});
