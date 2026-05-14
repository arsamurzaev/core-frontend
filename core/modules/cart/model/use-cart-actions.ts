"use client";

import { cartQueryKeys } from "@/core/modules/cart/model/cart-query-keys";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import type { CartMode } from "@/core/modules/cart/model/cart-constants";
import type { CartDto, CartItemDto } from "@/shared/api/generated/react-query";
import type { QueryClient } from "@tanstack/react-query";
import React from "react";
import type { CartProductSnapshot } from "./cart-context.types";
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
  quantityByLineKey: Record<string, number>;
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
  quantityByLineKey,
  storedPublicAccess,
}: UseCartActionsParams) {
  const findCartItem = React.useCallback(
    (selection: CartLineSelection): CartItemDto | null => {
      if (!activeCart) {
        return null;
      }

      return findCartItemForLineSelection(activeCart.items, selection);
    },
    [activeCart],
  );

  const setLineQuantity = React.useCallback(
    async (
      selection: CartLineSelection,
      nextQuantity: number,
      product?: CartProductSnapshot,
    ) => {
      const payload = buildCartLineUpsertPayload({
        cartItem: findCartItem(selection),
        product,
        quantity: nextQuantity,
        selection,
      });

      if (mode === "public" && storedPublicAccess) {
        await mutations.upsertPublicItemMutation.mutateAsync({
          access: storedPublicAccess,
          ...payload,
        });
        return;
      }

      await mutations.upsertCurrentItemMutation.mutateAsync(payload);
    },
    [
      findCartItem,
      mode,
      mutations.upsertCurrentItemMutation,
      mutations.upsertPublicItemMutation,
      storedPublicAccess,
    ],
  );

  const incrementLine = React.useCallback(
    async (selection: CartLineSelection, product?: CartProductSnapshot) => {
      const normalizedSelection = normalizeCartLineSelection(selection);
      const quantity =
        quantityByLineKey[
          buildCartLineSelectionKey(normalizedSelection)
        ] ??
        0;
      await setLineQuantity(normalizedSelection, quantity + 1, product);
    },
    [quantityByLineKey, setLineQuantity],
  );

  const decrementLine = React.useCallback(
    async (selection: CartLineSelection, product?: CartProductSnapshot) => {
      const normalizedSelection = normalizeCartLineSelection(selection);
      const quantity =
        quantityByLineKey[
          buildCartLineSelectionKey(normalizedSelection)
        ] ??
        0;
      if (quantity <= 0) {
        return;
      }

      await setLineQuantity(
        normalizedSelection,
        Math.max(quantity - 1, 0),
        product,
      );
    },
    [quantityByLineKey, setLineQuantity],
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
