import {
  type CreateProductFormValues,
  buildCreateVariantsPayload,
  normalizeSaleUnitsForPayload,
  type PayloadWithSaleUnits,
  type SaleUnitPayload,
} from "@/core/modules/product/editor";
import {
  type AttributeDto,
  type CreateProductDtoReq,
} from "@/shared/api/generated/react-query";

type CreateVariantPayload = PayloadWithSaleUnits<
  NonNullable<CreateProductDtoReq["variants"]>[number]
>;

export function resolveCreateProductVariantsPayload(params: {
  formValues: CreateProductFormValues;
  variantAttributes: AttributeDto[];
  canUseProductVariants: boolean;
  canUseCatalogSaleUnits: boolean;
}): CreateVariantPayload[] {
  const {
    formValues,
    variantAttributes,
    canUseProductVariants,
    canUseCatalogSaleUnits,
  } = params;

  if (!canUseProductVariants || variantAttributes.length === 0) {
    return [];
  }

  return buildCreateVariantsPayload(formValues.variants ?? {}, variantAttributes, {
    canUseCatalogSaleUnits,
  });
}

export function resolveCreateProductBaseSaleUnitsPayload(params: {
  formValues: CreateProductFormValues;
  variantAttributes: AttributeDto[];
  canUseProductVariants: boolean;
  canUseCatalogSaleUnits: boolean;
}): SaleUnitPayload[] | undefined {
  const {
    formValues,
    variantAttributes,
    canUseProductVariants,
    canUseCatalogSaleUnits,
  } = params;

  if (!canUseCatalogSaleUnits) {
    return undefined;
  }

  if (canUseProductVariants && variantAttributes.length > 0) {
    return undefined;
  }

  const baseSaleUnitsPayload = normalizeSaleUnitsForPayload(formValues.saleUnits);
  return baseSaleUnitsPayload.length > 0 ? baseSaleUnitsPayload : undefined;
}
