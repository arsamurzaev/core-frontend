"use client";

import { Header } from "@/core/widgets/header/ui/header";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import type React from "react";
import { useCatalogRuntimeCheckoutConfig } from "../use-catalog-runtime-checkout-config";
import { useCatalogRuntime } from "../use-catalog-runtime";

interface CatalogHeaderSlotProps {
  className?: string;
}

export const CatalogHeaderSlot: React.FC<CatalogHeaderSlotProps> = ({
  className,
}) => {
  const { catalog } = useCatalogState();
  const runtime = useCatalogRuntime();
  const checkoutConfig = useCatalogRuntimeCheckoutConfig(catalog);

  return (
    <Header
      className={className}
      checkoutConfig={checkoutConfig}
      shareButtonLabel={runtime.presentation.shareButtonLabel}
      shareCopySuccessMessage={runtime.presentation.copySuccessMessage}
      supportsBrands={runtime.presentation.supportsBrands}
      supportsCategoryDetails={runtime.presentation.supportsCategoryDetails}
    />
  );
};
