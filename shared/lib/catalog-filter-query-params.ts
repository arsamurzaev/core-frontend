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

export type SearchParamsLike = Pick<URLSearchParams, "get" | "entries" | "toString">;
export type ArrayFilterKey = "categories" | "brands";
export type BooleanFilterKey = "filter" | "isPopular" | "isDiscount";
export type StringFilterKey = "searchTerm" | "minPrice" | "maxPrice";

export const normalizeCatalogFilterString = (
  value: string | null | undefined,
): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

function parseListValue(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function parseListParam(
  searchParams: SearchParamsLike,
  key: ArrayFilterKey,
): string[] {
  const merged: string[] = parseListValue(searchParams.get(key));

  for (const [entryKey, entryValue] of searchParams.entries()) {
    if (entryKey !== key) {
      continue;
    }

    merged.push(...parseListValue(entryValue));
  }

  return unique(merged);
}

function parseBooleanParam(
  searchParams: SearchParamsLike,
  key: BooleanFilterKey,
): boolean | undefined {
  const value = searchParams.get(key);
  return value === "true" || value === "1" ? true : undefined;
}

function parseTabParam(searchParams: SearchParamsLike): CatalogRequestedTab {
  const value = searchParams.get("tab");
  return value === "categories" || value === "category"
    ? "categories"
    : "catalog";
}

function setListParam(
  params: URLSearchParams,
  key: ArrayFilterKey,
  value: string[],
): void {
  params.delete(key);

  const normalized = unique(
    value
      .map((item) => item.trim())
      .filter(Boolean),
  );

  if (normalized.length > 0) {
    params.set(key, normalized.join(","));
  }
}

function setBooleanParam(
  params: URLSearchParams,
  key: BooleanFilterKey,
  value: boolean | undefined,
): void {
  if (value) {
    params.set(key, "true");
    return;
  }

  params.delete(key);
}

function setStringParam(
  params: URLSearchParams,
  key: StringFilterKey,
  value: string | undefined,
): void {
  const normalized = normalizeCatalogFilterString(value);
  if (normalized) {
    params.set(key, normalized);
    return;
  }

  params.delete(key);
}

export function parseCatalogFilterQueryState(
  searchParams: SearchParamsLike,
): CatalogFilterQueryState {
  return {
    tab: parseTabParam(searchParams),
    filter: parseBooleanParam(searchParams, "filter"),
    categories: parseListParam(searchParams, "categories"),
    brands: parseListParam(searchParams, "brands"),
    isPopular: parseBooleanParam(searchParams, "isPopular"),
    isDiscount: parseBooleanParam(searchParams, "isDiscount"),
    searchTerm: normalizeCatalogFilterString(searchParams.get("searchTerm")),
    minPrice: normalizeCatalogFilterString(searchParams.get("minPrice")),
    maxPrice: normalizeCatalogFilterString(searchParams.get("maxPrice")),
  };
}

export function applyCatalogFilterQueryState(
  baseSearchParams: SearchParamsLike,
  state: CatalogFilterQueryState,
): URLSearchParams {
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
}
