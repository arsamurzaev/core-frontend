import type { CartItemDto } from "@/shared/api/generated/react-query";

export type CartGuestFields = {
  guestName?: string | null;
  guestSessionId?: string | null;
};

export function normalizeCartGuestSessionId(
  value?: string | null,
): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function getCartItemGuestSessionId(item: CartItemDto): string | null {
  return (
    normalizeCartGuestSessionId(
      (item as CartItemDto & CartGuestFields).guestSessionId,
    ) ?? null
  );
}

export function getCartItemGuestName(item: CartItemDto): string | null {
  const trimmed = (item as CartItemDto & CartGuestFields).guestName?.trim();
  return trimmed || null;
}

export function isCartItemForGuest(
  item: CartItemDto,
  guestSessionId?: string | null,
): boolean {
  const normalizedGuestSessionId = normalizeCartGuestSessionId(guestSessionId);

  if (!normalizedGuestSessionId) {
    return true;
  }

  return getCartItemGuestSessionId(item) === normalizedGuestSessionId;
}
