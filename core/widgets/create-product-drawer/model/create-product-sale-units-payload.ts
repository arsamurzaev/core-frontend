import {
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import {
  buildCreateVariantsPayload,
  normalizeSaleUnitsForPayload,
  type PayloadWithSaleUnits,
} from "@/core/modules/product/editor/model/product-variants";
import {
  type AttributeDto,
  type CreateProductDtoReq,
} from "@/shared/api/generated/react-query";

type CreateVariantPayload = PayloadWithSaleUnits<
  NonNullable<CreateProductDtoReq["variants"]>[number]
>;

export function resolveCreateProductVariantsPayload(params: {
  formValues: CreateProductFormValues;
  normalizedPrice: number | null;
  variantAttributes: AttributeDto[];
  canUseProductVariants: boolean;
  canUseCatalogSaleUnits: boolean;
}): CreateVariantPayload[] {
  const {
    formValues,
    normalizedPrice,
    variantAttributes,
    canUseProductVariants,
    canUseCatalogSaleUnits,
  } = params;
  const variantsPayload =
    canUseProductVariants && variantAttributes.length > 0
      ? buildCreateVariantsPayload(formValues.variants ?? {}, variantAttributes)
      : [];
  const baseSaleUnitsPayload = canUseCatalogSaleUnits
    ? normalizeSaleUnitsForPayload(formValues.saleUnits)
    : [];
  const canUseBaseSaleUnitsFallback =
    !canUseProductVariants || variantAttributes.length === 0;

  if (variantsPayload.length > 0) {
    return variantsPayload;
  }

  if (!canUseBaseSaleUnitsFallback || baseSaleUnitsPayload.length === 0) {
    return [];
  }

  return [
    {
      ...(normalizedPrice !== null ? { price: normalizedPrice } : {}),
      status: "ACTIVE",
      saleUnits: baseSaleUnitsPayload,
    },
  ];
}
