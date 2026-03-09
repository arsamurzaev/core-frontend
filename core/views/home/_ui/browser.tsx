"use client";

import { CategoryCard } from "@/core/modules/category/ui/category-card";
import {
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  useProductCardViewMode,
} from "@/core/modules/product/model/use-product-card-view-mode";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import { CatalogFilterDrawer } from "@/core/widgets/catalog-filter/ui/catalog-filter-drawer";
import {
  CATEGORY_PRODUCTS_PAGE_SIZE,
  CategoryProducts,
} from "@/core/widgets/category-products/ui/category-products";
import { CategoryBarList } from "@/core/widgets/filter-bar/ui/category-bar-list";
import { FilterBar } from "@/core/widgets/filter-bar/ui/filter-bar";
import { FilterProducts } from "@/core/widgets/filter-products/ui/filter-products";
import { useCategoryControllerGetAll } from "@/shared/api/generated";
import {
  getCatalogActiveFiltersCount,
  type CatalogFilterQueryState,
} from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import React from "react";
import { getCategorySectionId } from "../model/category-scroll";
import { useBrowserQueryState } from "../model/use-browser-query-state";
import { useCategoryScrollNavigation } from "../model/use-category-scroll-navigation";

interface BrowserProps {
  className?: string;
}

const CATEGORY_LOADING_SECTIONS_COUNT = 3;
const CATEGORY_LOADING_PRODUCTS_COUNT = 4;

const CategoryProductsSectionSkeleton = () => {
  const { isDetailed } = useProductCardViewMode();
  const listClassName = isDetailed
    ? PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME
    : PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME;

  return (
    <div className="space-y-7.5">
      <Skeleton className="h-7 w-40" />
      <div className={listClassName}>
        {Array.from({ length: CATEGORY_LOADING_PRODUCTS_COUNT }).map(
          (_, index) => (
            <ProductCardSkeleton key={index} isDetailed={isDetailed} />
          ),
        )}
      </div>
    </div>
  );
};

interface CatalogTabsToggleProps {
  tab: CatalogFilterQueryState["tab"];
}

const CatalogTabsToggle: React.FC<CatalogTabsToggleProps> = ({ tab }) => {
  return (
    <TabsList className="relative grid h-10 w-full grid-cols-2 rounded-full p-0.5">
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-0 w-1/2 rounded-full bg-background shadow-custom transition-transform duration-300 ease-out",
          tab === "categories" && "translate-x-full",
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
  );
};

export const Browser: React.FC<BrowserProps> = ({ className }) => {
  const {
    queryState,
    isFilterActive,
    swipeTranslatePercent,
    handleTabChange,
    handleFilterToggle,
  } = useBrowserQueryState();
  const categoriesQuery = useCategoryControllerGetAll();
  const categories = React.useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const {
    activeCategoryId,
    isProgrammaticScroll,
    programmaticScrollTargetId,
    handleCategoryBarClick,
  } = useCategoryScrollNavigation({
    categories,
    isCatalogTab: queryState.tab === "catalog",
    isFilterActive,
    pageSize: CATEGORY_PRODUCTS_PAGE_SIZE,
  });
  const shouldShowCategoryProductsLoading = React.useMemo(
    () =>
      !isFilterActive && categoriesQuery.isLoading && categories.length === 0,
    [categories.length, categoriesQuery.isLoading, isFilterActive],
  );
  const activeFiltersCount = React.useMemo(
    () => getCatalogActiveFiltersCount(queryState),
    [queryState],
  );

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
        <CatalogTabsToggle tab={queryState.tab} />

        <FilterBar
          tab={<CatalogTabsToggle tab={queryState.tab} />}
          searchTerm={queryState.searchTerm}
          filterAction={
            <CatalogFilterDrawer
              queryState={queryState}
              categories={categories}
              isCategoriesLoading={categoriesQuery.isLoading}
              activeFiltersCount={activeFiltersCount}
              onApply={handleFilterToggle}
            />
          }
          onFilterToggle={handleFilterToggle}
          bottomRow={
            queryState.tab === "catalog" && !isFilterActive ? (
              <CategoryBarList
                items={categories}
                isLoading={categoriesQuery.isLoading}
                activeCategoryId={activeCategoryId}
                onCategoryClick={handleCategoryBarClick}
              />
            ) : null
          }
        />

        <div className="overflow-hidden rounded-lg">
          <div
            className="flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${swipeTranslatePercent}%)` }}
          >
            <div className="w-1/2 shrink-0 space-y-7.5">
              <div className="m-1">
                {isFilterActive ? (
                  <FilterProducts queryState={queryState} />
                ) : shouldShowCategoryProductsLoading ? (
                  Array.from({
                    length: CATEGORY_LOADING_SECTIONS_COUNT,
                  }).map((_, index) => (
                    <CategoryProductsSectionSkeleton
                      key={`category-products-loading-${index}`}
                    />
                  ))
                ) : (
                  categories.map((category, index) => (
                    <CategoryProducts
                      key={category.id}
                      category={category}
                      sectionId={getCategorySectionId(category.id)}
                      initiallyActivated={index === 0}
                      forceActivation={
                        programmaticScrollTargetId === category.id ||
                        activeCategoryId === category.id
                      }
                      allowActivation={
                        !isProgrammaticScroll ||
                        programmaticScrollTargetId === category.id
                      }
                      allowLoadMore={!isProgrammaticScroll}
                    />
                  ))
                )}
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
