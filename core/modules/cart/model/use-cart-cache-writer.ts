"use client";

import { cartQueryKeys } from "@/core/modules/cart/model/cart-query-keys";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import type { CartDto } from "@/shared/api/generated/react-query";
import type { QueryClient } from "@tanstack/react-query";
import React from "react";
import {
  isStaleRealtimeCart,
  mergeCartRealtimeStatus,
} from "./cart-realtime-state";

interface UseCartCacheWriterParams {
  clearStoredCurrentCart: () => void;
  onCurrentCartPresent?: () => void;
  persistStoredCurrentCart: () => void;
  queryClient: QueryClient;
}

export function useCartCacheWriter({
  clearStoredCurrentCart,
  onCurrentCartPresent,
  persistStoredCurrentCart,
  queryClient,
}: UseCartCacheWriterParams) {
  const setCurrentCartData = React.useCallback(
    (cart: CartDto | null, options?: { ignoreStale?: boolean }) => {
      const previousCart = queryClient.getQueryData<CartDto | null>(
        cartQueryKeys.current,
      );

      if (options?.ignoreStale && isStaleRealtimeCart(cart, previousCart)) {
        return;
      }

      const nextCart = mergeCartRealtimeStatus(cart, previousCart);

      if (nextCart) {
        persistStoredCurrentCart();
        onCurrentCartPresent?.();
      } else {
        clearStoredCurrentCart();
      }

      queryClient.setQueryData(cartQueryKeys.current, nextCart);
    },
    [
      clearStoredCurrentCart,
      onCurrentCartPresent,
      persistStoredCurrentCart,
      queryClient,
    ],
  );

  const setPublicCartData = React.useCallback(
    (
      access: CartPublicAccess | null,
      cart: CartDto | null,
      options?: { ignoreStale?: boolean },
    ) => {
      if (!access) {
        return;
      }

      const queryKey = cartQueryKeys.public(access.publicKey);
      const previousCart = queryClient.getQueryData<CartDto | null>(queryKey);

      if (options?.ignoreStale && isStaleRealtimeCart(cart, previousCart)) {
        return;
      }

      const nextCart = mergeCartRealtimeStatus(cart, previousCart);
      queryClient.setQueryData(queryKey, nextCart);
    },
    [queryClient],
  );

  return {
    setCurrentCartData,
    setPublicCartData,
  };
}
