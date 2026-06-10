import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { buildProductEditorBasePayloadFields } from "@/core/modules/product/editor/model/product-editor-payload";
import { isDiscountAttribute } from "@/core/modules/product/editor/model/product-discount";
import {
  type AttributeDto,
  type CreateProductDtoReq,
} from "@/shared/api/generated/react-query";
import { type CreateProductPriceListPricePayload } from "@/core/modules/catalog-price-list";
import { type SaleUnitPayload } from "@/core/modules/product/editor/model/product-sale-units";
import {
  resolveCreateProductBaseSaleUnitsPayload,
  resolveCreateProductVariantsPayload,
} from "./create-product-sale-units-payload";

type CreateProductWithBaseSaleUnitsDtoReq = CreateProductDtoReq & {
  saleUnits?: SaleUnitPayload[];
  priceListPrices?: CreateProductPriceListPricePayload[];
};

export function parseCreateProductPayload(params: {
  formValues: CreateProductFormValues;
  mediaIds: string[];
  normalizedPrice: number | null;
  productAttributes: AttributeDto[];
  variantAttributes: AttributeDto[];
  canEditPrice?: boolean;
  canUseProductTypes: boolean;
  canUseProductVariants: boolean;
  canUseCatalogSaleUnits: boolean;
  canUseDiscounts?: boolean;
  priceListPrices?: CreateProductPriceListPricePayload[];
}): CreateProductWithBaseSaleUnitsDtoReq {
  const {
    formValues,
    mediaIds,
    normalizedPrice,
    productAttributes,
    variantAttributes,
    canEditPrice = true,
    canUseProductTypes,
    canUseProductVariants,
    canUseCatalogSaleUnits,
    canUseDiscounts = true,
    priceListPrices,
  } = params;
  const editableProductAttributes = canUseDiscounts
    ? productAttributes
    : productAttributes.filter((attribute) => !isDiscountAttribute(attribute));
  const basePayload = buildProductEditorBasePayloadFields({
    formValues,
    productAttributes: editableProductAttributes,
  });
  const resolvedVariantsPayload = canEditPrice
    ? resolveCreateProductVariantsPayload({
        formValues,
        variantAttributes,
        canUseProductVariants,
        canUseCatalogSaleUnits,
      })
    : [];
  const baseSaleUnitsPayload = canEditPrice
    ? resolveCreateProductBaseSaleUnitsPayload({
        formValues,
        variantAttributes,
        canUseProductVariants,
        canUseCatalogSaleUnits,
      })
    : undefined;

  return {
    name: basePayload.name,
    ...(canEditPrice ? { price: normalizedPrice } : {}),
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
    ...(priceListPrices?.length ? { priceListPrices } : {}),
  };
}
