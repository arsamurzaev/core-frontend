"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { useSession } from "@/shared/providers/session-provider";
import React from "react";
import { useCatalogRuntime } from "./use-catalog-runtime";

export function useCatalogRuntimeSlots() {
  const runtime = useCatalogRuntime();
  const { user } = useSession();
  const canManageCatalog = isCatalogManagerRole(user?.role);
  const Browser = !canManageCatalog ? runtime.slots.Browser : undefined;
  const CartCardAction = runtime.slots.CartCardAction;
  const renderCartCardAction = React.useCallback(
    (productId: string, item?: CartItemView) =>
      CartCardAction
        ? React.createElement(CartCardAction, { productId, item })
        : null,
    [CartCardAction],
  );

  return {
    runtime,
    extension: runtime.extension ?? undefined,
    canManageCatalog,
    Browser,
    CartCardAction,
    renderCartCardAction,
  };
}
