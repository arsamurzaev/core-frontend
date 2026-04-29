"use client";

import React from "react";
import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import {
  dispatchProductDrawerRouteClose,
  dispatchProductDrawerRouteOpen,
  type ProductDrawerCloseStrategy,
} from "../model/product-drawer-instant-events";

interface ProductDrawerRouteProps {
  productSlug: string;
  closeStrategy: ProductDrawerCloseStrategy;
  initialProduct?: ProductWithDetailsDto | null;
}

export const ProductDrawerRoute: React.FC<ProductDrawerRouteProps> = ({
  productSlug,
  closeStrategy,
  initialProduct,
}) => {
  React.useEffect(() => {
    let didOpen = false;
    const openTimer = window.setTimeout(() => {
      didOpen = true;
      dispatchProductDrawerRouteOpen({
        closeStrategy,
        initialProduct,
        productSlug,
      });
    }, 0);

    return () => {
      window.clearTimeout(openTimer);

      if (didOpen) {
        dispatchProductDrawerRouteClose({ productSlug });
      }
    };
  }, [closeStrategy, initialProduct, productSlug]);

  return null;
};
