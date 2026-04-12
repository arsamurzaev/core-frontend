"use client";

import { Browser } from "@/core/views/home/_ui/browser";
import type { CategoryDto } from "@/shared/api/generated/react-query";
import React from "react";
import { useCatalogPluginRuntime } from "../core/use-catalog-plugin-runtime";

interface CatalogBrowserProps {
  className?: string;
  initialCategories?: CategoryDto[];
}

export const CatalogBrowser: React.FC<CatalogBrowserProps> = (props) => {
  const { Browser: PluginBrowser } = useCatalogPluginRuntime();

  if (PluginBrowser) {
    return <PluginBrowser {...props} />;
  }

  return <Browser {...props} />;
};
