"use client";

import {
  getCartPricingForProduct,
  type CartItemView,
} from "@/core/modules/cart/model/cart-item-view";
import {
  isCartNotFoundError,
  isCartUnauthorizedError,
} from "@/core/modules/cart/model/cart-api-errors";
import { isInactiveSharedCartStatus } from "@/core/modules/cart/model/cart-events";
import {
  buildCartPublicStorageKey,
  buildCartShareUrl,
  deserializeCartPublicAccess,
  parseCartPublicAccessFromSearchParams,
  removeCartPublicAccessParams,
  serializeCartPublicAccess,
  type CartPublicAccess,
} from "@/core/modules/cart/model/cart-public-link";
import { cartQueryKeys } from "@/core/modules/cart/model/cart-query-keys";
import {
  buildShareBaseUrl,
  getPublicAccessKey,
} from "@/core/modules/cart/model/cart-share";
import { useCartDerivedState } from "@/core/modules/cart/model/use-cart-derived-state";
import { useCartManagerSession } from "@/core/modules/cart/model/use-cart-manager-session";
import { useCartSse } from "@/core/modules/cart/model/use-cart-sse";
import { type CartMode } from "@/core/modules/cart/model/cart-constants";
import {
  cartControllerCompleteManagerOrder,
  cartControllerCreateOrGetCurrent,
  cartControllerGetCurrent,
  cartControllerGetPublicCart,
  cartControllerRemoveCurrentItem,
  cartControllerRemovePublicItem,
  cartControllerShareCurrent,
  cartControllerUpsertCurrentItem,
  cartControllerUpsertPublicItem,
  type CartDto,
  type CartItemDto,
  type CompletedOrderDto,
  type ProductWithAttributesDto,
} from "@/shared/api/generated/react-query";
import { toNumberValue } from "@/shared/lib/attributes";
import { createStrictContext, useStrictContext } from "@/shared/lib/react";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { useCatalogMode } from "@/shared/lib/catalog-mode";
import { getCatalogTypeCode } from "@/shared/lib/catalog-type";
import { getCatalogCurrency } from "@/shared/lib/utils";
import { apiClient } from "@/shared/api/client";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";


export interface CartSharePayload {
  text: string;
  title?: string;
  url: string;
}

interface CartContextValue {
  autoExpandPublicCartAccessKey: string | null;
  canCreateManagerOrder: boolean;
  cart: CartDto | null;
  clearCart: () => Promise<void>;
  completeManagedOrder: (comment?: string) => Promise<CompletedOrderDto>;
  deleteCurrentCart: () => Promise<void>;
  decrementProduct: (productId: string, product?: CartProductSnapshot) => Promise<void>;
  detachPublicCart: () => void;
  incrementProduct: (productId: string, product?: CartProductSnapshot) => Promise<void>;
  setProductQuantity: (
    productId: string,
    nextQuantity: number,
    product?: CartProductSnapshot,
  ) => Promise<void>;
  isBusy: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  isManagerOrderCart: boolean;
  isManagedPublicCart: boolean;
  isOwnSharedCart: boolean;
  isPublicMode: boolean;
  items: CartItemView[];
  mode: CartMode;
  prepareShareOrder: (comment?: string) => Promise<CartSharePayload>;
  publicAccess: CartPublicAccess | null;
  canShare: boolean;
  quantityByProductId: Record<string, number>;
  shouldUseCartUi: boolean;
  startManagerOrder: () => Promise<void>;
  status: CartDto["status"] | null;
  statusMessage: string | null;
  totals: {
    hasDiscount: boolean;
    itemsCount: number;
    originalSubtotal: number;
    subtotal: number;
  };
}

const CartContext = createStrictContext<CartContextValue>();

