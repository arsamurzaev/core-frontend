import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import type { CartProductSnapshot } from "@/core/modules/cart/model/cart-context.types";

export const CART_PRODUCT_VARIANT_FORMS = [
  "\u0432\u0430\u0440\u0438\u0430\u043d\u0442",
  "\u0432\u0430\u0440\u0438\u0430\u043d\u0442\u0430",
  "\u0432\u0430\u0440\u0438\u0430\u043d\u0442\u043e\u0432",
] as const;

export interface CartProductLinesSummary {
  currency: string;
  linesCount: number;
  totalPrice: number;
  totalQuantity: number;
  variantLabel: string;
}

export function pluralizeRu(
  value: number,
  forms: readonly [string, string, string],
): string {
  const absoluteValue = Math.abs(value);
  const lastTwoDigits = absoluteValue % 100;
  const lastDigit = absoluteValue % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return forms[2];
  }

  if (lastDigit === 1) {
    return forms[0];
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return forms[1];
  }

  return forms[2];
}

export function buildCartLineSnapshot(
  product: CartProductSnapshot,
  item: CartItemView,
): CartProductSnapshot {
  const unitPrice =
    item.quantity > 0 && item.displayLineTotal !== null
      ? item.displayLineTotal / item.quantity
      : product.price;

  return {
    id: product.id,
    name: product.name,
    price: unitPrice === null ? null : String(unitPrice),
    slug: product.slug,
  };
}

export function getCartProductLinesSummary(
  lines: CartItemView[],
  fallbackCurrency: string,
): CartProductLinesSummary {
  const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = lines.reduce(
    (sum, item) => sum + (item.displayLineTotal ?? 0),
    0,
  );
  const linesCount = lines.length;

  return {
    currency: lines[0]?.currency ?? fallbackCurrency,
    linesCount,
    totalPrice,
    totalQuantity,
    variantLabel: pluralizeRu(linesCount, CART_PRODUCT_VARIANT_FORMS),
  };
}

export function canShowCartProductFooterPrice(
  displayPrice: number | null | undefined,
): boolean {
  return Number.isFinite(displayPrice);
}
