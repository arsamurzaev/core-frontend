"use client";

import { Header } from "@/core/widgets/header/ui/header";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { supportsCatalogBrands } from "../core/catalog-type-features";
import { getSandboxCatalogCheckoutConfig } from "../core/checkout-methods";

interface CatalogHeaderProps {
  className?: string;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({ className }) => {
  const { catalog } = useCatalogState();
  const checkoutConfig = React.useMemo(
    () => (catalog ? getSandboxCatalogCheckoutConfig(catalog) : undefined),
    [catalog],
  );

  return (
    <Header
      className={className}
      checkoutConfig={checkoutConfig}
      supportsBrands={supportsCatalogBrands(catalog)}
    />
  );
};