const CART_CONTEXT_FALLBACK_VALUE: CartContextValue = {
  autoExpandPublicCartAccessKey: null,
  canCreateManagerOrder: false,
  cart: null,
  clearCart: async () => {},
  completeManagedOrder: async () => {
    throw new Error("Корзина еще не готова.");
  },
  deleteCurrentCart: async () => {},
  decrementProduct: async () => {},
  detachPublicCart: () => {},
  incrementProduct: async () => {},
  setProductQuantity: async () => {},
  isBusy: false,
  isHydrated: false,
  isLoading: true,
  isManagerOrderCart: false,
  isManagedPublicCart: false,
  isOwnSharedCart: false,
  isPublicMode: false,
  items: [],
  mode: "current",
  prepareShareOrder: async () => {
    throw new Error("Корзина еще не готова.");
  },
  canShare: false,
  publicAccess: null,
  quantityByProductId: {},
  shouldUseCartUi: false,
  startManagerOrder: async () => {},
  status: null,
  statusMessage: null,
  totals: {
    hasDiscount: false,
    itemsCount: 0,
    originalSubtotal: 0,
    subtotal: 0,
  },
};

export type CartProductSnapshot = Pick<
  ProductWithAttributesDto,
  "id" | "name" | "price" | "slug"
>;

type CartMutationContext = {
  previousCart: CartDto | null | undefined;
};

const MANAGER_ORDER_CATALOG_TYPES = new Set(["wholesale", "whosale"]);

function CartProviderFallback({
  children,
}: React.PropsWithChildren) {
  return (
    <CartContext.Provider value={CART_CONTEXT_FALLBACK_VALUE}>
      {children}
    </CartContext.Provider>
  );
}

function buildCurrentCartStorageKey(catalogId: string): string {
  return `catalog-current-cart:${catalogId}`;
}

function buildManagerOrderStorageKey(catalogId: string): string {
  return `catalog-manager-order:${catalogId}`;
}

function normalizeVariantId(variantId?: string | null): string | undefined {
  if (!variantId) {
    return undefined;
  }

  const trimmed = variantId.trim();
  return trimmed || undefined;
}

function createOptimisticCart(params: {
  cart: CartDto | null;
  catalogId: string;
  product?: CartProductSnapshot;
  productId: string;
  quantity: number;
  variantId?: string;
}): CartDto | null {
  const { cart, catalogId, product, productId, quantity, variantId } = params;
  const item =
    cart?.items.find(
      (entry) =>
        entry.productId === productId &&
        normalizeVariantId(entry.variantId) === normalizeVariantId(variantId),
    ) ??
    cart?.items.find((entry) => entry.productId === productId) ??
    null;

  if (!item && !product) {
    return cart;
  }

  if (!cart && quantity <= 0) {
    return null;
  }

  const now = new Date().toISOString();
  const baseCart: CartDto =
    cart ??
    {
      id: `optimistic-${catalogId}`,
      catalogId,
      status: "DRAFT",
      statusMessage: null,
      statusChangedAt: now,
      publicKey: null,
      checkoutAt: null,
      comment: null,
      assignedManagerId: null,
      managerSessionStartedAt: null,
      managerLastSeenAt: null,
      closedAt: null,
      items: [],
      totals: {
        itemsCount: 0,
        subtotal: 0,
        total: 0,
      },
      createdAt: now,
      updatedAt: now,
    };
  const productPrice = toNumberValue(product?.price ?? null) ?? item?.product.price ?? 0;
  const productShort = item?.product ?? {
    id: product?.id ?? productId,
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    price: productPrice,
  };
  const nextItems =
    quantity <= 0
      ? baseCart.items.filter((entry) => entry.id !== item?.id)
      : item
        ? baseCart.items.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  quantity,
                  lineTotal: productPrice * quantity,
                  updatedAt: now,
                }
              : entry,
          )
        : [
            ...baseCart.items,
            {
              id: `optimistic-${productId}-${variantId ?? "default"}`,
              productId,
              variantId: variantId ?? null,
              quantity,
              product: productShort,
              lineTotal: productPrice * quantity,
              createdAt: now,
              updatedAt: now,
            },
          ];
  const subtotal = nextItems.reduce((sum, entry) => sum + entry.lineTotal, 0);

  return {
    ...baseCart,
    items: nextItems,
    totals: {
      itemsCount: nextItems.reduce((sum, entry) => sum + entry.quantity, 0),
      subtotal,
      total: subtotal,
    },
    updatedAt: now,
  };
}

