import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";

export type CatalogFilterDraftState = Pick<
  CatalogFilterQueryState,
  | "categories"
  | "brands"
  | "isPopular"
  | "isDiscount"
  | "searchTerm"
  | "minPrice"
  | "maxPrice"
>;

export type CatalogFilterPatch = Partial<CatalogFilterDraftState>;

export type CatalogFilterItem = {
  id: string;
  name: string;
};

export const CATALOG_FILTER_EMPTY_PATCH: CatalogFilterPatch = {
  categories: [],
  brands: [],
  isPopular: undefined,
  isDiscount: undefined,
  searchTerm: undefined,
  minPrice: undefined,
  maxPrice: undefined,
};

export function createCatalogFilterDraftFromQueryState(
  queryState: CatalogFilterQueryState,
): CatalogFilterDraftState {
  return {
    categories: [...queryState.categories],
    brands: [...queryState.brands],
    isPopular: queryState.isPopular,
    isDiscount: queryState.isDiscount,
    searchTerm: queryState.searchTerm,
    minPrice: queryState.minPrice,
    maxPrice: queryState.maxPrice,
  };
}

function normalizeList(value: string[]): string[] {
  const cleaned = value
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

function normalizeString(value?: string): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned || undefined;
}

export function normalizeCatalogFilterDraft(
  draft: CatalogFilterDraftState,
): CatalogFilterDraftState {
  return {
    categories: normalizeList(draft.categories),
    brands: normalizeList(draft.brands),
    isPopular: draft.isPopular ? true : undefined,
    isDiscount: draft.isDiscount ? true : undefined,
    searchTerm: normalizeString(draft.searchTerm),
    minPrice: normalizeString(draft.minPrice),
    maxPrice: normalizeString(draft.maxPrice),
  };
}
