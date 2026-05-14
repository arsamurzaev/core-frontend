import {
  ProductVariantPickerOptionDtoStatus,
  type ProductVariantPickerOptionDto,
  type ProductWithAttributesDto,
} from "@/shared/api/generated/react-query";

type VariantOptionsProduct = Pick<
  ProductWithAttributesDto,
  "variantPickerOptions"
>;

export function isCartProductVariantOptionPurchasable(
  option: ProductVariantPickerOptionDto,
  shouldEnforceStock: boolean,
): boolean {
  if (!shouldEnforceStock) {
    return option.status !== ProductVariantPickerOptionDtoStatus.DISABLED;
  }

  return option.isAvailable && option.stock > 0;
}

export function getCartProductVariantPickerOptions(params: {
  product: VariantOptionsProduct;
  shouldEnforceStock: boolean;
}): ProductVariantPickerOptionDto[] {
  return (params.product.variantPickerOptions ?? []).filter((option) =>
    isCartProductVariantOptionPurchasable(
      option,
      params.shouldEnforceStock,
    ),
  );
}
