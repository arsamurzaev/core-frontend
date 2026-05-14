import type { PrepareShareOrderInput } from "@/core/modules/cart/model/cart-context.types";
import type { CatalogContactDtoType } from "@/shared/api/generated/react-query";
import {
  buildCheckoutSummary,
  normalizeCheckoutData,
  type CheckoutData,
  type CheckoutLocation,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";

type CartWithCheckout = {
  checkoutContacts?: Partial<Record<CatalogContactDtoType, string>> | null;
  checkoutData?: CheckoutData | null;
  checkoutMethod?: CheckoutMethod | null;
};

export interface CartDrawerCheckoutLocks {
  isCheckoutLocked: boolean;
  isCommentLocked: boolean;
}

export interface CartDrawerCheckoutDisplay {
  displayedCheckoutData: CheckoutData;
  displayedCheckoutMethod: CheckoutMethod | null;
  displayedComment: string;
}

export function getCartCheckoutData(cart: unknown): CheckoutData | null {
  return (cart as CartWithCheckout | null | undefined)?.checkoutData ?? null;
}

export function getCartCheckoutMethod(cart: unknown): CheckoutMethod | null {
  return (cart as CartWithCheckout | null | undefined)?.checkoutMethod ?? null;
}

export function resolveCartDrawerCheckoutLocks(params: {
  hasPreparedShareOrder: boolean;
  hasSharedCart: boolean;
  isManagedPublicCart: boolean;
  isPublicMode: boolean;
}): CartDrawerCheckoutLocks {
  const isCommentLocked =
    params.isManagedPublicCart ||
    params.isPublicMode ||
    params.hasSharedCart ||
    params.hasPreparedShareOrder;

  return {
    isCheckoutLocked: isCommentLocked,
    isCommentLocked,
  };
}

export function resolveCartDrawerCheckoutDisplay(params: {
  cart: unknown;
  checkoutData: CheckoutData;
  isCheckoutEnabled?: boolean;
  checkoutMethod: CheckoutMethod | null;
  comment: string;
  isCheckoutLocked: boolean;
  isCommentLocked: boolean;
}): CartDrawerCheckoutDisplay {
  const isCheckoutEnabled = params.isCheckoutEnabled !== false;

  return {
    displayedCheckoutData: isCheckoutEnabled
      ? ((params.isCheckoutLocked ? getCartCheckoutData(params.cart) : null) ??
        params.checkoutData)
      : {},
    displayedCheckoutMethod: isCheckoutEnabled
      ? (getCartCheckoutMethod(params.cart) ?? params.checkoutMethod)
      : null,
    displayedComment: params.isCommentLocked
      ? ((params.cart as { comment?: string | null } | null | undefined)
          ?.comment ?? params.comment)
      : params.comment,
  };
}

export function validateCartDrawerCheckout(params: {
  checkoutData: CheckoutData;
  isCheckoutEnabled?: boolean;
  checkoutLocation: CheckoutLocation;
  checkoutMethod: CheckoutMethod | null;
}) {
  if (params.isCheckoutEnabled === false || !params.checkoutMethod) {
    return { data: {}, error: null };
  }

  return normalizeCheckoutData({
    data: params.checkoutData,
    location: params.checkoutLocation,
    method: params.checkoutMethod,
  });
}

export function buildCartDrawerCheckoutOrderInput(params: {
  checkoutValidationData: CheckoutData;
  comment: string;
  displayedCheckoutData: CheckoutData;
  displayedCheckoutMethod: CheckoutMethod | null;
  isCheckoutEnabled?: boolean;
  isCheckoutLocked: boolean;
}): PrepareShareOrderInput {
  if (params.isCheckoutEnabled === false) {
    return {};
  }

  const checkoutData = params.isCheckoutLocked
    ? params.displayedCheckoutData
    : params.checkoutValidationData;
  const checkoutSummary = params.displayedCheckoutMethod
    ? buildCheckoutSummary({
        data: checkoutData,
        method: params.displayedCheckoutMethod,
      })
    : [];

  return {
    checkoutData,
    ...(params.displayedCheckoutMethod
      ? { checkoutMethod: params.displayedCheckoutMethod }
      : {}),
    checkoutSummary,
    comment: params.comment,
  };
}
