"use client";

import {
  activateCatalogFilterState,
  applyCatalogFilterQueryState,
  clearCatalogFilterState,
  hasActiveCatalogFilters,
  parseCatalogFilterQueryState,
  type CatalogFilterQueryState,
} from "@/shared/lib/catalog-filter-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import {
  CATEGORY_SECTION_ID_PREFIX,
  FILTER_PRODUCTS_RESULTS_SECTION_ID,
} from "./category-scroll";

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

interface UseBrowserQueryStateResult {
  queryState: CatalogFilterQueryState;
  isFilterActive: boolean;
  activePanelIndex: number;
  swipeTranslatePercent: number;
  handleTabChange: (value: string) => void;
  handleFilterToggle: (patch?: CatalogFilterValuePatch) => void;
}

export function useBrowserQueryState(): UseBrowserQueryStateResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathnameKey = pathname ?? "";
  const queryKey = searchParams.toString();
  const previousLocationRef = React.useRef<{
    pathname: string;
    query: string;
  } | null>(null);

  const scrollToContentStart = React.useCallback((isNextFilterActive: boolean) => {
    const getTargetElementId = () => {
      if (isNextFilterActive) {
        return document.getElementById(FILTER_PRODUCTS_RESULTS_SECTION_ID)?.id;
      }

      return (
        document.querySelector<HTMLElement>(
          `[id^="${CATEGORY_SECTION_ID_PREFIX}-"]`,
        )?.id ?? document.getElementById("uncategorized-products-section")?.id
      );
    };

    const scroll = () => {
      const targetElementId = getTargetElementId();

      if (!targetElementId) {
        return;
      }

      const targetElement = document.getElementById(targetElementId);

      if (!targetElement) {
        return;
      }

      const filterBarBottom =
        document.getElementById("catalog-filter-bar")?.getBoundingClientRect()
          .bottom ?? 0;
      const nextTop = Math.max(
        0,
        window.scrollY + targetElement.getBoundingClientRect().top - filterBarBottom,
      );

      window.scrollTo({ top: nextTop, behavior: "instant" });
    };

    scroll();
    requestAnimationFrame(scroll);
    window.setTimeout(scroll, 80);
    window.setTimeout(scroll, 180);
  }, []);

  const queryState = React.useMemo(
    () => parseCatalogFilterQueryState(searchParams),
    [searchParams],
  );
  const isFilterActive = React.useMemo(
    () => hasActiveCatalogFilters(queryState),
    [queryState],
  );
  const activePanelIndex = React.useMemo(
    () => (queryState.tab === "categories" ? 1 : 0),
    [queryState.tab],
  );
  const swipeTranslatePercent = React.useMemo(
    () => activePanelIndex * 50,
    [activePanelIndex],
  );

  const handleTabChange = React.useCallback(
    (value: string) => {
      const nextTab = value === "categories" ? "categories" : "catalog";
      const nextState: CatalogFilterQueryState = {
        ...queryState,
        tab: nextTab,
      };
      const nextParams = applyCatalogFilterQueryState(searchParams, nextState);
      const query = nextParams.toString();

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, queryState, router, searchParams],
  );

  const handleFilterToggle = React.useCallback(
    (patch?: CatalogFilterValuePatch) => {
      let nextState: CatalogFilterQueryState;

      if (typeof patch !== "undefined") {
        const mergedState: CatalogFilterQueryState = {
          ...queryState,
          ...patch,
          tab: "catalog",
        };
        const hasFilterValues = hasActiveCatalogFilters({
          ...mergedState,
          filter: undefined,
        });
        nextState = {
          ...mergedState,
          filter: hasFilterValues ? true : undefined,
        };
      } else {
        nextState = isFilterActive
          ? clearCatalogFilterState(queryState)
          : activateCatalogFilterState(queryState);
      }

      const nextParams = applyCatalogFilterQueryState(searchParams, nextState);
      const query = nextParams.toString();

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });

      scrollToContentStart(hasActiveCatalogFilters(nextState));
    },
    [
      isFilterActive,
      pathname,
      queryState,
      router,
      scrollToContentStart,
      searchParams,
    ],
  );

  React.useEffect(() => {
    const previousLocation = previousLocationRef.current;
    const currentLocation = { pathname: pathnameKey, query: queryKey };

    if (!previousLocation) {
      previousLocationRef.current = currentLocation;
      return;
    }

    const hasOnlyQueryChanged =
      previousLocation.query !== currentLocation.query &&
      previousLocation.pathname === currentLocation.pathname;

    previousLocationRef.current = currentLocation;

    if (!hasOnlyQueryChanged) {
      return;
    }

    scrollToContentStart(isFilterActive);
  }, [isFilterActive, pathnameKey, queryKey, scrollToContentStart]);

  return {
    queryState,
    isFilterActive,
    activePanelIndex,
    swipeTranslatePercent,
    handleTabChange,
    handleFilterToggle,
  };
}
