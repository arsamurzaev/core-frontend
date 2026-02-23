"use client";

import { FilterBar } from "@/core/widgets/filter-bar/ui/filter-bar";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

interface BrowserProps {
  className?: string;
}

interface TabContentSkeletonProps {
  title: string;
}

const TabContentSkeleton: React.FC<TabContentSkeletonProps> = ({ title }) => {
  return (
    <section className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2 rounded-md border p-2.5">
            <Skeleton className="aspect-[3/4] w-full rounded-md" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  );
};

export const Browser: React.FC<BrowserProps> = ({ className }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const handleFilterToggle = React.useCallback(() => {
    const nextState: CatalogFilterQueryState = isFilterActive
      ? clearCatalogFilterState(queryState)
      : activateCatalogFilterState(queryState);
    const nextParams = applyCatalogFilterQueryState(searchParams, nextState);
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [isFilterActive, pathname, queryState, router, searchParams]);

  return (
    <section
      id="scroll-tab-element"
      className={cn("space-y-4 rounded-xl p-3", className)}
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

        <FilterBar />
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
            <div className="w-1/2 shrink-0 h-[200vh]"></div>
            <div className="w-1/2 shrink-0"></div>
          </div>
        </div>
      </Tabs>
    </section>
  );
};