function mergeCartRealtimeStatus(
  nextCart: CartDto | null,
  previousCart: CartDto | null | undefined,
): CartDto | null {
  if (!nextCart || !previousCart || nextCart.id !== previousCart.id) {
    return nextCart;
  }

  const nextUpdatedAt = Date.parse(nextCart.updatedAt);
  const previousUpdatedAt = Date.parse(previousCart.updatedAt);
  const shouldKeepPreviousStatus =
    Number.isFinite(nextUpdatedAt) &&
    Number.isFinite(previousUpdatedAt) &&
    nextUpdatedAt < previousUpdatedAt;

  if (!shouldKeepPreviousStatus) {
    return nextCart;
  }

  return {
    ...nextCart,
    assignedManagerId: previousCart.assignedManagerId,
    managerLastSeenAt: previousCart.managerLastSeenAt,
    managerSessionStartedAt: previousCart.managerSessionStartedAt,
    status: previousCart.status,
    statusChangedAt: previousCart.statusChangedAt,
    statusMessage: previousCart.statusMessage,
  };
}

function getCartRealtimeVersion(cart: CartDto | null | undefined): number {
  if (!cart) {
    return 0;
  }

  const updatedAt = Date.parse(cart.updatedAt);
  const statusChangedAt = Date.parse(cart.statusChangedAt);

  return Math.max(
    Number.isFinite(updatedAt) ? updatedAt : 0,
    Number.isFinite(statusChangedAt) ? statusChangedAt : 0,
  );
}

function isStaleRealtimeCart(
  nextCart: CartDto | null,
  previousCart: CartDto | null | undefined,
): boolean {
  if (!nextCart || !previousCart || nextCart.id !== previousCart.id) {
    return false;
  }

  return getCartRealtimeVersion(nextCart) < getCartRealtimeVersion(previousCart);
}

function formatSharePrice(value: number) {
  return Intl.NumberFormat("ru-RU").format(value);
}

function buildCartShareText(params: {
  currency: string;
  items: CartItemView[];
  totals: {
    subtotal: number;
  };
}) {
  const { currency, items, totals } = params;
  const itemLines = items.map((item, index) => {
    const productLabel = item.subtitle
      ? `${item.name} (${item.subtitle})`
      : item.name;

    return `${index + 1}. ${productLabel} - ${item.quantity} шт. - ${formatSharePrice(item.displayLineTotal)} ${item.currency}`;
  });

  return [
    "Заказ:",
    ...itemLines,
    "",
    `Итого: ${formatSharePrice(totals.subtotal)} ${currency}`,
  ].join("\n");
}

void buildCartShareText;

function formatShareMoney(value: number, currency: string) {
  const normalizedCurrency = currency.trim();
  const formattedValue = formatSharePrice(value);

  return normalizedCurrency.length > 1
    ? `${formattedValue} ${normalizedCurrency}`
    : `${formattedValue}${normalizedCurrency}`;
}

function buildLegacyCartShareText(params: {
  comment?: string;
  currency: string;
  items: CartItemView[];
  totals: {
    originalSubtotal: number;
    subtotal: number;
  };
  url: string;
}) {
  const { comment, currency, items, totals, url } = params;
  const normalizedComment = comment?.trim();
  const productsText = items
    .map((item) => {
      const productLabel = item.subtitle
        ? `${item.name} (${item.subtitle})`
        : item.name;

      return `•${productLabel} - ${item.quantity} шт.`;
    })
    .join("\n\n");

  const priceText =
    totals.originalSubtotal === totals.subtotal
      ? `Сумма: ${formatShareMoney(totals.subtotal, currency)}`
      : `Сумма: ~${formatShareMoney(totals.originalSubtotal, currency)}~ ${formatShareMoney(totals.subtotal, currency)}`;

  return ["", url, "", "Заказ:", productsText]
    .concat(normalizedComment ? ["", "Комментарий:", normalizedComment] : [])
    .concat(["", priceText])
    .filter((line): line is string => line !== null && line !== undefined)
    .join("\n");
}

