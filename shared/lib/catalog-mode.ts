"use client";

import { useSearchParams } from "next/navigation";
import { type CatalogSettingsDto } from "@/shared/api/generated/react-query";
import { getCatalogTypeCode } from "@/shared/lib/catalog-type";
import { useCatalogState } from "@/shared/providers/catalog-provider";

export type CatalogExperienceMode = "DELIVERY" | "BROWSE" | "HALL";

type CatalogModeSource =
  | {
      type?: {
        code?: string | null;
      } | null;
    }
  | null
  | undefined;

const DEFAULT_CATALOG_MODE: CatalogExperienceMode = "DELIVERY";
const HALL_CATALOG_TYPE_CODES = new Set(["restaurant", "cafe"]);

function canUseHallCatalogMode(catalog: CatalogModeSource): boolean {
  return HALL_CATALOG_TYPE_CODES.has(getCatalogTypeCode(catalog));
}

function isCatalogExperienceMode(value: unknown): value is CatalogExperienceMode {
  return value === "DELIVERY" || value === "BROWSE" || value === "HALL";
}

function resolveAllowedCatalogModes(
  settings: CatalogSettingsDto | null | undefined,
  canUseHallMode: boolean,
): CatalogExperienceMode[] {
  const rawAllowed = settings?.allowedModes ?? [DEFAULT_CATALOG_MODE];
  const allowed = rawAllowed
    .filter(isCatalogExperienceMode)
    .filter((mode) => canUseHallMode || mode !== "HALL");

  return allowed.length > 0 ? allowed : [DEFAULT_CATALOG_MODE];
}

export function resolveCatalogMode(
  settings: CatalogSettingsDto | null | undefined,
  searchParams: { get(key: string): string | null },
  options: {
    canUseHallMode?: boolean;
  } = {},
): CatalogExperienceMode {
  const allowed = resolveAllowedCatalogModes(
    settings,
    Boolean(options.canUseHallMode),
  );
  const rawDefaultMode = settings?.defaultMode ?? DEFAULT_CATALOG_MODE;
  const defaultMode =
    isCatalogExperienceMode(rawDefaultMode) && allowed.includes(rawDefaultMode)
      ? rawDefaultMode
      : allowed[0];
  const param = searchParams.get("mode")?.toUpperCase();

  if (isCatalogExperienceMode(param) && allowed.includes(param)) return param;
  return defaultMode;
}

export function useCatalogMode(): CatalogExperienceMode {
  const { catalog } = useCatalogState();
  const searchParams = useSearchParams();
  return resolveCatalogMode(catalog?.settings, searchParams, {
    canUseHallMode: canUseHallCatalogMode(catalog),
  });
}
