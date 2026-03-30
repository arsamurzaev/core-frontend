"use client";

import {
  CategoryProductsCardPageDto,
  categoryControllerGetProductCardsByCategory,
} from "@/shared/api/generated/react-query";
import { type QueryClient } from "@tanstack/react-query";

export type CategoryFirstPageState = "loaded" | "pending" | "error";

export function getCategoryProductsQueryKey(categoryId: string, pageSize: number) {
  return ["category-products-infinite", categoryId, pageSize] as const;
}

export function getCategoryFirstPageState(params: {
  categoryId: string;
  pageSize: number;
  queryClient: QueryClient;
}): CategoryFirstPageState {
  const { categoryId, pageSize, queryClient } = params;
  const categoryQueryKey = getCategoryProductsQueryKey(categoryId, pageSize);
  const queryData = queryClient.getQueryData<{
    pages?: unknown[];
  }>(categoryQueryKey);

  if (Array.isArray(queryData?.pages) && queryData.pages.length > 0) {
    return "loaded";
  }

  const queryState = queryClient.getQueryState(categoryQueryKey);
  if (queryState?.status === "error") {
    return "error";
  }

  return "pending";
}

export function hasCategoryFirstPageLoaded(params: {
  categoryId: string;
  pageSize: number;
  queryClient: QueryClient;
}): boolean {
  return getCategoryFirstPageState(params) === "loaded";
}

export async function prefetchCategoryFirstPage(params: {
  categoryId: string;
  pageSize: number;
  queryClient: QueryClient;
}): Promise<void> {
  const { categoryId, pageSize, queryClient } = params;

  await queryClient.prefetchInfiniteQuery({
    queryKey: getCategoryProductsQueryKey(categoryId, pageSize),
    queryFn: ({ pageParam }) =>
      categoryControllerGetProductCardsByCategory(categoryId, {
        cursor: pageParam as string | undefined,
        limit: pageSize,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CategoryProductsCardPageDto) =>
      lastPage.nextCursor ?? undefined,
  });
}
