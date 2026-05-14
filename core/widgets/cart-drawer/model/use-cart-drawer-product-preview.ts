"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import React from "react";

export function useCartDrawerProductPreview() {
  const [selectedCartItem, setSelectedCartItem] =
    React.useState<CartItemView | null>(null);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = React.useState(false);
  const selectedProduct = selectedCartItem?.product ?? null;

  const openProduct = React.useCallback((item: CartItemView) => {
    setSelectedCartItem(item);
    setIsProductDrawerOpen(true);
  }, []);

  const handleProductDrawerOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setIsProductDrawerOpen(nextOpen);
    },
    [],
  );

  const handleProductDrawerAfterClose = React.useCallback(() => {
    setSelectedCartItem(null);
  }, []);

  return {
    handleProductDrawerAfterClose,
    handleProductDrawerOpenChange,
    isProductDrawerOpen,
    openProduct,
    selectedCartItem,
    selectedProduct,
  };
}
