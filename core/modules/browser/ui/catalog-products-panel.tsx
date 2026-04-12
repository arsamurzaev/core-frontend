"use client";

import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import {
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  useProductCardViewMode,
} from "@/core/modules/product/model/use-product-card-view-mode";
import {
  CategoryProducts,
  UNCATEGORIZED_PRODUCTS_SECTION_ID,
  UncategorizedProducts,
} from "@/core/widgets/category-products/ui/category-products";
import { FilterProducts } from "@/core/widgets/filter-products/ui/filter-products";
import type { CategoryDto } from "@/shared/api/generated/react-query";
import type { CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";
import { getCategorySectionId } from "../model/category-scroll";

interface CatalogProductsPanelProps {
  className?: string;
  contentClassName?: string;
  collapsed?: boolean;
  categories: CategoryDto[];
  isCategoriesLoading: boolean;
  isFilterActive: boolean;
  queryState: CatalogFilterQueryState;
  activeCategoryId: string | null;
  isProgrammaticScroll: boolean;
  programmaticScrollTargetId: string | null;
  loadingSectionsCount?: number;
}

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

export const CatalogProductsPanel: React.FC<CatalogProductsPanelProps> = ({
  className,
  contentClassName,
  collapsed = false,
  categories,
  isCategoriesLoading,
  isFilterActive,
  queryState,
  activeCategoryId,
  isProgrammaticScroll,
  programmaticScrollTargetId,
  loadingSectionsCount = 3,
}) => {
  const shouldShowLoading =
    !isFilterActive && isCategoriesLoading && categories.length === 0;

  return (
    <div className={className}>
      <div className={cn(contentClassName, collapsed && "h-0")}>
        {isFilterActive ? (
          <FilterProducts queryState={queryState} />
        ) : shouldShowLoading ? (
          Array.from({ length: loadingSectionsCount }).map((_, index) => (
            <CategoryProductsSectionSkeleton
              key={`category-products-loading-${index}`}
            />
          ))
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
    </div>
  );
};
