"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { CartCardPrice } from "@/core/modules/cart/ui/cart-card-price";
import React from "react";

interface CartCardContentProps {
  item: CartItemView;
}

export const CartCardContent: React.FC<CartCardContentProps> = ({ item }) => {
  return (
    <div className="flex h-full flex-1 flex-col justify-between">
      <h3 className="line-clamp-2 leading-tight font-bold sm:text-xl">
        {item.name}
      </h3>
      <h4 className="text-[10px] font-light sm:text-base">
        {item.subtitle}
      </h4>
      <CartCardPrice item={item} />
    </div>
  );
};
