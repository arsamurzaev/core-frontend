"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { CartCardContent } from "@/core/modules/cart/ui/cart-card-content";
import { CartCardImage } from "@/core/modules/cart/ui/cart-card-image";
import { CartCardQuantity } from "@/core/modules/cart/ui/cart-card-quantity";
import { cn } from "@/shared/lib/utils";

import React from "react";

interface CartCardProps {
  actions?: React.ReactNode;
  className?: string;
  item: CartItemView;
  onClick?: () => void;
}

export const CartCard: React.FC<CartCardProps> = ({
  actions,
  className,
  item,
  onClick,
}) => {
  const isInteractive = Boolean(onClick);

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!isInteractive) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "shadow-custom relative grid grid-flow-col grid-cols-[auto_1fr] items-center gap-2 overflow-hidden rounded-lg pl-0 sm:grid-cols-[auto_1fr]",
        isInteractive && "cursor-pointer",
        className,
      )}
    >
      <CartCardImage imageUrl={item.imageUrl} name={item.name} />
      <div className="flex h-full items-center p-2 pl-0">
        <CartCardContent item={item} />
        {actions}
        {actions ? null : <CartCardQuantity quantity={item.quantity} />}
      </div>
    </div>
  );
};
