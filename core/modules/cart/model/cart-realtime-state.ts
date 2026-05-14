import type { CartDto } from "@/shared/api/generated/react-query";

export function mergeCartRealtimeStatus(
  nextCart: CartDto | null,
  previousCart: CartDto | null | undefined,
): CartDto | null {
  if (!nextCart || !previousCart || nextCart.id !== previousCart.id) {
    return nextCart;
  }

  const nextUpdatedAt = Date.parse(nextCart.updatedAt);
  const previousUpdatedAt = Date.parse(previousCart.updatedAt);
  const shouldKeepPreviousStatus =
    Number.isFinite(nextUpdatedAt) &&
    Number.isFinite(previousUpdatedAt) &&
    nextUpdatedAt < previousUpdatedAt;

  if (!shouldKeepPreviousStatus) {
    return nextCart;
  }

  return {
    ...nextCart,
    assignedManagerId: previousCart.assignedManagerId,
    managerLastSeenAt: previousCart.managerLastSeenAt,
    managerSessionStartedAt: previousCart.managerSessionStartedAt,
    status: previousCart.status,
    statusChangedAt: previousCart.statusChangedAt,
    statusMessage: previousCart.statusMessage,
  };
}

export function getCartRealtimeVersion(cart: CartDto | null | undefined): number {
  if (!cart) {
    return 0;
  }

  const updatedAt = Date.parse(cart.updatedAt);
  const statusChangedAt = Date.parse(cart.statusChangedAt);

  return Math.max(
    Number.isFinite(updatedAt) ? updatedAt : 0,
    Number.isFinite(statusChangedAt) ? statusChangedAt : 0,
  );
}

export function isStaleRealtimeCart(
  nextCart: CartDto | null,
  previousCart: CartDto | null | undefined,
): boolean {
  if (!nextCart || !previousCart || nextCart.id !== previousCart.id) {
    return false;
  }

  return getCartRealtimeVersion(nextCart) < getCartRealtimeVersion(previousCart);
}
