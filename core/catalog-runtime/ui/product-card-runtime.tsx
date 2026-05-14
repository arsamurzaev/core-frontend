"use client";

import {
  ProductCardWithPlugins as CoreProductCardWithPlugins,
} from "@/core/modules/product/entities/product-card-with-plugins";
import React from "react";
import { useCatalogRuntime } from "../use-catalog-runtime";

type ProductCardRuntimeProps = React.ComponentProps<
  typeof CoreProductCardWithPlugins
>;

export const ProductCardRuntime: React.FC<ProductCardRuntimeProps> = (
  props,
) => {
  const runtime = useCatalogRuntime();

  return <CoreProductCardWithPlugins {...props} plugin={runtime.productCard} />;
};
