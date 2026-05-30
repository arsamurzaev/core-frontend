"use client";

import {
  buildCartItemView,
  buildCartTotals,
  type CartItemView,
} from "@/core/modules/cart/model/cart-item-view";
import { getCartItemSaleUnitId } from "@/core/modules/cart/model/cart-line-key";
import { buildCartLineSelectionKey } from "@/core/modules/cart/model/cart-line-selection";
import {
  getProductControllerGetByIdQueryOptions,
  type CartDto,
  type ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { useQueries } from "@tanstack/react-query";
import React from "react";
import { isCartItemForGuest } from "./cart-guest";

function mapProductDetailsById(
  productIds: string[],
  results: Array<{ data?: ProductWithDetailsDto }>,
): Map<string, ProductWithDetailsDto> {
  const productMap = new Map<string, ProductWithDetailsDto>();

  productIds.forEach((productId, index) => {
    const product = results[index]?.data;
    if (product) {
      productMap.set(productId, product);
    }
  });

  return productMap;
}

interface UseCartDerivedStateParams {
  cart: CartDto | null;
  fallbackCurrency: string;
  quantityGuestSessionId?: string | null;
}

export function useCartDerivedState({
  cart,
  fallbackCurrency,
  quantityGuestSessionId,
}: UseCartDerivedStateParams) {
  const productIds = React.useMemo(
    () =>
      Array.from(new Set((cart?.items ?? []).map((item) => item.productId))),
    [cart?.items],
  );

  const productQueries = useQueries({
    queries: productIds.map((productId) =>
      getProductControllerGetByIdQueryOptions(productId, {
        query: {
          enabled: Boolean(productId),
          staleTime: 60_000,
          refetchOnWindowFocus: false,
        },
      }),
    ),
  });

  const productById = React.useMemo(
    () => mapProductDetailsById(productIds, productQueries),
    [productIds, productQueries],
  );

  const items = React.useMemo<CartItemView[]>(
    () =>
      (cart?.items ?? []).map((item) =>
        buildCartItemView({
          item,
          product: productById.get(item.productId),
          fallbackCurrency,
        }),
      ),
    [cart?.items, fallbackCurrency, productById],
  );

  const totals = React.useMemo(() => buildCartTotals(items), [items]);

  const quantityByProductId = React.useMemo(
    () =>
      (cart?.items ?? [])
        .filter((item) => isCartItemForGuest(item, quantityGuestSessionId))
        .reduce<Record<string, number>>((acc, item) => {
          acc[item.productId] = (acc[item.productId] ?? 0) + item.quantity;
          return acc;
        }, {}),
    [cart?.items, quantityGuestSessionId],
  );

  const quantityByLineKey = React.useMemo(
    () =>
      (cart?.items ?? [])
        .filter((item) => isCartItemForGuest(item, quantityGuestSessionId))
        .reduce<Record<string, number>>((acc, item) => {
          const lineKey = buildCartLineSelectionKey({
            productId: item.productId,
            saleUnitId: getCartItemSaleUnitId(item),
            variantId: item.variantId,
          });
          acc[lineKey] = (acc[lineKey] ?? 0) + item.quantity;
          return acc;
        }, {}),
    [cart?.items, quantityGuestSessionId],
  );

  return {
    items,
    quantityByLineKey,
    quantityByProductId,
    totals,
  };
}
