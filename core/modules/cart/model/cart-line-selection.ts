import {
  buildCartLineModifierSignature,
  buildCartLineKey,
  normalizeCartLineModifiers,
  normalizeSaleUnitId,
  normalizeVariantId,
  type CartLineModifierSelection,
  type NormalizedCartLineModifierSelection,
} from "@/core/modules/cart/model/cart-line-key";
import { normalizeCartGuestSessionId } from "./cart-guest";

export interface CartLineSelection {
  guestName?: string | null;
  guestSessionId?: string | null;
  modifiers?: CartLineModifierSelection[] | null;
  productId: string;
  saleUnitId?: string | null;
  variantId?: string | null;
}

export interface NormalizedCartLineSelection {
  guestName?: string;
  guestSessionId?: string;
  modifiers: NormalizedCartLineModifierSelection[];
  modifierSignature: string;
  productId: string;
  saleUnitId?: string;
  variantId?: string;
}

export type CartQuantityScope = "line" | "product";

export function normalizeCartLineSelection(
  selection: CartLineSelection,
): NormalizedCartLineSelection {
  const variantId = normalizeVariantId(selection.variantId);
  const saleUnitId = normalizeSaleUnitId(selection.saleUnitId);
  const guestSessionId = normalizeCartGuestSessionId(selection.guestSessionId);
  const guestName = selection.guestName?.trim();
  const modifiers = normalizeCartLineModifiers(selection.modifiers);
  const modifierSignature = buildCartLineModifierSignature(modifiers);

  return {
    productId: selection.productId.trim(),
    modifiers,
    modifierSignature,
    ...(guestName ? { guestName } : {}),
    ...(guestSessionId ? { guestSessionId } : {}),
    ...(variantId ? { variantId } : {}),
    ...(saleUnitId ? { saleUnitId } : {}),
  };
}

export function buildCartLineSelectionKey(
  selection: CartLineSelection,
): string {
  const normalized = normalizeCartLineSelection(selection);
  const lineKey = buildCartLineKey(
    normalized.productId,
    normalized.variantId,
    normalized.saleUnitId,
    normalized.modifiers,
  );

  return normalized.guestSessionId
    ? `${lineKey}:guest:${normalized.guestSessionId}`
    : lineKey;
}

export function shouldUseLineQuantity(
  selection: CartLineSelection,
  quantityScope?: CartQuantityScope,
): boolean {
  const normalized = normalizeCartLineSelection(selection);

  return (
    quantityScope === "line" ||
    Boolean(
      normalized.variantId ||
        normalized.saleUnitId ||
        normalized.modifierSignature,
    )
  );
}

export function getCartLineSelectionQuantity(params: {
  quantityByLineKey: Record<string, number>;
  quantityByProductId: Record<string, number>;
  quantityScope?: CartQuantityScope;
  selection: CartLineSelection;
}): number {
  const normalized = normalizeCartLineSelection(params.selection);

  if (shouldUseLineQuantity(normalized, params.quantityScope)) {
    return params.quantityByLineKey[buildCartLineSelectionKey(normalized)] ?? 0;
  }

  return params.quantityByProductId[normalized.productId] ?? 0;
}
