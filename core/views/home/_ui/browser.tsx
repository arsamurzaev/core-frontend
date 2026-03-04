"use client";

import { CategoryCard } from "@/core/modules/category/ui/category-card";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import {
  CategoryProducts,
  CATEGORY_PRODUCTS_PAGE_SIZE,
} from "@/core/widgets/category-products/ui/category-products";
import { CategoryBarList } from "@/core/widgets/filter-bar/ui/category-bar-list";
import { FilterBar } from "@/core/widgets/filter-bar/ui/filter-bar";
import {
  CategoryProductsPageDto,
  categoryControllerGetProductsByCategory,
  useCategoryControllerGetAll,
} from "@/shared/api/generated";
import {
  activateCatalogFilterState,
  applyCatalogFilterQueryState,
  clearCatalogFilterState,
  hasActiveCatalogFilters,
  parseCatalogFilterQueryState,
  type CatalogFilterQueryState,
} from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

interface BrowserProps {
  className?: string;
}

type CatalogFilterValuePatch = Partial<
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

const CategoryProductsSkeleton = () => {
  return (
    <div className="space-y-7.5">
      <Skeleton className="h-7 w-full" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(127px,1fr))] gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

const CATEGORY_SECTION_ID_PREFIX = "catalog-category-section";
const FILTER_BAR_SCROLL_OFFSET = 8;
const ACTIVE_CATEGORY_HYSTERESIS_PX = 12;
const PAGE_END_EPSILON_PX = 2;
const PROGRAMMATIC_SCROLL_SETTLE_DELAY_MS = 180;
const PROGRAMMATIC_SCROLL_ALIGN_TOLERANCE_PX = 8;
const PROGRAMMATIC_SCROLL_MAX_SETTLE_ATTEMPTS = 8;

function getCategorySectionId(categoryId: string): string {
  return `${CATEGORY_SECTION_ID_PREFIX}-${categoryId}`;
}

