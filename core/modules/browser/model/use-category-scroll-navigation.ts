"use client";

import { CategoryDto } from "@/shared/api/generated/react-query";
import React from "react";
import { CATEGORY_SCROLL_ALIGN_TOLERANCE_PX } from "./category-scroll";
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
  isCategoryLoadingBlocked: boolean;
  loadAllowedCategoryId: string | null;
  handleCategoryBarClick: (item: { id: string }) => void;
  handleCategoryFirstPageLoaded: (categoryId: string) => void;
}

export function useCategoryScrollNavigation({
  categories,
  isCatalogTab,
  isFilterActive,
}: UseCategoryScrollNavigationParams): UseCategoryScrollNavigationResult {
  const activeCategoryIdRef = React.useRef<string | null>(null);
  const syncRafRef = React.useRef<number | null>(null);
  const [jumpTargetCategoryId, setJumpTargetCategoryId] = React.useState<
    string | null
  >(null);
  const [loadAllowedCategoryId, setLoadAllowedCategoryId] = React.useState<
    string | null
  >(null);
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
      if (jumpTargetCategoryId) {
        if (nextActiveCategoryId === jumpTargetCategoryId) {
          setLoadAllowedCategoryId(jumpTargetCategoryId);
        }

        return;
      }

      setActiveCategory(nextActiveCategoryId);
    }
  }, [
    categoryIds,
    isCatalogViewEnabled,
    jumpTargetCategoryId,
    setActiveCategory,
  ]);

  const scheduleSyncActiveCategoryByViewport = React.useCallback(() => {
    if (syncRafRef.current !== null) {
      return;
    }

    syncRafRef.current = window.requestAnimationFrame(() => {
      syncRafRef.current = null;
      syncActiveCategoryByViewport();
    });
  }, [syncActiveCategoryByViewport]);

  React.useEffect(() => {
    if (categories.length === 0) {
      activeCategoryIdRef.current = null;
      setActiveCategoryId(null);
      setJumpTargetCategoryId(null);
      setLoadAllowedCategoryId(null);
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

    if (jumpTargetCategoryId && !categoryIdSet.has(jumpTargetCategoryId)) {
      setJumpTargetCategoryId(null);
      setLoadAllowedCategoryId(null);
    }
  }, [categories, categoryIds, jumpTargetCategoryId]);

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
    if (isCatalogViewEnabled) {
      return;
    }

    setJumpTargetCategoryId(null);
    setLoadAllowedCategoryId(null);
  }, [isCatalogViewEnabled]);

  React.useEffect(() => {
    return () => {
      if (syncRafRef.current !== null) {
        window.cancelAnimationFrame(syncRafRef.current);
        syncRafRef.current = null;
      }
    };
  }, []);

  const handleCategoryBarClick = React.useCallback(
    (item: { id: string }) => {
      if (!isCatalogViewEnabled || !categoryIds.includes(item.id)) {
        return;
      }

      const isAlreadyActive = activeCategoryIdRef.current === item.id;
      setActiveCategory(item.id);

      if (isAlreadyActive) {
        setJumpTargetCategoryId(null);
        setLoadAllowedCategoryId(null);
        alignCategorySectionToLine({
          categoryId: item.id,
          behavior: "auto",
          minDeltaPx: CATEGORY_SCROLL_ALIGN_TOLERANCE_PX,
        });
        scheduleSyncActiveCategoryByViewport();
        return;
      }

      setJumpTargetCategoryId(item.id);
      setLoadAllowedCategoryId(null);
      const alignResult = alignCategorySectionToLine({
        categoryId: item.id,
        behavior: "auto",
        minDeltaPx: CATEGORY_SCROLL_ALIGN_TOLERANCE_PX,
      });

      if (!alignResult.found) {
        setJumpTargetCategoryId(null);
        setLoadAllowedCategoryId(null);
        scheduleSyncActiveCategoryByViewport();
        return;
      }

      scheduleSyncActiveCategoryByViewport();
    },
    [
      categoryIds,
      isCatalogViewEnabled,
      scheduleSyncActiveCategoryByViewport,
      setActiveCategory,
    ],
  );

  const handleCategoryFirstPageLoaded = React.useCallback(
    (categoryId: string) => {
      if (jumpTargetCategoryId !== categoryId) {
        return;
      }

      setJumpTargetCategoryId(null);
      setLoadAllowedCategoryId(null);
      scheduleSyncActiveCategoryByViewport();
    },
    [jumpTargetCategoryId, scheduleSyncActiveCategoryByViewport],
  );

  return {
    activeCategoryId,
    isCategoryLoadingBlocked: jumpTargetCategoryId !== null,
    loadAllowedCategoryId,
    handleCategoryBarClick,
    handleCategoryFirstPageLoaded,
  };
}
