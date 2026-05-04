"use client";

import { Header } from "@/core/widgets/header/ui/header";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { supportsCatalogBrands } from "../core/catalog-type-features";

interface CatalogHeaderProps {
  className?: string;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({ className }) => {
  const { catalog } = useCatalogState();

  return (
    <Header
      className={className}
      supportsBrands={supportsCatalogBrands(catalog)}
    />
  );
};
