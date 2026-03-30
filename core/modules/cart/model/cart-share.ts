import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import { API_BASE_URL } from "@/shared/api/client";

function formatSharePrice(value: number) {
  return Intl.NumberFormat("ru-RU").format(value);
}

function formatShareMoney(value: number, currency: string) {
  const normalizedCurrency = currency.trim();
  const formattedValue = formatSharePrice(value);

  return normalizedCurrency.length > 1
    ? `${formattedValue} ${normalizedCurrency}`
    : `${formattedValue}${normalizedCurrency}`;
}

export function buildShareBaseUrl(): string {
  if (typeof window !== "undefined") {
    return new URL("/", window.location.origin).toString();
  }

  return new URL("/", API_BASE_URL).toString();
}

export function getPublicAccessKey(
  access: CartPublicAccess | null | undefined,
) {
  if (!access?.publicKey || !access.checkoutKey) {
    return null;
  }

  return `${access.publicKey}:${access.checkoutKey}`;
}

export function buildLegacyCartShareText(params: {
  comment?: string;
  currency: string;
  items: CartItemView[];
  totals: {
    originalSubtotal: number;
    subtotal: number;
  };
  url: string;
}) {
  const { comment, currency, items, totals, url } = params;
  const normalizedComment = comment?.trim();
  const productsText = items
    .map((item) => {
      const productLabel = item.subtitle
        ? `${item.name} (${item.subtitle})`
        : item.name;

      return `•${productLabel} - ${item.quantity} шт.`;
    })
    .join("\n\n");

  const priceText =
    totals.originalSubtotal === totals.subtotal
      ? `Сумма: ${formatShareMoney(totals.subtotal, currency)}`
      : `Сумма: ~${formatShareMoney(totals.originalSubtotal, currency)}~ ${formatShareMoney(totals.subtotal, currency)}`;

  return [url, "", "Заказ:", productsText, normalizedComment ? "" : null]
    .concat(normalizedComment ? ["Комментарий:", normalizedComment] : [])
    .concat(["", priceText])
    .filter(Boolean)
    .join("\n");
}
