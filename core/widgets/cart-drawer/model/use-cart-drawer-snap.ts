"use client";

import {
  CART_DRAWER_SCROLL_LOCK_CLASS,
  CART_DRAWER_SNAP_POINTS,
} from "@/core/widgets/cart-drawer/model/cart-drawer-state";
import {
  getPublicCartAccessKey,
  shouldExpandPublicCart,
  shouldLockCartDrawerPageScroll,
  type CartDrawerSnapPoint,
} from "@/core/widgets/cart-drawer/model/cart-drawer-snap";
import React from "react";

interface UseCartDrawerSnapParams {
  autoExpandPublicCartAccessKey: string | null | undefined;
  isPublicMode: boolean;
  publicAccessPublicKey: string | null | undefined;
  shouldHideCartWhileProductRouteOpen: boolean;
  shouldHideDrawer: boolean;
}

export function useCartDrawerSnap({
  autoExpandPublicCartAccessKey,
  isPublicMode,
  publicAccessPublicKey,
  shouldHideCartWhileProductRouteOpen,
  shouldHideDrawer,
}: UseCartDrawerSnapParams) {
  const [snapPoint, setSnapPoint] = React.useState<CartDrawerSnapPoint>(
    CART_DRAWER_SNAP_POINTS[0],
  );
  const autoExpandedPublicCartRef = React.useRef<string | null>(null);
  const isFullyExpanded = snapPoint === 1;
  const publicCartAccessKey = getPublicCartAccessKey({
    isPublicMode,
    publicAccessPublicKey,
  });

  React.useEffect(() => {
    if (!publicCartAccessKey) {
      autoExpandedPublicCartRef.current = null;
      return;
    }

    if (
      !shouldExpandPublicCart({
        autoExpandPublicCartAccessKey,
        lastExpandedPublicCartAccessKey: autoExpandedPublicCartRef.current,
        publicCartAccessKey,
      })
    ) {
      return;
    }

    setSnapPoint(1);
    autoExpandedPublicCartRef.current = publicCartAccessKey;
  }, [autoExpandPublicCartAccessKey, publicCartAccessKey]);

  React.useEffect(() => {
    const shouldLockPageScroll = shouldLockCartDrawerPageScroll({
      isFullyExpanded,
      shouldHideCartWhileProductRouteOpen,
      shouldHideDrawer,
    });

    document.documentElement.classList.toggle(
      CART_DRAWER_SCROLL_LOCK_CLASS,
      shouldLockPageScroll,
    );

    return () => {
      document.documentElement.classList.remove(CART_DRAWER_SCROLL_LOCK_CLASS);
    };
  }, [isFullyExpanded, shouldHideCartWhileProductRouteOpen, shouldHideDrawer]);

  return {
    isFullyExpanded,
    publicCartAccessKey,
    setSnapPoint,
    snapPoint,
  };
}
