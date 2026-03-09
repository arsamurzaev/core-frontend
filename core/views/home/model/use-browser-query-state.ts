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
    },
    [isFilterActive, pathname, queryState, router, searchParams],
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

    const target = document.getElementById("scroll-tab-element");
    if (!target) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [pathnameKey, queryKey]);

  return {
    queryState,
    isFilterActive,
    activePanelIndex,
    swipeTranslatePercent,
    handleTabChange,
    handleFilterToggle,
  };
}
