import {
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { buildProductEditorBasePayloadFields } from "@/core/modules/product/editor/model/product-editor-payload";
import {
  type AttributeDto,
  type CreateProductDtoReq,
} from "@/shared/api/generated/react-query";
import { type SaleUnitPayload } from "@/core/modules/product/editor/model/product-sale-units";
import {
  resolveCreateProductBaseSaleUnitsPayload,
  resolveCreateProductVariantsPayload,
} from "./create-product-sale-units-payload";

type CreateProductWithBaseSaleUnitsDtoReq = CreateProductDtoReq & {
  saleUnits?: SaleUnitPayload[];
};

export function parseCreateProductPayload(params: {
  formValues: CreateProductFormValues;
  mediaIds: string[];
  normalizedPrice: number | null;
  productAttributes: AttributeDto[];
  variantAttributes: AttributeDto[];
  canUseProductTypes: boolean;
  canUseProductVariants: boolean;
  canUseCatalogSaleUnits: boolean;
}): CreateProductWithBaseSaleUnitsDtoReq {
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
  const basePayload = buildProductEditorBasePayloadFields({
    formValues,
    productAttributes,
  });
  const resolvedVariantsPayload = resolveCreateProductVariantsPayload({
    formValues,
    variantAttributes,
    canUseProductVariants,
    canUseCatalogSaleUnits,
  });
  const baseSaleUnitsPayload = resolveCreateProductBaseSaleUnitsPayload({
    formValues,
    variantAttributes,
    canUseProductVariants,
    canUseCatalogSaleUnits,
  });

  return {
    name: basePayload.name,
    price: normalizedPrice,
    ...(basePayload.brandId ? { brandId: basePayload.brandId } : {}),
    ...(canUseProductTypes && basePayload.productTypeId
      ? { productTypeId: basePayload.productTypeId }
      : {}),
    ...(mediaIds.length > 0 ? { mediaIds } : {}),
    ...(basePayload.categories.length > 0
      ? { categories: basePayload.categories }
      : {}),
    ...(basePayload.attributes.length > 0
      ? { attributes: basePayload.attributes }
      : {}),
    ...(baseSaleUnitsPayload !== undefined
      ? { saleUnits: baseSaleUnitsPayload }
      : {}),
    ...(resolvedVariantsPayload.length > 0
      ? { variants: resolvedVariantsPayload }
      : {}),
  };
}
