export type CartDrawerSnapPoint = string | number | null;

export function getPublicCartAccessKey(params: {
  isPublicMode: boolean;
  publicAccessPublicKey: string | null | undefined;
}): string | null {
  return params.isPublicMode && params.publicAccessPublicKey
    ? params.publicAccessPublicKey
    : null;
}

export function shouldExpandPublicCart(params: {
  autoExpandPublicCartAccessKey: string | null | undefined;
  lastExpandedPublicCartAccessKey: string | null;
  publicCartAccessKey: string | null;
}): boolean {
  return (
    Boolean(params.publicCartAccessKey) &&
    params.autoExpandPublicCartAccessKey === params.publicCartAccessKey &&
    params.lastExpandedPublicCartAccessKey !== params.publicCartAccessKey
  );
}

export function shouldCollapsePublicCartAccessChange(params: {
  autoExpandPublicCartAccessKey: string | null | undefined;
  previousPublicCartAccessKey: string | null;
  publicCartAccessKey: string | null;
}): boolean {
  if (params.previousPublicCartAccessKey === params.publicCartAccessKey) {
    return false;
  }

  if (
    params.publicCartAccessKey &&
    params.autoExpandPublicCartAccessKey === params.publicCartAccessKey
  ) {
    return false;
  }

  return Boolean(
    params.previousPublicCartAccessKey || params.publicCartAccessKey,
  );
}

export function shouldLockCartDrawerPageScroll(params: {
  isFullyExpanded: boolean;
  shouldHideCartWhileProductRouteOpen: boolean;
  shouldHideDrawer: boolean;
}): boolean {
  return (
    params.isFullyExpanded &&
    !params.shouldHideDrawer &&
    !params.shouldHideCartWhileProductRouteOpen
  );
}
