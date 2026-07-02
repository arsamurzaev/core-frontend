"use client";

import type { BrowserSlotProps } from "@/core/catalog-runtime/slot-contracts";
import {
  useActiveCategoryIntersection,
  useBrowserQueryState,
  useCategoryClickActivationDelay,
} from "@/core/modules/browser";
import { buildCategoryDisplayList } from "@/core/modules/category";
import { CatalogProductsPanel } from "@/core/widgets/catalog-products";
import { CategoryBarList } from "@/core/widgets/filter-bar";
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
  const storefrontCategories = React.useMemo(
    () => buildCategoryDisplayList(initialCategories, { hideEmpty: true }),
    [initialCategories],
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
      isLoading={false}
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
        isCategoriesLoading={false}
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
