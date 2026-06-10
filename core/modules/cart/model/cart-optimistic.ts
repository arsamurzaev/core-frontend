import type { CartDto, CartItemDto } from "@/shared/api/generated/react-query";
import { toNumberValue } from "@/shared/lib/attributes";
import type { CartProductSnapshot } from "./cart-context.types";
import {
  getCartItemGuestSessionId,
  normalizeCartGuestSessionId,
} from "./cart-guest";
import {
  buildCartLineModifierSignature,
  getCartItemModifiers,
  getCartItemSaleUnitId,
  normalizeCartLineModifiers,
  normalizeSaleUnitId,
  normalizeVariantId,
  type CartLineModifierSelection,
} from "./cart-line-key";

function getNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  return toNumberValue(value);
}

function getPositiveNumber(value: unknown): number | null {
  const numericValue = getNumber(value);
  return numericValue !== null && numericValue > 0 ? numericValue : null;
}

function getExistingLineUnitPrice(item: CartItemDto | null): number | null {
  if (!item) {
    return null;
  }

  const quantity =
    typeof item.quantity === "number" && Number.isFinite(item.quantity)
      ? item.quantity
      : 0;
  const lineTotal = getNumber(item.lineTotal);
  const baseUnitPrice = getPositiveNumber(item.baseUnitPrice);

  if (lineTotal !== null && quantity > 0) {
    if (lineTotal > 0) {
      return lineTotal / quantity;
    }

    if (item.hasDiscount === true && baseUnitPrice !== null) {
      return 0;
    }
  }

  return (
    getPositiveNumber(item.unitPrice) ??
    getPositiveNumber(item.saleUnit?.price) ??
    getPositiveNumber(item.variant?.price) ??
    getNumber(item.product.price)
  );
}

function resolveOptimisticUnitPrice(params: {
  item: CartItemDto | null;
  product?: CartProductSnapshot;
}): number | null {
  return (
    getNumber(params.product?.price) ?? getExistingLineUnitPrice(params.item)
  );
}

export function createOptimisticCart(params: {
  cart: CartDto | null;
  catalogId: string;
  product?: CartProductSnapshot;
  guestName?: string | null;
  guestSessionId?: string | null;
  modifiers?: CartLineModifierSelection[] | null;
  productId: string;
  quantity: number;
  saleUnitId?: string;
  variantId?: string;
}): CartDto | null {
  const {
    cart,
    guestName,
    guestSessionId,
    catalogId,
    modifiers,
    product,
    productId,
    quantity,
    saleUnitId,
    variantId,
  } = params;
  const normalizedVariantId = normalizeVariantId(variantId);
  const normalizedSaleUnitId = normalizeSaleUnitId(saleUnitId);
  const normalizedGuestSessionId = normalizeCartGuestSessionId(guestSessionId);
  const normalizedModifiers = normalizeCartLineModifiers(modifiers);
  const modifierSignature = buildCartLineModifierSignature(normalizedModifiers);
  const matchesGuest = (entry: CartItemDto) =>
    !normalizedGuestSessionId ||
    getCartItemGuestSessionId(entry) === normalizedGuestSessionId;
  const item =
    cart?.items.find(
      (entry) =>
        matchesGuest(entry) &&
        entry.productId === productId &&
        normalizeVariantId(entry.variantId) === normalizedVariantId &&
        normalizeSaleUnitId(getCartItemSaleUnitId(entry)) ===
          normalizedSaleUnitId &&
        buildCartLineModifierSignature(getCartItemModifiers(entry)) ===
          modifierSignature,
    ) ??
    (!normalizedVariantId && !normalizedSaleUnitId && !modifierSignature
      ? cart?.items.find(
          (entry) =>
            matchesGuest(entry) &&
            entry.productId === productId &&
            !buildCartLineModifierSignature(getCartItemModifiers(entry)),
        )
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
    tableSession: null,
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
  const productPrice = resolveOptimisticUnitPrice({ item, product });
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
              id: [
                "optimistic",
                productId,
                variantId ?? "default",
                saleUnitId ?? "default",
                modifierSignature || "default",
              ].join("-"),
              productId,
              saleUnitId: saleUnitId ?? null,
              variantId: variantId ?? null,
              ...(guestName ? { guestName } : {}),
              ...(normalizedGuestSessionId
                ? { guestSessionId: normalizedGuestSessionId }
                : {}),
              quantity,
              baseQuantity: quantity,
              product: productShort,
              variant: null,
              saleUnit: null,
              modifiers: normalizedModifiers.map((modifier, index) => ({
                id: `optimistic-modifier-${index}`,
                productModifierGroupId: modifier.productModifierGroupId,
                productModifierOptionId: modifier.productModifierOptionId,
                catalogModifierGroupId: null,
                catalogModifierOptionId: null,
                groupCode: "",
                groupName: modifier.groupName ?? "",
                optionCode: "",
                optionName: modifier.optionName ?? "",
                quantity: modifier.quantity,
                unitPrice: getNumber(modifier.unitPrice) ?? 0,
              })),
              unitPrice: numericProductPrice,
              baseUnitPrice: numericProductPrice,
              discountPercent: 0,
              hasDiscount: false,
              lineTotal: numericProductPrice * quantity,
              createdAt: now,
              updatedAt: now,
            } satisfies CartItemDto & {
              guestName?: string;
              guestSessionId?: string;
              modifiers?: unknown[];
            },
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
