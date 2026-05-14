export const CART_PRODUCT_DRAWER_FOOTER_LABELS = {
  addToCart:
    "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0432 \u043a\u043e\u0440\u0437\u0438\u043d\u0443",
  selectAvailableVariant:
    "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442",
} as const;

export function shouldShowCartProductDrawerAddButton(quantity: number): boolean {
  return quantity <= 0;
}

export function getCartProductDrawerAddLabel(disabled: boolean): string {
  return disabled
    ? CART_PRODUCT_DRAWER_FOOTER_LABELS.selectAvailableVariant
    : CART_PRODUCT_DRAWER_FOOTER_LABELS.addToCart;
}
