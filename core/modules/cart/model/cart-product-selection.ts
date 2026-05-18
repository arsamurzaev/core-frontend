import type { CartProductSnapshot } from "@/core/modules/cart/model/cart-context.types";
import {
  normalizeCartLineSelection,
  type NormalizedCartLineSelection,
} from "@/core/modules/cart/model/cart-line-selection";
import type {
  ProductVariantPickerOptionDto,
  ProductWithAttributesDto,
} from "@/shared/api/generated/react-query";

type ProductWithVariantPickerOptions = Pick<
  ProductWithAttributesDto,
  "id" | "name" | "price" | "slug" | "variantPickerOptions"
>;

export function buildCartProductSelection(params: {
  productId: string;
  saleUnitId?: string | null;
  variantId?: string | null;
}): NormalizedCartLineSelection {
  return normalizeCartLineSelection(params);
}

export function findCartProductVariantOption(params: {
  product: Pick<ProductWithAttributesDto, "variantPickerOptions">;
  saleUnitId?: string | null;
  variantId?: string | null;
}): ProductVariantPickerOptionDto | null {
  const variantId = params.variantId?.trim();
  const saleUnitId = params.saleUnitId?.trim();

  if (!variantId) {
    return null;
  }

  return (
    params.product.variantPickerOptions?.find((option) => {
      if (option.id !== variantId) {
        return false;
      }

      return saleUnitId ? option.saleUnitId === saleUnitId : true;
    }) ?? null
  );
}

export function buildCartProductSelectionFromVariantOption(params: {
  option: ProductVariantPickerOptionDto;
  productId: string;
}): NormalizedCartLineSelection {
  return buildCartProductSelection({
    productId: params.productId,
    saleUnitId: params.option.saleUnitId,
    variantId: params.option.id,
  });
}

export function resolveCartProductCardSelection(params: {
  product: ProductWithVariantPickerOptions;
  variantId?: string | null;
}): NormalizedCartLineSelection {
  const option = findCartProductVariantOption({
    product: params.product,
    variantId: params.variantId,
  });

  return buildCartProductSelection({
    productId: params.product.id,
    saleUnitId: option?.saleUnitId,
    variantId: params.variantId,
  });
}

export function buildCartProductVariantSnapshot(
  product: ProductWithVariantPickerOptions,
  option: ProductVariantPickerOptionDto,
): CartProductSnapshot {
  return {
    id: product.id,
    name: product.name,
    price: option.saleUnitPrice ?? option.price ?? product.price,
    slug: product.slug,
  };
}
