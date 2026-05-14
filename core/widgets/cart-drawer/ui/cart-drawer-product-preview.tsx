"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { ProductDrawer } from "@/core/widgets/product-drawer/ui/product-drawer";
import React from "react";

interface CartDrawerProductPreviewProps {
  isOpen: boolean;
  selectedCartItem: CartItemView | null;
  selectedProduct: CartItemView["product"] | null;
  supportsBrands: boolean;
  onAfterClose: () => void;
  onOpenChange: (open: boolean) => void;
}

export const CartDrawerProductPreview: React.FC<
  CartDrawerProductPreviewProps
> = ({
  isOpen,
  selectedCartItem,
  selectedProduct,
  supportsBrands,
  onAfterClose,
  onOpenChange,
}) => {
  if (!selectedProduct) {
    return null;
  }

  return (
    <ProductDrawer
      open={isOpen}
      product={selectedProduct}
      productSlug={selectedProduct.slug}
      initialSaleUnitId={selectedCartItem?.saleUnitId}
      initialVariantId={selectedCartItem?.variantId}
      supportsBrands={supportsBrands}
      onOpenChange={onOpenChange}
      onAfterClose={onAfterClose}
    />
  );
};
