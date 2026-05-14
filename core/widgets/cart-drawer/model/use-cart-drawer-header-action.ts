"use client";

import { CART_DRAWER_SNAP_POINTS } from "@/core/widgets/cart-drawer/model/cart-drawer-state";
import { confirm } from "@/shared/ui/confirmation";
import React from "react";
import { toast } from "sonner";
import {
  DETACH_PUBLIC_CART_CONFIRMATION,
  DETACH_PUBLIC_CART_SUCCESS_MESSAGE,
  getDeleteCartConfirmationCopy,
  getDeleteCartSuccessMessage,
  resolveCartDrawerHeaderAction,
} from "./cart-drawer-header-action";

type CartHeaderActionSnapshot = {
  assignedManagerId?: string | null;
  publicKey?: string | null;
  status?: string | null;
};

interface UseCartDrawerHeaderActionParams {
  canDeleteCurrentCart: boolean;
  cart: CartHeaderActionSnapshot | null | undefined;
  deleteCurrentCart: () => Promise<void>;
  detachPublicCart: () => void;
  hasItems: boolean;
  isManagedPublicCart: boolean;
  isPublicMode: boolean;
  setSnapPoint: (snapPoint: string | number | null) => void;
}

function getHeaderActionErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не удалось обновить корзину.";
}

export function useCartDrawerHeaderAction({
  canDeleteCurrentCart,
  cart,
  deleteCurrentCart,
  detachPublicCart,
  hasItems,
  isManagedPublicCart,
  isPublicMode,
  setSnapPoint,
}: UseCartDrawerHeaderActionParams) {
  return React.useCallback(async () => {
    const action = resolveCartDrawerHeaderAction({
      canDeleteCurrentCart,
      hasItems,
      isManagedPublicCart,
      isPublicMode,
    });

    if (action === "none") {
      return;
    }

    if (action === "detach-public-cart") {
      const isConfirmed = await confirm(DETACH_PUBLIC_CART_CONFIRMATION);

      if (!isConfirmed) {
        return;
      }

      detachPublicCart();
      setSnapPoint(CART_DRAWER_SNAP_POINTS[0]);
      toast.success(DETACH_PUBLIC_CART_SUCCESS_MESSAGE);
      return;
    }

    const isConfirmed = await confirm(getDeleteCartConfirmationCopy(cart));

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteCurrentCart();
      setSnapPoint(CART_DRAWER_SNAP_POINTS[0]);
      toast.success(getDeleteCartSuccessMessage(cart));
    } catch (error) {
      toast.error(getHeaderActionErrorMessage(error));
    }
  }, [
    canDeleteCurrentCart,
    cart,
    deleteCurrentCart,
    detachPublicCart,
    hasItems,
    isManagedPublicCart,
    isPublicMode,
    setSnapPoint,
  ]);
}
