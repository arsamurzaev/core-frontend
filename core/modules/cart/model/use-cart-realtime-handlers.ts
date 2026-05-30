"use client";

import {
  isInactiveHallTableCart,
  isInactiveSharedCartStatus,
} from "@/core/modules/cart/model/cart-events";
import {
  applyCartRealtimeData,
  removePublicCartRealtimeData,
} from "@/core/modules/cart/model/cart-realtime-cache";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import { cartQueryKeys } from "@/core/modules/cart/model/cart-query-keys";
import {
  cartControllerCreateOrGetCurrent,
  type CartDto,
} from "@/shared/api/generated/react-query";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import type { QueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";

interface UseCartRealtimeHandlersParams {
  clearStoredPublicAccess: () => void;
  isManagedPublicCart: boolean;
  queryClient: QueryClient;
  setCurrentCartData: (
    cart: CartDto | null,
    options?: { ignoreStale?: boolean },
  ) => void;
  setPublicCartData: (
    access: CartPublicAccess | null,
    cart: CartDto | null,
    options?: { ignoreStale?: boolean },
  ) => void;
  storedPublicAccess: CartPublicAccess | null;
  userRole?: string | null;
}

export function useCartRealtimeHandlers({
  clearStoredPublicAccess,
  isManagedPublicCart,
  queryClient,
  setCurrentCartData,
  setPublicCartData,
  storedPublicAccess,
  userRole,
}: UseCartRealtimeHandlersParams) {
  const lastClosedOrderToastKeyRef = React.useRef<string | null>(null);
  const resettingInactiveCartRef = React.useRef<string | null>(null);

  const dismissPublicCart = React.useCallback(
    (access: CartPublicAccess | null) => {
      removePublicCartRealtimeData({
        access,
        clearStoredPublicAccess,
        queryClient,
      });
    },
    [clearStoredPublicAccess, queryClient],
  );

  const replaceInactiveUserCart = React.useCallback(
    async (cart: CartDto, access?: CartPublicAccess | null) => {
      const resetKey = `${cart.id}:${cart.status}`;

      if (resettingInactiveCartRef.current === resetKey) {
        return;
      }

      resettingInactiveCartRef.current = resetKey;

      try {
        if (access) {
          queryClient.removeQueries({
            queryKey: cartQueryKeys.public(access.publicKey),
          });
        }

        if (
          cart.publicKey &&
          storedPublicAccess?.publicKey === cart.publicKey
        ) {
          clearStoredPublicAccess();
        }

        const response = await cartControllerCreateOrGetCurrent();
        setCurrentCartData(response.cart);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Не удалось обновить корзину.",
        );
      } finally {
        resettingInactiveCartRef.current = null;
      }
    },
    [
      clearStoredPublicAccess,
      queryClient,
      setCurrentCartData,
      storedPublicAccess?.publicKey,
    ],
  );

  const handleSseCartUpdated = React.useCallback(
    (cart: CartDto, access?: CartPublicAccess | null) => {
      applyCartRealtimeData({
        access,
        cart,
        setCurrentCartData,
        setPublicCartData,
      });
    },
    [setCurrentCartData, setPublicCartData],
  );

  const handleSseCartStatusChanged = React.useCallback(
    (cart: CartDto, access?: CartPublicAccess | null) => {
      applyCartRealtimeData({
        access,
        cart,
        setCurrentCartData,
        setPublicCartData,
      });

      const isCatalogManager = isCatalogManagerRole(userRole);
      const isInactiveHallTable = isInactiveHallTableCart(cart, access);

      if (cart.status === "CONVERTED" && !isCatalogManager) {
        const toastKey = `${cart.id}:${cart.statusChangedAt ?? cart.updatedAt}`;

        if (lastClosedOrderToastKeyRef.current !== toastKey) {
          lastClosedOrderToastKeyRef.current = toastKey;
          toast.success(
            isInactiveHallTable
              ? "Заказ принят. Можно сделать дозаказ."
              : "Заказ был успешно закрыт.",
          );
        }
      }

      if (!isInactiveSharedCartStatus(cart.status)) {
        return;
      }

      if (access && isManagedPublicCart) {
        dismissPublicCart(access);
        return;
      }

      if (isInactiveHallTable && !isCatalogManager) {
        dismissPublicCart(access ?? null);
        return;
      }

      if (!isCatalogManager && (access || cart.publicKey)) {
        return;
      }

      if (!isCatalogManager) {
        void replaceInactiveUserCart(cart, access);
        return;
      }

      if (access) {
        dismissPublicCart(access);
      }
    },
    [
      dismissPublicCart,
      isManagedPublicCart,
      replaceInactiveUserCart,
      setCurrentCartData,
      setPublicCartData,
      userRole,
    ],
  );

  return {
    dismissPublicCart,
    handleSseCartStatusChanged,
    handleSseCartUpdated,
  };
}
