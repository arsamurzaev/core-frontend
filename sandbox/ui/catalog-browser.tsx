"use client";

import { Browser } from "@/core/views/home/_ui/browser";
import type { CategoryDto } from "@/shared/api/generated/react-query";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import {
  getSandboxCatalogPresentation,
  supportsCatalogBrands,
} from "../core/catalog-type-features";
import { useCatalogPluginRuntime } from "../core/use-catalog-plugin-runtime";

interface CatalogBrowserProps {
  className?: string;
  initialCategories?: CategoryDto[];
}

export const CatalogBrowser: React.FC<CatalogBrowserProps> = (props) => {
  const { catalog } = useCatalogState();
  const { Browser: PluginBrowser } = useCatalogPluginRuntime();
  const supportsBrands = supportsCatalogBrands(catalog);
  const presentation = React.useMemo(
    () => getSandboxCatalogPresentation(catalog),
    [catalog],
  );
  const browserProps = React.useMemo(
    () => ({
      ...props,
      catalogTabLabel: presentation.catalogTabLabel,
      categoryAdminCreateDescription:
        presentation.categoryAdminCreateDescription,
      categoryAdminEditDescription: presentation.categoryAdminEditDescription,
      categoryCardVariant: presentation.categoryCardVariant,
      supportsBrands,
      supportsCategoryDetails: presentation.supportsCategoryDetails,
    }),
    [props, supportsBrands, presentation],
  );

  if (PluginBrowser) {
    return <PluginBrowser {...browserProps} />;
  }

  return <Browser {...browserProps} />;
};
