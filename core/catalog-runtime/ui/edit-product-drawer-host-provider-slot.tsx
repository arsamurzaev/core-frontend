"use client";

import { EditProductDrawerHostProvider } from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-host";
import React from "react";
import { useCatalogRuntime } from "../use-catalog-runtime";

export const EditProductDrawerHostProviderSlot: React.FC<
  React.PropsWithChildren
> = ({ children }) => {
  const runtime = useCatalogRuntime();

  return (
    <EditProductDrawerHostProvider
      supportsBrands={runtime.presentation.supportsBrands}
      supportsCategoryDetails={runtime.presentation.supportsCategoryDetails}
    >
      {children}
    </EditProductDrawerHostProvider>
  );
};
