import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";

type CatalogTypeLike = {
  type?: {
    code?: string | null;
  } | null;
} | null | undefined;

export function getCatalogTypeCode(catalog: CatalogTypeLike): string {
  return catalog?.type?.code?.trim().toLowerCase() ?? "";
}

export function isRestaurantCatalog(catalog: CatalogTypeLike): boolean {
  return getCatalogTypeCode(catalog) === "restaurant";
}

export function supportsCatalogBrands(
  catalog: CatalogTypeLike | CatalogCurrentDto,
): boolean {
  return !isRestaurantCatalog(catalog);
}
