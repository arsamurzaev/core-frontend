import type { CartDto } from "@/shared/api/generated/react-query";
import { isCartItemForGuest } from "./cart-guest";
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
  guestSessionId?: string | null;
  quantityScope?: CartQuantityScope;
  selection: CartLineSelection;
}): number {
  const { cart, guestSessionId, quantityScope } = params;
  const selection = normalizeCartLineSelection(params.selection);
  const effectiveGuestSessionId = selection.guestSessionId ?? guestSessionId;

  if (!cart?.items.length) {
    return 0;
  }

  if (shouldUseLineQuantity(selection, quantityScope)) {
    const lineKey = buildCartLineSelectionKey({
      productId: selection.productId,
      saleUnitId: selection.saleUnitId,
      variantId: selection.variantId,
    });

    return cart.items.reduce((sum, item) => {
      if (!isCartItemForGuest(item, effectiveGuestSessionId)) {
        return sum;
      }

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
      item.productId === selection.productId &&
      isCartItemForGuest(item, effectiveGuestSessionId)
        ? sum + item.quantity
        : sum,
    0,
  );
}
