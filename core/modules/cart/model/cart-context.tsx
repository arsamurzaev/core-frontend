"use client";

import { useCatalogRuntime } from "@/core/catalog-runtime";
import { CART_CONTEXT_FALLBACK_VALUE } from "@/core/modules/cart/model/cart-context-fallback";
import { getCartPricingForProduct } from "@/core/modules/cart/model/cart-item-view";
import {
  normalizeSaleUnitId,
  normalizeVariantId,
} from "@/core/modules/cart/model/cart-line-key";
import { buildCartLineSelectionKey } from "@/core/modules/cart/model/cart-line-selection";
import { useCartStorageFlags } from "@/core/modules/cart/model/cart-storage";
import { useCartActions } from "@/core/modules/cart/model/use-cart-actions";
import { useCartCacheWriter } from "@/core/modules/cart/model/use-cart-cache-writer";
import { useCartDerivedState } from "@/core/modules/cart/model/use-cart-derived-state";
import { useCartManagerOrder } from "@/core/modules/cart/model/use-cart-manager-order";
import { useCartManagerSession } from "@/core/modules/cart/model/use-cart-manager-session";
import { useCartMutations } from "@/core/modules/cart/model/use-cart-mutations";
import { useCartProviderValue } from "@/core/modules/cart/model/use-cart-provider-value";
import { useCartPublicAccess } from "@/core/modules/cart/model/use-cart-public-access";
import { useCartQueries } from "@/core/modules/cart/model/use-cart-queries";
import { useCartRealtimeHandlers } from "@/core/modules/cart/model/use-cart-realtime-handlers";
import { useCartShareOrder } from "@/core/modules/cart/model/use-cart-share-order";
import { useCartSse } from "@/core/modules/cart/model/use-cart-sse";
import type { CartContextValue } from "@/core/modules/cart/model/cart-context.types";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { useCatalogMode } from "@/shared/lib/catalog-mode";
import { createStrictContext, useStrictContext } from "@/shared/lib/react";
import { getCatalogCurrency } from "@/shared/lib/utils";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";

export type {
  CartContextValue,
  CartProductSnapshot,
  CartSharePayload,
  PrepareShareOrderInput,
} from "./cart-context.types";
export { buildCartLineKey } from "./cart-line-key";
export {
  buildCartLineSelectionKey,
  getCartLineSelectionQuantity,
  normalizeCartLineSelection,
} from "./cart-line-selection";
export type {
  CartLineSelection,
  CartQuantityScope,
  NormalizedCartLineSelection,
} from "./cart-line-selection";

const CartContext = createStrictContext<CartContextValue>();

function CartProviderFallback({ children }: React.PropsWithChildren) {
  return (
    <CartContext.Provider value={CART_CONTEXT_FALLBACK_VALUE}>
      {children}
    </CartContext.Provider>
  );
}

