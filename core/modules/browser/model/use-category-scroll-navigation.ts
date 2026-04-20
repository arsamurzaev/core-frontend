"use client";

import {
  CategoryDto,
} from "@/shared/api/generated/react-query";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import {
  clamp,
  PROGRAMMATIC_SCROLL_ALIGN_TOLERANCE_PX,
  PROGRAMMATIC_SCROLL_DEFAULT_SETTLE_DELAY_MS,
  PROGRAMMATIC_SCROLL_FRAME_DELAY_FACTOR,
  PROGRAMMATIC_SCROLL_FRAME_SAMPLE_SIZE,
  PROGRAMMATIC_SCROLL_MAX_SETTLE_ATTEMPTS,
  PROGRAMMATIC_SCROLL_MAX_SETTLE_DELAY_MS,
  PROGRAMMATIC_SCROLL_MIN_ALIGN_DELTA_PX,
  PROGRAMMATIC_SCROLL_MIN_SETTLE_DELAY_MS,
} from "./category-scroll";
import {
  alignCategorySectionToLine,
  getActiveCategoryLineY,
  isCategoryProgrammaticTargetReached,
  resolveActiveCategoryIdByLine,
} from "./category-scroll-navigation-dom";
import {
  getCategoryFirstPageState,
  hasCategoryFirstPageLoaded,
  prefetchCategoryFirstPage,
} from "./category-scroll-navigation-query";

interface UseCategoryScrollNavigationParams {
  categories: CategoryDto[];
  isCatalogTab: boolean;
  isFilterActive: boolean;
  pageSize: number;
}

interface UseCategoryScrollNavigationResult {
  activeCategoryId: string | null;
  isProgrammaticScroll: boolean;
  programmaticScrollTargetId: string | null;
  handleCategoryBarClick: (item: { id: string }) => void;
}

const PROGRAMMATIC_SCROLL_MAX_WAIT_FOR_DATA_ATTEMPTS = 48;

