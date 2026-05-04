"use client";

import { EditProductDrawerHostProvider } from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-host";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { supportsCatalogBrands } from "../core/catalog-type-features";

export const PluginEditProductDrawerHostProvider: React.FC<
  React.PropsWithChildren
> = ({ children }) => {
  const { catalog } = useCatalogState();

  return (
    <EditProductDrawerHostProvider
      supportsBrands={supportsCatalogBrands(catalog)}
    >
      {children}
    </EditProductDrawerHostProvider>
  );
};
