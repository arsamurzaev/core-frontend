"use client";

import React from "react";
import { toast } from "sonner";
import {
  connectCartControllerSseCurrent,
  connectCartControllerSsePublic,
} from "@/shared/api/generated/cart-sse";
import {
  isCartNotFoundError,
  isCartUnauthorizedError,
} from "@/core/modules/cart/model/cart-api-errors";
import {
  isCartDetachedEvent,
  isCartStatusChangedEvent,
  isCartUpdatedEvent,
} from "@/core/modules/cart/model/cart-events";
import { type CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import {
  CART_SSE_RECONNECT_DELAY_MS,
  type CartMode,
} from "@/core/modules/cart/model/cart-constants";
import { type CartDto } from "@/shared/api/generated/react-query";

type UseCartSseParams = {
  activeCart: CartDto | null;
  clearStoredPublicAccess: () => void;
  handleSseConnected?: (access?: CartPublicAccess | null) => void;
  handleSseCartStatusChanged: (cart: CartDto, access?: CartPublicAccess | null) => void;
  handleSseCartUpdated: (cart: CartDto, access?: CartPublicAccess | null) => void;
  isHydrated: boolean;
  isLocalCartMutationPending: boolean;
  mode: CartMode;
  notifyPublicCartUnavailable: () => void;
  storedPublicAccess: CartPublicAccess | null;
};

function getCartItemsFingerprint(cart: CartDto | null | undefined): string | null {
  if (!cart) {
    return null;
  }

  return `${cart.id}:${cart.items
    .map(
      (item) =>
        `${item.id}:${item.productId}:${item.variantId ?? ""}:${item.quantity}`,
    )
    .join("|")}`;
}

export function useCartSse({
  activeCart,
  clearStoredPublicAccess,
  handleSseConnected,
  handleSseCartStatusChanged,
  handleSseCartUpdated,
  isHydrated,
  isLocalCartMutationPending,
  mode,
  notifyPublicCartUnavailable,
  storedPublicAccess,
}: UseCartSseParams): void {
  const activeCartItemsFingerprintRef = React.useRef<string | null>(null);
  const isLocalCartMutationPendingRef = React.useRef(isLocalCartMutationPending);

  React.useEffect(() => {
    activeCartItemsFingerprintRef.current = getCartItemsFingerprint(activeCart);
  }, [activeCart]);

  React.useEffect(() => {
    isLocalCartMutationPendingRef.current = isLocalCartMutationPending;
  }, [isLocalCartMutationPending]);

  React.useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (mode === "public" && !storedPublicAccess) {
      return;
    }

    if (mode === "current" && !activeCart) {
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
                if (event.type === "connected") {
                  handleSseConnected?.(storedPublicAccess);
                  return;
                }

                if (isCartUpdatedEvent(event)) {
                  const nextFingerprint = getCartItemsFingerprint(event.data);
                  const shouldNotifyCartUpdated =
                    nextFingerprint !== activeCartItemsFingerprintRef.current &&
                    !isLocalCartMutationPendingRef.current;

                  handleSseCartUpdated(event.data, storedPublicAccess);
                  activeCartItemsFingerprintRef.current = nextFingerprint;

                  if (shouldNotifyCartUpdated) {
                    toast.success("Содержимое корзины обновлено.");
                  }
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
              if (event.type === "connected") {
                handleSseConnected?.();
                return;
              }

              if (isCartUpdatedEvent(event)) {
                const nextFingerprint = getCartItemsFingerprint(event.data);
                const shouldNotifyCartUpdated =
                  nextFingerprint !== activeCartItemsFingerprintRef.current &&
                  !isLocalCartMutationPendingRef.current;

                handleSseCartUpdated(event.data);
                activeCartItemsFingerprintRef.current = nextFingerprint;

                if (shouldNotifyCartUpdated) {
                  toast.success("Содержимое корзины обновлено.");
                }
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
    activeCart?.id,
    handleSseConnected,
    handleSseCartStatusChanged,
    handleSseCartUpdated,
    isHydrated,
    mode,
    notifyPublicCartUnavailable,
    storedPublicAccess,
  ]);
}
