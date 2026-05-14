export {
  getCartCheckoutData,
  getCartCheckoutMethod,
} from "./cart-drawer-checkout";

export const CART_DRAWER_SCROLL_LOCK_CLASS = "cart-drawer-scroll-lock";
export const CART_DRAWER_SNAP_POINTS = ["111px", 1] as const;

const CHECKOUT_CART_STATUSES = new Set([
  "SHARED",
  "IN_PROGRESS",
  "PAUSED",
  "CONVERTED",
  "CANCELLED",
  "EXPIRED",
]);

interface CartVisibilitySnapshot {
  publicKey?: string | null;
  status?: string | null;
}

export interface CartDrawerVisibilityState {
  canDeleteCurrentCart: boolean;
  hasPublicCartLink: boolean;
  hasSharedCart: boolean;
  isCheckoutCartStatus: boolean;
  shouldHideDrawer: boolean;
  shouldKeepEmptySharedCartOpen: boolean;
  shouldShowManagerOrderStartBar: boolean;
}

export function isCheckoutCartStatus(
  status: string | null | undefined,
): boolean {
  return status ? CHECKOUT_CART_STATUSES.has(status) : false;
}

export function resolveCartDrawerVisibility(params: {
  canCreateManagerOrder: boolean;
  cart: CartVisibilitySnapshot | null | undefined;
  hasItems: boolean;
  hasPreparedShareOrder: boolean;
  isPublicMode: boolean;
  publicAccessPublicKey: string | null | undefined;
  shouldUseCartUi: boolean;
  status?: string | null;
}): CartDrawerVisibilityState {
  const hasPublicCartLink = Boolean(params.cart?.publicKey);
  const hasSharedCart = Boolean(params.publicAccessPublicKey);
  const checkoutCartStatus = isCheckoutCartStatus(
    params.status ?? params.cart?.status,
  );
  const canDeleteCurrentCart =
    !params.isPublicMode &&
    Boolean(params.cart) &&
    (params.hasItems || hasPublicCartLink);
  const shouldKeepEmptySharedCartOpen =
    params.isPublicMode ||
    hasPublicCartLink ||
    hasSharedCart ||
    params.hasPreparedShareOrder ||
    checkoutCartStatus;
  const shouldHideDrawer =
    !params.shouldUseCartUi ||
    (!params.hasItems && !shouldKeepEmptySharedCartOpen);

  return {
    canDeleteCurrentCart,
    hasPublicCartLink,
    hasSharedCart,
    isCheckoutCartStatus: checkoutCartStatus,
    shouldHideDrawer,
    shouldKeepEmptySharedCartOpen,
    shouldShowManagerOrderStartBar:
      params.canCreateManagerOrder && !params.shouldUseCartUi,
  };
}
