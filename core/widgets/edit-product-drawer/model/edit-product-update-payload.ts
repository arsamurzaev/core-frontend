import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { buildProductEditorBasePayloadFields } from "@/core/modules/product/editor/model/product-editor-payload";
import { buildRemovedProductAttributeIds } from "@/core/modules/product/editor/model/product-attributes";
import { isDiscountAttribute } from "@/core/modules/product/editor/model/product-discount";
import { buildCreateVariantsPayload } from "@/core/modules/product/editor/model/product-variants";
import { type SaleUnitPayload } from "@/core/modules/product/editor/model/product-sale-units";
import { type AttributeFormValue } from "@/core/modules/product/editor/model/types";
import {
  type AttributeDto,
  type ProductWithDetailsDto,
  type UpdateProductDtoReq,
} from "@/shared/api/generated/react-query";
import { buildEditProductBaseSaleUnitsPayload } from "./edit-product-sale-units-payload";

type UpdateProductWithBaseSaleUnitsDtoReq = UpdateProductDtoReq & {
  saleUnits?: SaleUnitPayload[];
};

function isScopedToProductType(
  attribute: AttributeDto,
  productTypeId: string | null,
): boolean {
  return Boolean(productTypeId && attribute.typeIds.includes(productTypeId));
}

function mergeAttributeIds(...groups: string[][]): string[] {
  return [
    ...new Set(groups.reduce<string[]>((ids, group) => [...ids, ...group], [])),
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
    .filter((attribute) =>
      Object.prototype.hasOwnProperty.call(
        params.persistedAttributeValues,
        attribute.id,
      ),
    )
    .map((attribute) => attribute.id);
}

function buildStaleProductTypeAttributeIds(params: {
  editableProductAttributes: AttributeDto[];
  hasProductTypeChange: boolean;
  product?: ProductWithDetailsDto | null;
}): string[] {
  if (!params.hasProductTypeChange || !params.product) {
    return [];
  }

  const editableAttributeIds = new Set(
    params.editableProductAttributes.map((attribute) => attribute.id),
  );

  return (params.product.productAttributes ?? [])
    .filter((attribute) => !attribute.attribute.isHidden)
    .map((attribute) => attribute.attributeId)
    .filter((attributeId) => !editableAttributeIds.has(attributeId));
}

function buildDisabledDiscountAttributeIds(params: {
  canUseDiscounts: boolean;
  persistedAttributeValues: Record<string, AttributeFormValue>;
  productAttributes: AttributeDto[];
}): string[] {
  if (params.canUseDiscounts) {
    return [];
  }

  return params.productAttributes
    .filter(isDiscountAttribute)
    .filter((attribute) =>
      Object.prototype.hasOwnProperty.call(
        params.persistedAttributeValues,
        attribute.id,
      ),
    )
    .map((attribute) => attribute.id);
}

function hasTypedVariants(product?: ProductWithDetailsDto | null): boolean {
  return Boolean(
    product?.variants?.some((variant) => (variant.attributes ?? []).length > 0),
  );
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
  canUseDiscounts?: boolean;
  canEditPrice?: boolean;
}): UpdateProductWithBaseSaleUnitsDtoReq {
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
    canUseDiscounts = true,
    canEditPrice = true,
  } = params;
  const writableProductAttributes = canUseDiscounts
    ? productAttributes
    : productAttributes.filter((attribute) => !isDiscountAttribute(attribute));
  const basePayload = buildProductEditorBasePayloadFields({
    formValues,
    productAttributes: writableProductAttributes,
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
      ? writableProductAttributes.filter(
          (attribute) =>
            !isScopedToProductType(attribute, currentProductTypeId),
        )
      : isClearingProductType
        ? writableProductAttributes.filter(
            (attribute) =>
              !isScopedToProductType(attribute, currentProductTypeId),
          )
        : writableProductAttributes;
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
    buildStaleProductTypeAttributeIds({
      editableProductAttributes,
      hasProductTypeChange,
      product,
    }),
    buildDisabledDiscountAttributeIds({
      canUseDiscounts,
      persistedAttributeValues,
      productAttributes,
    }),
  );
  const baseSaleUnitsPayload = canEditPrice
    ? buildEditProductBaseSaleUnitsPayload({
        formValues,
        product,
        canUseCatalogSaleUnits,
      })
    : undefined;
  const shouldReplaceVariantMatrix =
    canEditPrice &&
    canUseProductVariants &&
    (variantAttributes.length > 0 ||
      (hasProductTypeChange && hasTypedVariants(product)));
  const variantMatrixPayload = shouldReplaceVariantMatrix
    ? buildCreateVariantsPayload(formValues.variants, variantAttributes, {
        canUseCatalogSaleUnits,
      })
    : [];

  return {
    name: basePayload.name,
    ...(canEditPrice ? { price: basePayload.price } : {}),
    mediaIds,
    brandId: basePayload.brandId,
    ...(canUseProductTypes && hasProductTypeChange
      ? { productTypeId: nextProductTypeId }
      : {}),
    categories: basePayload.categories,
    attributes,
    removeAttributeIds:
      removeAttributeIds.length > 0 ? removeAttributeIds : undefined,
    ...(baseSaleUnitsPayload !== undefined && !shouldReplaceVariantMatrix
      ? { saleUnits: baseSaleUnitsPayload }
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
  canUseDiscounts?: boolean;
  canEditPrice?: boolean;
}) {
  return buildEditProductUpdatePayloadCandidate(params);
}
