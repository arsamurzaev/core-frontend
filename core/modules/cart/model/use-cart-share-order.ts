"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import { buildCartShareUrl } from "@/core/modules/cart/model/cart-public-link";
import { buildShareBaseUrl } from "@/core/modules/cart/model/cart-share";
import { buildLegacyCartShareText } from "@/core/modules/cart/model/cart-share-text";
import {
  type CartDto,
  type CatalogContactDtoType,
} from "@/shared/api/generated/react-query";
import { buildCheckoutSummary } from "@/shared/lib/checkout-methods";
import React from "react";
import type {
  CartDtoWithCheckout,
  CartSharePayload,
  PrepareShareOrderInput,
} from "./cart-context.types";
import type { useCartMutations } from "./use-cart-mutations";

interface UseCartShareOrderParams {
  activeCart: CartDto | null;
  items: CartItemView[];
  mutations: ReturnType<typeof useCartMutations>;
  setStoredPublicAccess: React.Dispatch<
    React.SetStateAction<CartPublicAccess | null>
  >;
  shareCurrency: string;
  shareTitle: string;
  storedPublicAccess: CartPublicAccess | null;
  totals: {
    originalSubtotal: number;
    subtotal: number;
  };
}

export function useCartShareOrder({
  activeCart,
  items,
  mutations,
  setStoredPublicAccess,
  shareCurrency,
  shareTitle,
  storedPublicAccess,
  totals,
}: UseCartShareOrderParams) {
  return React.useCallback(
    async (
      input?: PrepareShareOrderInput | string,
    ): Promise<CartSharePayload> => {
      if (!items.length) {
        throw new Error("Нельзя поделиться пустой корзиной.");
      }

      let access = storedPublicAccess;
      const shareInput =
        typeof input === "string" ? { comment: input } : (input ?? {});
      const normalizedComment = shareInput.comment?.trim();
      const checkoutSummary =
        shareInput.checkoutSummary ??
        (shareInput.checkoutMethod && shareInput.checkoutData
          ? buildCheckoutSummary({
              data: shareInput.checkoutData,
              method: shareInput.checkoutMethod,
            })
          : []);
      let contactsOverride = getCartCheckoutContacts(activeCart);

      if (!access) {
        const shared = await mutations.shareCurrentCartMutation.mutateAsync({
          ...shareInput,
          comment: normalizedComment || undefined,
        });
        const publicKey = shared.publicKey || shared.cart.publicKey;
        if (!publicKey) {
          throw new Error("Не удалось подготовить публичную корзину.");
        }

        contactsOverride = getCartCheckoutContacts(shared.cart);
        access = {
          publicKey,
          rawLink: `/?c=${encodeURIComponent(publicKey)}`,
        };
      }

      setStoredPublicAccess(access);
      const shareUrl = buildCartShareUrl(access, buildShareBaseUrl());

      return {
        contactsOverride,
        text: buildLegacyCartShareText({
          checkoutSummary,
          comment: normalizedComment,
          currency: shareCurrency,
          items,
          totals: {
            originalSubtotal: totals.originalSubtotal,
            subtotal: totals.subtotal,
          },
          url: shareUrl,
        }),
        title: shareTitle,
        url: shareUrl,
      };
    },
    [
      activeCart,
      items,
      mutations.shareCurrentCartMutation,
      setStoredPublicAccess,
      shareCurrency,
      shareTitle,
      storedPublicAccess,
      totals.originalSubtotal,
      totals.subtotal,
    ],
  );
}

function getCartCheckoutContacts(
  cart: CartDto | null | undefined,
): Partial<Record<CatalogContactDtoType, string>> | undefined {
  return (
    (cart as CartDtoWithCheckout | null | undefined)?.checkoutContacts ??
    undefined
  );
}
