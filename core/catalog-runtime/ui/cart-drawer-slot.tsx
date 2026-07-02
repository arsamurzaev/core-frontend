"use client";

import {
  CartDrawer,
  HallTableGuestNameDialog,
  HallTableOrdersDrawer,
} from "@/core/widgets/cart-drawer";
import { useCatalog } from "@/shared/providers/catalog-provider";
import type React from "react";
import { shouldUseCatalogRuntimeCartCardAction } from "../order-policies";
import { useCatalogRuntimeCheckoutConfig } from "../use-catalog-runtime-checkout-config";
import { useCatalogRuntimeSlots } from "../use-catalog-runtime-slots";

export const CartDrawerSlot: React.FC = () => {
  const catalog = useCatalog();
  const { renderCartCardAction, runtime } = useCatalogRuntimeSlots();
  const checkoutConfig = useCatalogRuntimeCheckoutConfig(catalog);
  const shouldUseCartCardAction =
    shouldUseCatalogRuntimeCartCardAction(runtime);

  return (
    <>
      <CartDrawer
        actionRenderer={
          shouldUseCartCardAction ? renderCartCardAction : undefined
        }
        checkoutConfig={checkoutConfig}
        commentPlaceholder={runtime.checkout.commentPlaceholder}
        supportsBrands={runtime.presentation.supportsBrands}
      />
      <HallTableGuestNameDialog />
      <HallTableOrdersDrawer />
    </>
  );
};
