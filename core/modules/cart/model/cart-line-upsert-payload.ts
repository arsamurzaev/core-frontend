import type { CartItemDto } from "@/shared/api/generated/react-query";
import type { CartProductSnapshot } from "./cart-context.types";
import {
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
    normalizeSaleUnitId(getCartItemSaleUnitId(item)) === selection.saleUnitId
  );
}

function isDefaultProductCartLine(item: CartItemDto, productId: string): boolean {
  return (
    item.productId === productId &&
    !normalizeVariantId(item.variantId) &&
    !normalizeSaleUnitId(getCartItemSaleUnitId(item))
  );
}

export function findCartItemForLineSelection(
  items: CartItemDto[],
  selection: CartLineSelection,
): CartItemDto | null {
  const normalizedSelection = normalizeCartLineSelection(selection);

  if (normalizedSelection.variantId || normalizedSelection.saleUnitId) {
    return (
      items.find((item) => isMatchingCartLine(item, normalizedSelection)) ??
      null
    );
  }

  return (
    items.find((item) =>
      isDefaultProductCartLine(item, normalizedSelection.productId),
    ) ??
    items.find((item) => item.productId === normalizedSelection.productId) ??
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
    product,
    productId: normalizedSelection.productId,
    quantity,
    ...(saleUnitId ? { saleUnitId } : {}),
    ...(variantId ? { variantId } : {}),
  };
}
