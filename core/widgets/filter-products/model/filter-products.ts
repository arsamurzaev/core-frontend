import {
  type CatalogFilterQueryState,
} from "@/shared/lib/catalog-filter-query";
import { type ProductControllerGetInfiniteCardsParams } from "@/shared/api/generated/react-query";

export const FILTER_PRODUCTS_PAGE_SIZE = 24;
export const GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT = 12;
export const DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT = 6;
export const GRID_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT = 4;
export const DETAILED_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT = 3;

function normalizeString(value?: string): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseNumericString(value?: string): number | undefined {
  const normalized = normalizeString(value);
  if (!normalized) {
    return undefined;
  }

  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return numericValue;
}

export function createDeterministicSeed(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }

  return `${hash.toString(36)}`;
}

export function buildFilterRequestParams(
  queryState: CatalogFilterQueryState,
): ProductControllerGetInfiniteCardsParams {
  const categories =
    queryState.categories.length > 0
      ? queryState.categories.join(",")
      : undefined;
  const brands =
    queryState.brands.length > 0 ? queryState.brands.join(",") : undefined;

  return {
    categories,
    brands,
    searchTerm: normalizeString(queryState.searchTerm),
    isPopular: queryState.isPopular ? true : undefined,
    isDiscount: queryState.isDiscount ? true : undefined,
    minPrice: parseNumericString(queryState.minPrice),
    maxPrice: parseNumericString(queryState.maxPrice),
    limit: FILTER_PRODUCTS_PAGE_SIZE,
  };
}
