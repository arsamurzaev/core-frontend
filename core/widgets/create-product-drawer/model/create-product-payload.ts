import {
  type CreateProductFormValues,
  normalizeOptionalString,
} from "@/core/modules/product/editor/model/form-config";
import { buildProductAttributePayload } from "@/core/modules/product/editor/model/product-attributes";
import { normalizeProductCategoryIds } from "@/core/modules/product/editor/model/product-category-payload";
import {
  type AttributeDto,
  type CreateProductDtoReq,
} from "@/shared/api/generated/react-query";
import { resolveCreateProductVariantsPayload } from "./create-product-sale-units-payload";

export function parseCreateProductPayload(params: {
  formValues: CreateProductFormValues;
  mediaIds: string[];
  normalizedPrice: number | null;
  productAttributes: AttributeDto[];
  variantAttributes: AttributeDto[];
  canUseProductTypes: boolean;
  canUseProductVariants: boolean;
  canUseCatalogSaleUnits: boolean;
}): CreateProductDtoReq {
  const {
    formValues,
    mediaIds,
    normalizedPrice,
    productAttributes,
    variantAttributes,
    canUseProductTypes,
    canUseProductVariants,
    canUseCatalogSaleUnits,
  } = params;
  const normalizedCategories = normalizeProductCategoryIds(formValues.categoryIds);
  const normalizedBrandId = normalizeOptionalString(formValues.brandId);
  const normalizedProductTypeId = normalizeOptionalString(formValues.productTypeId);
  const attributesPayload = buildProductAttributePayload(
    productAttributes,
    formValues.attributes ?? {},
  );
  const resolvedVariantsPayload = resolveCreateProductVariantsPayload({
    formValues,
    normalizedPrice,
    variantAttributes,
    canUseProductVariants,
    canUseCatalogSaleUnits,
  });

  return {
    name: formValues.name.trim(),
    price: normalizedPrice,
    ...(normalizedBrandId ? { brandId: normalizedBrandId } : {}),
    ...(canUseProductTypes && normalizedProductTypeId
      ? { productTypeId: normalizedProductTypeId }
      : {}),
    ...(mediaIds.length > 0 ? { mediaIds } : {}),
    ...(normalizedCategories.length > 0
      ? { categories: normalizedCategories }
      : {}),
    ...(attributesPayload.length > 0 ? { attributes: attributesPayload } : {}),
    ...(resolvedVariantsPayload.length > 0
      ? { variants: resolvedVariantsPayload }
      : {}),
  } satisfies CreateProductDtoReq;
}
