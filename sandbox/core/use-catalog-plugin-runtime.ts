"use client";

import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { useSession } from "@/shared/providers/session-provider";
import React from "react";
import { useCatalogPlugin } from "./use-catalog-plugin";

export function useCatalogPluginRuntime() {
  const plugin = useCatalogPlugin();
  const { user } = useSession();
  const canManageCatalog = isCatalogManagerRole(user?.role);

  const Browser = !canManageCatalog ? plugin?.browser?.Component : undefined;
  const CartCardAction = !canManageCatalog ? plugin?.cart?.CardAction : undefined;

  const renderCartCardAction = React.useCallback(
    (productId: string) =>
      CartCardAction ? React.createElement(CartCardAction, { productId }) : null,
    [CartCardAction],
  );

  return {
    plugin,
    canManageCatalog,
    Browser,
    CartCardAction,
    renderCartCardAction,
  };
}