export const Browser: React.FC<BrowserProps> = ({ className }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const pathnameKey = pathname ?? "";
  const previousLocationRef = React.useRef<{
    pathname: string;
    query: string;
  } | null>(null);
  const activeCategoryIdRef = React.useRef<string | null>(null);
  const pendingScrollCategoryIdRef = React.useRef<string | null>(null);
  const syncActiveCategoryRafRef = React.useRef<number | null>(null);
  const programmaticScrollSettleTimerRef = React.useRef<number | null>(null);
  const programmaticScrollSettleAttemptsRef = React.useRef(0);
  const programmaticScrollTargetIdRef = React.useRef<string | null>(null);
  const programmaticScrollLockRef = React.useRef(false);
  const [isProgrammaticScrollLocked, setIsProgrammaticScrollLocked] =
    React.useState(false);
  const [programmaticScrollTargetId, setProgrammaticScrollTargetId] =
    React.useState<string | null>(null);
  const [pendingScrollCategoryId, setPendingScrollCategoryId] = React.useState<
    string | null
  >(null);
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(
    null,
  );

  const categoriesQuery = useCategoryControllerGetAll();
  const categories = React.useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const isProgrammaticScroll = isProgrammaticScrollLocked;

  const clearProgrammaticScrollSettle = React.useCallback(() => {
    if (programmaticScrollSettleTimerRef.current === null) {
      return;
    }

    window.clearTimeout(programmaticScrollSettleTimerRef.current);
    programmaticScrollSettleTimerRef.current = null;
  }, []);

  const resetProgrammaticScrollState = React.useCallback(() => {
    pendingScrollCategoryIdRef.current = null;
    setPendingScrollCategoryId(null);
    programmaticScrollTargetIdRef.current = null;
    setProgrammaticScrollTargetId(null);
    programmaticScrollSettleAttemptsRef.current = 0;
    programmaticScrollLockRef.current = false;
    setIsProgrammaticScrollLocked(false);
    clearProgrammaticScrollSettle();
  }, [clearProgrammaticScrollSettle]);

  React.useEffect(() => {
    activeCategoryIdRef.current = activeCategoryId;
  }, [activeCategoryId]);

  React.useEffect(() => {
    pendingScrollCategoryIdRef.current = pendingScrollCategoryId;
  }, [pendingScrollCategoryId]);

  const queryState = React.useMemo(
    () => parseCatalogFilterQueryState(searchParams),
    [searchParams],
  );
  const isFilterActive = React.useMemo(
    () => hasActiveCatalogFilters(queryState),
    [queryState],
  );
  const activePanelIndex = React.useMemo(() => {
    return queryState.tab === "categories" ? 1 : 0;
  }, [queryState.tab]);
  const swipeTranslatePercent = React.useMemo(
    () => activePanelIndex * 50,
    [activePanelIndex],
  );

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
    (categoryId: string, behavior: ScrollBehavior): boolean => {
      const target = document.getElementById(getCategorySectionId(categoryId));

      if (!target) {
        return false;
      }

      const deltaY = target.getBoundingClientRect().top - getActiveLineY();
      const nextTop = Math.max(window.scrollY + deltaY, 0);

      window.scrollTo({
        top: nextTop,
        behavior,
      });

      return true;
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
    if (queryState.tab !== "catalog" || isFilterActive || categories.length === 0) {
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
  }, [categories, getActiveLineY, isFilterActive, queryState.tab, resolveActiveCategoryByLine]);

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
    if (queryState.tab !== "catalog" || isFilterActive || categories.length === 0) {
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
  }, [
    categories.length,
    isFilterActive,
    queryState.tab,
    scheduleSyncActiveCategoryByViewport,
  ]);

  const releaseProgrammaticScrollLock = React.useCallback(
    (targetId: string) => {
      if (programmaticScrollTargetIdRef.current !== targetId) {
        return;
      }

      void alignCategorySection(targetId, "auto");

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

      void alignCategorySection(targetId, "auto");

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
        PROGRAMMATIC_SCROLL_SETTLE_DELAY_MS,
      );
    };

    programmaticScrollSettleTimerRef.current = window.setTimeout(
      runAttempt,
      PROGRAMMATIC_SCROLL_SETTLE_DELAY_MS,
    );
  }, [
    alignCategorySection,
    clearProgrammaticScrollSettle,
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

      const categoryQueryKey = [
        "category-products-infinite",
        item.id,
        CATEGORY_PRODUCTS_PAGE_SIZE,
      ] as const;
      const hasWarmData = queryClient.getQueryData(categoryQueryKey) !== undefined;

      if (!hasWarmData) {
        void queryClient.prefetchInfiniteQuery({
          queryKey: categoryQueryKey,
          queryFn: ({ pageParam }) =>
            categoryControllerGetProductsByCategory(item.id, {
              cursor: pageParam as string | undefined,
              limit: CATEGORY_PRODUCTS_PAGE_SIZE,
            }),
          initialPageParam: undefined as string | undefined,
          getNextPageParam: (lastPage: CategoryProductsPageDto) =>
            lastPage.nextCursor ?? undefined,
        });
      }

      const didStartScroll = alignCategorySection(item.id, "auto");

      if (!didStartScroll) {
        resetProgrammaticScrollState();
        scheduleSyncActiveCategoryByViewport();
        return;
      }

      scheduleSyncActiveCategoryByViewport();
      scheduleProgrammaticScrollSettle();
    },
    [
      alignCategorySection,
      queryClient,
      resetProgrammaticScrollState,
      scheduleProgrammaticScrollSettle,
      scheduleSyncActiveCategoryByViewport,
    ],
  );

  React.useEffect(() => {
    if (!isProgrammaticScrollLocked || queryState.tab !== "catalog") {
      return;
    }

    const handleProgrammaticScroll = () => {
      programmaticScrollSettleAttemptsRef.current = 0;
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
    };
  }, [
    clearProgrammaticScrollSettle,
    isProgrammaticScrollLocked,
    queryState.tab,
    scheduleProgrammaticScrollSettle,
  ]);

  React.useEffect(() => {
    if (!isProgrammaticScrollLocked || queryState.tab === "catalog") {
      return;
    }

    resetProgrammaticScrollState();
  }, [isProgrammaticScrollLocked, queryState.tab, resetProgrammaticScrollState]);

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

  return (
    <section
      id="scroll-tab-element"
      className={cn("space-y-4 rounded-xl", className)}
    >
      <Tabs
        value={queryState.tab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="relative grid h-10 w-full grid-cols-2 rounded-full p-0.5">
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 z-0 w-1/2 rounded-full bg-background shadow-custom transition-transform duration-300 ease-out",
              queryState.tab === "categories" && "translate-x-full",
            )}
          />
          <TabsTrigger
            value="catalog"
            className="relative z-10 rounded-full text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Каталог
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="relative z-10 rounded-full text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Категории
          </TabsTrigger>
        </TabsList>

        <FilterBar
          tab={
            <TabsList className="relative grid h-10 w-full grid-cols-2 rounded-full p-0.5">
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0 z-0 w-1/2 rounded-full bg-background shadow-custom transition-transform duration-300 ease-out",
                  queryState.tab === "categories" && "translate-x-full",
                )}
              />
              <TabsTrigger
                value="catalog"
                className="relative z-10 rounded-full text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Каталог
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="relative z-10 rounded-full text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Категории
              </TabsTrigger>
            </TabsList>
          }
          bottomRow={
            queryState.tab === "catalog" && !isFilterActive ? (
              <CategoryBarList
                items={categories}
                activeCategoryId={activeCategoryId}
                onCategoryClick={handleCategoryBarClick}
              />
            ) : null
          }
        />
        {/* <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            queryState.tab === "catalog"
              ? "max-h-12 opacity-100"
              : "pointer-events-none max-h-0 opacity-0",
          )}
        >
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant={isFilterActive ? "default" : "outline"}
              onClick={handleFilterToggle}
            >
              {isFilterActive ? "Reset Filter" : "Enable Filter"}
            </Button>
          </div>
        </div> */}

        <div className="overflow-hidden rounded-lg">
          <div
            className="flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${swipeTranslatePercent}%)` }}
          >
            <div className="w-1/2 shrink-0 space-y-7.5">
              <div className="m-1">
                {categoriesQuery.isLoading && <CategoryProductsSkeleton />}
                {isFilterActive
                  ? "Фильтр"
                  : categories.map((category) => (
                      <CategoryProducts
                        key={category.id}
                        category={category}
                        sectionId={getCategorySectionId(category.id)}
                        forceActivation={
                          programmaticScrollTargetId === category.id
                        }
                        allowActivation={
                          !isProgrammaticScroll ||
                          programmaticScrollTargetId === category.id
                        }
                        allowLoadMore={!isProgrammaticScroll}
                      />
                    ))}
              </div>
            </div>
            <div className="w-1/2 shrink-0">
              {categories.map((category, index) => (
                <CategoryCard
                  handleClick={() =>
                    handleFilterToggle({
                      categories: [category.id],
                    })
                  }
                  key={category.id}
                  data={category}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </Tabs>
    </section>
  );
};