const CartProviderInner: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const catalog = useCatalog();
  const { isAuthenticated, isLoading: isSessionLoading, user } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const storageKey = React.useMemo(
    () => buildCartPublicStorageKey(catalog.id),
    [catalog.id],
  );
  const currentCartStorageKey = React.useMemo(
    () => buildCurrentCartStorageKey(catalog.id),
    [catalog.id],
  );
  const managerOrderStorageKey = React.useMemo(
    () => buildManagerOrderStorageKey(catalog.id),
    [catalog.id],
  );
  const fallbackCurrency = React.useMemo(
    () => getCatalogCurrency(catalog, "RUB"),
    [catalog],
  );
  const [storedPublicAccess, setStoredPublicAccess] =
    React.useState<CartPublicAccess | null>(null);
  const [hasStoredCurrentCart, setHasStoredCurrentCart] = React.useState(false);
  const [hasActiveManagerOrder, setHasActiveManagerOrder] =
    React.useState(false);
  const [autoExpandPublicCartAccessKey, setAutoExpandPublicCartAccessKey] =
    React.useState<string | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const lastPublicCartUnavailableToastAtRef = React.useRef(0);
  const lastClosedOrderToastKeyRef = React.useRef<string | null>(null);
  const resettingInactiveCartRef = React.useRef<string | null>(null);
  const currentCartNotFoundHandledRef = React.useRef(false);

  const clearStoredPublicAccess = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey);
    }

    setAutoExpandPublicCartAccessKey(null);
    setStoredPublicAccess(null);
  }, [storageKey]);

  const persistStoredCurrentCart = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(currentCartStorageKey, "1");
    }

    setHasStoredCurrentCart(true);
  }, [currentCartStorageKey]);

  const persistActiveManagerOrder = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(managerOrderStorageKey, "1");
    }

    setHasActiveManagerOrder(true);
  }, [managerOrderStorageKey]);

  const clearActiveManagerOrder = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(managerOrderStorageKey);
    }

    setHasActiveManagerOrder(false);
  }, [managerOrderStorageKey]);

  const clearStoredCurrentCart = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(currentCartStorageKey);
    }

    setHasStoredCurrentCart(false);
  }, [currentCartStorageKey]);

  const notifyPublicCartUnavailable = React.useCallback(() => {
    const now = Date.now();

    if (now - lastPublicCartUnavailableToastAtRef.current < 1_000) {
      clearStoredPublicAccess();
      return;
    }

    lastPublicCartUnavailableToastAtRef.current = now;
    clearStoredPublicAccess();
    toast.error("Публичная корзина больше недоступна.");
  }, [clearStoredPublicAccess]);

  const persistPublicAccess = React.useCallback(
    (access: CartPublicAccess) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(storageKey, serializeCartPublicAccess(access));
      }

      setStoredPublicAccess(access);
    },
    [storageKey],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const access = deserializeCartPublicAccess(
      window.sessionStorage.getItem(storageKey),
    );
    setAutoExpandPublicCartAccessKey(getPublicAccessKey(access));
    setStoredPublicAccess(access);
    setHasStoredCurrentCart(
      window.localStorage.getItem(currentCartStorageKey) === "1",
    );
    setHasActiveManagerOrder(
      window.localStorage.getItem(managerOrderStorageKey) === "1",
    );
    setIsHydrated(true);
  }, [currentCartStorageKey, managerOrderStorageKey, storageKey]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (
        event.storageArea !== window.localStorage ||
        event.key !== currentCartStorageKey
      ) {
        return;
      }

      setHasStoredCurrentCart(event.newValue === "1");
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [currentCartStorageKey]);

  React.useEffect(() => {
    if (!isHydrated || !pathname) {
      return;
    }

    const accessFromQuery = parseCartPublicAccessFromSearchParams(searchParams);
    if (!accessFromQuery) {
      return;
    }

    setAutoExpandPublicCartAccessKey(getPublicAccessKey(accessFromQuery));
    persistPublicAccess(accessFromQuery);

    const cleanedParams = removeCartPublicAccessParams(
      new URLSearchParams(searchParams.toString()),
    );
    const query = cleanedParams.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [isHydrated, pathname, persistPublicAccess, router, searchParams]);

  const isCatalogManager = Boolean(user && isCatalogManagerRole(user.role));
  const canCreateManagerOrder =
    isCatalogManager &&
    MANAGER_ORDER_CATALOG_TYPES.has(getCatalogTypeCode(catalog));

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
      persistStoredCurrentCart();
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
    persistStoredCurrentCart,
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

  React.useEffect(() => {
    if (!isOwnSharedCart || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.removeItem(storageKey);
    setAutoExpandPublicCartAccessKey(null);
  }, [isOwnSharedCart, storageKey]);

  React.useEffect(() => {
    if (!isOwnSharedCart || !currentCart || currentCart.items.length > 0) {
      return;
    }

    clearStoredPublicAccess();
  }, [clearStoredPublicAccess, currentCart, isOwnSharedCart]);

  const mode: CartMode =
    storedPublicAccess && !isOwnSharedCart ? "public" : "current";
  const publicCartQuery = useQuery({
    queryKey:
      storedPublicAccess?.publicKey
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
      isHydrated &&
      mode === "public" &&
      Boolean(storedPublicAccess?.publicKey),
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

  const activeCart = mode === "public" ? (publicCartQuery.data ?? null) : currentCart;
  const activeCartError =
    mode === "public" ? publicCartQuery.error : currentCartQuery.error;
  const activeCartLoading =
    mode === "public" ? publicCartQuery.isLoading : currentCartQuery.isLoading;
  const activeCartStatus = activeCart?.status ?? null;
  const activeCartStatusMessage = activeCart?.statusMessage ?? null;

  const { items, quantityByProductId, totals } = useCartDerivedState({
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
  const setCurrentCartData = React.useCallback(
    (cart: CartDto | null, options?: { ignoreStale?: boolean }) => {
      const previousCart =
        queryClient.getQueryData<CartDto | null>(cartQueryKeys.current);
      if (options?.ignoreStale && isStaleRealtimeCart(cart, previousCart)) {
        return;
      }

      const nextCart = mergeCartRealtimeStatus(cart, previousCart);

      if (nextCart) {
        persistStoredCurrentCart();
        currentCartNotFoundHandledRef.current = false;
      } else {
        clearStoredCurrentCart();
      }

      queryClient.setQueryData(cartQueryKeys.current, nextCart);
    },
    [clearStoredCurrentCart, persistStoredCurrentCart, queryClient],
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

      queryClient.setQueryData(
        queryKey,
        nextCart,
      );
    },
    [queryClient],
  );

  const handleSseCartUpdated = React.useCallback(
    (cart: CartDto, access?: CartPublicAccess | null) => {
      if (access) {
        setPublicCartData(access, cart, { ignoreStale: true });
        return;
      }

      setCurrentCartData(cart, { ignoreStale: true });
    },
    [setCurrentCartData, setPublicCartData],
  );

  const dismissPublicCart = React.useCallback(
    (access: CartPublicAccess | null) => {
      if (!access) {
        return;
      }

      queryClient.removeQueries({
        queryKey: cartQueryKeys.public(access.publicKey),
      });
      clearStoredPublicAccess();
    },
    [clearStoredPublicAccess, queryClient],
  );

  const replaceInactiveUserCart = React.useCallback(
    async (cart: CartDto, access?: CartPublicAccess | null) => {
      const resetKey = `${cart.id}:${cart.status}`;

      if (resettingInactiveCartRef.current === resetKey) {
        return;
      }

      resettingInactiveCartRef.current = resetKey;

      try {
        if (access) {
          queryClient.removeQueries({
            queryKey: cartQueryKeys.public(access.publicKey),
          });
        }

        if (cart.publicKey && storedPublicAccess?.publicKey === cart.publicKey) {
          clearStoredPublicAccess();
        }

        const response = await cartControllerCreateOrGetCurrent();
        setCurrentCartData(response.cart);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Не удалось обновить корзину.",
        );
      } finally {
        resettingInactiveCartRef.current = null;
      }
    },
    [
      clearStoredPublicAccess,
      queryClient,
      setCurrentCartData,
      storedPublicAccess?.publicKey,
    ],
  );

  const handleSseCartStatusChanged = React.useCallback(
    (cart: CartDto, access?: CartPublicAccess | null) => {
      if (access) {
        setPublicCartData(access, cart, { ignoreStale: true });
      } else {
        setCurrentCartData(cart, { ignoreStale: true });
      }

      if (cart.status === "CONVERTED" && !isCatalogManagerRole(user?.role)) {
        const toastKey = `${cart.id}:${cart.statusChangedAt ?? cart.updatedAt}`;

        if (lastClosedOrderToastKeyRef.current !== toastKey) {
          lastClosedOrderToastKeyRef.current = toastKey;
          toast.success("Заказ был успешно закрыт.");
        }
      }

      if (!isInactiveSharedCartStatus(cart.status)) {
        return;
      }

      if (access && isManagedPublicCart) {
        dismissPublicCart(access);
        return;
      }

      if (!isCatalogManagerRole(user?.role) && (access || cart.publicKey)) {
        return;
      }

      if (!isCatalogManagerRole(user?.role)) {
        void replaceInactiveUserCart(cart, access);
        return;
      }

      if (access) {
        dismissPublicCart(access);
      }
    },
    [
      dismissPublicCart,
      isManagedPublicCart,
      replaceInactiveUserCart,
      setCurrentCartData,
      setPublicCartData,
      user?.role,
    ],
  );

  const { isManagerSessionLoading } = useCartManagerSession({
    isHydrated,
    isManagedPublicCart,
    setPublicCartData,
    storedPublicAccess,
    userId: user?.id,
    userRole: user?.role,
  });

  const upsertCurrentItemMutation = useMutation({
    mutationFn: async (params: {
      product?: CartProductSnapshot;
      productId: string;
      quantity: number;
      variantId?: string;
    }) => {
      const response = await cartControllerUpsertCurrentItem({
        productId: params.productId,
        quantity: params.quantity,
        ...(params.variantId ? { variantId: params.variantId } : {}),
      });

      return response.cart;
    },
    onMutate: async (params): Promise<CartMutationContext> => {
      await queryClient.cancelQueries({ queryKey: cartQueryKeys.current });
      const previousCart =
        queryClient.getQueryData<CartDto | null>(cartQueryKeys.current);
      const optimisticCart = createOptimisticCart({
        cart: previousCart ?? activeCart,
        catalogId: catalog.id,
        product: params.product,
        productId: params.productId,
        quantity: params.quantity,
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
      variantId?: string;
    }) => {
      const response = await cartControllerUpsertPublicItem(params.access.publicKey, {
        productId: params.productId,
        quantity: params.quantity,
        ...(params.variantId ? { variantId: params.variantId } : {}),
      });

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
        catalogId: catalog.id,
        product: params.product,
        productId: params.productId,
        quantity: params.quantity,
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
    mutationFn: async (comment?: string) =>
      cartControllerShareCurrent(comment ? { comment } : undefined),
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
      const response = await cartControllerCompleteManagerOrder(access.publicKey);

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

  const isLocalCartMutationPending =
    upsertCurrentItemMutation.isPending ||
    upsertPublicItemMutation.isPending ||
    removeCurrentItemMutation.isPending ||
    removePublicItemMutation.isPending;

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

  const findCartItemByProductId = React.useCallback(
    (productId: string): CartItemDto | null => {
      if (!activeCart) {
        return null;
      }

      return (
        activeCart.items.find(
          (item) => item.productId === productId && item.variantId === null,
        ) ??
        activeCart.items.find((item) => item.productId === productId) ??
        null
      );
    },
    [activeCart],
  );

  const setProductQuantity = React.useCallback(
    async (
      productId: string,
      nextQuantity: number,
      product?: CartProductSnapshot,
    ) => {
      const cartItem = findCartItemByProductId(productId);
      const variantId = normalizeVariantId(cartItem?.variantId);

      if (mode === "public" && storedPublicAccess) {
        await upsertPublicItemMutation.mutateAsync({
          access: storedPublicAccess,
          product,
          productId,
          quantity: nextQuantity,
          ...(variantId ? { variantId } : {}),
        });
        return;
      }

      await upsertCurrentItemMutation.mutateAsync({
        product,
        productId,
        quantity: nextQuantity,
        ...(variantId ? { variantId } : {}),
      });
    },
    [
      findCartItemByProductId,
      mode,
      storedPublicAccess,
      upsertCurrentItemMutation,
      upsertPublicItemMutation,
    ],
  );

  const incrementProduct = React.useCallback(
    async (productId: string, product?: CartProductSnapshot) => {
      const quantity = quantityByProductId[productId] ?? 0;
      await setProductQuantity(productId, quantity + 1, product);
    },
    [quantityByProductId, setProductQuantity],
  );

  const decrementProduct = React.useCallback(
    async (productId: string, product?: CartProductSnapshot) => {
      const quantity = quantityByProductId[productId] ?? 0;
      if (quantity <= 0) {
        return;
      }

      await setProductQuantity(productId, Math.max(quantity - 1, 0), product);
    },
    [quantityByProductId, setProductQuantity],
  );

  const clearCart = React.useCallback(async () => {
    if (!activeCart?.items.length) {
      return;
    }

    if (mode === "public" && storedPublicAccess) {
      for (const item of activeCart.items) {
        await removePublicItemMutation.mutateAsync({
          access: storedPublicAccess,
          itemId: item.id,
        });
      }
      return;
    }

    for (const item of activeCart.items) {
      await removeCurrentItemMutation.mutateAsync(item.id);
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
    queryClient,
    removeCurrentItemMutation,
    removePublicItemMutation,
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

    await deleteCurrentCartMutation.mutateAsync();
  }, [
    activeCart,
    clearActiveManagerOrder,
    clearStoredCurrentCart,
    clearStoredPublicAccess,
    deleteCurrentCartMutation,
    mode,
    queryClient,
  ]);

  const prepareShareOrder = React.useCallback(async (comment?: string): Promise<CartSharePayload> => {
    if (!items.length) {
      throw new Error("Нельзя поделиться пустой корзиной.");
    }

    let access = storedPublicAccess;
    const normalizedComment = comment?.trim();

    if (!access) {
      const shared = await shareCurrentCartMutation.mutateAsync(
        normalizedComment || undefined,
      );
      const publicKey = shared.publicKey || shared.cart.publicKey;
      if (!publicKey) {
        throw new Error("Не удалось подготовить публичную корзину.");
      }

      access = {
        publicKey,
        rawLink: `/?c=${encodeURIComponent(publicKey)}`,
      };
    }

    setStoredPublicAccess(access);
    const shareUrl = buildCartShareUrl(access, buildShareBaseUrl());

    return {
      text: buildLegacyCartShareText({
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
  }, [
    items,
    shareCurrentCartMutation,
    shareCurrency,
    shareTitle,
    storedPublicAccess,
    totals.originalSubtotal,
    totals.subtotal,
  ]);

  const startManagerOrder = React.useCallback(async () => {
    if (!canCreateManagerOrder) {
      return;
    }

    await startManagerOrderMutation.mutateAsync();
  }, [canCreateManagerOrder, startManagerOrderMutation]);

  const completeManagedOrder = React.useCallback(async (comment?: string) => {
    let access = storedPublicAccess;
    const shouldResetCurrentCartAfterComplete = !access;

    if (!access) {
      if (!items.length) {
        throw new Error("Нельзя завершить пустую корзину.");
      }

      const shared = await shareCurrentCartMutation.mutateAsync(
        comment?.trim() || undefined,
      );
      const publicKey = shared.publicKey || shared.cart.publicKey;
      if (!publicKey) {
        throw new Error("Не удалось подготовить заказ.");
      }

      access = {
        publicKey,
        rawLink: `/?c=${encodeURIComponent(publicKey)}`,
      };
    }

    const result = await completeManagerOrderMutation.mutateAsync(access);

    if (shouldResetCurrentCartAfterComplete) {
      clearActiveManagerOrder();
      clearStoredCurrentCart();
      queryClient.removeQueries({ queryKey: cartQueryKeys.current });
    }

    return result.order;
  }, [
    clearActiveManagerOrder,
    clearStoredCurrentCart,
    completeManagerOrderMutation,
    items.length,
    queryClient,
    shareCurrentCartMutation,
    storedPublicAccess,
  ]);

  const isBusy =
    upsertCurrentItemMutation.isPending ||
    upsertPublicItemMutation.isPending ||
    removeCurrentItemMutation.isPending ||
    removePublicItemMutation.isPending ||
    deleteCurrentCartMutation.isPending ||
    shareCurrentCartMutation.isPending ||
    startManagerOrderMutation.isPending ||
    completeManagerOrderMutation.isPending ||
    isManagerSessionLoading;

  const value = React.useMemo<CartContextValue>(
    () => ({
      autoExpandPublicCartAccessKey,
      canCreateManagerOrder,
      canShare,
      cart: activeCart,
      clearCart,
      completeManagedOrder,
      deleteCurrentCart,
      decrementProduct,
      detachPublicCart: clearStoredPublicAccess,
      incrementProduct,
      setProductQuantity,
      isBusy,
      isHydrated,
      isLoading:
        isSessionLoading ||
        activeCartLoading ||
        (!activeCart && Boolean(activeCartError)),
      isManagerOrderCart,
      isManagedPublicCart,
      isOwnSharedCart,
      isPublicMode: mode === "public",
      items,
      mode,
      prepareShareOrder,
      publicAccess: storedPublicAccess,
      quantityByProductId,
      shouldUseCartUi,
      startManagerOrder,
      status: activeCartStatus,
      statusMessage: activeCartStatusMessage,
      totals,
    }),
    [
      activeCart,
      activeCartError,
      activeCartLoading,
      activeCartStatus,
      activeCartStatusMessage,
      autoExpandPublicCartAccessKey,
      canCreateManagerOrder,
      canShare,
      clearCart,
      clearStoredPublicAccess,
      completeManagedOrder,
      deleteCurrentCart,
      decrementProduct,
      incrementProduct,
      setProductQuantity,
      isBusy,
      isHydrated,
      isSessionLoading,
      isManagerOrderCart,
      isManagedPublicCart,
      isOwnSharedCart,
      items,
      mode,
      prepareShareOrder,
      quantityByProductId,
      shouldUseCartUi,
      startManagerOrder,
      storedPublicAccess,
      totals,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const CartProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <React.Suspense fallback={<CartProviderFallback>{children}</CartProviderFallback>}>
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
