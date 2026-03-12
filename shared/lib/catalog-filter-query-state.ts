import {
  CATALOG_FILTER_QUERY_DEFAULT_STATE,
  type ArrayFilterKey,
  type BooleanFilterKey,
  type CatalogEffectiveTab,
  type CatalogFilterQueryState,
  type StringFilterKey,
  normalizeCatalogFilterString,
} from "@/shared/lib/catalog-filter-query-params";

export function hasActiveCatalogFilters(
  state: CatalogFilterQueryState,
): boolean {
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
}

export function getCatalogActiveFiltersCount(
  state: CatalogFilterQueryState,
): number {
  let total = 0;
  total += state.categories.length;
  total += state.brands.length;
  if (state.isPopular) {
    total += 1;
  }
  if (state.isDiscount) {
    total += 1;
  }
  if (state.searchTerm) {
    total += 1;
  }
  if (state.minPrice || state.maxPrice) {
    total += 1;
  }
  return total;
}

export function getCatalogEffectiveTab(
  state: CatalogFilterQueryState,
): CatalogEffectiveTab {
  if (state.tab === "categories") {
    return "categories";
  }

  return hasActiveCatalogFilters(state) ? "filter" : "catalog";
}

export function toggleArrayFilterValue(
  state: CatalogFilterQueryState,
  key: ArrayFilterKey,
  value: string,
): CatalogFilterQueryState {
  const normalized = value.trim();
  if (!normalized) {
    return state;
  }

  const current = state[key];
  const nextValues = current.includes(normalized)
    ? current.filter((item) => item !== normalized)
    : [...current, normalized];

  return {
    ...state,
    [key]: nextValues,
  };
}

export function toggleBooleanFilterValue(
  state: CatalogFilterQueryState,
  key: BooleanFilterKey,
): CatalogFilterQueryState {
  return {
    ...state,
    [key]: state[key] ? undefined : true,
  };
}

export function setStringFilterValue(
  state: CatalogFilterQueryState,
  key: StringFilterKey,
  value?: string,
): CatalogFilterQueryState {
  return {
    ...state,
    [key]: normalizeCatalogFilterString(value),
  };
}

export function activateCatalogFilterState(
  state: CatalogFilterQueryState,
): CatalogFilterQueryState {
  return {
    ...state,
    tab: "catalog",
    filter: true,
  };
}

export function clearCatalogFilterState(
  state: CatalogFilterQueryState,
): CatalogFilterQueryState {
  return {
    ...state,
    ...CATALOG_FILTER_QUERY_DEFAULT_STATE,
  };
}
