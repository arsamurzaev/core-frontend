"use client";

import { Browser } from "@/core/views/home/_ui/browser";
import type React from "react";
import type { BrowserSlotProps } from "../contracts";
import { useCatalogRuntimeSlots } from "../use-catalog-runtime-slots";

type CatalogBrowserSlotProps = Pick<
  BrowserSlotProps,
  "className" | "initialCategories"
>;

export const CatalogBrowserSlot: React.FC<CatalogBrowserSlotProps> = (
  props,
) => {
  const { Browser: RuntimeBrowser, runtime } = useCatalogRuntimeSlots();
  const browserProps = {
    ...props,
    catalogTabLabel: runtime.presentation.catalogTabLabel,
    categoryAdminCreateDescription:
      runtime.presentation.categoryAdminCreateDescription,
    categoryAdminEditDescription:
      runtime.presentation.categoryAdminEditDescription,
    categoryCardVariant: runtime.presentation.categoryCardVariant,
    supportsBrands: runtime.presentation.supportsBrands,
    supportsCategoryDetails: runtime.presentation.supportsCategoryDetails,
  };

  if (RuntimeBrowser) {
    return <RuntimeBrowser {...browserProps} />;
  }

  return <Browser {...browserProps} />;
};
