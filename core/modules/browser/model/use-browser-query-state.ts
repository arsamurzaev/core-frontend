"use client";

import {
  hasActiveCatalogFilters,
  parseCatalogFilterQueryState,
  type CatalogFilterQueryState,
} from "@/shared/lib/catalog-filter-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import {
  CATALOG_PRODUCTS_SECTION_ID,
  CATEGORY_SECTION_ID_PREFIX,
  FILTER_PRODUCTS_RESULTS_SECTION_ID,
  getCategorySectionScrollTargetOffset,
} from "./category-scroll";
import {
  buildBrowserQueryHref,
  getBrowserFilterQueryKey,
  getBrowserPanelState,
  getNextBrowserFilterQueryState,
  getNextBrowserTabQueryState,
  type CatalogFilterValuePatch,
} from "./browser-query-state";

export type { CatalogFilterValuePatch } from "./browser-query-state";

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
  const previousLocationRef = React.useRef<{
    filterQuery: string;
    pathname: string;
  } | null>(null);

  const scrollToContentStart = React.useCallback((isNextFilterActive: boolean) => {
    const getTargetElement = () => {
      if (isNextFilterActive) {
        return document.getElementById(FILTER_PRODUCTS_RESULTS_SECTION_ID);
      }

      return (
        document.getElementById(CATALOG_PRODUCTS_SECTION_ID) ??
        document.querySelector<HTMLElement>(
          `[id^="${CATEGORY_SECTION_ID_PREFIX}-"]`,
        ) ??
        document.getElementById("uncategorized-products-section")
      );
    };

    const scroll = () => {
      const targetElement = getTargetElement();

      if (!targetElement) {
        return;
      }

      const nextTop = Math.max(
        0,
        window.scrollY +
          targetElement.getBoundingClientRect().top -
          getCategorySectionScrollTargetOffset(),
      );

      window.scrollTo({ top: nextTop, behavior: "instant" });
    };

    scroll();
    requestAnimationFrame(() => {
      scroll();
      requestAnimationFrame(scroll);
    });
    window.setTimeout(scroll, 80);
    window.setTimeout(scroll, 180);
  }, []);

  const queryState = React.useMemo(
    () => parseCatalogFilterQueryState(searchParams),
    [searchParams],
  );
  const filterQueryKey = React.useMemo(
    () => getBrowserFilterQueryKey(queryState),
    [queryState],
  );
  const isFilterActive = React.useMemo(
    () => hasActiveCatalogFilters(queryState),
    [queryState],
  );
  const { activePanelIndex, swipeTranslatePercent } = React.useMemo(
    () => getBrowserPanelState(queryState),
    [queryState],
  );

  const handleTabChange = React.useCallback(
    (value: string) => {
      const nextState = getNextBrowserTabQueryState(queryState, value);

      router.replace(
        buildBrowserQueryHref({
          pathname,
          queryState: nextState,
          searchParams,
        }),
        {
          scroll: false,
        },
      );
    },
    [pathname, queryState, router, searchParams],
  );

  const handleFilterToggle = React.useCallback(
    (patch?: CatalogFilterValuePatch) => {
      const nextState = getNextBrowserFilterQueryState({
        isFilterActive,
        patch,
        queryState,
      });

      router.replace(
        buildBrowserQueryHref({
          pathname,
          queryState: nextState,
          searchParams,
        }),
        {
          scroll: false,
        },
      );

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
    const currentLocation = {
      filterQuery: filterQueryKey,
      pathname: pathnameKey,
    };

    if (!previousLocation) {
      previousLocationRef.current = currentLocation;
      return;
    }

    const hasOnlyCatalogFilterQueryChanged =
      previousLocation.filterQuery !== currentLocation.filterQuery &&
      previousLocation.pathname === currentLocation.pathname;

    previousLocationRef.current = currentLocation;

    if (!hasOnlyCatalogFilterQueryChanged) {
      return;
    }

    scrollToContentStart(isFilterActive);
  }, [filterQueryKey, isFilterActive, pathnameKey, scrollToContentStart]);

  return {
    queryState,
    isFilterActive,
    activePanelIndex,
    swipeTranslatePercent,
    handleTabChange,
    handleFilterToggle,
  };
}
