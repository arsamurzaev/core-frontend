"use client";

import type { CartCardActionSlotProps } from "@/core/catalog-runtime/contracts";
import { getCartItemMaxQuantity } from "@/core/modules/cart/model/cart-item-max-quantity";
import React from "react";
import { QuantitySpinbox } from "./quantity-spinbox";

export const WholesaleCartCardAction: React.FC<CartCardActionSlotProps> = ({
  item,
  productId,
}) => {
  return (
    <QuantitySpinbox
      productId={productId}
      maxQuantity={item ? getCartItemMaxQuantity(item) : undefined}
      quantityScope="line"
      saleUnitId={item?.saleUnitId}
      variantId={item?.variantId}
    />
  );
};
