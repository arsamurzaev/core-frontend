"use client";

import { ProductCard } from "@/core/modules/product/entities/product-card";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import {
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  useProductCardViewMode,
} from "@/core/modules/product/model/use-product-card-view-mode";
import { isMoySkladProduct } from "@/core/modules/product/model/moysklad-product";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import {
  DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
  DETAILED_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT,
  GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
  GRID_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT,
} from "@/core/widgets/filter-products/model/filter-products";
import { useFilterRecommendations } from "@/core/widgets/filter-products/model/use-filter-recommendations";
import { ToggleProductPopularAction } from "@/core/modules/product/actions/ui/toggle-product-popular-action";
import { useFilterProducts } from "@/core/widgets/filter-products/model/use-filter-products";
import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import { useSession } from "@/shared/providers/session-provider";
import React from "react";

interface FilterProductsProps {
  className?: string;
  queryState: CatalogFilterQueryState;
}

function createSkeletonKeys(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

interface FilterProductListSectionProps {
  emptyText: string;
  heading: string;
  isDetailed: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  products: Array<{
    id: string;
    slug: string;
  } & React.ComponentProps<typeof ProductCard>["data"]>;
}

const FilterProductListSection: React.FC<FilterProductListSectionProps> = ({
  emptyText,
  heading,
  isDetailed,
  isFetchingNextPage,
  isLoading,
  loadMoreRef,
  products,
}) => {
  const { isAuthenticated } = useSession();
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
    <div className="space-y-6">
      <h2 className="pl-1 text-left text-xl font-bold">{heading}</h2>

      <ul className={listClassName}>
        {isLoading &&
          initialSkeletonKeys.map((index) => (
            <ProductCardSkeleton
              key={`${heading}-initial-${index}`}
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
                  isVisiblePrice={isAuthenticated}
                  footerAction={
                    isAuthenticated ? (
                      <ToggleProductPopularAction
                        productId={product.id}
                        isPopular={Boolean(product.isPopular)}
                      />
                    ) : undefined
                  }
                />
              </ProductLink>
              <EditProductCardAction
                isMoySkladLinked={isMoySkladProduct(product)}
                productId={product.id}
                status={product.status}
              />
            </article>
          ))}
        {isFetchingNextPage &&
          nextPageSkeletonKeys.map((index) => (
            <ProductCardSkeleton
              key={`${heading}-next-${index}`}
              isDetailed={isDetailed}
            />
          ))}
      </ul>

      {!isLoading && products.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">{emptyText}</p>
      ) : null}

      <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
    </div>
  );
};

export const FilterProducts: React.FC<FilterProductsProps> = ({
  className,
  queryState,
}) => {
  const { isDetailed } = useProductCardViewMode();
  const { isFetchingNextPage, isLoading, loadMoreRef, products } =
    useFilterProducts({
      queryState,
    });
  const {
    isFetchingNextPage: isFetchingRecommendationsNextPage,
    isLoading: isRecommendationsLoading,
    loadMoreRef: recommendationsLoadMoreRef,
    products: recommendedProducts,
  } = useFilterRecommendations({
    queryState,
  });

  return (
    <div className={cn("space-y-6", className)}>
      <FilterProductListSection
        heading="Результаты фильтра"
        emptyText="По вашему запросу ничего не найдено"
        isDetailed={isDetailed}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        loadMoreRef={loadMoreRef}
        products={products}
      />
      <FilterProductListSection
        heading="Рекомендации"
        emptyText="Рекомендации не найдены"
        isDetailed={isDetailed}
        isFetchingNextPage={isFetchingRecommendationsNextPage}
        isLoading={isRecommendationsLoading}
        loadMoreRef={recommendationsLoadMoreRef}
        products={recommendedProducts}
      />
    </div>
  );
};
