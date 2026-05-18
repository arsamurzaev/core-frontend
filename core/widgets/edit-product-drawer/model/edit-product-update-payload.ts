import {
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { buildProductEditorBasePayloadFields } from "@/core/modules/product/editor/model/product-editor-payload";
import {
  buildRemovedProductAttributeIds,
} from "@/core/modules/product/editor/model/product-attributes";
import { buildCreateVariantsPayload } from "@/core/modules/product/editor/model/product-variants";
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
  variantAttributes?: AttributeDto[];
  canUseProductTypes?: boolean;
  canUseCatalogSaleUnits: boolean;
  canUseProductVariants?: boolean;
}): UpdateProductDtoReq {
  const {
    formValues,
    mediaIds,
    persistedAttributeValues,
    product,
    productAttributes,
    variantAttributes = [],
    canUseProductTypes = true,
    canUseCatalogSaleUnits,
    canUseProductVariants = false,
  } = params;
  const basePayload = buildProductEditorBasePayloadFields({
    formValues,
    productAttributes,
  });

  const currentProductTypeId = product?.productType?.id ?? null;
  const nextProductTypeId = canUseProductTypes
    ? basePayload.productTypeId
    : currentProductTypeId;
  const hasProductTypeChange =
    canUseProductTypes &&
    product !== undefined &&
    nextProductTypeId !== currentProductTypeId;
  const isClearingProductType = hasProductTypeChange && !nextProductTypeId;
  const editableProductAttributes =
    !canUseProductTypes && currentProductTypeId
      ? productAttributes.filter(
          (attribute) =>
            !isScopedToProductType(attribute, currentProductTypeId),
        )
      : isClearingProductType
        ? productAttributes.filter(
            (attribute) =>
              !isScopedToProductType(attribute, currentProductTypeId),
          )
        : productAttributes;
  const attributes = buildProductEditorBasePayloadFields({
    formValues: {
      ...formValues,
      attributes: formValues.attributes ?? {},
    },
    productAttributes: editableProductAttributes,
  }).attributes;
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
  const shouldReplaceVariantMatrix =
    canUseProductVariants && variantAttributes.length > 0;
  const variantMatrixPayload = shouldReplaceVariantMatrix
    ? buildCreateVariantsPayload(formValues.variants, variantAttributes)
    : [];

  return {
    name: basePayload.name,
    price: basePayload.price,
    mediaIds,
    brandId: basePayload.brandId,
    ...(canUseProductTypes && hasProductTypeChange
      ? { productTypeId: nextProductTypeId }
      : {}),
    categories: basePayload.categories,
    attributes,
    removeAttributeIds:
      removeAttributeIds.length > 0 ? removeAttributeIds : undefined,
    ...(variantsPayload.length > 0 && !shouldReplaceVariantMatrix
      ? { variants: variantsPayload }
      : {}),
    ...(shouldReplaceVariantMatrix
      ? { variantMatrix: variantMatrixPayload }
      : {}),
  };
}

export function parseEditProductUpdatePayload(params: {
  formValues: CreateProductFormValues;
  mediaIds: string[];
  persistedAttributeValues: Record<string, AttributeFormValue>;
  product?: ProductWithDetailsDto | null;
  productAttributes: AttributeDto[];
  variantAttributes?: AttributeDto[];
  canUseProductTypes?: boolean;
  canUseCatalogSaleUnits: boolean;
  canUseProductVariants?: boolean;
}) {
  return buildEditProductUpdatePayloadCandidate(params);
}
