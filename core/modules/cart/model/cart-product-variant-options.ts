import type {
  ProductVariantPickerOptionDto,
  ProductWithAttributesDto,
} from "@/shared/api/generated/react-query";
import {
  filterActivePriceListVisibleItems,
  resolveProductVariantAvailability,
  type ProductVariantAvailabilityState,
} from "@/core/modules/product";

type VariantOptionsProduct = Pick<
  ProductWithAttributesDto,
  "variantPickerOptions"
> & {
  usesPriceList?: boolean | null;
};

export interface CartProductVariantPickerItem {
  availability: ProductVariantAvailabilityState;
  option: ProductVariantPickerOptionDto;
}

export function isCartProductVariantOptionPurchasable(
  option: ProductVariantPickerOptionDto,
  shouldEnforceStock: boolean,
): boolean {
  return resolveProductVariantAvailability(option, {
    shouldEnforceStock,
  }).isSelectable;
}

export function getCartProductVariantPickerItems(params: {
  product: VariantOptionsProduct;
  shouldEnforceStock: boolean;
}): CartProductVariantPickerItem[] {
  return filterActivePriceListVisibleItems(
    params.product,
    params.product.variantPickerOptions ?? [],
  ).map((option) => ({
    availability: resolveProductVariantAvailability(option, {
      shouldEnforceStock: params.shouldEnforceStock,
    }),
    option,
  }));
}

export function getCartProductVariantPickerOptions(params: {
  product: VariantOptionsProduct;
  shouldEnforceStock: boolean;
}): ProductVariantPickerOptionDto[] {
  return getCartProductVariantPickerItems(params)
    .filter((item) => item.availability.isSelectable)
    .map((item) => item.option);
}
