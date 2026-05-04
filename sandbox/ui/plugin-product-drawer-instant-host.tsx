"use client";

import { ProductDrawerInstantHost } from "@/core/widgets/product-drawer/ui/product-drawer-instant-host";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { supportsCatalogBrands } from "../core/catalog-type-features";

export const PluginProductDrawerInstantHost: React.FC = () => {
  const { catalog } = useCatalogState();

  return (
    <ProductDrawerInstantHost supportsBrands={supportsCatalogBrands(catalog)} />
  );
};
