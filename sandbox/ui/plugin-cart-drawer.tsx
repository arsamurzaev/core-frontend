"use client";

import { CartDrawer } from "@/core/widgets/cart-drawer/ui/cart-drawer";
import { useSession } from "@/shared/providers/session-provider";
import React from "react";
import { useCatalogPlugin } from "../core/use-catalog-plugin";

export const PluginCartDrawer: React.FC = () => {
  const plugin = useCatalogPlugin();
  const { user } = useSession();
  const canManage = user?.role === "ADMIN" || user?.role === "CATALOG";

  const actionRenderer =
    plugin.CartCardAction && !canManage
      ? (productId: string) =>
          plugin.CartCardAction ? (
            <plugin.CartCardAction productId={productId} />
          ) : null
      : undefined;

  return <CartDrawer actionRenderer={actionRenderer} />;
};
