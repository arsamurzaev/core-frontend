"use client";

import { useActiveCategoryIntersection } from "@/core/modules/browser/model/use-active-category-intersection";
import { useBrowserQueryState } from "@/core/modules/browser/model/use-browser-query-state";
import { useCategoryClickActivationDelay } from "@/core/modules/browser/model/use-category-click-activation-delay";
import { CatalogProductsPanel } from "@/core/modules/browser/ui/catalog-products-panel";
import { CategoryBarList } from "@/core/widgets/filter-bar/ui/category-bar-list";
import {
  type CategoryDto,
  useCategoryControllerGetAll,
} from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import React from "react";
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
  const { activeCategoryId } = useActiveCategoryIntersection({
    categories,
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
      items={categories}
      isLoading={categoriesQuery.isLoading}
      activeCategoryId={visibleActiveCategoryId}
      onCategoryClick={categoryClickActivation.handleCategoryClick}
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
