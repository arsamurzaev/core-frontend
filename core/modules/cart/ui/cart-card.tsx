"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

import React from "react";

interface CartCardProps {
  actions?: React.ReactNode;
  className?: string;
  item: CartItemView;
  onClick?: () => void;
}

function getDiscountPercent(item: CartItemView): number {
  if (!item.originalLineTotal || item.originalLineTotal <= item.displayLineTotal) {
    return 0;
  }

  return Math.max(
    1,
    Math.round(
      ((item.originalLineTotal - item.displayLineTotal) /
        item.originalLineTotal) *
        100,
    ),
  );
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
      <div className="relative aspect-[3/4] h-25 sm:h-[150px]">
        <img
          src={item.imageUrl}
          alt="Фото товара"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="flex h-full items-center p-2 pl-0">
        <div className="flex h-full flex-1 flex-col justify-between">
          <h3 className="line-clamp-2 leading-tight font-bold sm:text-xl">
            {item.name}
          </h3>
          <h4 className="text-[10px] font-light sm:text-base">
            {item.subtitle}
          </h4>
          <div className="flex items-end gap-3">
            <p className="text-sm leading-none font-bold sm:text-lg">
              {item.displayLineTotal
                ? Intl.NumberFormat("ru").format(item.displayLineTotal)
                : "?"}{" "}
              {item.currency}
            </p>
            {item.hasDiscount ? (
              <>
                <p className="text-muted text-xs leading-none font-bold line-through">
                  {Intl.NumberFormat("ru").format(item.originalLineTotal)}{" "}
                  {item.currency}
                </p>
                <Badge className="absolute right-0 bottom-2">
                  -{getDiscountPercent(item)}%
                </Badge>
              </>
            ) : null}
          </div>
        </div>
        {actions}
        <p className={cn(actions && "hidden")}>x {item.quantity}</p>
      </div>
    </div>
  );
};
