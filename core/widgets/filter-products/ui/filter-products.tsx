"use client";

import {
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  useProductCardViewMode,
} from "@/core/modules/product/model/use-product-card-view-mode";
import { ProductCard } from "@/core/modules/product/entities/product-card";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import {
  ProductControllerGetInfiniteParams,
  ProductInfinitePageDto,
  productControllerGetInfinite,
} from "@/shared/api/generated";
import {
  type CatalogFilterQueryState,
  hasActiveCatalogFilters,
} from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";

interface FilterProductsProps {
  className?: string;
  queryState: CatalogFilterQueryState;
}

interface FilterProductsPageParam {
  cursor?: string;
  seed: string;
}

const FILTER_PRODUCTS_PAGE_SIZE = 24;
const GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT = 12;
const DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT = 6;
const GRID_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT = 4;
const DETAILED_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT = 3;

function normalizeString(value?: string): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseNumericString(value?: string): number | undefined {
  const normalized = normalizeString(value);
  if (!normalized) {
    return undefined;
  }

  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return numericValue;
}

function createDeterministicSeed(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }

  return `${hash.toString(36)}`;
}

function buildFilterRequestParams(
  queryState: CatalogFilterQueryState,
): ProductControllerGetInfiniteParams {
  const categories =
    queryState.categories.length > 0
      ? queryState.categories.join(",")
      : undefined;
  const brands =
    queryState.brands.length > 0 ? queryState.brands.join(",") : undefined;
  const searchTerm = normalizeString(queryState.searchTerm);
  const minPrice = parseNumericString(queryState.minPrice);
  const maxPrice = parseNumericString(queryState.maxPrice);

  return {
    categories,
    brands,
    searchTerm,
    isPopular: queryState.isPopular ? true : undefined,
    isDiscount: queryState.isDiscount ? true : undefined,
    minPrice,
    maxPrice,
    limit: FILTER_PRODUCTS_PAGE_SIZE,
  };
}

export const FilterProducts: React.FC<FilterProductsProps> = ({
  className,
  queryState,
}) => {
  const { isDetailed } = useProductCardViewMode();
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const requestParams = React.useMemo(
    () => buildFilterRequestParams(queryState),
    [queryState],
  );
  const filterSignature = React.useMemo(
    () => JSON.stringify(requestParams),
    [requestParams],
  );
  const deterministicSeed = React.useMemo(
    () => createDeterministicSeed(filterSignature),
    [filterSignature],
  );
  const listClassName = React.useMemo(
    () =>
      isDetailed
        ? PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME
        : PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
    [isDetailed],
  );
  const initialSkeletonKeys = React.useMemo(
    () =>
      Array.from(
        {
          length: isDetailed
            ? DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT
            : GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
        },
        (_, index) => index,
      ),
    [isDetailed],
  );
  const nextPageSkeletonKeys = React.useMemo(
    () =>
      Array.from(
        {
          length: isDetailed
            ? DETAILED_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT
            : GRID_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT,
        },
        (_, index) => index,
      ),
    [isDetailed],
  );

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: [
        "filter-products-infinite",
        requestParams,
        deterministicSeed,
        FILTER_PRODUCTS_PAGE_SIZE,
      ],
      queryFn: ({ pageParam }) => {
        const typedPageParam = pageParam as FilterProductsPageParam;
        return productControllerGetInfinite({
          ...requestParams,
          cursor: typedPageParam.cursor,
          seed: typedPageParam.seed,
        });
      },
      initialPageParam: {
        cursor: undefined,
        seed: deterministicSeed,
      } as FilterProductsPageParam,
      getNextPageParam: (
        lastPage: ProductInfinitePageDto,
        _allPages,
        lastPageParam,
      ) => {
        if (!lastPage.nextCursor) {
          return undefined;
        }

        const previousPageParam = lastPageParam as FilterProductsPageParam;
        return {
          cursor: lastPage.nextCursor,
          seed: lastPage.seed ?? previousPageParam.seed,
        } as FilterProductsPageParam;
      },
      enabled: hasActiveCatalogFilters(queryState),
    });
  const products = React.useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  React.useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const target = loadMoreRef.current;
    if (!target || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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
            <article key={product.id}>
              <ProductLink slug={product.slug} className="block h-full">
                <ProductCard
                  data={product}
                  isDetailed={isDetailed}
                  className={cn("h-full", isDetailed && "min-h-[160px]")}
                />
              </ProductLink>
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
