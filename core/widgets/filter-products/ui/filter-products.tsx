"use client";

import { ProductCard } from "@/core/modules/product/entities/product-card";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import {
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  useProductCardViewMode,
} from "@/core/modules/product/model/use-product-card-view-mode";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import {
  DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
  DETAILED_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT,
  GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
  GRID_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT,
} from "@/core/widgets/filter-products/model/filter-products";
import { useFilterProducts } from "@/core/widgets/filter-products/model/use-filter-products";
import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import React from "react";

interface FilterProductsProps {
  className?: string;
  queryState: CatalogFilterQueryState;
}

function createSkeletonKeys(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

export const FilterProducts: React.FC<FilterProductsProps> = ({
  className,
  queryState,
}) => {
  const { isDetailed } = useProductCardViewMode();
  const { isFetchingNextPage, isLoading, loadMoreRef, products } =
    useFilterProducts({
      queryState,
    });
  const listClassName = React.useMemo(
    () =>
      isDetailed
        ? PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME
        : PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
    [isDetailed],
  );
  const initialSkeletonKeys = React.useMemo(
    () =>
      createSkeletonKeys(
        isDetailed
          ? DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT
          : GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
      ),
    [isDetailed],
  );
  const nextPageSkeletonKeys = React.useMemo(
    () =>
      createSkeletonKeys(
        isDetailed
          ? DETAILED_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT
          : GRID_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT,
      ),
    [isDetailed],
  );

  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="pl-1 text-left text-xl font-bold">Результаты фильтра</h2>

      <ul className={listClassName}>
        {isLoading &&
          initialSkeletonKeys.map((index) => (
            <ProductCardSkeleton
              key={`filter-initial-${index}`}
              isDetailed={isDetailed}
            />
          ))}
        {!isLoading &&
          products.map((product) => (
            <article key={product.id} className="relative">
              <ProductLink slug={product.slug} className="block h-full">
                <ProductCard
                  data={product}
                  isDetailed={isDetailed}
                  className={cn("h-full", isDetailed && "min-h-[160px]")}
                />
              </ProductLink>
              <EditProductCardAction productId={product.id} />
            </article>
          ))}
        {isFetchingNextPage &&
          nextPageSkeletonKeys.map((index) => (
            <ProductCardSkeleton
              key={`filter-next-${index}`}
              isDetailed={isDetailed}
            />
          ))}
      </ul>

      {!isLoading && products.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">
          По вашему запросу ничего не найдено
        </p>
      ) : null}

      <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
    </div>
  );
};
