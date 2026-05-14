"use client";

import { useCatalogRuntime } from "./use-catalog-runtime";

export function useCatalogRuntimeExtension() {
  return useCatalogRuntime().extension ?? undefined;
}
