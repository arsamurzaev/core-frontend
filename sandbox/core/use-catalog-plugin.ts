"use client";

import { useCatalogState } from "@/shared/providers/catalog-provider";
import { defaultPlugin } from "../plugins/default/default.plugin";
import { CATALOG_PLUGINS } from "./registry";
import type { CatalogPlugin } from "./contracts";

export function useCatalogPlugin(): CatalogPlugin {
  const { catalog } = useCatalogState();
  return (
    CATALOG_PLUGINS.find((p) => p.typeCode === catalog?.type.code) ??
    defaultPlugin
  );
}
