import {
  type CreateProductFormValues,
  normalizeOptionalString,
} from "@/core/modules/product/editor/model/form-config";
import {
  buildProductAttributePayload,
  buildRemovedProductAttributeIds,
} from "@/core/modules/product/editor/model/product-attributes";
import { normalizeProductCategoryIds } from "@/core/modules/product/editor/model/product-category-payload";
import { type AttributeFormValue } from "@/core/modules/product/editor/model/types";
import {
  type AttributeDto,
  type ProductWithDetailsDto,
  type UpdateProductDtoReq,
} from "@/shared/api/generated/react-query";
import { buildEditProductBaseSaleUnitVariantPayloads } from "./edit-product-sale-units-payload";

function isScopedToProductType(
  attribute: AttributeDto,
  productTypeId: string | null,
): boolean {
  return Boolean(productTypeId && attribute.typeIds.includes(productTypeId));
}

function mergeAttributeIds(...groups: string[][]): string[] {
  return [
    ...new Set(
      groups.reduce<string[]>((ids, group) => [...ids, ...group], []),
    ),
  ];
}

function buildClearedProductTypeAttributeIds(params: {
  currentProductTypeId: string | null;
  isClearingProductType: boolean;
  persistedAttributeValues: Record<string, AttributeFormValue>;
  productAttributes: AttributeDto[];
}): string[] {
  if (!params.isClearingProductType || !params.currentProductTypeId) {
    return [];
  }

  return params.productAttributes
    .filter((attribute) =>
      isScopedToProductType(attribute, params.currentProductTypeId),
    )
    .filter(
      (attribute) =>
        Object.prototype.hasOwnProperty.call(
          params.persistedAttributeValues,
          attribute.id,
        ),
    )
    .map((attribute) => attribute.id);
}

export function buildEditProductUpdatePayloadCandidate(params: {
  formValues: CreateProductFormValues;
  mediaIds: string[];
  persistedAttributeValues: Record<string, AttributeFormValue>;
  product?: ProductWithDetailsDto | null;
  productAttributes: AttributeDto[];
  canUseCatalogSaleUnits: boolean;
}): UpdateProductDtoReq {
  const {
    formValues,
    mediaIds,
    persistedAttributeValues,
    product,
    productAttributes,
    canUseCatalogSaleUnits,
  } = params;
  const normalizedCategories = normalizeProductCategoryIds(
    formValues.categoryIds,
  );

  const currentProductTypeId = product?.productType?.id ?? null;
  const nextProductTypeId =
    normalizeOptionalString(formValues.productTypeId) ?? null;
  const hasProductTypeChange =
    product !== undefined && nextProductTypeId !== currentProductTypeId;
  const isClearingProductType = hasProductTypeChange && !nextProductTypeId;
  const editableProductAttributes = isClearingProductType
    ? productAttributes.filter(
        (attribute) =>
          !isScopedToProductType(attribute, currentProductTypeId),
      )
    : productAttributes;
  const attributes = buildProductAttributePayload(
    editableProductAttributes,
    formValues.attributes ?? {},
  );
  const removeAttributeIds = mergeAttributeIds(
    buildRemovedProductAttributeIds(
      editableProductAttributes,
      persistedAttributeValues,
      formValues.attributes ?? {},
    ),
    buildClearedProductTypeAttributeIds({
      currentProductTypeId,
      isClearingProductType,
      persistedAttributeValues,
      productAttributes,
    }),
  );
  const variantsPayload = buildEditProductBaseSaleUnitVariantPayloads({
    formValues,
    product,
    canUseCatalogSaleUnits,
  });
  const nextPrice =
    formValues.price.trim().length > 0 ? Number(formValues.price) : null;

  return {
    name: formValues.name.trim(),
    price: nextPrice,
    mediaIds,
    brandId: normalizeOptionalString(formValues.brandId) ?? null,
    ...(hasProductTypeChange ? { productTypeId: nextProductTypeId } : {}),
    categories: normalizedCategories,
    attributes,
    removeAttributeIds:
      removeAttributeIds.length > 0 ? removeAttributeIds : undefined,
    ...(variantsPayload.length > 0 ? { variants: variantsPayload } : {}),
  };
}

export function parseEditProductUpdatePayload(params: {
  formValues: CreateProductFormValues;
  mediaIds: string[];
  persistedAttributeValues: Record<string, AttributeFormValue>;
  product?: ProductWithDetailsDto | null;
  productAttributes: AttributeDto[];
  canUseCatalogSaleUnits: boolean;
}) {
  return buildEditProductUpdatePayloadCandidate(params);
}
