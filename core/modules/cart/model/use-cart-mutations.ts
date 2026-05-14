"use client";

import { isCartNotFoundError } from "@/core/modules/cart/model/cart-api-errors";
import { cartQueryKeys } from "@/core/modules/cart/model/cart-query-keys";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import { createOptimisticCart } from "@/core/modules/cart/model/cart-optimistic";
import { apiClient } from "@/shared/api/client";
import {
  cartControllerCompleteManagerOrder,
  cartControllerCreateOrGetCurrent,
  cartControllerRemoveCurrentItem,
  cartControllerRemovePublicItem,
  cartControllerShareCurrent,
  cartControllerUpsertCurrentItem,
  cartControllerUpsertPublicItem,
  type CartDto,
  type PublicUpsertCartItemDtoReq,
  type UpsertCartItemDtoReq,
} from "@/shared/api/generated/react-query";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import type React from "react";
import type {
  CartMutationContext,
  CartProductSnapshot,
  PrepareShareOrderInput,
} from "./cart-context.types";

interface UseCartMutationsParams {
  activeCart: CartDto | null;
  catalogId: string;
  clearActiveManagerOrder: () => void;
  clearStoredCurrentCart: () => void;
  clearStoredPublicAccess: () => void;
  currentCartNotFoundHandledRef: React.MutableRefObject<boolean>;
  dismissPublicCart: (access: CartPublicAccess | null) => void;
  persistActiveManagerOrder: () => void;
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
}

