"use client";

import {
  formatGeneratedZodError,
} from "@/core/widgets/create-product-drawer/lib/errors";
import {
  CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  type CreateProductFormValues,
  normalizeOptionalString,
} from "@/core/widgets/create-product-drawer/model/form-config";
import {
  buildInitialAttributeValues,
  buildProductAttributePayload,
  buildRemovedProductAttributeIds,
  hasPersistedAttributeValue,
} from "@/core/widgets/create-product-drawer/model/product-attributes";
import { type AttributeFormValue } from "@/core/widgets/product-editor/model/types";
import {
  type AttributeDto,
  ProductAttributeRefDtoDataType,
  type ProductAttributeDto,
  type ProductWithDetailsDto,
  getProductControllerGetAllQueryKey,
  getProductControllerGetByIdQueryKey,
  getProductControllerGetBySlugQueryKey,
  getProductControllerGetPopularQueryKey,
} from "@/shared/api/generated";
import { ProductControllerUpdateBody } from "@/shared/api/generated/zod";
import { type QueryClient } from "@tanstack/react-query";

const DISCOUNT_ATTRIBUTE_KEYS = new Set([
  "discount",
  "discountedprice",
  "discountstartat",
  "discountendat",
]);

function normalizeAttributeKey(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isDiscountAttributeKey(value: string | null | undefined): boolean {
  return DISCOUNT_ATTRIBUTE_KEYS.has(normalizeAttributeKey(value));
}

function toFormAttributeValue(
  attribute: ProductAttributeDto,
): AttributeFormValue | undefined {
  switch (attribute.attribute.dataType) {
    case ProductAttributeRefDtoDataType.ENUM:
      return attribute.enumValueId ?? null;
    case ProductAttributeRefDtoDataType.INTEGER:
      return attribute.valueInteger === null || attribute.valueInteger === undefined
        ? null
        : String(attribute.valueInteger);
    case ProductAttributeRefDtoDataType.DECIMAL:
      return attribute.valueDecimal === null || attribute.valueDecimal === undefined
        ? null
        : String(attribute.valueDecimal);
    case ProductAttributeRefDtoDataType.BOOLEAN:
      return typeof attribute.valueBoolean === "boolean"
        ? attribute.valueBoolean
        : false;
    case ProductAttributeRefDtoDataType.DATETIME:
      return attribute.valueDateTime ?? null;
    case ProductAttributeRefDtoDataType.STRING:
    default:
      return attribute.valueString ?? null;
  }
}

export function buildEditProductFormValues(
  product: ProductWithDetailsDto,
  productAttributes: AttributeDto[],
): CreateProductFormValues {
  const attributes = buildInitialAttributeValues(productAttributes);
  let hasDiscount = false;

  for (const attribute of product.productAttributes ?? []) {
    const nextValue = toFormAttributeValue(attribute);
    attributes[attribute.attributeId] = nextValue ?? null;

    if (
      isDiscountAttributeKey(attribute.attribute.key) &&
      hasPersistedAttributeValue(nextValue)
    ) {
      hasDiscount = true;
    }
  }

  return {
    ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
    name: product.name,
    price: String(product.price ?? ""),
    brandId: product.brand?.id ?? undefined,
    categoryIds: [],
    hasDiscount,
    attributes,
  };
}

export function buildPersistedEditableAttributeValues(
  product: ProductWithDetailsDto,
  productAttributes: AttributeDto[],
): Record<string, AttributeFormValue> {
  const editableAttributeIds = new Set(
    productAttributes.map((attribute) => attribute.id),
  );
  const values: Record<string, AttributeFormValue> = {};

  for (const attribute of product.productAttributes ?? []) {
    if (!editableAttributeIds.has(attribute.attributeId)) {
      continue;
    }

    values[attribute.attributeId] = toFormAttributeValue(attribute) ?? null;
  }

  return values;
}

export function buildEditProductUpdatePayloadCandidate(params: {
  formValues: CreateProductFormValues;
  mediaIds: string[];
  persistedAttributeValues: Record<string, AttributeFormValue>;
  productAttributes: AttributeDto[];
}) {
  const { formValues, mediaIds, persistedAttributeValues, productAttributes } =
    params;

  const attributes = buildProductAttributePayload(
    productAttributes,
    formValues.attributes ?? {},
  );
  const removeAttributeIds = buildRemovedProductAttributeIds(
    productAttributes,
    persistedAttributeValues,
    formValues.attributes ?? {},
  );

  return {
    name: formValues.name.trim(),
    price: Number(formValues.price),
    mediaIds,
    brandId: normalizeOptionalString(formValues.brandId) ?? null,
    attributes,
    removeAttributeIds:
      removeAttributeIds.length > 0 ? removeAttributeIds : undefined,
  };
}

export function parseEditProductUpdatePayload(params: {
  formValues: CreateProductFormValues;
  mediaIds: string[];
  persistedAttributeValues: Record<string, AttributeFormValue>;
  productAttributes: AttributeDto[];
}) {
  const payloadCandidate = buildEditProductUpdatePayloadCandidate(params);
  const payloadParsed = ProductControllerUpdateBody.safeParse(payloadCandidate);

  if (!payloadParsed.success) {
    throw new Error(
      formatGeneratedZodError(
        payloadParsed.error,
        "Форма содержит некорректные данные для редактирования товара.",
      ),
    );
  }

  return payloadParsed.data;
}

export async function invalidateEditProductQueries(
  queryClient: QueryClient,
  product: Pick<ProductWithDetailsDto, "id" | "slug">,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: getProductControllerGetAllQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: ["/product/infinite"],
    }),
    queryClient.invalidateQueries({
      queryKey: getProductControllerGetPopularQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getProductControllerGetByIdQueryKey(product.id),
    }),
    queryClient.invalidateQueries({
      queryKey: getProductControllerGetBySlugQueryKey(product.slug),
    }),
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return (
          typeof key === "string" &&
          key.startsWith("/category/") &&
          key.endsWith("/products/infinite")
        );
      },
    }),
  ]);
}
