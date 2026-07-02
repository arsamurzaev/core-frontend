"use client";

import {
  ProductCardSkeleton,
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  useProductCardViewMode,
} from "@/core/modules/product";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";

const GRID_LOADING_PRODUCTS_COUNT = 4;
const DETAILED_LOADING_PRODUCTS_COUNT = 2;
const MAX_LOADING_PRODUCTS_COUNT = 16;

interface CatalogProductsSectionSkeletonProps {
  className?: string;
  productCount?: number;
  showTitle?: boolean;
}

interface CatalogProductsSectionsSkeletonProps {
  className?: string;
  sectionsCount?: number;
}

export const CatalogProductsSectionSkeleton: React.FC<
  CatalogProductsSectionSkeletonProps
> = ({ className, productCount, showTitle = true }) => {
  const { isDetailed } = useProductCardViewMode();
  const listClassName = isDetailed
    ? PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME
    : PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME;
  const fallbackCount = isDetailed
    ? DETAILED_LOADING_PRODUCTS_COUNT
    : GRID_LOADING_PRODUCTS_COUNT;
  const requestedCount = productCount ?? fallbackCount;
  const skeletonCount = Math.min(
    MAX_LOADING_PRODUCTS_COUNT,
    Math.max(0, Math.floor(requestedCount)),
  );

  return (
    <div className={cn("space-y-4", className)}>
      {showTitle ? <Skeleton className="h-7 w-40 rounded-control" /> : null}
      <div className={listClassName}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductCardSkeleton
            key={`catalog-product-skeleton-${index}`}
            isDetailed={isDetailed}
          />
        ))}
      </div>
    </div>
  );
};

export const CatalogProductsSectionsSkeleton: React.FC<
  CatalogProductsSectionsSkeletonProps
> = ({ className, sectionsCount = 3 }) => {
  return (
    <div className={cn("space-y-7.5", className)}>
      {Array.from({ length: sectionsCount }).map((_, index) => (
        <CatalogProductsSectionSkeleton
          key={`catalog-products-section-skeleton-${index}`}
        />
      ))}
    </div>
  );
};
