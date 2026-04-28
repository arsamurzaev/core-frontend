"use client";

import type { CartProductSnapshot } from "@/core/modules/cart/model/cart-context";
import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Minus, Plus } from "lucide-react";
import React from "react";

interface CartProductDrawerFooterActionProps {
  className?: string;
  product?: CartProductSnapshot;
  productId: string;
}

export const CartProductDrawerFooterAction: React.FC<
  CartProductDrawerFooterActionProps
> = ({ className, product, productId }) => {
  const { handleAdd, handleDecrement, handleIncrement, isBusy, quantity } =
    useCartProductControls(productId, product);

  if (!quantity) {
    return (
      <Button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleAdd();
        }}
        className={cn(
          "shadow-custom cursor-default bg-secondary/70 disabled:opacity-100",
          isBusy && "animate-pulse",
          className,
        )}
        variant="secondary"
        size="icon"
        aria-label="Добавить в корзину"
      >
        <Plus />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "bg-primary flex min-w-[104px] cursor-default items-center gap-2.5 rounded-full px-2.5 py-3 text-white",
        isBusy && "animate-pulse",
        className,
      )}
    >
      <button
        type="button"
        disabled={isBusy}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleDecrement();
        }}
        aria-label="Уменьшить количество"
      >
        <Minus size={12} />
      </button>
      <p className="flex-1 text-center">{quantity}</p>
      <button
        type="button"
        disabled={isBusy}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleIncrement();
        }}
        aria-label="Увеличить количество"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};
