"use client";

import {
  ProductCardWithPlugins as CoreProductCardWithPlugins,
} from "@/core/modules/product/entities/product-card-with-plugins";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { resolveProductCardPlugin } from "../core/product-card-plugin";

type ProductCardWithPluginsProps = React.ComponentProps<
  typeof CoreProductCardWithPlugins
>;

export const ProductCardWithPlugins: React.FC<ProductCardWithPluginsProps> = (
  props,
) => {
  const { catalog } = useCatalogState();
  const plugin = React.useMemo(
    () => resolveProductCardPlugin(catalog?.type.code),
    [catalog?.type.code],
  );

  return <CoreProductCardWithPlugins {...props} plugin={plugin} />;
};
