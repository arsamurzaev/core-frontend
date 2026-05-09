"use client";

import { CartDrawer } from "@/core/widgets/cart-drawer/ui/cart-drawer";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { supportsCatalogBrands } from "../core/catalog-type-features";
import { getCartCommentPlaceholder } from "../core/cart-comment-placeholder";
import { getSandboxCatalogCheckoutConfig } from "../core/checkout-methods";
import { useCatalogPluginRuntime } from "../core/use-catalog-plugin-runtime";

export const PluginCartDrawer: React.FC = () => {
  const { catalog } = useCatalogState();
  const { CartCardAction, renderCartCardAction } = useCatalogPluginRuntime();
  const supportsBrands = supportsCatalogBrands(catalog);
  const commentPlaceholder = React.useMemo(
    () => getCartCommentPlaceholder(catalog),
    [catalog],
  );
  const checkoutConfig = React.useMemo(
    () => (catalog ? getSandboxCatalogCheckoutConfig(catalog) : undefined),
    [catalog],
  );

  return (
    <CartDrawer
      actionRenderer={CartCardAction ? renderCartCardAction : undefined}
      checkoutConfig={checkoutConfig}
      commentPlaceholder={commentPlaceholder}
      supportsBrands={supportsBrands}
    />
  );
};
