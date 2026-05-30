export type CartDrawerFooterActionKind =
  | "collapse"
  | "complete-order"
  | "share"
  | "none";

export function resolveCartDrawerFooterAction(params: {
  canShare: boolean;
  hasCollapseAction: boolean;
  isManagerOrderCart: boolean;
}): CartDrawerFooterActionKind {
  if (params.isManagerOrderCart) {
    return "complete-order";
  }

  if (params.canShare) {
    return "share";
  }

  if (params.hasCollapseAction) {
    return "collapse";
  }

  return "none";
}

export function getCartDrawerShareButtonLabel(params: {
  hasOpenedShareDrawer: boolean;
  hasSharedCart: boolean;
}): string {
  return params.hasSharedCart || params.hasOpenedShareDrawer
    ? "Поделиться"
    : "Оформить заказ";
}
