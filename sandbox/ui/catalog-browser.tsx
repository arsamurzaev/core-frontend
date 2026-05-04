"use client";

import { Browser } from "@/core/views/home/_ui/browser";
import type { CategoryDto } from "@/shared/api/generated/react-query";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { supportsCatalogBrands } from "../core/catalog-type-features";
import { useCatalogPluginRuntime } from "../core/use-catalog-plugin-runtime";

interface CatalogBrowserProps {
  className?: string;
  initialCategories?: CategoryDto[];
}

export const CatalogBrowser: React.FC<CatalogBrowserProps> = (props) => {
  const { catalog } = useCatalogState();
  const { Browser: PluginBrowser } = useCatalogPluginRuntime();
  const supportsBrands = supportsCatalogBrands(catalog);
  const browserProps = React.useMemo(
    () => ({ ...props, supportsBrands }),
    [props, supportsBrands],
  );

  if (PluginBrowser) {
    return <PluginBrowser {...browserProps} />;
  }

  return <Browser {...browserProps} />;
};