const CartProviderInner: React.FC<React.PropsWithChildren> = ({ children }) => {
  const catalog = useCatalog();
  const runtime = useCatalogRuntime();
  const { isAuthenticated, isLoading: isSessionLoading, user } = useSession();
  const queryClient = useQueryClient();
  const fallbackCurrency = React.useMemo(
    () => getCatalogCurrency(catalog, "RUB"),
    [catalog],
  );
  const {
    autoExpandPublicCartAccessKey,
    clearOwnSharedCartAccessKey,
    clearStoredPublicAccess,
    isHydrated,
    notifyPublicCartUnavailable,
    setStoredPublicAccess,
    storedPublicAccess,
  } = useCartPublicAccess({ catalogId: catalog.id });
  const {
    clearActiveManagerOrder,
    clearStoredCurrentCart,
    hasActiveManagerOrder,
    hasStoredCurrentCart,
    persistActiveManagerOrder,
    persistStoredCurrentCart,
  } = useCartStorageFlags(catalog.id);
  const isCatalogManager = Boolean(user && isCatalogManagerRole(user.role));
  const canCreateManagerOrder =
    isCatalogManager && runtime.cart.supportsManagerOrder;
  const {
    activeCart,
    activeCartError,
    activeCartLoading,
    currentCart,
    currentCartNotFoundHandledRef,
    isOwnSharedCart,
    mode,
  } = useCartQueries({
    canCreateManagerOrder,
    clearActiveManagerOrder,
    clearStoredCurrentCart,
    hasActiveManagerOrder,
    hasStoredCurrentCart,
    isAuthenticated,
    isHydrated,
    isSessionLoading,
    notifyPublicCartUnavailable,
    onCurrentCartFound: persistStoredCurrentCart,
    queryClient,
    storedPublicAccess,
  });
  const { setCurrentCartData, setPublicCartData } = useCartCacheWriter({
    clearStoredCurrentCart,
    onCurrentCartPresent: () => {
      currentCartNotFoundHandledRef.current = false;
    },
    persistStoredCurrentCart,
    queryClient,
  });

  React.useEffect(() => {
    if (isOwnSharedCart) {
      clearOwnSharedCartAccessKey();
    }
  }, [clearOwnSharedCartAccessKey, isOwnSharedCart]);

  React.useEffect(() => {
    if (!isOwnSharedCart || !currentCart || currentCart.items.length > 0) {
      return;
    }

    clearStoredPublicAccess();
  }, [clearStoredPublicAccess, currentCart, isOwnSharedCart]);

  const activeCartStatus = activeCart?.status ?? null;
  const activeCartStatusMessage = activeCart?.statusMessage ?? null;
  const { items, quantityByLineKey, quantityByProductId, totals } =
    useCartDerivedState({
      cart: activeCart,
      fallbackCurrency,
    });
  const catalogMode = useCatalogMode();
  const shouldUseCartUi =
    isHydrated &&
    catalogMode !== "BROWSE" &&
    (mode === "public" ||
      (canCreateManagerOrder && hasActiveManagerOrder) ||
      (!isSessionLoading && !isAuthenticated));
  const canShare =
    shouldUseCartUi && catalogMode === "DELIVERY" && !canCreateManagerOrder;
  const isManagedPublicCart = mode === "public" && isCatalogManager;
  const isManagerOrderCart =
    isManagedPublicCart ||
    (mode === "current" && canCreateManagerOrder && hasActiveManagerOrder);
  const shareCurrency = items[0]?.currency ?? fallbackCurrency;
  const shareTitle = React.useMemo(() => {
    const normalizedCatalogName = catalog.name?.trim();
    return normalizedCatalogName
      ? `Заказ из каталога «${normalizedCatalogName}»`
      : "Заказ";
  }, [catalog.name]);
  const {
    dismissPublicCart,
    handleSseCartStatusChanged,
    handleSseCartUpdated,
  } = useCartRealtimeHandlers({
    clearStoredPublicAccess,
    isManagedPublicCart,
    queryClient,
    setCurrentCartData,
    setPublicCartData,
    storedPublicAccess,
    userRole: user?.role,
  });
  const { isManagerSessionLoading } = useCartManagerSession({
    isHydrated,
    isManagedPublicCart,
    setPublicCartData,
    storedPublicAccess,
    userId: user?.id,
    userRole: user?.role,
  });
  const mutations = useCartMutations({
    activeCart,
    catalogId: catalog.id,
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
  });
  const isLocalCartMutationPending =
    mutations.upsertCurrentItemMutation.isPending ||
    mutations.upsertPublicItemMutation.isPending ||
    mutations.removeCurrentItemMutation.isPending ||
    mutations.removePublicItemMutation.isPending;

  useCartSse({
    activeCart,
    clearStoredPublicAccess,
    handleSseCartStatusChanged,
    handleSseCartUpdated,
    isHydrated,
    isLocalCartMutationPending,
    mode,
    notifyPublicCartUnavailable,
    storedPublicAccess,
  });

  const {
    clearCart,
    decrementLine,
    decrementProduct,
    deleteCurrentCart,
    incrementLine,
    incrementProduct,
    setLineQuantity,
    setProductQuantity,
  } = useCartActions({
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
  });
  const prepareShareOrder = useCartShareOrder({
    activeCart,
    items,
    mutations,
    setStoredPublicAccess,
    shareCurrency,
    shareTitle,
    storedPublicAccess,
    totals,
  });
  const { completeManagedOrder, startManagerOrder } = useCartManagerOrder({
    canCreateManagerOrder,
    clearActiveManagerOrder,
    clearStoredCurrentCart,
    itemsCount: items.length,
    mutations,
    queryClient,
    storedPublicAccess,
  });
  const isBusy =
    mutations.upsertCurrentItemMutation.isPending ||
    mutations.upsertPublicItemMutation.isPending ||
    mutations.removeCurrentItemMutation.isPending ||
    mutations.removePublicItemMutation.isPending ||
    mutations.deleteCurrentCartMutation.isPending ||
    mutations.shareCurrentCartMutation.isPending ||
    mutations.startManagerOrderMutation.isPending ||
    mutations.completeManagerOrderMutation.isPending ||
    isManagerSessionLoading;

  const value = useCartProviderValue({
    activeCart,
    activeCartError,
    activeCartLoading,
    activeCartStatus,
    activeCartStatusMessage,
    autoExpandPublicCartAccessKey,
    canCreateManagerOrder,
    canShare,
    catalogMode,
    clearCart,
    completeManagedOrder,
    deleteCurrentCart,
    decrementLine,
    decrementProduct,
    detachPublicCart: clearStoredPublicAccess,
    incrementLine,
    incrementProduct,
    isBusy,
    isHydrated,
    isManagerOrderCart,
    isManagedPublicCart,
    isOwnSharedCart,
    isSessionLoading,
    items,
    mode,
    prepareShareOrder,
    publicAccess: storedPublicAccess,
    quantityByLineKey,
    quantityByProductId,
    setLineQuantity,
    setProductQuantity,
    shouldUseCartUi,
    startManagerOrder,
    totals,
  });

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const CartProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <React.Suspense
      fallback={<CartProviderFallback>{children}</CartProviderFallback>}
    >
      <CartProviderInner>{children}</CartProviderInner>
    </React.Suspense>
  );
};

export function useCart() {
  return useStrictContext(CartContext);
}

export function useCartProductQuantity(productId: string): number {
  const { quantityByProductId } = useCart();
  return quantityByProductId[productId] ?? 0;
}

export function useCartProductVariantQuantity(
  productId: string,
  variantId?: string | null,
  saleUnitId?: string | null,
): number {
  const { quantityByLineKey, quantityByProductId } = useCart();
  const normalizedVariantId = normalizeVariantId(variantId);
  const normalizedSaleUnitId = normalizeSaleUnitId(saleUnitId);
  if (!normalizedVariantId && !normalizedSaleUnitId) {
    return quantityByProductId[productId] ?? 0;
  }

  return (
    quantityByLineKey[
      buildCartLineSelectionKey({
        productId,
        saleUnitId: normalizedSaleUnitId,
        variantId: normalizedVariantId,
      })
    ] ?? 0
  );
}

export function useCartProductPricing(product: ProductWithAttributesDto) {
  const { quantityByProductId } = useCart();
  const { config } = useCatalog();
  const quantity = quantityByProductId[product.id] ?? 0;
  const currencyFallback = getCatalogCurrency({ config }, "RUB");

  return React.useMemo(() => {
    if (!quantity) {
      return null;
    }

    return getCartPricingForProduct(product, quantity, currencyFallback);
  }, [currencyFallback, product, quantity]);
}
