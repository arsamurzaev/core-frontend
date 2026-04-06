"use client";

import {
  CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  type CreateProductFormValues,
  normalizeOptionalString,
} from "@/core/modules/product/editor/model/form-config";
import {
  buildInitialAttributeValues,
  buildProductAttributePayload,
  buildRemovedProductAttributeIds,
  hasPersistedAttributeValue,
} from "@/core/modules/product/editor/model/product-attributes";
import { buildVariantsFormValueFromExisting } from "@/core/modules/product/editor/model/product-variants";
import { type AttributeFormValue } from "@/core/modules/product/editor/model/types";
import {
  type AttributeDto,
  ProductAttributeRefDtoDataType,
  type ProductAttributeDto,
  type ProductWithDetailsDto,
  type UpdateProductDtoReq,
} from "@/shared/api/generated/react-query";
import { invalidateProductQueries } from "@/core/modules/product/actions/model/invalidate-product-queries";
import { type QueryClient } from "@tanstack/react-query";

const DISCOUNT_ATTRIBUTE_KEYS = new Set([
  "discount",
  "discountedprice",
  "discountstartat",
  "discountendat",
]);

function normalizeCategoryIds(values: string[] | undefined): string[] {
  return (values ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

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
  variantAttributes: AttributeDto[] = [],
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

  const variants = buildVariantsFormValueFromExisting(
    product.variants ?? [],
    variantAttributes,
  );

  return {
    ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
    name: product.name,
    price: String(product.price ?? ""),
    brandId: product.brand?.id ?? undefined,
    categoryIds: normalizeCategoryIds(
      product.categories?.map((category) => category.id),
    ),
    hasDiscount,
    attributes,
    variants,
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
}): UpdateProductDtoReq {
  const { formValues, mediaIds, persistedAttributeValues, productAttributes } =
    params;
  const normalizedCategories = normalizeCategoryIds(formValues.categoryIds);

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
    categories: normalizedCategories,
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
  return buildEditProductUpdatePayloadCandidate(params);
}

export async function invalidateEditProductQueries(queryClient: QueryClient) {
  await invalidateProductQueries(queryClient);
}
