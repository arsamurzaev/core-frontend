import {
  applyCatalogFilterQueryState,
  parseCatalogFilterQueryState,
} from "./catalog-filter-query";

type SearchParamsLike = Pick<URLSearchParams, "get" | "entries" | "toString">;
type CatalogRouteMode = "DELIVERY" | "BROWSE" | "HALL";

const HOME_PATH = "/";
const PRODUCT_PATH = "/product";
const CATALOG_ROUTE_MODES = new Set<CatalogRouteMode>([
  "DELIVERY",
  "BROWSE",
  "HALL",
]);

function normalizeProductSlug(rawSlug: string): string {
  const trimmed = rawSlug.trim();
  if (!trimmed) return "";

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function getCatalogQuery(searchParams: SearchParamsLike): string {
  const filterState = parseCatalogFilterQueryState(searchParams);
  const normalizedParams = applyCatalogFilterQueryState(
    new URLSearchParams(),
    filterState,
  );

  const mode = normalizeCatalogRouteMode(searchParams.get("mode"));
  if (mode) {
    normalizedParams.set("mode", mode);
  }

  return normalizedParams.toString();
}

function normalizeCatalogRouteMode(value: string | null): CatalogRouteMode | null {
  const mode = value?.trim().toUpperCase();
  return CATALOG_ROUTE_MODES.has(mode as CatalogRouteMode)
    ? (mode as CatalogRouteMode)
    : null;
}

export function buildHomeHrefWithCatalogQuery(
  searchParams: SearchParamsLike,
): string {
  const query = getCatalogQuery(searchParams);
  return query ? `${HOME_PATH}?${query}` : HOME_PATH;
}

export function buildProductHrefWithCatalogQuery(
  slug: string,
  searchParams: SearchParamsLike,
): string {
  const normalizedSlug = normalizeProductSlug(slug);
  const encodedSlug = encodeURIComponent(normalizedSlug);
  const pathname = encodedSlug ? `${PRODUCT_PATH}/${encodedSlug}` : PRODUCT_PATH;
  const query = getCatalogQuery(searchParams);

  return query ? `${pathname}?${query}` : pathname;
}
