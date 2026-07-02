"use client";

import type { BrowserSlotProps } from "@/core/catalog-runtime/contracts";
import {
  useActiveCategoryIntersection,
  useBrowserQueryState,
  useCategoryClickActivationDelay,
} from "@/core/modules/browser";
import { buildCategoryDisplayList } from "@/core/modules/category";
import { CatalogProductsPanel } from "@/core/widgets/catalog-products/ui/catalog-products-panel";
import { CategoryBarList } from "@/core/widgets/filter-bar/ui/category-bar-list";
import { useCategoryControllerGetAll } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import React from "react";
import { RestaurantFilterBar } from "./restaurant-filter-bar";

const CATEGORY_LOADING_SECTIONS_COUNT = 3;

export const RestaurantBrowser: React.FC<BrowserSlotProps> = ({
  className,
  initialCategories = [],
}) => {
  const { queryState, isFilterActive, handleFilterToggle } =
    useBrowserQueryState();
  const categoriesQuery = useCategoryControllerGetAll(undefined, {
    query: {
      initialData: initialCategories,
      staleTime: 60_000,
    },
  });
  const categories = React.useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const isCategoriesInitialLoading =
    categories.length === 0 &&
    (categoriesQuery.isLoading || categoriesQuery.isFetching);
  const storefrontCategories = React.useMemo(
    () => buildCategoryDisplayList(categories, { hideEmpty: true }),
    [categories],
  );
  const { activeCategoryId } = useActiveCategoryIntersection({
    categories: storefrontCategories,
    enabled: !isFilterActive,
  });
  const categoryClickActivation = useCategoryClickActivationDelay({
    enabled: !isFilterActive,
  });
  const visibleActiveCategoryId =
    categoryClickActivation.activationBlockedCategoryId ??
    categoryClickActivation.forceActivatedCategoryId ??
    activeCategoryId;
  const bottomRow = !isFilterActive ? (
    <CategoryBarList
      items={storefrontCategories}
      isLoading={isCategoriesInitialLoading}
      activeCategoryId={visibleActiveCategoryId}
      onCategoryClick={categoryClickActivation.handleCategoryClick}
    />
  ) : null;

  return (
    <section
      id="scroll-tab-element"
      className={cn("space-y-4 rounded-panel", className)}
    >
      <RestaurantFilterBar
        searchTerm={queryState.searchTerm}
        onFilterToggle={handleFilterToggle}
        bottomRow={bottomRow}
      />

      <CatalogProductsPanel
        className="m-1 space-y-7.5"
        categories={storefrontCategories}
        isCategoriesLoading={isCategoriesInitialLoading}
        isFilterActive={isFilterActive}
        queryState={queryState}
        activationBlockedCategoryId={
          categoryClickActivation.activationBlockedCategoryId
        }
        forceActivatedCategoryId={
          categoryClickActivation.forceActivatedCategoryId
        }
        loadingSectionsCount={CATEGORY_LOADING_SECTIONS_COUNT}
      />
    </section>
  );
};
