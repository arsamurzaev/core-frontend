"use client";

import { invalidateProductQueries } from "@/core/modules/product/actions/model/invalidate-product-queries";
import {
  getProductControllerGetByIdQueryKey,
  type ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { type QueryClient } from "@tanstack/react-query";

export {
  buildEditProductAttributeFormState,
  buildPersistedEditableAttributeValues,
  isDiscountAttributeKey,
  toProductFormAttributeValue,
} from "./edit-product-attribute-values";
export { buildEditProductFormValues } from "./edit-product-form-values";
export {
  buildEditProductBaseSaleUnitsPayload,
  findDefaultProductVariant,
  hasExistingBaseSaleUnits,
} from "./edit-product-sale-units-payload";
export {
  buildEditProductUpdatePayloadCandidate,
  parseEditProductUpdatePayload,
} from "./edit-product-update-payload";

export async function invalidateEditProductQueries(queryClient: QueryClient) {
  await invalidateProductQueries(queryClient);
}

function isProductDetailsCandidate(
  value: unknown,
  productId: string,
): value is ProductWithDetailsDto {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (value as { id?: unknown }).id === productId;
}

export function writeUpdatedProductToEditCache(
  queryClient: QueryClient,
  productId: string,
  updatedProduct: unknown,
) {
  if (!isProductDetailsCandidate(updatedProduct, productId)) {
    return;
  }

  queryClient.setQueryData<ProductWithDetailsDto>(
    getProductControllerGetByIdQueryKey(productId),
    updatedProduct,
  );
}
