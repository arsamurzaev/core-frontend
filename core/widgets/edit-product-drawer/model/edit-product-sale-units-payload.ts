import {
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import {
  normalizeSaleUnitsForPayload,
  type PayloadWithSaleUnits,
} from "@/core/modules/product/editor/model/product-variants";
import {
  type ProductWithDetailsDto,
  type UpdateProductDtoReq,
} from "@/shared/api/generated/react-query";

type UpdateVariantPayload = PayloadWithSaleUnits<
  NonNullable<UpdateProductDtoReq["variants"]>[number]
>;

function hasArrayItems(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function findDefaultProductVariant(
  product?: ProductWithDetailsDto | null,
) {
  return product?.variants?.find((variant) => variant.attributes.length === 0);
}

export function hasExistingBaseSaleUnits(params: {
  product?: ProductWithDetailsDto | null;
  defaultVariant?: { saleUnits?: unknown } | null;
}): boolean {
  return (
    hasArrayItems(
      (params.product as { saleUnits?: unknown } | null | undefined)?.saleUnits,
    ) || hasArrayItems(params.defaultVariant?.saleUnits)
  );
}

export function buildEditProductBaseSaleUnitVariantPayloads(params: {
  formValues: CreateProductFormValues;
  product?: ProductWithDetailsDto | null;
  canUseCatalogSaleUnits: boolean;
}): UpdateVariantPayload[] {
  const { formValues, product, canUseCatalogSaleUnits } = params;
  const baseSaleUnitsPayload = canUseCatalogSaleUnits
    ? normalizeSaleUnitsForPayload(formValues.saleUnits)
    : [];
  const defaultVariant = findDefaultProductVariant(product);
  const hasExistingSaleUnits = hasExistingBaseSaleUnits({
    product,
    defaultVariant,
  });

  if (
    !defaultVariant?.variantKey ||
    !canUseCatalogSaleUnits ||
    (baseSaleUnitsPayload.length === 0 && !hasExistingSaleUnits)
  ) {
    return [];
  }

  return [
    {
      variantKey: defaultVariant.variantKey,
      ...(formValues.price.trim().length > 0
        ? { price: Number(formValues.price) }
        : {}),
      status: "ACTIVE",
      saleUnits: baseSaleUnitsPayload,
    },
  ];
}
