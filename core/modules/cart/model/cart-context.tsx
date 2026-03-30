"use client";

import {
  getCartPricingForProduct,
  type CartItemView,
} from "@/core/modules/cart/model/cart-item-view";
import {
  isCartNotFoundError,
  isCartUnauthorizedError,
} from "@/core/modules/cart/model/cart-api-errors";
import {
  isCartDetachedEvent,
  isCartStatusChangedEvent,
  isCartUpdatedEvent,
  isInactiveSharedCartStatus,
} from "@/core/modules/cart/model/cart-events";
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
import {
  AuthUserDtoRole,
  cartControllerReleaseManagerSession,
  cartControllerCompleteManagerOrder,
  cartControllerCreateOrGetCurrent,
  cartControllerCreateCheckoutKey,
  cartControllerGetCurrent,
  cartControllerGetPublicCart,
  cartControllerHeartbeatManagerSession,
  cartControllerRemoveCurrentItem,
  cartControllerRemovePublicItem,
  cartControllerStartManagerSession,
  cartControllerShareCurrent,
  cartControllerUpsertCurrentItem,
  cartControllerUpsertPublicItem,
  type CartDto,
  type CartItemDto,
  type CompletedOrderDto,
  type ProductWithAttributesDto,
} from "@/shared/api/generated/react-query";
import {
  connectCartControllerSseCurrent,
  connectCartControllerSsePublic,
} from "@/shared/api/generated/cart-sse";
import {
  API_BASE_URL,
  FORWARDED_HOST_HEADER,
  getForwardedHost,
} from "@/shared/api/client";
import { withCsrf } from "@/shared/api/client-request";
import { createStrictContext, useStrictContext } from "@/shared/lib/react";
import { getCatalogCurrency } from "@/shared/lib/utils";
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

type CartMode = "current" | "public";

const CART_MANAGER_HEARTBEAT_MS = 25_000;
const CART_SSE_RECONNECT_DELAY_MS = 3_000;

function releaseManagerSessionWithKeepalive(publicKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  const headers = new Headers(withCsrf());
  const forwardedHost = getForwardedHost();

  if (forwardedHost) {
    headers.set(FORWARDED_HOST_HEADER, forwardedHost);
  }

  void fetch(
    new URL(`/cart/public/${publicKey}/manager/release`, API_BASE_URL).toString(),
    {
      method: "POST",
      credentials: "include",
      headers,
      keepalive: true,
      cache: "no-store",
    },
  ).catch(() => undefined);
}

export interface CartSharePayload {
  text: string;
  title?: string;
  url: string;
}

interface CartContextValue {
  autoExpandPublicCartAccessKey: string | null;
  cart: CartDto | null;
  clearCart: () => Promise<void>;
  completeManagedOrder: () => Promise<CompletedOrderDto>;
  decrementProduct: (productId: string) => Promise<void>;
  detachPublicCart: () => void;
  incrementProduct: (productId: string) => Promise<void>;
  isBusy: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  isManagedPublicCart: boolean;
  isOwnSharedCart: boolean;
  isPublicMode: boolean;
  items: CartItemView[];
  mode: CartMode;
  prepareShareOrder: (comment?: string) => Promise<CartSharePayload>;
  publicAccess: CartPublicAccess | null;
  quantityByProductId: Record<string, number>;
  shouldUseCartUi: boolean;
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
  cart: null,
  clearCart: async () => {},
  completeManagedOrder: async () => {
    throw new Error("Корзина еще не готова.");
  },
  decrementProduct: async () => {},
  detachPublicCart: () => {},
  incrementProduct: async () => {},
  isBusy: false,
  isHydrated: false,
  isLoading: true,
  isManagedPublicCart: false,
  isOwnSharedCart: false,
  isPublicMode: false,
  items: [],
  mode: "current",
  prepareShareOrder: async () => {
    throw new Error("Корзина еще не готова.");
  },
  publicAccess: null,
  quantityByProductId: {},
  shouldUseCartUi: false,
  status: null,
  statusMessage: null,
  totals: {
    hasDiscount: false,
    itemsCount: 0,
    originalSubtotal: 0,
    subtotal: 0,
  },
};

