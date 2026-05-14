"use client";

import type { PrepareShareOrderInput } from "@/core/modules/cart/model/cart-context.types";
import {
  getInitialCheckoutMethod,
  type CheckoutConfig,
  type CheckoutData,
  type CheckoutLocation,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import React from "react";
import {
  buildCartDrawerCheckoutOrderInput,
  resolveCartDrawerCheckoutDisplay,
  resolveCartDrawerCheckoutLocks,
  validateCartDrawerCheckout,
} from "./cart-drawer-checkout";

interface UseCartDrawerCheckoutParams {
  cart: unknown;
  checkoutConfig: CheckoutConfig;
  isCheckoutEnabled: boolean;
  checkoutLocation: CheckoutLocation;
  hasSharedCart: boolean;
  isManagedPublicCart: boolean;
  isPublicMode: boolean;
}

export function useCartDrawerCheckout({
  cart,
  checkoutConfig,
  isCheckoutEnabled,
  checkoutLocation,
  hasSharedCart,
  isManagedPublicCart,
  isPublicMode,
}: UseCartDrawerCheckoutParams) {
  const initialCheckoutMethod = React.useMemo(
    () => (isCheckoutEnabled ? getInitialCheckoutMethod(checkoutConfig) : null),
    [checkoutConfig, isCheckoutEnabled],
  );
  const [comment, setComment] = React.useState("");
  const [checkoutMethod, setCheckoutMethod] =
    React.useState<CheckoutMethod | null>(initialCheckoutMethod);
  const [checkoutData, setCheckoutData] = React.useState<CheckoutData>({});
  const [hasPreparedShareOrder, setHasPreparedShareOrder] =
    React.useState(false);
  const cartId = (cart as { id?: string | null } | null | undefined)?.id ?? null;

  const { isCheckoutLocked, isCommentLocked } = React.useMemo(
    () =>
      resolveCartDrawerCheckoutLocks({
        hasPreparedShareOrder,
        hasSharedCart,
        isManagedPublicCart,
        isPublicMode,
      }),
    [
      hasPreparedShareOrder,
      hasSharedCart,
      isManagedPublicCart,
      isPublicMode,
    ],
  );
  const {
    displayedCheckoutData,
    displayedCheckoutMethod,
    displayedComment,
  } = React.useMemo(
    () =>
      resolveCartDrawerCheckoutDisplay({
        cart,
        checkoutData,
        isCheckoutEnabled,
        checkoutMethod,
        comment,
        isCheckoutLocked,
        isCommentLocked,
      }),
    [
      cart,
      checkoutData,
      checkoutMethod,
      comment,
      isCheckoutEnabled,
      isCheckoutLocked,
      isCommentLocked,
    ],
  );
  const checkoutValidation = React.useMemo(
    () =>
      validateCartDrawerCheckout({
        checkoutData,
        isCheckoutEnabled,
        checkoutLocation,
        checkoutMethod,
      }),
    [checkoutData, checkoutLocation, checkoutMethod, isCheckoutEnabled],
  );

  React.useEffect(() => {
    setHasPreparedShareOrder(false);
    setComment("");
    setCheckoutMethod(initialCheckoutMethod);
    setCheckoutData({});
  }, [cartId, initialCheckoutMethod]);

  React.useEffect(() => {
    if (!isCheckoutEnabled) {
      setCheckoutMethod(null);
      setCheckoutData({});
      return;
    }

    if (
      checkoutMethod &&
      checkoutConfig.enabledMethods.includes(checkoutMethod)
    ) {
      return;
    }

    setCheckoutMethod(initialCheckoutMethod);
    setCheckoutData({});
  }, [
    checkoutConfig.enabledMethods,
    checkoutMethod,
    initialCheckoutMethod,
    isCheckoutEnabled,
  ]);

  const handleCheckoutChange = React.useCallback(
    (method: CheckoutMethod, data: CheckoutData) => {
      if (!isCheckoutEnabled) {
        return;
      }

      setCheckoutMethod(method);
      setCheckoutData(data);
    },
    [isCheckoutEnabled],
  );

  const markSharePrepared = React.useCallback(() => {
    setHasPreparedShareOrder(true);
  }, []);

  const buildOrderInput = React.useCallback((): PrepareShareOrderInput => {
    return buildCartDrawerCheckoutOrderInput({
      checkoutValidationData: checkoutValidation.data,
      comment,
      displayedCheckoutData,
      displayedCheckoutMethod,
      isCheckoutEnabled,
      isCheckoutLocked,
    });
  }, [
    checkoutValidation.data,
    comment,
    displayedCheckoutData,
    displayedCheckoutMethod,
    isCheckoutEnabled,
    isCheckoutLocked,
  ]);

  return {
    buildOrderInput,
    checkoutData,
    checkoutMethod,
    checkoutValidation,
    comment,
    displayedCheckoutData,
    displayedCheckoutMethod,
    displayedComment,
    handleCheckoutChange,
    hasPreparedShareOrder,
    isCheckoutLocked,
    isCommentLocked,
    markSharePrepared,
    setComment,
  };
}
