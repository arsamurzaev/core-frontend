import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import {
  findProductSaleUnit,
  getProductSaleUnits,
  getSaleUnitMaxQuantity,
} from "@/core/modules/product";
import type { ProductVariantDto } from "@/shared/api/generated/react-query";

function findDefaultProductVariant(
  variants: ProductVariantDto[],
  defaultVariantId?: string | null,
): ProductVariantDto | null {
  const normalizedDefaultVariantId = defaultVariantId?.trim();

  return (
    (normalizedDefaultVariantId
      ? (variants.find((variant) => variant.id === normalizedDefaultVariantId) ??
        null)
      : null) ??
    variants.find(
      (variant) =>
        variant.kind === "DEFAULT" || variant.variantKey === "default",
    ) ??
    variants.find((variant) => (variant.attributes ?? []).length === 0) ??
    null
  );
}

export function getCartItemMaxQuantity(
  item: CartItemView,
): number | undefined {
  const product = item.product;

  if (!product) {
    return undefined;
  }

  const variant = item.variantId
    ? (product.variants.find((entry) => entry.id === item.variantId) ?? null)
    : null;
  const stockSource =
    variant ??
    findDefaultProductVariant(product.variants, product.defaultVariantId);
  const saleUnits = getProductSaleUnits(stockSource ?? product);
  const saleUnit = findProductSaleUnit(saleUnits, item.saleUnitId);
  const stock = stockSource?.stock ?? product.stock;

  return getSaleUnitMaxQuantity(stock, saleUnit);
}
