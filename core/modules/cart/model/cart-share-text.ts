import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";

function formatSharePrice(value: number) {
  return Intl.NumberFormat("ru-RU").format(value);
}

function getShareProductName(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName.endsWith(")")) {
    return trimmedName;
  }

  let depth = 0;

  for (let index = trimmedName.length - 1; index >= 0; index -= 1) {
    const char = trimmedName[index];

    if (char === ")") {
      depth += 1;
    } else if (char === "(") {
      depth -= 1;

      if (depth === 0) {
        return trimmedName.slice(0, index).trim() || trimmedName;
      }
    }
  }

  return trimmedName;
}

function formatCartItemQuantity(item: CartItemView): string {
  return item.saleUnitLabel
    ? `${item.quantity} ${item.saleUnitLabel}`
    : `${item.quantity} шт.`;
}

function formatShareMoney(value: number, currency: string) {
  const normalizedCurrency = currency.trim();
  const formattedValue = formatSharePrice(value);

  return normalizedCurrency.length > 1
    ? `${formattedValue} ${normalizedCurrency}`
    : `${formattedValue}${normalizedCurrency}`;
}

export function buildLegacyCartShareText(params: {
  checkoutSummary?: string[];
  comment?: string;
  currency: string;
  items: CartItemView[];
  totals: {
    originalSubtotal: number;
    subtotal: number;
  };
  url: string;
}) {
  const {
    checkoutSummary = [],
    comment,
    currency,
    items,
    totals,
    url,
  } = params;
  const normalizedComment = comment?.trim();
  const productsText = items
    .map((item) => {
      const productLabel = getShareProductName(item.name);

      return `•${productLabel} - ${formatCartItemQuantity(item)}`;
    })
    .join("\n\n");
  const priceText =
    totals.originalSubtotal === totals.subtotal
      ? `Сумма: ${formatShareMoney(totals.subtotal, currency)}`
      : `Сумма: ~${formatShareMoney(totals.originalSubtotal, currency)}~ ${formatShareMoney(totals.subtotal, currency)}`;

  return ["", url, "", "Заказ:", productsText]
    .concat(checkoutSummary.length > 0 ? ["", ...checkoutSummary] : [])
    .concat(normalizedComment ? ["", "Комментарий:", normalizedComment] : [])
    .concat(["", priceText])
    .filter((line): line is string => line !== null && line !== undefined)
    .join("\n");
}
