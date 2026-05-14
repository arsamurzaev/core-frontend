"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { getCartItemMaxQuantity } from "@/core/modules/cart/model/cart-item-max-quantity";
import { CartCard } from "@/core/modules/cart/ui/cart-card";
import { CartCardAction } from "@/core/modules/cart/ui/cart-card-action";
import { cn } from "@/shared/lib/utils";
import React from "react";

interface CartCardListProps {
  className?: string;
  hasAction?: boolean;
  actionRenderer?: (
    productId: string,
    item?: CartItemView,
  ) => React.ReactNode;
  items: CartItemView[];
  onItemClick?: (item: CartItemView) => void;
}

export const CartCardList: React.FC<CartCardListProps> = ({
  className,
  hasAction = true,
  actionRenderer,
  items,
  onItemClick,
}) => {
  return (
    <ul className={cn("space-y-4", className)}>
      {items.map((item) => (
        <li key={item.id}>
          <CartCard
            item={item}
            onClick={
              item.product && onItemClick
                ? () => onItemClick(item)
                : undefined
            }
            actions={
              actionRenderer
                ? actionRenderer(item.productId, item)
                : hasAction
                  ? (
                      <CartCardAction
                        productId={item.productId}
                        maxQuantity={getCartItemMaxQuantity(item)}
                        saleUnitId={item.saleUnitId}
                        variantId={item.variantId}
                      />
                    )
                  : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
};
