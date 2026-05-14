"use client";

import { cartQueryKeys } from "@/core/modules/cart/model/cart-query-keys";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import type { CartMode } from "@/core/modules/cart/model/cart-constants";
import type { CartDto, CartItemDto } from "@/shared/api/generated/react-query";
import type { QueryClient } from "@tanstack/react-query";
import React from "react";
import type { CartProductSnapshot } from "./cart-context.types";
import { getCartLineSelectionQuantityFromCart } from "./cart-quantity-from-cart";
import {
  buildCartLineSelectionKey,
  normalizeCartLineSelection,
  type CartLineSelection,
} from "./cart-line-selection";
import {
  buildCartLineUpsertPayload,
  findCartItemForLineSelection,
} from "./cart-line-upsert-payload";
import type { useCartMutations } from "./use-cart-mutations";

interface UseCartActionsParams {
  activeCart: CartDto | null;
  canCreateManagerOrder: boolean;
  clearActiveManagerOrder: () => void;
  clearStoredCurrentCart: () => void;
  clearStoredPublicAccess: () => void;
  hasActiveManagerOrder: boolean;
  mode: CartMode;
  mutations: ReturnType<typeof useCartMutations>;
  queryClient: QueryClient;
  storedPublicAccess: CartPublicAccess | null;
}

