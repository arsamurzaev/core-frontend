import {
  activateCatalogFilterState,
  applyCatalogFilterQueryState,
  clearCatalogFilterState,
  hasActiveCatalogFilters,
  type CatalogFilterQueryState,
  type SearchParamsLike,
} from "@/shared/lib/catalog-filter-query";

export type CatalogFilterValuePatch = Partial<
  Pick<
    CatalogFilterQueryState,
    | "categories"
    | "brands"
    | "isPopular"
    | "isDiscount"
    | "searchTerm"
    | "minPrice"
    | "maxPrice"
  >
>;

export interface BrowserPanelState {
  activePanelIndex: number;
  swipeTranslatePercent: number;
}

export function normalizeBrowserTabValue(
  value: string,
): CatalogFilterQueryState["tab"] {
  return value === "categories" ? "categories" : "catalog";
}

export function getBrowserPanelState(
  queryState: Pick<CatalogFilterQueryState, "tab">,
): BrowserPanelState {
  const activePanelIndex = queryState.tab === "categories" ? 1 : 0;

  return {
    activePanelIndex,
    swipeTranslatePercent: activePanelIndex * 50,
  };
}

export function getBrowserFilterQueryKey(
  queryState: CatalogFilterQueryState,
): string {
  return applyCatalogFilterQueryState(
    new URLSearchParams(),
    queryState,
  ).toString();
}

export function getNextBrowserTabQueryState(
  queryState: CatalogFilterQueryState,
  value: string,
): CatalogFilterQueryState {
  return {
    ...queryState,
    tab: normalizeBrowserTabValue(value),
  };
}

export function getNextBrowserFilterQueryState(params: {
  isFilterActive: boolean;
  patch?: CatalogFilterValuePatch;
  queryState: CatalogFilterQueryState;
}): CatalogFilterQueryState {
  const { isFilterActive, patch, queryState } = params;

  if (typeof patch === "undefined") {
    return isFilterActive
      ? clearCatalogFilterState(queryState)
      : activateCatalogFilterState(queryState);
  }

  const mergedState: CatalogFilterQueryState = {
    ...queryState,
    ...patch,
    tab: "catalog",
  };
  const hasFilterValues = hasActiveCatalogFilters({
    ...mergedState,
    filter: undefined,
  });

  return {
    ...mergedState,
    filter: hasFilterValues ? true : undefined,
  };
}

export function buildBrowserQueryHref(params: {
  pathname: string;
  queryState: CatalogFilterQueryState;
  searchParams: SearchParamsLike;
}): string {
  const nextParams = applyCatalogFilterQueryState(
    params.searchParams,
    params.queryState,
  );
  const query = nextParams.toString();

  return query ? `${params.pathname}?${query}` : params.pathname;
}
