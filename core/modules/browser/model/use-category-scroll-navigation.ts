"use client";

import { CategoryDto } from "@/shared/api/generated/react-query";
import React from "react";
import { flushSync } from "react-dom";
import {
  CATEGORY_SCROLL_ALIGN_TOLERANCE_PX,
  CATEGORY_SCROLL_REALIGN_ATTEMPTS,
  CATEGORY_SCROLL_REALIGN_DELAY_MS,
} from "./category-scroll";
import {
  alignCategorySectionToLine,
  getActiveCategoryLineY,
  invalidateCategoryScrollCache,
  resolveActiveCategoryIdByLine,
} from "./category-scroll-navigation-dom";

interface UseCategoryScrollNavigationParams {
  categories: CategoryDto[];
  isCatalogTab: boolean;
  isFilterActive: boolean;
}

interface UseCategoryScrollNavigationResult {
  activeCategoryId: string | null;
  navigationTargetCategoryId: string | null;
  handleCategoryBarClick: (item: { id: string }) => void;
}

export function useCategoryScrollNavigation({
  categories,
  isCatalogTab,
  isFilterActive,
}: UseCategoryScrollNavigationParams): UseCategoryScrollNavigationResult {
  const activeCategoryIdRef = React.useRef<string | null>(null);
  const syncRafRef = React.useRef<number | null>(null);
  const realignTimerRef = React.useRef<number | null>(null);
  const [navigationTargetCategoryId, setNavigationTargetCategoryId] =
    React.useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(
    null,
  );

  const isCatalogViewEnabled = isCatalogTab && !isFilterActive;
  const categoryIds = React.useMemo(
    () => categories.map((category) => category.id),
    [categories],
  );

  const setActiveCategory = React.useCallback((categoryId: string | null) => {
    if (activeCategoryIdRef.current === categoryId) {
      return;
    }

    activeCategoryIdRef.current = categoryId;
    setActiveCategoryId(categoryId);
  }, []);

  const syncActiveCategoryByViewport = React.useCallback(() => {
    if (!isCatalogViewEnabled || categoryIds.length === 0) {
      return;
    }

    const lineY = getActiveCategoryLineY();
    const nextActiveCategoryId = resolveActiveCategoryIdByLine({
      categoryIds,
      currentActiveCategoryId: activeCategoryIdRef.current,
      lineY,
    });

    if (nextActiveCategoryId) {
      setActiveCategory(nextActiveCategoryId);
    }
  }, [categoryIds, isCatalogViewEnabled, setActiveCategory]);

  const scheduleSyncActiveCategoryByViewport = React.useCallback(() => {
    if (syncRafRef.current !== null) {
      return;
    }

    syncRafRef.current = window.requestAnimationFrame(() => {
      syncRafRef.current = null;
      syncActiveCategoryByViewport();
    });
  }, [syncActiveCategoryByViewport]);

  const syncActiveCategoryAfterLayout = React.useCallback(() => {
    requestAnimationFrame(() => {
      syncActiveCategoryByViewport();
    });
  }, [syncActiveCategoryByViewport]);

  const clearRealignTimer = React.useCallback(() => {
    if (realignTimerRef.current === null) {
      return;
    }

    window.clearTimeout(realignTimerRef.current);
    realignTimerRef.current = null;
  }, []);

  const alignCategoryInstantly = React.useCallback((categoryId: string) => {
    invalidateCategoryScrollCache();
    return alignCategorySectionToLine({
      categoryId,
      behavior: "instant",
      minDeltaPx: CATEGORY_SCROLL_ALIGN_TOLERANCE_PX,
    });
  }, []);

  const scheduleCategoryRealign = React.useCallback(
    (categoryId: string) => {
      clearRealignTimer();

      let attempts = 0;

      const realign = () => {
        const result = alignCategoryInstantly(categoryId);
        scheduleSyncActiveCategoryByViewport();

        if (
          !result.found ||
          result.distanceToLine <= CATEGORY_SCROLL_ALIGN_TOLERANCE_PX ||
          attempts >= CATEGORY_SCROLL_REALIGN_ATTEMPTS
        ) {
          realignTimerRef.current = null;
          setNavigationTargetCategoryId(null);
          syncActiveCategoryAfterLayout();
          return;
        }

        attempts += 1;
        realignTimerRef.current = window.setTimeout(
          realign,
          CATEGORY_SCROLL_REALIGN_DELAY_MS,
        );
      };

      realignTimerRef.current = window.setTimeout(
        realign,
        CATEGORY_SCROLL_REALIGN_DELAY_MS,
      );
    },
    [
      alignCategoryInstantly,
      clearRealignTimer,
      scheduleSyncActiveCategoryByViewport,
      syncActiveCategoryAfterLayout,
    ],
  );

  React.useEffect(() => {
    if (categories.length === 0) {
      activeCategoryIdRef.current = null;
      setActiveCategoryId(null);
      setNavigationTargetCategoryId(null);
      return;
    }

    const categoryIdSet = new Set(categoryIds);
    const currentActiveCategoryId = activeCategoryIdRef.current;
    const nextActiveCategoryId =
      currentActiveCategoryId && categoryIdSet.has(currentActiveCategoryId)
        ? currentActiveCategoryId
        : categories[0]?.id ?? null;

    activeCategoryIdRef.current = nextActiveCategoryId;
    setActiveCategoryId(nextActiveCategoryId);

    if (
      navigationTargetCategoryId &&
      !categoryIdSet.has(navigationTargetCategoryId)
    ) {
      setNavigationTargetCategoryId(null);
    }
  }, [categories, categoryIds, navigationTargetCategoryId]);

  React.useEffect(() => {
    if (!isCatalogViewEnabled || categoryIds.length === 0) {
      return;
    }

    scheduleSyncActiveCategoryByViewport();

    const handleScroll = () => {
      scheduleSyncActiveCategoryByViewport();
    };

    const handleResize = () => {
      invalidateCategoryScrollCache();
      scheduleSyncActiveCategoryByViewport();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    const scrollTarget = document.getElementById("scroll-tab-element");
    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined" && scrollTarget) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(scrollTarget);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();

      if (syncRafRef.current !== null) {
        window.cancelAnimationFrame(syncRafRef.current);
        syncRafRef.current = null;
      }
    };
  }, [
    categoryIds.length,
    isCatalogViewEnabled,
    scheduleSyncActiveCategoryByViewport,
  ]);

  React.useEffect(() => {
    return () => {
      if (syncRafRef.current !== null) {
        window.cancelAnimationFrame(syncRafRef.current);
        syncRafRef.current = null;
      }

      clearRealignTimer();
      setNavigationTargetCategoryId(null);
    };
  }, [clearRealignTimer]);

  const handleCategoryBarClick = React.useCallback(
    (item: { id: string }) => {
      if (!isCatalogViewEnabled || !categoryIds.includes(item.id)) {
        return;
      }

      const isAlreadyActive = activeCategoryIdRef.current === item.id;

      if (isAlreadyActive) {
        flushSync(() => {
          setNavigationTargetCategoryId(null);
          setActiveCategory(item.id);
        });
        alignCategoryInstantly(item.id);
        scheduleCategoryRealign(item.id);
        syncActiveCategoryAfterLayout();
        return;
      }

      flushSync(() => {
        setNavigationTargetCategoryId(item.id);
        setActiveCategory(item.id);
      });
      const alignResult = alignCategoryInstantly(item.id);

      if (!alignResult.found) {
        flushSync(() => {
          setNavigationTargetCategoryId(null);
        });
        syncActiveCategoryAfterLayout();
        return;
      }

      scheduleCategoryRealign(item.id);
      syncActiveCategoryAfterLayout();
    },
    [
      alignCategoryInstantly,
      categoryIds,
      isCatalogViewEnabled,
      scheduleCategoryRealign,
      setActiveCategory,
      syncActiveCategoryAfterLayout,
    ],
  );

  return {
    activeCategoryId,
    navigationTargetCategoryId,
    handleCategoryBarClick,
  };
}