export function useCartActions({
  activeCart,
  canCreateManagerOrder,
  clearActiveManagerOrder,
  clearStoredCurrentCart,
  clearStoredPublicAccess,
  hasActiveManagerOrder,
  mode,
  mutations,
  queryClient,
  storedPublicAccess,
}: UseCartActionsParams) {
  const pendingLineQuantitiesRef = React.useRef(
    new Map<string, { quantity: number; revision: number }>(),
  );
  const pendingRevisionRef = React.useRef(0);

  const getActiveCartSnapshot = React.useCallback((): CartDto | null => {
    if (mode === "public" && storedPublicAccess) {
      return (
        queryClient.getQueryData<CartDto | null>(
          cartQueryKeys.public(storedPublicAccess.publicKey),
        ) ??
        activeCart ??
        null
      );
    }

    return (
      queryClient.getQueryData<CartDto | null>(cartQueryKeys.current) ??
      activeCart ??
      null
    );
  }, [activeCart, mode, queryClient, storedPublicAccess]);

  const getLatestLineQuantity = React.useCallback(
    (selection: CartLineSelection): number => {
      const normalizedSelection = normalizeCartLineSelection(selection);
      const lineKey = buildCartLineSelectionKey(normalizedSelection);
      const pending = pendingLineQuantitiesRef.current.get(lineKey);

      if (pending) {
        return pending.quantity;
      }

      return getCartLineSelectionQuantityFromCart({
        cart: getActiveCartSnapshot(),
        selection: normalizedSelection,
      });
    },
    [getActiveCartSnapshot],
  );

  const trackPendingLineQuantity = React.useCallback(
    (selection: CartLineSelection, quantity: number) => {
      const normalizedSelection = normalizeCartLineSelection(selection);
      const lineKey = buildCartLineSelectionKey(normalizedSelection);
      const revision = pendingRevisionRef.current + 1;
      pendingRevisionRef.current = revision;
      pendingLineQuantitiesRef.current.set(lineKey, { quantity, revision });

      return () => {
        const pending = pendingLineQuantitiesRef.current.get(lineKey);

        if (pending?.revision === revision) {
          pendingLineQuantitiesRef.current.delete(lineKey);
        }
      };
    },
    [],
  );

  const findCartItem = React.useCallback(
    (selection: CartLineSelection): CartItemDto | null => {
      const cart = getActiveCartSnapshot();

      if (!cart) {
        return null;
      }

      return findCartItemForLineSelection(cart.items, selection);
    },
    [getActiveCartSnapshot],
  );

  const setLineQuantity = React.useCallback(
    async (
      selection: CartLineSelection,
      nextQuantity: number,
      product?: CartProductSnapshot,
    ) => {
      const releasePendingLineQuantity = trackPendingLineQuantity(
        selection,
        nextQuantity,
      );
      const payload = buildCartLineUpsertPayload({
        cartItem: findCartItem(selection),
        product,
        quantity: nextQuantity,
        selection,
      });

      try {
        if (mode === "public" && storedPublicAccess) {
          await mutations.upsertPublicItemMutation.mutateAsync({
            access: storedPublicAccess,
            ...payload,
          });
          return;
        }

        await mutations.upsertCurrentItemMutation.mutateAsync(payload);
      } finally {
        releasePendingLineQuantity();
      }
    },
    [
      findCartItem,
      mode,
      mutations.upsertCurrentItemMutation,
      mutations.upsertPublicItemMutation,
      storedPublicAccess,
      trackPendingLineQuantity,
    ],
  );

  const incrementLine = React.useCallback(
    async (selection: CartLineSelection, product?: CartProductSnapshot) => {
      const normalizedSelection = normalizeCartLineSelection(selection);
      const quantity = getLatestLineQuantity(normalizedSelection);
      await setLineQuantity(normalizedSelection, quantity + 1, product);
    },
    [getLatestLineQuantity, setLineQuantity],
  );

  const decrementLine = React.useCallback(
    async (selection: CartLineSelection, product?: CartProductSnapshot) => {
      const normalizedSelection = normalizeCartLineSelection(selection);
      const quantity = getLatestLineQuantity(normalizedSelection);
      if (quantity <= 0) {
        return;
      }

      await setLineQuantity(
        normalizedSelection,
        Math.max(quantity - 1, 0),
        product,
      );
    },
    [getLatestLineQuantity, setLineQuantity],
  );

  const setProductQuantity = React.useCallback(
    async (
      productId: string,
      nextQuantity: number,
      product?: CartProductSnapshot,
      variantId?: string,
      saleUnitId?: string,
    ) => {
      await setLineQuantity(
        {
          productId,
          saleUnitId,
          variantId,
        },
        nextQuantity,
        product,
      );
    },
    [setLineQuantity],
  );

  const incrementProduct = React.useCallback(
    async (
      productId: string,
      product?: CartProductSnapshot,
      variantId?: string,
      saleUnitId?: string,
    ) => {
      await incrementLine(
        {
          productId,
          saleUnitId,
          variantId,
        },
        product,
      );
    },
    [incrementLine],
  );

  const decrementProduct = React.useCallback(
    async (
      productId: string,
      product?: CartProductSnapshot,
      variantId?: string,
      saleUnitId?: string,
    ) => {
      await decrementLine(
        {
          productId,
          saleUnitId,
          variantId,
        },
        product,
      );
    },
    [decrementLine],
  );

  const clearCart = React.useCallback(async () => {
    if (!activeCart?.items.length) {
      return;
    }

    if (mode === "public" && storedPublicAccess) {
      for (const item of activeCart.items) {
        await mutations.removePublicItemMutation.mutateAsync({
          access: storedPublicAccess,
          itemId: item.id,
        });
      }
      return;
    }

    for (const item of activeCart.items) {
      await mutations.removeCurrentItemMutation.mutateAsync(item.id);
    }

    if (canCreateManagerOrder && hasActiveManagerOrder) {
      clearActiveManagerOrder();
      clearStoredCurrentCart();
      queryClient.removeQueries({ queryKey: cartQueryKeys.current });
    }
  }, [
    activeCart,
    canCreateManagerOrder,
    clearActiveManagerOrder,
    clearStoredCurrentCart,
    hasActiveManagerOrder,
    mode,
    mutations.removeCurrentItemMutation,
    mutations.removePublicItemMutation,
    queryClient,
    storedPublicAccess,
  ]);

  const deleteCurrentCart = React.useCallback(async () => {
    if (mode === "public") {
      clearStoredPublicAccess();
      return;
    }

    if (!activeCart) {
      clearActiveManagerOrder();
      clearStoredCurrentCart();
      queryClient.removeQueries({ queryKey: cartQueryKeys.current });
      return;
    }

    await mutations.deleteCurrentCartMutation.mutateAsync();
  }, [
    activeCart,
    clearActiveManagerOrder,
    clearStoredCurrentCart,
    clearStoredPublicAccess,
    mode,
    mutations.deleteCurrentCartMutation,
    queryClient,
  ]);

  return {
    clearCart,
    decrementLine,
    decrementProduct,
    deleteCurrentCart,
    incrementLine,
    incrementProduct,
    setLineQuantity,
    setProductQuantity,
  };
}
