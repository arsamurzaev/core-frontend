"use client";

import { revalidateStorefrontCacheBestEffort } from "@/shared/api/revalidate-storefront-client";
import { type QueryClient, type QueryKey } from "@tanstack/react-query";

function shouldInvalidateProductQuery(queryKey: QueryKey): boolean {
  const key = queryKey[0];
  if (typeof key !== "string") {
    return false;
  }

  if (
    key === "filter-products-infinite" ||
    key === "filter-recommendations-infinite" ||
    key === "category-products-infinite"
  ) {
    return true;
  }

  if (key === "/product" || key.startsWith("/product/")) {
    return true;
  }

  if (key === "/category") {
    return true;
  }

  return (
    key.startsWith("/category/") &&
    key.includes("/products/") &&
    key.endsWith("/infinite")
  );
}

export async function invalidateProductQueries(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({
      predicate: (query) => shouldInvalidateProductQuery(query.queryKey),
    }),
    revalidateStorefrontCacheBestEffort(),
  ]);
}
