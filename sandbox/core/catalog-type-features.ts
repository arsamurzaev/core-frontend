import { getCatalogTypeCode } from "@/shared/lib/catalog-type";
import type { CatalogLike } from "@/shared/lib/utils";

const CATALOG_TYPES_WITHOUT_BRANDS = new Set(["cafe", "restaurant"]);

export function supportsCatalogBrands(catalog?: CatalogLike | null): boolean {
  return !CATALOG_TYPES_WITHOUT_BRANDS.has(getCatalogTypeCode(catalog));
}
