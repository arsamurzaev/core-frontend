export const CATALOG_REQUESTED_TAB_VALUES = ["catalog", "categories"] as const;

export type CatalogRequestedTab = (typeof CATALOG_REQUESTED_TAB_VALUES)[number];
export type CatalogEffectiveTab = CatalogRequestedTab | "filter";

export type CatalogFilterQueryState = {
  tab: CatalogRequestedTab;
  filter?: boolean;
  categories: string[];
  brands: string[];
  isPopular?: boolean;
  isDiscount?: boolean;
  searchTerm?: string;
  minPrice?: string;
  maxPrice?: string;
};

export const CATALOG_FILTER_QUERY_DEFAULT_STATE: CatalogFilterQueryState = {
  tab: "catalog",
  filter: undefined,
  categories: [],
  brands: [],
  isPopular: undefined,
  isDiscount: undefined,
  searchTerm: undefined,
  minPrice: undefined,
  maxPrice: undefined,
};

type SearchParamsLike = Pick<URLSearchParams, "get" | "entries" | "toString">;
type ArrayFilterKey = "categories" | "brands";
type BooleanFilterKey = "filter" | "isPopular" | "isDiscount";
type StringFilterKey = "searchTerm" | "minPrice" | "maxPrice";

const normalizeString = (value: string | null | undefined): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const parseListValue = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const unique = <T,>(items: T[]): T[] => Array.from(new Set(items));

const parseListParam = (
  searchParams: SearchParamsLike,
  key: ArrayFilterKey,
): string[] => {
  const merged: string[] = parseListValue(searchParams.get(key));
  for (const [entryKey, entryValue] of searchParams.entries()) {
    if (entryKey !== key) continue;
    merged.push(...parseListValue(entryValue));
  }
  return unique(merged);
};

const parseBooleanParam = (
  searchParams: SearchParamsLike,
  key: BooleanFilterKey,
): boolean | undefined => {
  const value = searchParams.get(key);
  if (value === "true" || value === "1") return true;
  return undefined;
};

const parseTabParam = (searchParams: SearchParamsLike): CatalogRequestedTab => {
  const value = searchParams.get("tab");
  if (value === "categories" || value === "category") return "categories";
  return "catalog";
};

const setListParam = (
  params: URLSearchParams,
  key: ArrayFilterKey,
  value: string[],
): void => {
  params.delete(key);
  const normalized = unique(
    value
      .map((item) => item.trim())
      .filter(Boolean),
  );
  if (normalized.length > 0) {
    params.set(key, normalized.join(","));
  }
};

const setBooleanParam = (
  params: URLSearchParams,
  key: BooleanFilterKey,
  value: boolean | undefined,
): void => {
  if (value) {
    params.set(key, "true");
  } else {
    params.delete(key);
  }
};

const setStringParam = (
  params: URLSearchParams,
  key: StringFilterKey,
  value: string | undefined,
): void => {
  const normalized = normalizeString(value);
  if (normalized) {
    params.set(key, normalized);
  } else {
    params.delete(key);
  }
};

export const parseCatalogFilterQueryState = (
  searchParams: SearchParamsLike,
): CatalogFilterQueryState => {
  return {
    tab: parseTabParam(searchParams),
    filter: parseBooleanParam(searchParams, "filter"),
    categories: parseListParam(searchParams, "categories"),
    brands: parseListParam(searchParams, "brands"),
    isPopular: parseBooleanParam(searchParams, "isPopular"),
    isDiscount: parseBooleanParam(searchParams, "isDiscount"),
    searchTerm: normalizeString(searchParams.get("searchTerm")),
    minPrice: normalizeString(searchParams.get("minPrice")),
    maxPrice: normalizeString(searchParams.get("maxPrice")),
  };
};

export const hasActiveCatalogFilters = (state: CatalogFilterQueryState): boolean => {
  return Boolean(
    state.filter ||
    state.categories.length > 0 ||
      state.brands.length > 0 ||
      state.isPopular ||
      state.isDiscount ||
      state.searchTerm ||
      state.minPrice ||
      state.maxPrice,
  );
};

export const getCatalogActiveFiltersCount = (
  state: CatalogFilterQueryState,
): number => {
  let total = 0;
  total += state.categories.length;
  total += state.brands.length;
  if (state.isPopular) total += 1;
  if (state.isDiscount) total += 1;
  if (state.searchTerm) total += 1;
  if (state.minPrice || state.maxPrice) total += 1;
  return total;
};

export const getCatalogEffectiveTab = (
  state: CatalogFilterQueryState,
): CatalogEffectiveTab => {
  if (state.tab === "categories") return "categories";
  return hasActiveCatalogFilters(state) ? "filter" : "catalog";
};

export const applyCatalogFilterQueryState = (
  baseSearchParams: SearchParamsLike,
  state: CatalogFilterQueryState,
): URLSearchParams => {
  const nextParams = new URLSearchParams(baseSearchParams.toString());
  if (state.tab === "categories") {
    nextParams.set("tab", "categories");
  } else {
    nextParams.delete("tab");
  }

  setBooleanParam(nextParams, "filter", state.filter);
  setListParam(nextParams, "categories", state.categories);
  setListParam(nextParams, "brands", state.brands);
  setBooleanParam(nextParams, "isPopular", state.isPopular);
  setBooleanParam(nextParams, "isDiscount", state.isDiscount);
  setStringParam(nextParams, "searchTerm", state.searchTerm);
  setStringParam(nextParams, "minPrice", state.minPrice);
  setStringParam(nextParams, "maxPrice", state.maxPrice);

  return nextParams;
};

export const toggleArrayFilterValue = (
  state: CatalogFilterQueryState,
  key: ArrayFilterKey,
  value: string,
): CatalogFilterQueryState => {
  const normalized = value.trim();
  if (!normalized) return state;
  const current = state[key];
  const nextValues = current.includes(normalized)
    ? current.filter((item) => item !== normalized)
    : [...current, normalized];
  return {
    ...state,
    [key]: nextValues,
  };
};

export const toggleBooleanFilterValue = (
  state: CatalogFilterQueryState,
  key: BooleanFilterKey,
): CatalogFilterQueryState => {
  return {
    ...state,
    [key]: state[key] ? undefined : true,
  };
};

export const setStringFilterValue = (
  state: CatalogFilterQueryState,
  key: StringFilterKey,
  value?: string,
): CatalogFilterQueryState => {
  return {
    ...state,
    [key]: normalizeString(value),
  };
};

export const activateCatalogFilterState = (
  state: CatalogFilterQueryState,
): CatalogFilterQueryState => {
  return {
    ...state,
    tab: "catalog",
    filter: true,
  };
};

export const clearCatalogFilterState = (
  state: CatalogFilterQueryState,
): CatalogFilterQueryState => {
  return {
    ...state,
    tab: "catalog",
    filter: undefined,
    categories: [],
    brands: [],
    isPopular: undefined,
    isDiscount: undefined,
    searchTerm: undefined,
    minPrice: undefined,
    maxPrice: undefined,
  };
};
