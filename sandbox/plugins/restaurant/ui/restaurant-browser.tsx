"use client";

import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import {
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  useProductCardViewMode,
} from "@/core/modules/product/model/use-product-card-view-mode";
import {
  CATEGORY_PRODUCTS_PAGE_SIZE,
  CategoryProducts,
  UNCATEGORIZED_PRODUCTS_SECTION_ID,
  UncategorizedProducts,
} from "@/core/widgets/category-products/ui/category-products";
import { CategoryBarList } from "@/core/widgets/filter-bar/ui/category-bar-list";
import { FilterProducts } from "@/core/widgets/filter-products/ui/filter-products";
import {
  type CategoryDto,
  useCategoryControllerGetAll,
} from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";
import { getCategorySectionId } from "@/core/views/home/model/category-scroll";
import { useBrowserQueryState } from "@/core/views/home/model/use-browser-query-state";
import { useCategoryScrollNavigation } from "@/core/views/home/model/use-category-scroll-navigation";
import { RestaurantFilterBar } from "./restaurant-filter-bar";

interface RestaurantBrowserProps {
  className?: string;
  initialCategories?: CategoryDto[];
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
    isProgrammaticScroll,
    programmaticScrollTargetId,
    handleCategoryBarClick,
  } = useCategoryScrollNavigation({
    categories,
    isCatalogTab: true,
    isFilterActive,
    pageSize: CATEGORY_PRODUCTS_PAGE_SIZE,
  });

  const shouldShowLoading = React.useMemo(
    () =>
      !isFilterActive && categoriesQuery.isLoading && categories.length === 0,
    [categories.length, categoriesQuery.isLoading, isFilterActive],
  );

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

      <div className="m-1 space-y-7.5">
        {isFilterActive ? (
          <FilterProducts queryState={queryState} />
        ) : shouldShowLoading ? (
          Array.from({ length: CATEGORY_LOADING_SECTIONS_COUNT }).map(
            (_, index) => (
              <CategoryProductsSectionSkeleton
                key={`restaurant-loading-${index}`}
              />
            ),
          )
        ) : (
          <>
            {categories.map((category, index) => (
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
            ))}
            <UncategorizedProducts
              sectionId={UNCATEGORIZED_PRODUCTS_SECTION_ID}
              initiallyActivated={categories.length === 0}
            />
          </>
        )}
      </div>
    </section>
  );
};
