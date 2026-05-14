"use client";

import {
  isCartNotFoundError,
  isCartUnauthorizedError,
} from "@/core/modules/cart/model/cart-api-errors";
import { cartQueryKeys } from "@/core/modules/cart/model/cart-query-keys";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import type { CartMode } from "@/core/modules/cart/model/cart-constants";
import {
  cartControllerGetCurrent,
  cartControllerGetPublicCart,
  type CartDto,
} from "@/shared/api/generated/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import React from "react";

interface UseCartQueriesParams {
  canCreateManagerOrder: boolean;
  clearActiveManagerOrder: () => void;
  clearStoredCurrentCart: () => void;
  hasActiveManagerOrder: boolean;
  hasStoredCurrentCart: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isSessionLoading: boolean;
  notifyPublicCartUnavailable: () => void;
  onCurrentCartFound: () => void;
  queryClient: QueryClient;
  storedPublicAccess: CartPublicAccess | null;
}

export function useCartQueries({
  canCreateManagerOrder,
  clearActiveManagerOrder,
  clearStoredCurrentCart,
  hasActiveManagerOrder,
  hasStoredCurrentCart,
  isAuthenticated,
  isHydrated,
  isSessionLoading,
  notifyPublicCartUnavailable,
  onCurrentCartFound,
  queryClient,
  storedPublicAccess,
}: UseCartQueriesParams) {
  const currentCartNotFoundHandledRef = React.useRef(false);
  const shouldEnableCurrentCartQuery =
    isHydrated &&
    hasStoredCurrentCart &&
    !isSessionLoading &&
    (!isAuthenticated ||
      Boolean(storedPublicAccess) ||
      (canCreateManagerOrder && hasActiveManagerOrder));

  const currentCartQuery = useQuery({
    queryKey: cartQueryKeys.current,
    queryFn: async (): Promise<CartDto | null> => {
      try {
        const response = await cartControllerGetCurrent();
        return response.cart;
      } catch (error) {
        if (isCartNotFoundError(error)) {
          return null;
        }

        throw error;
      }
    },
    enabled: shouldEnableCurrentCartQuery,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (isCartNotFoundError(error)) {
        return false;
      }

      return failureCount < 2;
    },
  });

  React.useEffect(() => {
    if (!currentCartQuery.isFetched) {
      return;
    }

    if (currentCartQuery.data !== null) {
      onCurrentCartFound();
      currentCartNotFoundHandledRef.current = false;
      return;
    }

    if (currentCartNotFoundHandledRef.current) {
      return;
    }

    currentCartNotFoundHandledRef.current = true;
    clearStoredCurrentCart();
    clearActiveManagerOrder();
    queryClient.removeQueries({ queryKey: cartQueryKeys.current });
  }, [
    clearActiveManagerOrder,
    clearStoredCurrentCart,
    currentCartQuery.data,
    currentCartQuery.isFetched,
    onCurrentCartFound,
    queryClient,
  ]);

  const currentCart = currentCartQuery.data ?? null;
  const isOwnSharedCart = React.useMemo(
    () =>
      Boolean(
        storedPublicAccess?.publicKey &&
          currentCart?.publicKey &&
          storedPublicAccess.publicKey === currentCart.publicKey,
      ),
    [currentCart?.publicKey, storedPublicAccess?.publicKey],
  );
  const mode: CartMode =
    storedPublicAccess && !isOwnSharedCart ? "public" : "current";
  const publicCartQuery = useQuery({
    queryKey: storedPublicAccess?.publicKey
      ? cartQueryKeys.public(storedPublicAccess.publicKey)
      : ["cart", "public", "empty"],
    queryFn: async (): Promise<CartDto | null> => {
      if (!storedPublicAccess) {
        return null;
      }

      const response = await cartControllerGetPublicCart(
        storedPublicAccess.publicKey,
      );

      return response.cart;
    },
    enabled:
      isHydrated && mode === "public" && Boolean(storedPublicAccess?.publicKey),
    refetchInterval: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (isCartUnauthorizedError(error) || isCartNotFoundError(error)) {
        return false;
      }

      return failureCount < 2;
    },
  });

  React.useEffect(() => {
    if (mode !== "public" || !storedPublicAccess || !publicCartQuery.error) {
      return;
    }

    if (
      !isCartUnauthorizedError(publicCartQuery.error) &&
      !isCartNotFoundError(publicCartQuery.error)
    ) {
      return;
    }

    queryClient.removeQueries({
      queryKey: cartQueryKeys.public(storedPublicAccess.publicKey),
    });
    notifyPublicCartUnavailable();
  }, [
    mode,
    notifyPublicCartUnavailable,
    publicCartQuery.error,
    queryClient,
    storedPublicAccess,
  ]);

  const activeCart =
    mode === "public" ? (publicCartQuery.data ?? null) : currentCart;
  const activeCartError =
    mode === "public" ? publicCartQuery.error : currentCartQuery.error;
  const activeCartLoading =
    mode === "public" ? publicCartQuery.isLoading : currentCartQuery.isLoading;

  return {
    activeCart,
    activeCartError,
    activeCartLoading,
    currentCart,
    currentCartNotFoundHandledRef,
    currentCartQuery,
    isOwnSharedCart,
    mode,
    publicCartQuery,
  };
}
