"use client";

import { EditProductDrawerHostProvider } from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-host";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import {
  getSandboxCatalogPresentation,
  supportsCatalogBrands,
} from "../core/catalog-type-features";

export const PluginEditProductDrawerHostProvider: React.FC<
  React.PropsWithChildren
> = ({ children }) => {
  const { catalog } = useCatalogState();
  const presentation = React.useMemo(
    () => getSandboxCatalogPresentation(catalog),
    [catalog],
  );

  return (
    <EditProductDrawerHostProvider
      supportsBrands={supportsCatalogBrands(catalog)}
      supportsCategoryDetails={presentation.supportsCategoryDetails}
    >
      {children}
    </EditProductDrawerHostProvider>
  );
};
