"use client";

import { CartDrawer } from "@/core/widgets/cart-drawer/ui/cart-drawer";
import React from "react";
import { useCatalogPluginRuntime } from "../core/use-catalog-plugin-runtime";

export const PluginCartDrawer: React.FC = () => {
  const { CartCardAction, renderCartCardAction } = useCatalogPluginRuntime();

  return (
    <CartDrawer
      actionRenderer={CartCardAction ? renderCartCardAction : undefined}
    />
  );
};
