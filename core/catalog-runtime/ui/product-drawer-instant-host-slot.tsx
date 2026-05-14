"use client";

import { ProductDrawerInstantHost } from "@/core/widgets/product-drawer/ui/product-drawer-instant-host";
import type React from "react";
import { useCatalogRuntime } from "../use-catalog-runtime";

export const ProductDrawerInstantHostSlot: React.FC = () => {
  const runtime = useCatalogRuntime();

  return (
    <ProductDrawerInstantHost
      supportsBrands={runtime.presentation.supportsBrands}
    />
  );
};
