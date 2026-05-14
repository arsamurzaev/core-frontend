"use client";

import { CartDrawer } from "@/core/widgets/cart-drawer/ui/cart-drawer";
import { useCatalog } from "@/shared/providers/catalog-provider";
import type React from "react";
import { useCatalogRuntimeCheckoutConfig } from "../use-catalog-runtime-checkout-config";
import { useCatalogRuntimeSlots } from "../use-catalog-runtime-slots";

export const CartDrawerSlot: React.FC = () => {
  const catalog = useCatalog();
  const { CartCardAction, renderCartCardAction, runtime } =
    useCatalogRuntimeSlots();
  const checkoutConfig = useCatalogRuntimeCheckoutConfig(catalog);

  return (
    <CartDrawer
      actionRenderer={CartCardAction ? renderCartCardAction : undefined}
      checkoutConfig={checkoutConfig}
      commentPlaceholder={runtime.checkout.commentPlaceholder}
      supportsBrands={runtime.presentation.supportsBrands}
    />
  );
};
