import { getCatalogTypeCode } from "@/shared/lib/catalog-type";
import type { CatalogLike } from "@/shared/lib/utils";
import {
  RESTAURANT_EXPERIENCE,
  RESTAURANT_TYPE_CODES,
} from "./extensions/restaurant/restaurant.metadata";
import type { CatalogExperienceRuntimeConfig } from "./runtime-contracts";

export const DEFAULT_CATALOG_EXPERIENCE: CatalogExperienceRuntimeConfig = {
  supportsHallMode: false,
};

const CATALOG_EXPERIENCE_BY_TYPE_CODE = new Map<
  string,
  CatalogExperienceRuntimeConfig
>(
  RESTAURANT_TYPE_CODES.map((typeCode) => [typeCode, RESTAURANT_EXPERIENCE]),
);

export function resolveCatalogRuntimeExperience(
  catalog?: Pick<CatalogLike, "type"> | null,
): CatalogExperienceRuntimeConfig {
  return (
    CATALOG_EXPERIENCE_BY_TYPE_CODE.get(getCatalogTypeCode(catalog)) ??
    DEFAULT_CATALOG_EXPERIENCE
  );
}

export function canUseHallCatalogExperience(
  catalog?: Pick<CatalogLike, "type"> | null,
): boolean {
  return resolveCatalogRuntimeExperience(catalog).supportsHallMode;
}
