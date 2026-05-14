"use client";

import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { resolveCatalogRuntime } from "./resolve-catalog-runtime";

export function useCatalogRuntime() {
  const { catalog } = useCatalogState();

  return React.useMemo(() => resolveCatalogRuntime(catalog), [catalog]);
}
