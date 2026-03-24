"use client";

import {
  formatGeneratedZodError,
} from "@/shared/lib/api-errors";
import {
  type CreateProductFormValues,
  normalizeOptionalString,
} from "@/core/modules/product/editor/model/form-config";
import {
  buildProductAttributePayload,
} from "@/core/modules/product/editor/model/product-attributes";
import { type AttributeDto } from "@/shared/api/generated";
import {
  getProductControllerGetAllQueryKey,
  getProductControllerGetPopularQueryKey,
  type CreateProductDtoReq,
} from "@/shared/api/generated";
import { ProductControllerCreateBody } from "@/shared/api/generated/zod";
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
  const attributesPayload = buildProductAttributePayload(
    productAttributes,
    formValues.attributes ?? {},
  );

  const payloadCandidate = {
    name: formValues.name.trim(),
    price: normalizedPrice,
    brandId: normalizeOptionalString(formValues.brandId),
    mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
    categories:
      normalizedCategories.length > 0 ? normalizedCategories : undefined,
    attributes: attributesPayload.length > 0 ? attributesPayload : undefined,
  };

  const payloadParsed = ProductControllerCreateBody.safeParse(payloadCandidate);
  if (!payloadParsed.success) {
    throw new Error(
      formatGeneratedZodError(
        payloadParsed.error,
        "Форма содержит некорректные данные для создания товара.",
      ),
    );
  }

  return payloadParsed.data;
}

export async function invalidateCreateProductQueries(
  queryClient: QueryClient,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: getProductControllerGetPopularQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getProductControllerGetAllQueryKey(),
    }),
  ]);
}

