"use client";

import { resolveCatalogMode } from "@/shared/lib/catalog-mode";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { useSearchParams } from "next/navigation";
import { canUseHallCatalogExperience } from "./experience";

export function useCatalogMode() {
  const { catalog } = useCatalogState();
  const searchParams = useSearchParams();

  return resolveCatalogMode(catalog?.settings, searchParams, {
    canUseHallMode: canUseHallCatalogExperience(catalog),
  });
}
