"use client";

import { invalidateProductQueries } from "@/core/modules/product/actions/model/invalidate-product-queries";
import { type QueryClient } from "@tanstack/react-query";

export {
  buildEditProductAttributeFormState,
  buildPersistedEditableAttributeValues,
  isDiscountAttributeKey,
  toProductFormAttributeValue,
} from "./edit-product-attribute-values";
export { buildEditProductFormValues } from "./edit-product-form-values";
export {
  buildEditProductBaseSaleUnitVariantPayloads,
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
