export const CART_PRODUCT_ACTION_LABELS = {
  addToCart:
    "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432 \u043a\u043e\u0440\u0437\u0438\u043d\u0443",
  cartQuantity:
    "\u0422\u043e\u0432\u0430\u0440\u043e\u0432 \u0432 \u043a\u043e\u0440\u0437\u0438\u043d\u0435",
  selectVariant:
    "\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0432\u0430\u0440\u0438\u0430\u043d\u0442",
  unavailable:
    "\u041d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u0432\u0430\u0440\u0438\u0430\u043d\u0442\u043e\u0432",
} as const;

export function shouldShowCartProductActionQuantity(params: {
  quantity: number;
  requiresVariantSelection: boolean;
}): boolean {
  return !params.requiresVariantSelection && params.quantity > 0;
}

export function shouldRenderCartProductVariantDrawer(params: {
  canUseProductVariants: boolean;
  isVariantDrawerOpen: boolean;
  requiresVariantSelection: boolean;
}): boolean {
  return (
    params.canUseProductVariants &&
    (params.requiresVariantSelection || params.isVariantDrawerOpen)
  );
}

export function getCartProductActionAriaLabel(params: {
  isUnavailable: boolean;
  quantity: number;
  requiresVariantSelection: boolean;
  shouldShowQuantity: boolean;
}): string {
  if (params.isUnavailable) {
    return CART_PRODUCT_ACTION_LABELS.unavailable;
  }

  if (params.requiresVariantSelection) {
    return CART_PRODUCT_ACTION_LABELS.selectVariant;
  }

  if (params.shouldShowQuantity) {
    return `${CART_PRODUCT_ACTION_LABELS.cartQuantity}: ${params.quantity}`;
  }

  return CART_PRODUCT_ACTION_LABELS.addToCart;
}
