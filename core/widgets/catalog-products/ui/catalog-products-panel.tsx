"use client";

import {
  CATALOG_PRODUCTS_SECTION_ID,
  CATEGORY_SECTION_SCROLL_MARGIN_TOP,
} from "@/core/modules/browser";
import { CategoryProducts } from "@/core/widgets/category-products";
import { CatalogProductsSectionsSkeleton } from "@/core/widgets/catalog-products/ui/catalog-products-skeleton";
import { FilterProducts } from "@/core/widgets/filter-products";
import type { CategoryDto } from "@/shared/api/generated/react-query";
import type { CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import React from "react";

export interface CatalogProductsPanelProps {
  className?: string;
  contentClassName?: string;
  collapsed?: boolean;
  categories: CategoryDto[];
  isCategoriesLoading: boolean;
  isFilterActive: boolean;
  queryState: CatalogFilterQueryState;
  activationBlockedCategoryId?: string | null;
  forceActivatedCategoryId?: string | null;
  loadingSectionsCount?: number;
}

export const CatalogProductsPanel: React.FC<CatalogProductsPanelProps> = ({
  className,
  contentClassName,
  collapsed = false,
  categories,
  isCategoriesLoading,
  isFilterActive,
  queryState,
  activationBlockedCategoryId = null,
  forceActivatedCategoryId = null,
  loadingSectionsCount = 3,
}) => {
  const shouldShowLoading =
    !isFilterActive && isCategoriesLoading && categories.length === 0;

  return (
    <div className={className}>
      <div
        id={!isFilterActive ? CATALOG_PRODUCTS_SECTION_ID : undefined}
        className={cn(
          contentClassName,
          shouldShowLoading && "min-h-[760px]",
          collapsed && "h-0",
        )}
        style={
          !isFilterActive
            ? { scrollMarginTop: CATEGORY_SECTION_SCROLL_MARGIN_TOP }
            : undefined
        }
      >
        {isFilterActive ? (
          <FilterProducts queryState={queryState} />
        ) : shouldShowLoading ? (
          <CatalogProductsSectionsSkeleton
            sectionsCount={loadingSectionsCount}
          />
        ) : (
          <CategoryProducts
            categories={categories}
            activationBlockedCategoryId={activationBlockedCategoryId}
            forceActivatedCategoryId={forceActivatedCategoryId}
          />
        )}
      </div>
    </div>
  );
};
