"use client";

import {
  CategoryDto,
  CategoryProductsPageDto,
  categoryControllerGetProductsByCategory,
} from "@/shared/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import {
  ACTIVE_CATEGORY_HYSTERESIS_PX,
  type AlignCategorySectionResult,
  clamp,
  FILTER_BAR_SCROLL_OFFSET,
  getCategorySectionId,
  PAGE_END_EPSILON_PX,
  PROGRAMMATIC_SCROLL_ALIGN_TOLERANCE_PX,
  PROGRAMMATIC_SCROLL_DEFAULT_SETTLE_DELAY_MS,
  PROGRAMMATIC_SCROLL_FRAME_DELAY_FACTOR,
  PROGRAMMATIC_SCROLL_FRAME_SAMPLE_SIZE,
  PROGRAMMATIC_SCROLL_MAX_SETTLE_ATTEMPTS,
  PROGRAMMATIC_SCROLL_MAX_SETTLE_DELAY_MS,
  PROGRAMMATIC_SCROLL_MIN_ALIGN_DELTA_PX,
  PROGRAMMATIC_SCROLL_MIN_SETTLE_DELAY_MS,
} from "./category-scroll";

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

type CategoryFirstPageState = "loaded" | "pending" | "error";

const PROGRAMMATIC_SCROLL_MAX_WAIT_FOR_DATA_ATTEMPTS = 48;

