import type {
  CartDto,
  CartItemDto,
} from "@/shared/api/generated/react-query";
import { toNumberValue } from "@/shared/lib/attributes";
import type { CartProductSnapshot } from "./cart-context.types";
import {
  getCartItemSaleUnitId,
  normalizeSaleUnitId,
  normalizeVariantId,
} from "./cart-line-key";

export function createOptimisticCart(params: {
  cart: CartDto | null;
  catalogId: string;
  product?: CartProductSnapshot;
  productId: string;
  quantity: number;
  saleUnitId?: string;
  variantId?: string;
}): CartDto | null {
  const {
    cart,
    catalogId,
    product,
    productId,
    quantity,
    saleUnitId,
    variantId,
  } = params;
  const normalizedVariantId = normalizeVariantId(variantId);
  const normalizedSaleUnitId = normalizeSaleUnitId(saleUnitId);
  const item =
    cart?.items.find(
      (entry) =>
        entry.productId === productId &&
        normalizeVariantId(entry.variantId) === normalizedVariantId &&
        normalizeSaleUnitId(getCartItemSaleUnitId(entry)) ===
          normalizedSaleUnitId,
    ) ??
    (!normalizedVariantId && !normalizedSaleUnitId
      ? cart?.items.find((entry) => entry.productId === productId)
      : null) ??
    null;

  if (!item && !product) {
    return cart;
  }

  if (!cart && quantity <= 0) {
    return null;
  }

  const now = new Date().toISOString();
  const baseCart: CartDto = cart ?? {
    id: `optimistic-${catalogId}`,
    catalogId,
    status: "DRAFT",
    statusMessage: null,
    statusChangedAt: now,
    publicKey: null,
    checkoutAt: null,
    checkoutMethod: null,
    checkoutData: null,
    checkoutContacts: null,
    comment: null,
    assignedManagerId: null,
    managerSessionStartedAt: null,
    managerLastSeenAt: null,
    closedAt: null,
    items: [],
    totals: {
      itemsCount: 0,
      subtotal: 0,
      baseSubtotal: 0,
      discountTotal: 0,
      hasDiscount: false,
      total: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
  const productPrice =
    toNumberValue(product?.price ?? null) ??
    toNumberValue(item?.product.price ?? null);
  const numericProductPrice = productPrice ?? 0;
  const productShort = item?.product ?? {
    id: product?.id ?? productId,
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    price: productPrice,
  };
  const nextItems =
    quantity <= 0
      ? baseCart.items.filter((entry) => entry.id !== item?.id)
      : item
        ? baseCart.items.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  quantity,
                  baseQuantity: quantity,
                  lineTotal: numericProductPrice * quantity,
                  unitPrice: numericProductPrice,
                  baseUnitPrice: numericProductPrice,
                  discountPercent: 0,
                  hasDiscount: false,
                  updatedAt: now,
                }
              : entry,
          )
        : [
            ...baseCart.items,
            {
              id: `optimistic-${productId}-${variantId ?? "default"}-${saleUnitId ?? "default"}`,
              productId,
              saleUnitId: saleUnitId ?? null,
              variantId: variantId ?? null,
              quantity,
              baseQuantity: quantity,
              product: productShort,
              variant: null,
              saleUnit: null,
              unitPrice: numericProductPrice,
              baseUnitPrice: numericProductPrice,
              discountPercent: 0,
              hasDiscount: false,
              lineTotal: numericProductPrice * quantity,
              createdAt: now,
              updatedAt: now,
            } satisfies CartItemDto,
          ];
  const subtotal = nextItems.reduce((sum, entry) => sum + entry.lineTotal, 0);

  return {
    ...baseCart,
    items: nextItems,
    totals: {
      itemsCount: nextItems.reduce((sum, entry) => sum + entry.quantity, 0),
      subtotal,
      baseSubtotal: subtotal,
      discountTotal: 0,
      hasDiscount: false,
      total: subtotal,
    },
    updatedAt: now,
  };
}
