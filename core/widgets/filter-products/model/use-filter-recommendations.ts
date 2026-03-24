"use client";

import {
  FILTER_PRODUCTS_PAGE_SIZE,
  buildFilterRequestParams,
  createDeterministicSeed,
} from "@/core/widgets/filter-products/model/filter-products";
import {
  type CatalogFilterQueryState,
  hasActiveCatalogFilters,
} from "@/shared/lib/catalog-filter-query";
import {
  type ProductControllerGetRecommendationsInfiniteParams,
  type ProductInfinitePageDto,
  productControllerGetRecommendationsInfinite,
} from "@/shared/api/generated";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";

interface RecommendationPageParam {
  cursor?: string;
  seed: string;
}

interface UseFilterRecommendationsParams {
  queryState: CatalogFilterQueryState;
}

export function useFilterRecommendations({
  queryState,
}: UseFilterRecommendationsParams) {
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const requestParams =
    React.useMemo<ProductControllerGetRecommendationsInfiniteParams>(
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
  const isEnabled = React.useMemo(
    () => hasActiveCatalogFilters(queryState),
    [queryState],
  );

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: [
        "filter-recommendations-infinite",
        requestParams,
        deterministicSeed,
        FILTER_PRODUCTS_PAGE_SIZE,
      ],
      queryFn: ({ pageParam }) => {
        const typedPageParam = pageParam as RecommendationPageParam;

        return productControllerGetRecommendationsInfinite({
          ...requestParams,
          cursor: typedPageParam.cursor,
          seed: typedPageParam.seed,
        });
      },
      initialPageParam: {
        cursor: undefined,
        seed: deterministicSeed,
      } as RecommendationPageParam,
      getNextPageParam: (
        lastPage: ProductInfinitePageDto,
        _allPages,
        lastPageParam,
      ) => {
        if (!lastPage.nextCursor) {
          return undefined;
        }

        const previousPageParam = lastPageParam as RecommendationPageParam;
        return {
          cursor: lastPage.nextCursor,
          seed: lastPage.seed ?? previousPageParam.seed,
        } as RecommendationPageParam;
      },
      enabled: isEnabled,
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

  return {
    isEnabled,
    isFetchingNextPage,
    isLoading,
    loadMoreRef,
    products,
  };
}
