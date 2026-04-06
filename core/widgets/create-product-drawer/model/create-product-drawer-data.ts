"use client";

import { invalidateProductQueries } from "@/core/modules/product/actions/model/invalidate-product-queries";
import {
  type CreateProductFormValues,
  normalizeOptionalString,
} from "@/core/modules/product/editor/model/form-config";
import { buildProductAttributePayload } from "@/core/modules/product/editor/model/product-attributes";
import { buildCreateVariantsPayload } from "@/core/modules/product/editor/model/product-variants";
import {
  type AttributeDto,
  type CreateProductDtoReq,
} from "@/shared/api/generated/react-query";
import { type QueryClient } from "@tanstack/react-query";

function normalizeCategoryIds(values: string[] | undefined): string[] {
  return (values ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function parseCreateProductPayload(params: {
  formValues: CreateProductFormValues;
  mediaIds: string[];
  normalizedPrice: number;
  productAttributes: AttributeDto[];
}): CreateProductDtoReq {
  const { formValues, mediaIds, normalizedPrice, productAttributes } = params;
  const normalizedCategories = normalizeCategoryIds(formValues.categoryIds);
  const normalizedBrandId = normalizeOptionalString(formValues.brandId);
  const attributesPayload = buildProductAttributePayload(
    productAttributes,
    formValues.attributes ?? {},
  );

  const variantsPayload = buildCreateVariantsPayload(formValues.variants ?? {});

  return {
    name: formValues.name.trim(),
    price: normalizedPrice,
    ...(normalizedBrandId ? { brandId: normalizedBrandId } : {}),
    ...(mediaIds.length > 0 ? { mediaIds } : {}),
    ...(normalizedCategories.length > 0
      ? { categories: normalizedCategories }
      : {}),
    ...(attributesPayload.length > 0 ? { attributes: attributesPayload } : {}),
    ...(variantsPayload.length > 0 ? { variants: variantsPayload } : {}),
  } satisfies CreateProductDtoReq;
}

export async function invalidateCreateProductQueries(
  queryClient: QueryClient,
) {
  await invalidateProductQueries(queryClient);
}
