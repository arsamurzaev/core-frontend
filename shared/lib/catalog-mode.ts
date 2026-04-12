"use client";

import { useSearchParams } from "next/navigation";
import { type CatalogSettingsDto } from "@/shared/api/generated/react-query";
import { useCatalogState } from "@/shared/providers/catalog-provider";

export type CatalogExperienceMode = "DELIVERY" | "BROWSE" | "HALL";

export function resolveCatalogMode(
  settings: CatalogSettingsDto | null | undefined,
  searchParams: { get(key: string): string | null },
): CatalogExperienceMode {
  const allowed = settings?.allowedModes ?? ["DELIVERY"];
  const defaultMode = (settings?.defaultMode ?? "DELIVERY") as CatalogExperienceMode;
  const param = searchParams.get("mode")?.toUpperCase() as CatalogExperienceMode | undefined;

  if (param && allowed.includes(param)) return param;
  return defaultMode;
}

export function useCatalogMode(): CatalogExperienceMode {
  const { catalog } = useCatalogState();
  const searchParams = useSearchParams();
  return resolveCatalogMode(catalog?.settings, searchParams);
}
