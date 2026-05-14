import type {
  CheckoutConfig,
  CheckoutMethod,
} from "@/shared/lib/checkout-methods";

export interface CartDrawerContentState {
  hasCheckoutMethods: boolean;
  hasItems: boolean;
  normalizedComment: string;
  shouldShowCommentEditor: boolean;
  shouldShowReadonlyComment: boolean;
  shouldShowReadonlySection: boolean;
  shouldShowStatusMessage: boolean;
}

export function resolveCartDrawerContentState(params: {
  checkoutConfig: CheckoutConfig;
  isCheckoutEnabled?: boolean;
  checkoutMethod: CheckoutMethod | null;
  comment: string;
  isCommentLocked: boolean;
  isManagedPublicCart: boolean;
  itemsCount: number;
  status: string | null;
  statusMessage: string | null;
}): CartDrawerContentState {
  const hasItems = params.itemsCount > 0;
  const normalizedComment = params.comment.trim();
  const isCheckoutEnabled = params.isCheckoutEnabled !== false;
  const hasCheckoutMethod = isCheckoutEnabled && params.checkoutMethod !== null;
  const shouldShowReadonlyComment =
    isCheckoutEnabled && params.isCommentLocked && Boolean(normalizedComment);

  return {
    hasCheckoutMethods:
      isCheckoutEnabled &&
      params.checkoutConfig.enabledMethods.length > 0 &&
      hasCheckoutMethod,
    hasItems,
    normalizedComment,
    shouldShowCommentEditor: isCheckoutEnabled && !params.isCommentLocked,
    shouldShowReadonlyComment,
    shouldShowReadonlySection:
      params.isCommentLocked &&
      (hasCheckoutMethod || shouldShowReadonlyComment),
    shouldShowStatusMessage:
      !params.isManagedPublicCart &&
      params.status === "IN_PROGRESS" &&
      Boolean(params.statusMessage?.trim()),
  };
}
