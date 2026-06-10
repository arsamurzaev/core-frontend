import type { CartItemDto } from "@/shared/api/generated/react-query";
import { isCartItemForGuest } from "./cart-guest";
import type { CartProductSnapshot } from "./cart-context.types";
import {
  getCartItemModifiers,
  getCartItemSaleUnitId,
  normalizeSaleUnitId,
  normalizeVariantId,
} from "./cart-line-key";
import {
  normalizeCartLineSelection,
  type CartLineSelection,
  type NormalizedCartLineSelection,
} from "./cart-line-selection";

export interface CartLineUpsertPayload {
  guestName?: string;
  guestSessionId?: string;
  modifiers?: Array<{
    productModifierGroupId: string;
    productModifierOptionId: string;
    quantity: number;
  }>;
  product?: CartProductSnapshot;
  productId: string;
  quantity: number;
  saleUnitId?: string;
  variantId?: string;
}

interface BuildCartLineUpsertPayloadInput {
  cartItem?: CartItemDto | null;
  product?: CartProductSnapshot;
  quantity: number;
  selection: CartLineSelection;
}

function isMatchingCartLine(
  item: CartItemDto,
  selection: NormalizedCartLineSelection,
): boolean {
  return (
    item.productId === selection.productId &&
    normalizeVariantId(item.variantId) === selection.variantId &&
    normalizeSaleUnitId(getCartItemSaleUnitId(item)) === selection.saleUnitId &&
    normalizeCartLineSelection({
      productId: item.productId,
      modifiers: getCartItemModifiers(item),
    }).modifierSignature === selection.modifierSignature
  );
}

function isDefaultProductCartLine(
  item: CartItemDto,
  productId: string,
): boolean {
  return (
    item.productId === productId &&
    !normalizeVariantId(item.variantId) &&
    !normalizeSaleUnitId(getCartItemSaleUnitId(item)) &&
    !normalizeCartLineSelection({
      productId: item.productId,
      modifiers: getCartItemModifiers(item),
    }).modifierSignature
  );
}

export function findCartItemForLineSelection(
  items: CartItemDto[],
  selection: CartLineSelection,
  options: { guestSessionId?: string | null } = {},
): CartItemDto | null {
  const normalizedSelection = normalizeCartLineSelection(selection);
  const effectiveGuestSessionId =
    normalizedSelection.guestSessionId ?? options.guestSessionId;
  const guestItems = items.filter((item) =>
    isCartItemForGuest(item, effectiveGuestSessionId),
  );

  if (
    normalizedSelection.variantId ||
    normalizedSelection.saleUnitId ||
    normalizedSelection.modifierSignature
  ) {
    return (
      guestItems.find((item) =>
        isMatchingCartLine(item, normalizedSelection),
      ) ?? null
    );
  }

  return (
    guestItems.find((item) =>
      isDefaultProductCartLine(item, normalizedSelection.productId),
    ) ??
    guestItems.find(
      (item) => item.productId === normalizedSelection.productId,
    ) ??
    null
  );
}

export function buildCartLineUpsertPayload({
  cartItem,
  product,
  quantity,
  selection,
}: BuildCartLineUpsertPayloadInput): CartLineUpsertPayload {
  const normalizedSelection = normalizeCartLineSelection(selection);
  const variantId =
    normalizedSelection.variantId ?? normalizeVariantId(cartItem?.variantId);
  const saleUnitId =
    normalizedSelection.saleUnitId ??
    normalizeSaleUnitId(cartItem ? getCartItemSaleUnitId(cartItem) : null);

  return {
    ...(normalizedSelection.guestName
      ? { guestName: normalizedSelection.guestName }
      : {}),
    ...(normalizedSelection.guestSessionId
      ? { guestSessionId: normalizedSelection.guestSessionId }
      : {}),
    ...(normalizedSelection.modifiers.length
      ? {
          modifiers: normalizedSelection.modifiers.map((modifier) => ({
            productModifierGroupId: modifier.productModifierGroupId,
            productModifierOptionId: modifier.productModifierOptionId,
            quantity: modifier.quantity,
          })),
        }
      : {}),
    product,
    productId: normalizedSelection.productId,
    quantity,
    ...(saleUnitId ? { saleUnitId } : {}),
    ...(variantId ? { variantId } : {}),
  };
}
