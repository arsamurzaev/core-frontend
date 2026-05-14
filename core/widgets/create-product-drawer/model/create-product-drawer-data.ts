"use client";

import { invalidateProductQueries } from "@/core/modules/product/actions/model/invalidate-product-queries";
import { type QueryClient } from "@tanstack/react-query";

export { parseCreateProductPayload } from "./create-product-payload";

export async function invalidateCreateProductQueries(
  queryClient: QueryClient,
) {
  await invalidateProductQueries(queryClient);
}
