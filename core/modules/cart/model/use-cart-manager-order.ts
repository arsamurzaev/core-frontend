"use client";

import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import { cartQueryKeys } from "@/core/modules/cart/model/cart-query-keys";
import type { CompletedOrderDto } from "@/shared/api/generated/react-query";
import type { QueryClient } from "@tanstack/react-query";
import React from "react";
import type { PrepareShareOrderInput } from "./cart-context.types";
import type { useCartMutations } from "./use-cart-mutations";

interface UseCartManagerOrderParams {
  canCreateManagerOrder: boolean;
  clearActiveManagerOrder: () => void;
  clearStoredCurrentCart: () => void;
  itemsCount: number;
  mutations: ReturnType<typeof useCartMutations>;
  queryClient: QueryClient;
  storedPublicAccess: CartPublicAccess | null;
}

export function useCartManagerOrder({
  canCreateManagerOrder,
  clearActiveManagerOrder,
  clearStoredCurrentCart,
  itemsCount,
  mutations,
  queryClient,
  storedPublicAccess,
}: UseCartManagerOrderParams) {
  const startManagerOrder = React.useCallback(async () => {
    if (!canCreateManagerOrder) {
      return;
    }

    await mutations.startManagerOrderMutation.mutateAsync();
  }, [canCreateManagerOrder, mutations.startManagerOrderMutation]);

  const completeManagedOrder = React.useCallback(
    async (input?: PrepareShareOrderInput | string): Promise<CompletedOrderDto> => {
      const shareInput =
        typeof input === "string" ? { comment: input } : (input ?? {});
      const normalizedComment = shareInput.comment?.trim();
      let access = storedPublicAccess;
      const shouldResetCurrentCartAfterComplete = !access;

      if (!access) {
        if (!itemsCount) {
          throw new Error("Нельзя завершить пустую корзину.");
        }

        const shared = await mutations.shareCurrentCartMutation.mutateAsync({
          ...shareInput,
          comment: normalizedComment || undefined,
        });
        const publicKey = shared.publicKey || shared.cart.publicKey;
        if (!publicKey) {
          throw new Error("Не удалось подготовить заказ.");
        }

        access = {
          publicKey,
          rawLink: `/?c=${encodeURIComponent(publicKey)}`,
        };
      }

      const result =
        await mutations.completeManagerOrderMutation.mutateAsync(access);

      if (shouldResetCurrentCartAfterComplete) {
        clearActiveManagerOrder();
        clearStoredCurrentCart();
        queryClient.removeQueries({ queryKey: cartQueryKeys.current });
      }

      return result.order;
    },
    [
      clearActiveManagerOrder,
      clearStoredCurrentCart,
      itemsCount,
      mutations.completeManagerOrderMutation,
      mutations.shareCurrentCartMutation,
      queryClient,
      storedPublicAccess,
    ],
  );

  return {
    completeManagedOrder,
    startManagerOrder,
  };
}
