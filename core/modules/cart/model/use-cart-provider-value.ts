"use client";

import type { CartDto } from "@/shared/api/generated/react-query";
import React from "react";
import type { CartContextValue } from "./cart-context.types";
import type { CartItemView } from "./cart-item-view";
import type { CartMode } from "./cart-constants";
import type { CartPublicAccess } from "./cart-public-link";

interface UseCartProviderValueParams
  extends Pick<
    CartContextValue,
    | "autoExpandPublicCartAccessKey"
    | "canCreateManagerOrder"
    | "canShare"
    | "catalogMode"
    | "clearCart"
    | "completeManagedOrder"
    | "deleteCurrentCart"
    | "decrementLine"
    | "decrementProduct"
    | "detachPublicCart"
    | "incrementLine"
    | "incrementProduct"
    | "isBusy"
    | "isHydrated"
    | "isManagerOrderCart"
    | "isManagedPublicCart"
    | "isOwnSharedCart"
    | "prepareShareOrder"
    | "quantityByLineKey"
    | "quantityByProductId"
    | "setLineQuantity"
    | "setProductQuantity"
    | "shouldUseCartUi"
    | "startManagerOrder"
    | "totals"
  > {
  activeCart: CartDto | null;
  activeCartError: unknown;
  activeCartLoading: boolean;
  activeCartStatus: CartDto["status"] | null;
  activeCartStatusMessage: string | null;
  isSessionLoading: boolean;
  items: CartItemView[];
  mode: CartMode;
  publicAccess: CartPublicAccess | null;
}

export function useCartProviderValue({
  activeCart,
  activeCartError,
  activeCartLoading,
  activeCartStatus,
  activeCartStatusMessage,
  autoExpandPublicCartAccessKey,
  canCreateManagerOrder,
  canShare,
  catalogMode,
  clearCart,
  completeManagedOrder,
  deleteCurrentCart,
  decrementLine,
  decrementProduct,
  detachPublicCart,
  incrementLine,
  incrementProduct,
  isBusy,
  isHydrated,
  isManagerOrderCart,
  isManagedPublicCart,
  isOwnSharedCart,
  isSessionLoading,
  items,
  mode,
  prepareShareOrder,
  publicAccess,
  quantityByLineKey,
  quantityByProductId,
  setLineQuantity,
  setProductQuantity,
  shouldUseCartUi,
  startManagerOrder,
  totals,
}: UseCartProviderValueParams): CartContextValue {
  return React.useMemo<CartContextValue>(
    () => ({
      autoExpandPublicCartAccessKey,
      canCreateManagerOrder,
      canShare,
      cart: activeCart,
      catalogMode,
      clearCart,
      completeManagedOrder,
      deleteCurrentCart,
      decrementLine,
      decrementProduct,
      detachPublicCart,
      incrementLine,
      incrementProduct,
      setLineQuantity,
      setProductQuantity,
      isBusy,
      isHydrated,
      isLoading:
        isSessionLoading ||
        activeCartLoading ||
        (!activeCart && Boolean(activeCartError)),
      isManagerOrderCart,
      isManagedPublicCart,
      isOwnSharedCart,
      isPublicMode: mode === "public",
      items,
      mode,
      prepareShareOrder,
      publicAccess,
      quantityByLineKey,
      quantityByProductId,
      shouldUseCartUi,
      startManagerOrder,
      status: activeCartStatus,
      statusMessage: activeCartStatusMessage,
      totals,
    }),
    [
      activeCart,
      activeCartError,
      activeCartLoading,
      activeCartStatus,
      activeCartStatusMessage,
      autoExpandPublicCartAccessKey,
      canCreateManagerOrder,
      canShare,
      catalogMode,
      clearCart,
      completeManagedOrder,
      deleteCurrentCart,
      decrementLine,
      decrementProduct,
      detachPublicCart,
      incrementLine,
      incrementProduct,
      isBusy,
      isHydrated,
      isManagerOrderCart,
      isManagedPublicCart,
      isOwnSharedCart,
      isSessionLoading,
      items,
      mode,
      prepareShareOrder,
      publicAccess,
      quantityByLineKey,
      quantityByProductId,
      setLineQuantity,
      setProductQuantity,
      shouldUseCartUi,
      startManagerOrder,
      totals,
    ],
  );
}