export function useCategoryScrollNavigation({
  categories,
  isCatalogTab,
  isFilterActive,
  pageSize,
}: UseCategoryScrollNavigationParams): UseCategoryScrollNavigationResult {
  const queryClient = useQueryClient();
  const activeCategoryIdRef = React.useRef<string | null>(null);
  const pendingScrollCategoryIdRef = React.useRef<string | null>(null);
  const syncActiveCategoryRafRef = React.useRef<number | null>(null);
  const programmaticScrollSettleTimerRef = React.useRef<number | null>(null);
  const programmaticScrollSettleAttemptsRef = React.useRef(0);
  const programmaticScrollAdaptiveDelayRef = React.useRef(
    PROGRAMMATIC_SCROLL_DEFAULT_SETTLE_DELAY_MS,
  );
  const programmaticScrollFpsRafRef = React.useRef<number | null>(null);
  const programmaticScrollLastFrameTsRef = React.useRef<number | null>(null);
  const programmaticScrollFrameSampleCountRef = React.useRef(0);
  const programmaticScrollFrameSampleTotalRef = React.useRef(0);
  const programmaticScrollTargetIdRef = React.useRef<string | null>(null);
  const programmaticScrollRequiresFirstPageRef = React.useRef(false);
  const programmaticScrollLockRef = React.useRef(false);
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(
    null,
  );
  const [pendingScrollCategoryId, setPendingScrollCategoryId] = React.useState<
    string | null
  >(null);
  const [programmaticScrollTargetId, setProgrammaticScrollTargetId] =
    React.useState<string | null>(null);
  const [isProgrammaticScrollLocked, setIsProgrammaticScrollLocked] =
    React.useState(false);

  const isCatalogViewEnabled = isCatalogTab && !isFilterActive;
  const categoryIds = React.useMemo(
    () => categories.map((category) => category.id),
    [categories],
  );

  React.useEffect(() => {
    activeCategoryIdRef.current = activeCategoryId;
  }, [activeCategoryId]);

  React.useEffect(() => {
    pendingScrollCategoryIdRef.current = pendingScrollCategoryId;
  }, [pendingScrollCategoryId]);

  const clearProgrammaticScrollSettle = React.useCallback(() => {
    if (programmaticScrollSettleTimerRef.current === null) {
      return;
    }

    window.clearTimeout(programmaticScrollSettleTimerRef.current);
    programmaticScrollSettleTimerRef.current = null;
  }, []);

  const clearProgrammaticScrollFpsTracking = React.useCallback(() => {
    if (programmaticScrollFpsRafRef.current !== null) {
      window.cancelAnimationFrame(programmaticScrollFpsRafRef.current);
      programmaticScrollFpsRafRef.current = null;
    }

    programmaticScrollLastFrameTsRef.current = null;
    programmaticScrollFrameSampleCountRef.current = 0;
    programmaticScrollFrameSampleTotalRef.current = 0;
    programmaticScrollAdaptiveDelayRef.current =
      PROGRAMMATIC_SCROLL_DEFAULT_SETTLE_DELAY_MS;
  }, []);

  const startProgrammaticScrollFpsTracking = React.useCallback(() => {
    clearProgrammaticScrollFpsTracking();

    const trackFrame = (timestamp: number) => {
      if (!programmaticScrollLockRef.current) {
        return;
      }

      const previousTimestamp = programmaticScrollLastFrameTsRef.current;
      if (previousTimestamp !== null) {
        const frameDuration = timestamp - previousTimestamp;

        if (frameDuration > 0 && frameDuration < 1000) {
          programmaticScrollFrameSampleCountRef.current += 1;
          programmaticScrollFrameSampleTotalRef.current += frameDuration;
        }

        if (
          programmaticScrollFrameSampleCountRef.current >=
          PROGRAMMATIC_SCROLL_FRAME_SAMPLE_SIZE
        ) {
          const averageFrameDuration =
            programmaticScrollFrameSampleTotalRef.current /
            programmaticScrollFrameSampleCountRef.current;

          const nextDelay = clamp(
            Math.round(averageFrameDuration * PROGRAMMATIC_SCROLL_FRAME_DELAY_FACTOR),
            PROGRAMMATIC_SCROLL_MIN_SETTLE_DELAY_MS,
            PROGRAMMATIC_SCROLL_MAX_SETTLE_DELAY_MS,
          );

          programmaticScrollAdaptiveDelayRef.current = nextDelay;
          programmaticScrollFrameSampleCountRef.current = 0;
          programmaticScrollFrameSampleTotalRef.current = 0;
        }
      }

      programmaticScrollLastFrameTsRef.current = timestamp;
      programmaticScrollFpsRafRef.current = window.requestAnimationFrame(trackFrame);
    };

    programmaticScrollFpsRafRef.current = window.requestAnimationFrame(trackFrame);
  }, [clearProgrammaticScrollFpsTracking]);

  const getProgrammaticScrollSettleDelay = React.useCallback((): number => {
    return clamp(
      programmaticScrollAdaptiveDelayRef.current,
      PROGRAMMATIC_SCROLL_MIN_SETTLE_DELAY_MS,
      PROGRAMMATIC_SCROLL_MAX_SETTLE_DELAY_MS,
    );
  }, []);

  const resetProgrammaticScrollState = React.useCallback(() => {
    pendingScrollCategoryIdRef.current = null;
    setPendingScrollCategoryId(null);
    programmaticScrollTargetIdRef.current = null;
    programmaticScrollRequiresFirstPageRef.current = false;
    setProgrammaticScrollTargetId(null);
    programmaticScrollSettleAttemptsRef.current = 0;
    programmaticScrollLockRef.current = false;
    setIsProgrammaticScrollLocked(false);
    clearProgrammaticScrollSettle();
    clearProgrammaticScrollFpsTracking();
  }, [clearProgrammaticScrollFpsTracking, clearProgrammaticScrollSettle]);

  React.useEffect(() => {
    if (categories.length === 0) {
      activeCategoryIdRef.current = null;
      setActiveCategoryId(null);
      resetProgrammaticScrollState();
      return;
    }

    const categoryIdSet = new Set(categories.map((category) => category.id));
    const nextActiveCategoryId =
      activeCategoryIdRef.current &&
      categoryIdSet.has(activeCategoryIdRef.current)
        ? activeCategoryIdRef.current
        : categories[0]?.id ?? null;
    const nextPendingCategoryId =
      pendingScrollCategoryIdRef.current &&
      categoryIdSet.has(pendingScrollCategoryIdRef.current)
        ? pendingScrollCategoryIdRef.current
        : null;

    activeCategoryIdRef.current = nextActiveCategoryId;
    setActiveCategoryId(nextActiveCategoryId);
    pendingScrollCategoryIdRef.current = nextPendingCategoryId;
    setPendingScrollCategoryId(nextPendingCategoryId);

    const targetId = programmaticScrollTargetIdRef.current;
    if (targetId && !categoryIdSet.has(targetId)) {
      resetProgrammaticScrollState();
    }
  }, [categories, resetProgrammaticScrollState]);

  const alignCategorySection = React.useCallback(
    (
      categoryId: string,
      behavior: ScrollBehavior,
      minDeltaPx = 0,
    ) => {
      return alignCategorySectionToLine({
        categoryId,
        behavior,
        minDeltaPx,
      });
    },
    [],
  );

  const resolveActiveCategoryByLine = React.useCallback(
    (lineY: number): string | null => {
      return resolveActiveCategoryIdByLine({
        categoryIds,
        currentActiveCategoryId: activeCategoryIdRef.current,
        lineY,
      });
    },
    [categoryIds],
  );

  const isProgrammaticTargetReached = React.useCallback(
    (targetId: string): boolean => {
      return isCategoryProgrammaticTargetReached({
        categoryIds,
        targetId,
      });
    },
    [categoryIds],
  );

  const isCategoryActiveAtLine = React.useCallback(
    (categoryId: string): boolean => {
      const lineY = getActiveCategoryLineY();

      return resolveActiveCategoryByLine(lineY) === categoryId;
    },
    [resolveActiveCategoryByLine],
  );

  const syncActiveCategoryByViewport = React.useCallback(() => {
    if (!isCatalogViewEnabled || categories.length === 0) {
      return;
    }

    const lineY = getActiveCategoryLineY();
    const nextActiveCategoryId = resolveActiveCategoryByLine(lineY);

    if (!nextActiveCategoryId) {
      return;
    }

    const pendingId = pendingScrollCategoryIdRef.current;
    if (programmaticScrollLockRef.current) {
      if (pendingId && activeCategoryIdRef.current !== pendingId) {
        activeCategoryIdRef.current = pendingId;
        setActiveCategoryId(pendingId);
      }
      return;
    }

    if (activeCategoryIdRef.current !== nextActiveCategoryId) {
      activeCategoryIdRef.current = nextActiveCategoryId;
      setActiveCategoryId(nextActiveCategoryId);
    }

    if (pendingId) {
      pendingScrollCategoryIdRef.current = null;
      setPendingScrollCategoryId(null);
    }
  }, [categories.length, isCatalogViewEnabled, resolveActiveCategoryByLine]);

  const getCategoryFirstPageStatus = React.useCallback(
    (categoryId: string) =>
      getCategoryFirstPageState({
        categoryId,
        pageSize,
        queryClient,
      }),
    [pageSize, queryClient],
  );

  const hasLoadedCategoryFirstPage = React.useCallback(
    (categoryId: string) =>
      hasCategoryFirstPageLoaded({
        categoryId,
        pageSize,
        queryClient,
      }),
    [pageSize, queryClient],
  );

  const scheduleSyncActiveCategoryByViewport = React.useCallback(() => {
    if (syncActiveCategoryRafRef.current !== null) {
      return;
    }

    syncActiveCategoryRafRef.current = window.requestAnimationFrame(() => {
      syncActiveCategoryRafRef.current = null;
      syncActiveCategoryByViewport();
    });
  }, [syncActiveCategoryByViewport]);

  React.useEffect(() => {
    if (!isCatalogViewEnabled || categories.length === 0) {
      return;
    }

    scheduleSyncActiveCategoryByViewport();

    const handleSync = () => {
      scheduleSyncActiveCategoryByViewport();
    };

    window.addEventListener("scroll", handleSync, { passive: true });
    window.addEventListener("resize", handleSync);

    const scrollTarget = document.getElementById("scroll-tab-element");
    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined" && scrollTarget) {
      resizeObserver = new ResizeObserver(handleSync);
      resizeObserver.observe(scrollTarget);
    }

    return () => {
      window.removeEventListener("scroll", handleSync);
      window.removeEventListener("resize", handleSync);
      resizeObserver?.disconnect();

      if (syncActiveCategoryRafRef.current !== null) {
        window.cancelAnimationFrame(syncActiveCategoryRafRef.current);
        syncActiveCategoryRafRef.current = null;
      }
    };
  }, [categories.length, isCatalogViewEnabled, scheduleSyncActiveCategoryByViewport]);

  const releaseProgrammaticScrollLock = React.useCallback(
    (targetId: string) => {
      if (programmaticScrollTargetIdRef.current !== targetId) {
        return;
      }

      activeCategoryIdRef.current = targetId;
      setActiveCategoryId(targetId);
      resetProgrammaticScrollState();
      scheduleSyncActiveCategoryByViewport();
    },
    [resetProgrammaticScrollState, scheduleSyncActiveCategoryByViewport],
  );

  const abortProgrammaticScroll = React.useCallback(() => {
    resetProgrammaticScrollState();
    syncActiveCategoryByViewport();
    scheduleSyncActiveCategoryByViewport();
  }, [
    resetProgrammaticScrollState,
    scheduleSyncActiveCategoryByViewport,
    syncActiveCategoryByViewport,
  ]);

  const scheduleProgrammaticScrollSettle = React.useCallback(() => {
    clearProgrammaticScrollSettle();

    const targetId = programmaticScrollTargetIdRef.current;
    if (!targetId || !programmaticScrollLockRef.current) {
      return;
    }

    const runAttempt = () => {
      const currentTargetId = programmaticScrollTargetIdRef.current;
      if (
        currentTargetId !== targetId ||
        !currentTargetId ||
        !programmaticScrollLockRef.current
      ) {
        return;
      }

      if (programmaticScrollRequiresFirstPageRef.current) {
        const firstPageState = getCategoryFirstPageStatus(targetId);

        if (firstPageState !== "loaded") {
          if (firstPageState === "error") {
            abortProgrammaticScroll();
            return;
          }

          if (
            programmaticScrollSettleAttemptsRef.current >=
            PROGRAMMATIC_SCROLL_MAX_WAIT_FOR_DATA_ATTEMPTS
          ) {
            abortProgrammaticScroll();
            return;
          }

          programmaticScrollSettleAttemptsRef.current += 1;
          programmaticScrollSettleTimerRef.current = window.setTimeout(
            runAttempt,
            getProgrammaticScrollSettleDelay(),
          );
          return;
        }

        programmaticScrollRequiresFirstPageRef.current = false;
        programmaticScrollSettleAttemptsRef.current = 0;
        setProgrammaticScrollTargetId(targetId);
        programmaticScrollSettleTimerRef.current = window.setTimeout(
          runAttempt,
          0,
        );
        return;
      }

      if (isProgrammaticTargetReached(targetId)) {
        releaseProgrammaticScrollLock(targetId);
        return;
      }

      alignCategorySection(targetId, "auto", PROGRAMMATIC_SCROLL_MIN_ALIGN_DELTA_PX);

      if (isProgrammaticTargetReached(targetId)) {
        releaseProgrammaticScrollLock(targetId);
        return;
      }

      if (
        programmaticScrollSettleAttemptsRef.current >=
        PROGRAMMATIC_SCROLL_MAX_SETTLE_ATTEMPTS
      ) {
        releaseProgrammaticScrollLock(targetId);
        return;
      }

      programmaticScrollSettleAttemptsRef.current += 1;
      programmaticScrollSettleTimerRef.current = window.setTimeout(
        runAttempt,
        getProgrammaticScrollSettleDelay(),
      );
    };

    programmaticScrollSettleTimerRef.current = window.setTimeout(
      runAttempt,
      getProgrammaticScrollSettleDelay(),
    );
  }, [
    alignCategorySection,
    abortProgrammaticScroll,
    clearProgrammaticScrollSettle,
    getProgrammaticScrollSettleDelay,
    getCategoryFirstPageStatus,
    isProgrammaticTargetReached,
    releaseProgrammaticScrollLock,
  ]);

  const handleCategoryBarClick = React.useCallback(
    (item: { id: string }) => {
      if (!isCatalogViewEnabled || !categoryIds.includes(item.id)) {
        return;
      }

      if (
        activeCategoryIdRef.current === item.id &&
        isCategoryActiveAtLine(item.id)
      ) {
        resetProgrammaticScrollState();
        scheduleSyncActiveCategoryByViewport();
        return;
      }

      activeCategoryIdRef.current = item.id;
      setActiveCategoryId(item.id);
      pendingScrollCategoryIdRef.current = item.id;
      setPendingScrollCategoryId(item.id);
      programmaticScrollTargetIdRef.current = item.id;
      programmaticScrollSettleAttemptsRef.current = 0;
      programmaticScrollLockRef.current = true;
      setIsProgrammaticScrollLocked(true);
      startProgrammaticScrollFpsTracking();

      const hasWarmData = hasLoadedCategoryFirstPage(item.id);
      setProgrammaticScrollTargetId(hasWarmData ? item.id : null);
      programmaticScrollRequiresFirstPageRef.current = !hasWarmData;

      if (!hasWarmData) {
        void prefetchCategoryFirstPage({
          categoryId: item.id,
          pageSize,
          queryClient,
        })
          .catch(() => undefined);

        scheduleSyncActiveCategoryByViewport();
        scheduleProgrammaticScrollSettle();
        return;
      }

      const alignResult = alignCategorySection(
        item.id,
        "auto",
        PROGRAMMATIC_SCROLL_ALIGN_TOLERANCE_PX,
      );

      if (!alignResult.found) {
        resetProgrammaticScrollState();
        scheduleSyncActiveCategoryByViewport();
        return;
      }

      scheduleSyncActiveCategoryByViewport();
      scheduleProgrammaticScrollSettle();
    },
    [
      alignCategorySection,
      categoryIds,
      hasLoadedCategoryFirstPage,
      isCatalogViewEnabled,
      isCategoryActiveAtLine,
      pageSize,
      queryClient,
      resetProgrammaticScrollState,
      scheduleProgrammaticScrollSettle,
      scheduleSyncActiveCategoryByViewport,
      startProgrammaticScrollFpsTracking,
    ],
  );

  React.useEffect(() => {
    if (!isProgrammaticScrollLocked || !isCatalogTab) {
      return;
    }

    const handleProgrammaticScroll = () => {
      scheduleProgrammaticScrollSettle();
    };

    window.addEventListener("scroll", handleProgrammaticScroll, { passive: true });
    window.addEventListener("resize", handleProgrammaticScroll);

    programmaticScrollSettleAttemptsRef.current = 0;
    scheduleProgrammaticScrollSettle();

    return () => {
      window.removeEventListener("scroll", handleProgrammaticScroll);
      window.removeEventListener("resize", handleProgrammaticScroll);
      clearProgrammaticScrollSettle();
      clearProgrammaticScrollFpsTracking();
    };
  }, [
    clearProgrammaticScrollFpsTracking,
    clearProgrammaticScrollSettle,
    isCatalogTab,
    isProgrammaticScrollLocked,
    scheduleProgrammaticScrollSettle,
  ]);

  React.useEffect(() => {
    if (!isProgrammaticScrollLocked || isCatalogTab) {
      return;
    }

    resetProgrammaticScrollState();
  }, [isCatalogTab, isProgrammaticScrollLocked, resetProgrammaticScrollState]);

  React.useEffect(() => {
    return () => {
      clearProgrammaticScrollSettle();
      clearProgrammaticScrollFpsTracking();
      if (syncActiveCategoryRafRef.current !== null) {
        window.cancelAnimationFrame(syncActiveCategoryRafRef.current);
        syncActiveCategoryRafRef.current = null;
      }
    };
  }, [clearProgrammaticScrollFpsTracking, clearProgrammaticScrollSettle]);

  return {
    activeCategoryId,
    isProgrammaticScroll: isProgrammaticScrollLocked,
    programmaticScrollTargetId,
    handleCategoryBarClick,
  };
}