export function useCartMutations({
  activeCart,
  catalogId,
  clearActiveManagerOrder,
  clearStoredCurrentCart,
  clearStoredPublicAccess,
  currentCartNotFoundHandledRef,
  dismissPublicCart,
  persistActiveManagerOrder,
  queryClient,
  setCurrentCartData,
  setPublicCartData,
  storedPublicAccess,
}: UseCartMutationsParams) {
  const upsertCurrentItemMutation = useMutation({
    mutationFn: async (params: {
      product?: CartProductSnapshot;
      productId: string;
      quantity: number;
      saleUnitId?: string;
      variantId?: string;
    }) => {
      const payload: UpsertCartItemDtoReq & { saleUnitId?: string } = {
        productId: params.productId,
        quantity: params.quantity,
        ...(params.variantId ? { variantId: params.variantId } : {}),
        ...(params.saleUnitId ? { saleUnitId: params.saleUnitId } : {}),
      };
      const response = await cartControllerUpsertCurrentItem(payload);

      return response.cart;
    },
    onMutate: async (params): Promise<CartMutationContext> => {
      await queryClient.cancelQueries({ queryKey: cartQueryKeys.current });
      const previousCart = queryClient.getQueryData<CartDto | null>(
        cartQueryKeys.current,
      );
      const optimisticCart = createOptimisticCart({
        cart: previousCart ?? activeCart,
        catalogId,
        product: params.product,
        productId: params.productId,
        quantity: params.quantity,
        saleUnitId: params.saleUnitId,
        variantId: params.variantId,
      });

      if (optimisticCart !== undefined) {
        setCurrentCartData(optimisticCart);
      }

      return { previousCart };
    },
    onSuccess: (cart) => setCurrentCartData(cart),
    onError: (error, _params, context: CartMutationContext | undefined) => {
      if (isCartNotFoundError(error)) {
        clearStoredCurrentCart();
        currentCartNotFoundHandledRef.current = true;
        queryClient.removeQueries({ queryKey: cartQueryKeys.current });
        return;
      }

      setCurrentCartData(context?.previousCart ?? null);
    },
  });

  const upsertPublicItemMutation = useMutation({
    mutationFn: async (params: {
      access: CartPublicAccess;
      product?: CartProductSnapshot;
      productId: string;
      quantity: number;
      saleUnitId?: string;
      variantId?: string;
    }) => {
      const payload: PublicUpsertCartItemDtoReq & { saleUnitId?: string } = {
        productId: params.productId,
        quantity: params.quantity,
        ...(params.variantId ? { variantId: params.variantId } : {}),
        ...(params.saleUnitId ? { saleUnitId: params.saleUnitId } : {}),
      };
      const response = await cartControllerUpsertPublicItem(
        params.access.publicKey,
        payload,
      );

      return {
        access: params.access,
        cart: response.cart,
      };
    },
    onSuccess: ({ access, cart }) => {
      setPublicCartData(access, cart);
    },
    onMutate: async (params): Promise<CartMutationContext> => {
      const queryKey = cartQueryKeys.public(params.access.publicKey);
      await queryClient.cancelQueries({ queryKey });
      const previousCart = queryClient.getQueryData<CartDto | null>(queryKey);
      const optimisticCart = createOptimisticCart({
        cart: previousCart ?? activeCart,
        catalogId,
        product: params.product,
        productId: params.productId,
        quantity: params.quantity,
        saleUnitId: params.saleUnitId,
        variantId: params.variantId,
      });

      if (optimisticCart !== undefined) {
        setPublicCartData(params.access, optimisticCart);
      }

      return { previousCart };
    },
    onError: (error, params, context) => {
      if (isCartNotFoundError(error)) {
        dismissPublicCart(params.access);
        return;
      }

      setPublicCartData(params.access, context?.previousCart ?? null);
    },
  });

  const removeCurrentItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await cartControllerRemoveCurrentItem(itemId);
      return response.cart;
    },
    onSuccess: (cart) => setCurrentCartData(cart),
    onError: (error) => {
      if (isCartNotFoundError(error)) {
        clearStoredCurrentCart();
        currentCartNotFoundHandledRef.current = true;
        queryClient.removeQueries({ queryKey: cartQueryKeys.current });
      }
    },
  });

  const removePublicItemMutation = useMutation({
    mutationFn: async (params: {
      access: CartPublicAccess;
      itemId: string;
    }) => {
      const response = await cartControllerRemovePublicItem(
        params.access.publicKey,
        params.itemId,
      );

      return {
        access: params.access,
        cart: response.cart,
      };
    },
    onSuccess: ({ access, cart }) => {
      setPublicCartData(access, cart);
    },
    onError: (error, params) => {
      if (isCartNotFoundError(error)) {
        dismissPublicCart(params.access);
      }
    },
  });

  const deleteCurrentCartMutation = useMutation({
    mutationFn: () => apiClient.delete<void>("/cart/current"),
    onSuccess: () => {
      clearActiveManagerOrder();
      clearStoredCurrentCart();
      if (
        activeCart?.publicKey &&
        storedPublicAccess?.publicKey === activeCart.publicKey
      ) {
        clearStoredPublicAccess();
      }
      currentCartNotFoundHandledRef.current = true;
      queryClient.removeQueries({ queryKey: cartQueryKeys.current });
    },
    onError: (error) => {
      if (isCartNotFoundError(error)) {
        clearActiveManagerOrder();
        clearStoredCurrentCart();
        currentCartNotFoundHandledRef.current = true;
        queryClient.removeQueries({ queryKey: cartQueryKeys.current });
      }
    },
  });

  const shareCurrentCartMutation = useMutation({
    mutationFn: async (input?: PrepareShareOrderInput | string) => {
      const normalizedInput =
        typeof input === "string" ? { comment: input } : (input ?? {});

      return cartControllerShareCurrent({
        ...(normalizedInput.comment
          ? { comment: normalizedInput.comment }
          : {}),
        ...(normalizedInput.checkoutMethod
          ? { checkoutMethod: normalizedInput.checkoutMethod }
          : {}),
        ...(normalizedInput.checkoutData
          ? { checkoutData: normalizedInput.checkoutData }
          : {}),
      } as never);
    },
    onSuccess: (response) => {
      setCurrentCartData(response.cart);
    },
  });

  const startManagerOrderMutation = useMutation({
    mutationFn: () => cartControllerCreateOrGetCurrent(),
    onSuccess: (response) => {
      persistActiveManagerOrder();
      setCurrentCartData(response.cart);
    },
  });

  const completeManagerOrderMutation = useMutation({
    mutationFn: async (access: CartPublicAccess) => {
      const response = await cartControllerCompleteManagerOrder(
        access.publicKey,
      );

      return {
        access,
        order: response.order,
      };
    },
    onSuccess: ({ access }) => {
      queryClient.removeQueries({
        queryKey: cartQueryKeys.public(access.publicKey),
      });
      clearStoredPublicAccess();
    },
  });

  return {
    completeManagerOrderMutation,
    deleteCurrentCartMutation,
    removeCurrentItemMutation,
    removePublicItemMutation,
    shareCurrentCartMutation,
    startManagerOrderMutation,
    upsertCurrentItemMutation,
    upsertPublicItemMutation,
  };
}
