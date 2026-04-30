"use client";

import React from "react";
import { toast } from "sonner";
import {
  connectCartControllerSseCurrent,
  connectCartControllerSsePublic,
  type CartSseEvent,
} from "@/shared/api/generated/cart-sse";
import {
  isCartNotFoundError,
  isCartUnauthorizedError,
} from "@/core/modules/cart/model/cart-api-errors";
import {
  isCartDetachedEvent,
  isCartSnapshotEvent,
  isCartStatusChangedEvent,
  isCartUpdatedEvent,
} from "@/core/modules/cart/model/cart-events";
import { type CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import {
  CART_SSE_RECONNECT_DELAY_MS,
  CART_SSE_RECONNECT_MAX_DELAY_MS,
  CART_SSE_STALE_TIMEOUT_MS,
  type CartMode,
} from "@/core/modules/cart/model/cart-constants";
import { type CartDto } from "@/shared/api/generated/react-query";

type UseCartSseParams = {
  activeCart: CartDto | null;
  clearStoredPublicAccess: () => void;
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

function getReconnectDelay(attempt: number): number {
  const baseDelay = Math.min(
    CART_SSE_RECONNECT_DELAY_MS * 2 ** attempt,
    CART_SSE_RECONNECT_MAX_DELAY_MS,
  );
  const jitter = Math.round(baseDelay * 0.2 * Math.random());
  return baseDelay + jitter;
}

function isRedisStreamEventId(value: string | undefined): value is string {
  return Boolean(value && /^\d+-\d+$/.test(value));
}

function logCartSseDebug(message: string, details?: Record<string, unknown>) {
  if (process.env.NEXT_PUBLIC_CART_SSE_DEBUG !== "1") {
    return;
  }

  console.debug(`[cart-sse] ${message}`, details ?? {});
}

export function useCartSse({
  activeCart,
  clearStoredPublicAccess,
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

    let connectionAbortController: AbortController | null = null;
    let reconnectTimeoutId: number | null = null;
    let staleTimeoutId: number | null = null;
    let reconnectAttempt = 0;
    let lastEventId: string | null = null;
    let isDisposed = false;

    const clearStaleTimeout = () => {
      if (staleTimeoutId !== null) {
        window.clearTimeout(staleTimeoutId);
        staleTimeoutId = null;
      }
    };

    const markStreamAlive = () => {
      clearStaleTimeout();
      staleTimeoutId = window.setTimeout(() => {
        if (!isDisposed) {
          logCartSseDebug("stale connection aborted", {
            lastEventId,
            mode,
          });
          connectionAbortController?.abort();
        }
      }, CART_SSE_STALE_TIMEOUT_MS);
    };

    const scheduleReconnect = () => {
      if (isDisposed || reconnectTimeoutId !== null) {
        return;
      }

      const delay = getReconnectDelay(reconnectAttempt);
      reconnectAttempt += 1;
      logCartSseDebug("reconnect scheduled", {
        attempt: reconnectAttempt,
        delay,
        lastEventId,
        mode,
      });

      reconnectTimeoutId = window.setTimeout(() => {
        reconnectTimeoutId = null;
        void connect();
      }, delay);
    };

    const handleStreamEvent = (
      event: CartSseEvent,
      access?: CartPublicAccess | null,
    ) => {
      reconnectAttempt = 0;
      markStreamAlive();

      if (isRedisStreamEventId(event.id)) {
        lastEventId = event.id;
      }

      if (event.type !== "ping") {
        logCartSseDebug("event received", {
          eventId: event.id,
          lastEventId,
          type: event.type,
          mode,
        });
      }

      if (event.type === "connected" || event.type === "ping") {
        return;
      }

      if (isCartSnapshotEvent(event)) {
        handleSseCartUpdated(event.data, access);
        activeCartItemsFingerprintRef.current = getCartItemsFingerprint(event.data);
        return;
      }

      if (isCartUpdatedEvent(event)) {
        const nextFingerprint = getCartItemsFingerprint(event.data);
        const shouldNotifyCartUpdated =
          nextFingerprint !== activeCartItemsFingerprintRef.current &&
          !isLocalCartMutationPendingRef.current;

        handleSseCartUpdated(event.data, access);
        activeCartItemsFingerprintRef.current = nextFingerprint;

        if (shouldNotifyCartUpdated) {
          toast.success("Содержимое корзины обновлено.");
        }
        return;
      }

      if (isCartStatusChangedEvent(event)) {
        handleSseCartStatusChanged(event.data, access);
        return;
      }

      if (access && isCartDetachedEvent(event)) {
        clearStoredPublicAccess();
        toast.success("Корзина была откреплена.");
      }
    };

    const connect = async () => {
      connectionAbortController = new AbortController();
      markStreamAlive();
      logCartSseDebug("connecting", {
        lastEventId,
        mode,
      });

      try {
        if (mode === "public" && storedPublicAccess) {
          await connectCartControllerSsePublic(
            storedPublicAccess.publicKey,
            { checkoutKey: storedPublicAccess.checkoutKey },
            {
              lastEventId,
              signal: connectionAbortController.signal,
              onEvent: (event) => handleStreamEvent(event, storedPublicAccess),
            },
          );
        } else {
          await connectCartControllerSseCurrent({
            lastEventId,
            signal: connectionAbortController.signal,
            onEvent: (event) => handleStreamEvent(event),
          });
        }

        clearStaleTimeout();
        if (!connectionAbortController.signal.aborted) {
          scheduleReconnect();
        }
      } catch (error) {
        clearStaleTimeout();
        if (isDisposed) {
          return;
        }

        logCartSseDebug("connection failed", {
          lastEventId,
          message: error instanceof Error ? error.message : String(error),
          mode,
        });

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
      connectionAbortController?.abort();
      clearStaleTimeout();

      if (reconnectTimeoutId !== null) {
        window.clearTimeout(reconnectTimeoutId);
      }
    };
  }, [
    activeCart?.id,
    clearStoredPublicAccess,
    handleSseCartStatusChanged,
    handleSseCartUpdated,
    isHydrated,
    mode,
    notifyPublicCartUnavailable,
    storedPublicAccess,
  ]);
}