function CartProviderFallback({
  children,
}: React.PropsWithChildren) {
  return (
    <CartContext.Provider value={CART_CONTEXT_FALLBACK_VALUE}>
      {children}
    </CartContext.Provider>
  );
}

function normalizeVariantId(variantId?: string | null): string | undefined {
  if (!variantId) {
    return undefined;
  }

  const trimmed = variantId.trim();
  return trimmed || undefined;
}

function isManagerRole(role?: string | null) {
  return role === AuthUserDtoRole.ADMIN || role === AuthUserDtoRole.CATALOG;
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

  return [url, "", "Заказ:", productsText, normalizedComment ? "" : null]
    .concat(normalizedComment ? ["Комментарий:", normalizedComment] : [])
    .concat(["", priceText])
    .filter(Boolean)
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
  const fallbackCurrency = React.useMemo(
    () => getCatalogCurrency(catalog, "RUB"),
    [catalog],
  );
  const [storedPublicAccess, setStoredPublicAccess] =
    React.useState<CartPublicAccess | null>(null);
  const [autoExpandPublicCartAccessKey, setAutoExpandPublicCartAccessKey] =
    React.useState<string | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [isManagerSessionLoading, setIsManagerSessionLoading] =
    React.useState(false);
  const lastPublicCartUnavailableToastAtRef = React.useRef(0);
  const resettingInactiveCartRef = React.useRef<string | null>(null);

  const clearStoredPublicAccess = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey);
    }

    setAutoExpandPublicCartAccessKey(null);
    setStoredPublicAccess(null);
  }, [storageKey]);

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
    setIsHydrated(true);
  }, [storageKey]);

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

  const shouldEnableCurrentCartQuery =
    isHydrated &&
    !isSessionLoading &&
    (!isAuthenticated || Boolean(storedPublicAccess));

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
      storedPublicAccess?.publicKey && storedPublicAccess.checkoutKey
        ? cartQueryKeys.public(
            storedPublicAccess.publicKey,
            storedPublicAccess.checkoutKey,
          )
        : ["cart", "public", "empty"],
    queryFn: async (): Promise<CartDto | null> => {
      if (!storedPublicAccess) {
        return null;
      }

      const response = await cartControllerGetPublicCart(
        storedPublicAccess.publicKey,
        {
          checkoutKey: storedPublicAccess.checkoutKey,
        },
      );

      return response.cart;
    },
    enabled:
      isHydrated &&
      mode === "public" &&
      Boolean(storedPublicAccess?.publicKey && storedPublicAccess.checkoutKey),
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

    notifyPublicCartUnavailable();
  }, [
    mode,
    notifyPublicCartUnavailable,
    publicCartQuery.error,
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
  const shouldUseCartUi = mode === "public" || (!isSessionLoading && !isAuthenticated);
  const isManagedPublicCart =
    mode === "public" && Boolean(user && isManagerRole(user.role));
  const shareCurrency = items[0]?.currency ?? fallbackCurrency;
  const shareTitle = React.useMemo(() => {
    const normalizedCatalogName = catalog.name?.trim();
    return normalizedCatalogName
      ? `Заказ из каталога «${normalizedCatalogName}»`
      : "Заказ";
  }, [catalog.name]);
  const setCurrentCartData = React.useCallback(
    (cart: CartDto | null) => {
      queryClient.setQueryData(cartQueryKeys.current, cart);
    },
    [queryClient],
  );

  const setPublicCartData = React.useCallback(
    (access: CartPublicAccess | null, cart: CartDto | null) => {
      if (!access) {
        return;
      }

      queryClient.setQueryData(
        cartQueryKeys.public(access.publicKey, access.checkoutKey),
        cart,
      );
    },
    [queryClient],
  );

  const handleSseCartUpdated = React.useCallback(
    (cart: CartDto, access?: CartPublicAccess | null) => {
      if (access) {
        setPublicCartData(access, cart);
        return;
      }

      setCurrentCartData(cart);
    },
    [setCurrentCartData, setPublicCartData],
  );

  const dismissPublicCart = React.useCallback(
    (access: CartPublicAccess | null) => {
      if (!access) {
        return;
      }

      queryClient.removeQueries({
        queryKey: cartQueryKeys.public(access.publicKey, access.checkoutKey),
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
            queryKey: cartQueryKeys.public(access.publicKey, access.checkoutKey),
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
        setPublicCartData(access, cart);
      } else {
        setCurrentCartData(cart);
      }

      if (!isInactiveSharedCartStatus(cart.status)) {
        return;
      }

      if (access && isManagedPublicCart) {
        dismissPublicCart(access);
        return;
      }

      if (!isManagerRole(user?.role)) {
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

  React.useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (mode === "public") {
      if (!storedPublicAccess) {
        return;
      }
    } else if (!currentCart?.id) {
      return;
    }

    const abortController = new AbortController();
    let reconnectTimeoutId: number | null = null;
    let isDisposed = false;

    const scheduleReconnect = () => {
      if (isDisposed) {
        return;
      }

      reconnectTimeoutId = window.setTimeout(() => {
        void connect();
      }, CART_SSE_RECONNECT_DELAY_MS);
    };

    const connect = async () => {
      try {
        if (mode === "public" && storedPublicAccess) {
          await connectCartControllerSsePublic(
            storedPublicAccess.publicKey,
            { checkoutKey: storedPublicAccess.checkoutKey },
            {
              signal: abortController.signal,
              onEvent: (event) => {
                if (isCartUpdatedEvent(event)) {
                  handleSseCartUpdated(event.data, storedPublicAccess);
                  return;
                }

                if (isCartStatusChangedEvent(event)) {
                  handleSseCartStatusChanged(event.data, storedPublicAccess);
                  return;
                }

                if (isCartDetachedEvent(event)) {
                  clearStoredPublicAccess();
                  toast.success("Корзина была откреплена.");
                }
              },
            },
          );
        } else {
          await connectCartControllerSseCurrent({
            signal: abortController.signal,
            onEvent: (event) => {
              if (isCartUpdatedEvent(event)) {
                handleSseCartUpdated(event.data);
                return;
              }

              if (isCartStatusChangedEvent(event)) {
                handleSseCartStatusChanged(event.data);
              }
            },
          });
        }

        if (!abortController.signal.aborted) {
          scheduleReconnect();
        }
      } catch (error) {
        if (abortController.signal.aborted || isDisposed) {
          return;
        }

        if (
          mode === "public" &&
          (isCartUnauthorizedError(error) || isCartNotFoundError(error))
        ) {
          notifyPublicCartUnavailable();
          return;
        }

        scheduleReconnect();
      }
    };

    void connect();

    return () => {
      isDisposed = true;
      abortController.abort();

      if (reconnectTimeoutId !== null) {
        window.clearTimeout(reconnectTimeoutId);
      }
    };
  }, [
    clearStoredPublicAccess,
    currentCart?.id,
    handleSseCartStatusChanged,
    handleSseCartUpdated,
    isHydrated,
    mode,
    notifyPublicCartUnavailable,
    storedPublicAccess,
  ]);

  React.useEffect(() => {
    if (!isHydrated || !isManagedPublicCart || !storedPublicAccess) {
      return;
    }

    let isDisposed = false;
    let heartbeatIntervalId: number | null = null;
    let hasStartedManagerSession = false;
    let hasReleasedManagerSession = false;

    const access = storedPublicAccess;

    const clearHeartbeat = () => {
      if (heartbeatIntervalId !== null) {
        window.clearInterval(heartbeatIntervalId);
        heartbeatIntervalId = null;
      }
    };

    const releaseManagerSession = (useKeepalive = false) => {
      if (hasReleasedManagerSession || !hasStartedManagerSession) {
        return;
      }

      hasReleasedManagerSession = true;
      clearHeartbeat();

      if (useKeepalive) {
        releaseManagerSessionWithKeepalive(access.publicKey);
        return;
      }

      void cartControllerReleaseManagerSession(access.publicKey).catch(
        () => undefined,
      );
    };

    const handlePageHide = () => {
      releaseManagerSession(true);
    };

    const runHeartbeat = async () => {
      try {
        const response = await cartControllerHeartbeatManagerSession(
          access.publicKey,
        );

        if (isDisposed) {
          return;
        }

        setPublicCartData(access, response.cart);
      } catch (error) {
        if (isDisposed) {
          return;
        }

        if (isCartUnauthorizedError(error) || isCartNotFoundError(error)) {
          clearHeartbeat();
          return;
        }
      }
    };

    const startManagerSession = async () => {
      setIsManagerSessionLoading(true);

      try {
        const response = await cartControllerStartManagerSession(access.publicKey);

        if (isDisposed) {
          return;
        }

        hasStartedManagerSession = true;
        setPublicCartData(access, response.cart);
        heartbeatIntervalId = window.setInterval(() => {
          void runHeartbeat();
        }, CART_MANAGER_HEARTBEAT_MS);
      } catch (error) {
        if (isDisposed) {
          return;
        }

        toast.error(
          error instanceof Error
            ? error.message
            : "Не удалось взять корзину в работу.",
        );
      } finally {
        if (!isDisposed) {
          setIsManagerSessionLoading(false);
        }
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);
    void startManagerSession();

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      isDisposed = true;
      releaseManagerSession();
      clearHeartbeat();
    };
  }, [
    isHydrated,
    isManagedPublicCart,
    setPublicCartData,
    storedPublicAccess,
    user?.id,
    user?.role,
  ]);

  const upsertCurrentItemMutation = useMutation({
    mutationFn: async (params: {
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
    onSuccess: setCurrentCartData,
  });

  const upsertPublicItemMutation = useMutation({
    mutationFn: async (params: {
      access: CartPublicAccess;
      productId: string;
      quantity: number;
      variantId?: string;
    }) => {
      const response = await cartControllerUpsertPublicItem(params.access.publicKey, {
        productId: params.productId,
        quantity: params.quantity,
        checkoutKey: params.access.checkoutKey,
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
  });

  const removeCurrentItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await cartControllerRemoveCurrentItem(itemId);
      return response.cart;
    },
    onSuccess: setCurrentCartData,
  });

  const removePublicItemMutation = useMutation({
    mutationFn: async (params: {
      access: CartPublicAccess;
      itemId: string;
    }) => {
      const response = await cartControllerRemovePublicItem(
        params.access.publicKey,
        params.itemId,
        {
          checkoutKey: params.access.checkoutKey,
        },
      );

      return {
        access: params.access,
        cart: response.cart,
      };
    },
    onSuccess: ({ access, cart }) => {
      setPublicCartData(access, cart);
    },
  });

  const shareCurrentCartMutation = useMutation({
    mutationFn: async () => cartControllerShareCurrent(),
    onSuccess: (response) => {
      setCurrentCartData(response.cart);
    },
  });

  const createCheckoutKeyMutation = useMutation({
    mutationFn: async (publicKey: string) => cartControllerCreateCheckoutKey(publicKey),
    onSuccess: (response) => {
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
        queryKey: cartQueryKeys.public(access.publicKey, access.checkoutKey),
      });
      clearStoredPublicAccess();
    },
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
    async (productId: string, nextQuantity: number) => {
      const cartItem = findCartItemByProductId(productId);
      const variantId = normalizeVariantId(cartItem?.variantId);

      if (mode === "public" && storedPublicAccess) {
        await upsertPublicItemMutation.mutateAsync({
          access: storedPublicAccess,
          productId,
          quantity: nextQuantity,
          ...(variantId ? { variantId } : {}),
        });
        return;
      }

      await upsertCurrentItemMutation.mutateAsync({
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
    async (productId: string) => {
      const quantity = quantityByProductId[productId] ?? 0;
      await setProductQuantity(productId, quantity + 1);
    },
    [quantityByProductId, setProductQuantity],
  );

  const decrementProduct = React.useCallback(
    async (productId: string) => {
      const quantity = quantityByProductId[productId] ?? 0;
      if (quantity <= 0) {
        return;
      }

      await setProductQuantity(productId, Math.max(quantity - 1, 0));
    },
    [quantityByProductId, setProductQuantity],
  );

  const clearCart = React.useCallback(async () => {
    if (!activeCart?.items.length) {
      return;
    }

    if (mode === "public" && storedPublicAccess) {
      await Promise.all(
        activeCart.items.map((item) =>
          removePublicItemMutation.mutateAsync({
            access: storedPublicAccess,
            itemId: item.id,
          }),
        ),
      );
      return;
    }

    await Promise.all(
      activeCart.items.map((item) => removeCurrentItemMutation.mutateAsync(item.id)),
    );
  }, [
    activeCart,
    mode,
    removeCurrentItemMutation,
    removePublicItemMutation,
    storedPublicAccess,
  ]);

  const prepareShareOrder = React.useCallback(async (comment?: string): Promise<CartSharePayload> => {
    if (!items.length) {
      throw new Error("Нельзя поделиться пустой корзиной.");
    }

    let access = storedPublicAccess;

    if (!access) {
      const shared = await shareCurrentCartMutation.mutateAsync();
      const publicKey = shared.publicKey || shared.cart.publicKey;
      if (!publicKey) {
        throw new Error("Не удалось подготовить публичную корзину.");
      }

      const checkout = await createCheckoutKeyMutation.mutateAsync(publicKey);
      access = {
        checkoutKey: checkout.checkoutKey,
        publicKey,
        rawLink: `/cart/public/${publicKey}?checkoutKey=${checkout.checkoutKey}`,
      };
    }

    setStoredPublicAccess(access);
    const shareUrl = buildCartShareUrl(access, buildShareBaseUrl());

    return {
      text: buildLegacyCartShareText({
        comment,
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
    createCheckoutKeyMutation,
    items,
    shareCurrentCartMutation,
    shareCurrency,
    shareTitle,
    storedPublicAccess,
    totals.originalSubtotal,
    totals.subtotal,
  ]);

  const completeManagedOrder = React.useCallback(async () => {
    if (!storedPublicAccess) {
      throw new Error("Публичная корзина не найдена.");
    }

    const result = await completeManagerOrderMutation.mutateAsync(storedPublicAccess);
    return result.order;
  }, [completeManagerOrderMutation, storedPublicAccess]);

  const isBusy =
    upsertCurrentItemMutation.isPending ||
    upsertPublicItemMutation.isPending ||
    removeCurrentItemMutation.isPending ||
    removePublicItemMutation.isPending ||
    shareCurrentCartMutation.isPending ||
    createCheckoutKeyMutation.isPending ||
    completeManagerOrderMutation.isPending ||
    isManagerSessionLoading;

  const value = React.useMemo<CartContextValue>(
    () => ({
      autoExpandPublicCartAccessKey,
      cart: activeCart,
      clearCart,
      completeManagedOrder,
      decrementProduct,
      detachPublicCart: clearStoredPublicAccess,
      incrementProduct,
      isBusy,
      isHydrated,
      isLoading:
        isSessionLoading ||
        activeCartLoading ||
        (!activeCart && Boolean(activeCartError)),
      isManagedPublicCart,
      isOwnSharedCart,
      isPublicMode: mode === "public",
      items,
      mode,
      prepareShareOrder,
      publicAccess: storedPublicAccess,
      quantityByProductId,
      shouldUseCartUi,
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
      clearCart,
      clearStoredPublicAccess,
      completeManagedOrder,
      decrementProduct,
      incrementProduct,
      isBusy,
      isHydrated,
      isSessionLoading,
      isManagedPublicCart,
      isOwnSharedCart,
      items,
      mode,
      prepareShareOrder,
      quantityByProductId,
      shouldUseCartUi,
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
