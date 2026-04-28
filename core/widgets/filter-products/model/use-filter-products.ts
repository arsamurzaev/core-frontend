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
  type ProductCardPageDto,
  type ProductControllerGetInfiniteCardsParams,
  productControllerGetInfiniteCards,
} from "@/shared/api/generated/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";

interface FilterProductsPageParam {
  cursor?: string;
  seed: string;
}

interface UseFilterProductsParams {
  queryState: CatalogFilterQueryState;
}

export function useFilterProducts({ queryState }: UseFilterProductsParams) {
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const requestParams = React.useMemo<ProductControllerGetInfiniteCardsParams>(
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
        "filter-products-infinite",
        requestParams,
        deterministicSeed,
        FILTER_PRODUCTS_PAGE_SIZE,
      ],
      queryFn: ({ pageParam }) => {
        const typedPageParam = pageParam as FilterProductsPageParam;

        return productControllerGetInfiniteCards({
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
        lastPage: ProductCardPageDto,
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
      { rootMargin: "900px 0px" },
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
