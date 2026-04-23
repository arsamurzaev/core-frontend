"use client";

import React from "react";
import { toast } from "sonner";
import {
  cartControllerHeartbeatManagerSession,
  cartControllerReleaseManagerSession,
  cartControllerStartManagerSession,
  type CartDto,
} from "@/shared/api/generated/react-query";
import {
  API_BASE_URL,
  FORWARDED_HOST_HEADER,
} from "@/shared/api/client";
import { normalizeForwardedHost } from "@/shared/api/forwarded-host";
import { withCsrf } from "@/shared/api/client-request";
import {
  isCartNotFoundError,
  isCartUnauthorizedError,
} from "@/core/modules/cart/model/cart-api-errors";
import { type CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import { CART_MANAGER_HEARTBEAT_MS } from "@/core/modules/cart/model/cart-constants";

function releaseManagerSessionWithKeepalive(publicKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  const headers = new Headers(withCsrf());
  const forwardedHost = normalizeForwardedHost(window.location.host);

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

type UseCartManagerSessionParams = {
  isHydrated: boolean;
  isManagedPublicCart: boolean;
  setPublicCartData: (access: CartPublicAccess | null, cart: CartDto | null) => void;
  storedPublicAccess: CartPublicAccess | null;
  userId?: string | null;
  userRole?: string | null;
};

export function useCartManagerSession({
  isHydrated,
  isManagedPublicCart,
  setPublicCartData,
  storedPublicAccess,
  userId,
  userRole,
}: UseCartManagerSessionParams): { isManagerSessionLoading: boolean } {
  const [isManagerSessionLoading, setIsManagerSessionLoading] = React.useState(false);

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
  }, [isHydrated, isManagedPublicCart, setPublicCartData, storedPublicAccess, userId, userRole]);

  return { isManagerSessionLoading };
}
