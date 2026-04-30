"use client";

import { CatalogProductsPanel } from "@/core/modules/browser/ui/catalog-products-panel";
import { CategoryBarList } from "@/core/widgets/filter-bar/ui/category-bar-list";
import {
  type CategoryDto,
  useCategoryControllerGetAll,
} from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import React from "react";
import { useBrowserQueryState } from "@/core/modules/browser/model/use-browser-query-state";
import { useCategoryScrollNavigation } from "@/core/modules/browser/model/use-category-scroll-navigation";
import { RestaurantFilterBar } from "./restaurant-filter-bar";

interface RestaurantBrowserProps {
  className?: string;
  initialCategories?: CategoryDto[];
}

const CATEGORY_LOADING_SECTIONS_COUNT = 3;

export const RestaurantBrowser: React.FC<RestaurantBrowserProps> = ({
  className,
  initialCategories = [],
}) => {
  const { queryState, isFilterActive, handleFilterToggle } =
    useBrowserQueryState();

  const categoriesQuery = useCategoryControllerGetAll({
    query: {
      initialData: initialCategories,
      staleTime: 60_000,
    },
  });
  const categories = React.useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  const {
    activeCategoryId,
    isCategoryLoadingBlocked,
    loadAllowedCategoryId,
    handleCategoryBarClick,
    handleCategoryFirstPageLoaded,
  } = useCategoryScrollNavigation({
    categories,
    isCatalogTab: true,
    isFilterActive,
  });

  const bottomRow = !isFilterActive ? (
    <CategoryBarList
      items={categories}
      isLoading={categoriesQuery.isLoading}
      activeCategoryId={activeCategoryId}
      onCategoryClick={handleCategoryBarClick}
    />
  ) : null;

  return (
    <section
      id="scroll-tab-element"
      className={cn("space-y-4 rounded-xl", className)}
    >
      <RestaurantFilterBar
        searchTerm={queryState.searchTerm}
        onFilterToggle={handleFilterToggle}
        bottomRow={bottomRow}
      />

      <CatalogProductsPanel
        className="m-1 space-y-7.5"
        categories={categories}
        isCategoriesLoading={categoriesQuery.isLoading}
        isFilterActive={isFilterActive}
        queryState={queryState}
        isCategoryLoadingBlocked={isCategoryLoadingBlocked}
        loadAllowedCategoryId={loadAllowedCategoryId}
        onCategoryFirstPageLoaded={handleCategoryFirstPageLoaded}
        loadingSectionsCount={CATEGORY_LOADING_SECTIONS_COUNT}
      />
    </section>
  );
};
