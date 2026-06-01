"use client";

import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import { buildCartShareUrl } from "@/core/modules/cart/model/cart-public-link";
import { buildShareBaseUrl } from "@/core/modules/cart/model/cart-share";
import { buildLegacyCartShareText } from "@/core/modules/cart/model/cart-share-text";
import {
  type CartDto,
  type CatalogContactDto,
  type CatalogContactDtoType,
} from "@/shared/api/generated/react-query";
import {
  buildCheckoutSummary,
  resolveCheckoutContacts,
  type CheckoutConfig,
} from "@/shared/lib/checkout-methods";
import type { CatalogPriceFormatMode } from "@/shared/lib/price-format";
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
  catalogContacts: CatalogContactDto[];
  checkoutConfig: CheckoutConfig;
  mutations: ReturnType<typeof useCartMutations>;
  setStoredPublicAccess: React.Dispatch<
    React.SetStateAction<CartPublicAccess | null>
  >;
  priceFormatMode: CatalogPriceFormatMode;
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
  catalogContacts,
  checkoutConfig,
  items,
  mutations,
  priceFormatMode,
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
      let cartForContacts = activeCart;

      if (!access) {
        const shared = await mutations.shareCurrentCartMutation.mutateAsync({
          ...shareInput,
          comment: normalizedComment || undefined,
        });
        const publicKey = shared.publicKey || shared.cart.publicKey;
        if (!publicKey) {
          throw new Error("Не удалось подготовить публичную корзину.");
        }

        cartForContacts = shared.cart;
        access = {
          publicKey,
          rawLink: `/?c=${encodeURIComponent(publicKey)}`,
        };
      }

      setStoredPublicAccess(access);
      const shareUrl = buildCartShareUrl(access, buildShareBaseUrl());
      const contactsOverride = resolveCartShareContactsOverride({
        cart: cartForContacts,
        catalogContacts,
        checkoutConfig,
        input: shareInput,
      });

      return {
        contactsOverride,
        text: buildLegacyCartShareText({
          checkoutSummary,
          comment: normalizedComment,
          currency: shareCurrency,
          items,
          priceFormatMode,
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
      catalogContacts,
      checkoutConfig,
      items,
      mutations.shareCurrentCartMutation,
      priceFormatMode,
      setStoredPublicAccess,
      shareCurrency,
      shareTitle,
      storedPublicAccess,
      totals.originalSubtotal,
      totals.subtotal,
    ],
  );
}

export function resolveCartShareContactsOverride({
  cart,
  catalogContacts,
  checkoutConfig,
  input,
}: {
  cart: CartDto | null | undefined;
  catalogContacts: CatalogContactDto[];
  checkoutConfig: CheckoutConfig;
  input: PrepareShareOrderInput;
}): Partial<Record<CatalogContactDtoType, string>> | undefined {
  const checkoutMethod =
    input.checkoutMethod ??
    (cart as CartDtoWithCheckout | null | undefined)?.checkoutMethod ??
    null;

  if (!checkoutMethod) {
    return undefined;
  }

  const contacts = resolveCheckoutContacts({
    catalogContacts,
    config: checkoutConfig,
    method: checkoutMethod,
  });

  return hasCartShareContacts(contacts) ? contacts : undefined;
}

function hasCartShareContacts(
  contacts: Partial<Record<CatalogContactDtoType, string>>,
): boolean {
  return Object.values(contacts).some((value) => Boolean(value?.trim()));
}