function getCategoryProductsQueryKey(categoryId: string, pageSize: number) {
  return ["category-products-infinite", categoryId, pageSize] as const;
}

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
      setActiveCategoryId(null);
      resetProgrammaticScrollState();
      return;
    }

    setActiveCategoryId((previousValue) => {
      if (
        previousValue &&
        categories.some((category) => category.id === previousValue)
      ) {
        return previousValue;
      }

      return categories[0].id;
    });

    setPendingScrollCategoryId((previousValue) => {
      if (
        previousValue &&
        categories.some((category) => category.id === previousValue)
      ) {
        return previousValue;
      }

      return null;
    });
  }, [categories, resetProgrammaticScrollState]);

  const getActiveLineY = React.useCallback((): number => {
    const filterBar = document.getElementById("catalog-filter-bar");
    return (filterBar?.getBoundingClientRect().bottom ?? 0) + FILTER_BAR_SCROLL_OFFSET;
  }, []);

  const alignCategorySection = React.useCallback(
    (
      categoryId: string,
      behavior: ScrollBehavior,
      minDeltaPx = 0,
    ): AlignCategorySectionResult => {
      const target = document.getElementById(getCategorySectionId(categoryId));

      if (!target) {
        return {
          found: false,
          didScroll: false,
          distanceToLine: Number.POSITIVE_INFINITY,
        };
      }

      const deltaY = target.getBoundingClientRect().top - getActiveLineY();
      const distanceToLine = Math.abs(deltaY);

      if (distanceToLine <= minDeltaPx) {
        return {
          found: true,
          didScroll: false,
          distanceToLine,
        };
      }

      const nextTop = Math.max(window.scrollY + deltaY, 0);
      const scrollDistance = Math.abs(nextTop - window.scrollY);

      if (scrollDistance <= minDeltaPx) {
        return {
          found: true,
          didScroll: false,
          distanceToLine,
        };
      }

      window.scrollTo({
        top: nextTop,
        behavior,
      });

      return {
        found: true,
        didScroll: true,
        distanceToLine,
      };
    },
    [getActiveLineY],
  );

  const resolveActiveCategoryByLine = React.useCallback(
    (lineY: number): string | null => {
      if (categories.length === 0) {
        return null;
      }

      const sections = categories
        .map((category) => {
          const element = document.getElementById(getCategorySectionId(category.id));

          if (!element) {
            return null;
          }

          return {
            id: category.id,
            rect: element.getBoundingClientRect(),
          };
        })
        .filter((section): section is { id: string; rect: DOMRect } => section !== null);

      if (sections.length === 0) {
        return activeCategoryIdRef.current ?? categories[0].id;
      }

      const firstSection = sections[0];
      const lastSection = sections[sections.length - 1];

      if (lineY < firstSection.rect.top) {
        return firstSection.id;
      }

      if (lineY >= lastSection.rect.bottom) {
        return lastSection.id;
      }

      const currentActiveId = activeCategoryIdRef.current;
      if (currentActiveId) {
        const currentSection = sections.find((section) => section.id === currentActiveId);

        if (currentSection) {
          const isWithinCurrentSection =
            currentSection.rect.top - ACTIVE_CATEGORY_HYSTERESIS_PX <= lineY &&
            currentSection.rect.bottom + ACTIVE_CATEGORY_HYSTERESIS_PX > lineY;

          if (isWithinCurrentSection) {
            return currentActiveId;
          }
        }
      }

      let candidateId = firstSection.id;
      for (const section of sections) {
        if (section.rect.top <= lineY) {
          candidateId = section.id;
          continue;
        }

        break;
      }

      return candidateId;
    },
    [categories],
  );

  const isProgrammaticTargetReached = React.useCallback(
    (targetId: string): boolean => {
      const lineY = getActiveLineY();
      const activeCategoryAtLine = resolveActiveCategoryByLine(lineY);

      if (activeCategoryAtLine === targetId) {
        return true;
      }

      const lastCategoryId = categories[categories.length - 1]?.id ?? null;
      if (targetId !== lastCategoryId) {
        return false;
      }

      const target = document.getElementById(getCategorySectionId(targetId));
      if (!target) {
        return false;
      }

      const isAtPageBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - PAGE_END_EPSILON_PX;

      if (!isAtPageBottom) {
        return false;
      }

      const targetRect = target.getBoundingClientRect();
      const distanceToLine = Math.abs(targetRect.top - lineY);
      const isTargetVisible =
        targetRect.top < window.innerHeight && targetRect.bottom > 0;

      return (
        distanceToLine <= PROGRAMMATIC_SCROLL_ALIGN_TOLERANCE_PX || isTargetVisible
      );
    },
    [categories, getActiveLineY, resolveActiveCategoryByLine],
  );

  const syncActiveCategoryByViewport = React.useCallback(() => {
    if (!isCatalogViewEnabled || categories.length === 0) {
      return;
    }

    const lineY = getActiveLineY();
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
  }, [categories.length, getActiveLineY, isCatalogViewEnabled, resolveActiveCategoryByLine]);

  const getCategoryFirstPageState = React.useCallback(
    (categoryId: string): CategoryFirstPageState => {
      const categoryQueryKey = getCategoryProductsQueryKey(categoryId, pageSize);
      const queryData = queryClient.getQueryData<{
        pages?: unknown[];
      }>(categoryQueryKey);

      if (Array.isArray(queryData?.pages) && queryData.pages.length > 0) {
        return "loaded";
      }

      const queryState = queryClient.getQueryState(categoryQueryKey);

      if (queryState?.status === "error") {
        return "error";
      }

      return "pending";
    },
    [pageSize, queryClient],
  );

  const hasCategoryFirstPageLoaded = React.useCallback(
    (categoryId: string): boolean => {
      return getCategoryFirstPageState(categoryId) === "loaded";
    },
    [getCategoryFirstPageState],
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

      void alignCategorySection(
        targetId,
        "auto",
        PROGRAMMATIC_SCROLL_MIN_ALIGN_DELTA_PX,
      );

      activeCategoryIdRef.current = targetId;
      setActiveCategoryId(targetId);
      resetProgrammaticScrollState();
      scheduleSyncActiveCategoryByViewport();
    },
    [
      alignCategorySection,
      resetProgrammaticScrollState,
      scheduleSyncActiveCategoryByViewport,
    ],
  );

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
        const firstPageState = getCategoryFirstPageState(targetId);

        if (firstPageState !== "loaded") {
          if (firstPageState === "error") {
            releaseProgrammaticScrollLock(targetId);
            return;
          }

          const alignResult = alignCategorySection(
            targetId,
            "auto",
            PROGRAMMATIC_SCROLL_ALIGN_TOLERANCE_PX,
          );

          if (!alignResult.found) {
            releaseProgrammaticScrollLock(targetId);
            return;
          }

          if (
            programmaticScrollSettleAttemptsRef.current >=
            PROGRAMMATIC_SCROLL_MAX_WAIT_FOR_DATA_ATTEMPTS
          ) {
            releaseProgrammaticScrollLock(targetId);
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
    clearProgrammaticScrollSettle,
    getProgrammaticScrollSettleDelay,
    getCategoryFirstPageState,
    isProgrammaticTargetReached,
    releaseProgrammaticScrollLock,
  ]);

  const handleCategoryBarClick = React.useCallback(
    (item: { id: string }) => {
      activeCategoryIdRef.current = item.id;
      setActiveCategoryId(item.id);
      pendingScrollCategoryIdRef.current = item.id;
      setPendingScrollCategoryId(item.id);
      programmaticScrollTargetIdRef.current = item.id;
      setProgrammaticScrollTargetId(item.id);
      programmaticScrollSettleAttemptsRef.current = 0;
      programmaticScrollLockRef.current = true;
      setIsProgrammaticScrollLocked(true);
      startProgrammaticScrollFpsTracking();

      const categoryQueryKey = getCategoryProductsQueryKey(item.id, pageSize);
      const hasWarmData = hasCategoryFirstPageLoaded(item.id);
      programmaticScrollRequiresFirstPageRef.current = !hasWarmData;

      if (!hasWarmData) {
        void queryClient
          .prefetchInfiniteQuery({
            queryKey: categoryQueryKey,
            queryFn: ({ pageParam }) =>
              categoryControllerGetProductsByCategory(item.id, {
                cursor: pageParam as string | undefined,
                limit: pageSize,
              }),
            initialPageParam: undefined as string | undefined,
            getNextPageParam: (lastPage: CategoryProductsPageDto) =>
              lastPage.nextCursor ?? undefined,
          })
          .catch(() => undefined);
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
      hasCategoryFirstPageLoaded,
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
