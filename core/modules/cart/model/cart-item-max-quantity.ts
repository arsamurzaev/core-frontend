import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import {
  findProductSaleUnit,
  getProductSaleUnits,
  getSaleUnitMaxQuantity,
} from "@/core/modules/product/model/sale-units";

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
  const saleUnits = getProductSaleUnits(variant ?? product);
  const saleUnit = findProductSaleUnit(saleUnits, item.saleUnitId);

  return getSaleUnitMaxQuantity(variant?.stock, saleUnit);
}
