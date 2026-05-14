import type { CartDto } from "@/shared/api/generated/react-query";
import { getCartItemSaleUnitId } from "./cart-line-key";
import {
  buildCartLineSelectionKey,
  normalizeCartLineSelection,
  shouldUseLineQuantity,
  type CartLineSelection,
  type CartQuantityScope,
} from "./cart-line-selection";

export function getCartLineSelectionQuantityFromCart(params: {
  cart: CartDto | null | undefined;
  quantityScope?: CartQuantityScope;
  selection: CartLineSelection;
}): number {
  const { cart, quantityScope } = params;
  const selection = normalizeCartLineSelection(params.selection);

  if (!cart?.items.length) {
    return 0;
  }

  if (shouldUseLineQuantity(selection, quantityScope)) {
    const lineKey = buildCartLineSelectionKey(selection);

    return cart.items.reduce((sum, item) => {
      const itemLineKey = buildCartLineSelectionKey({
        productId: item.productId,
        saleUnitId: getCartItemSaleUnitId(item),
        variantId: item.variantId,
      });

      return itemLineKey === lineKey ? sum + item.quantity : sum;
    }, 0);
  }

  return cart.items.reduce(
    (sum, item) =>
      item.productId === selection.productId ? sum + item.quantity : sum,
    0,
  );
}
