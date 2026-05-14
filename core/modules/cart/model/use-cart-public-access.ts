"use client";

import {
  buildCartPublicStorageKey,
  deserializeCartPublicAccess,
  parseCartPublicAccessFromSearchParams,
  removeCartPublicAccessParams,
  serializeCartPublicAccess,
  type CartPublicAccess,
} from "@/core/modules/cart/model/cart-public-link";
import { getPublicAccessKey } from "@/core/modules/cart/model/cart-share";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

interface UseCartPublicAccessParams {
  catalogId: string;
}

export function useCartPublicAccess({ catalogId }: UseCartPublicAccessParams) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storageKey = React.useMemo(
    () => buildCartPublicStorageKey(catalogId),
    [catalogId],
  );
  const [storedPublicAccess, setStoredPublicAccess] =
    React.useState<CartPublicAccess | null>(null);
  const [autoExpandPublicCartAccessKey, setAutoExpandPublicCartAccessKey] =
    React.useState<string | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const lastPublicCartUnavailableToastAtRef = React.useRef(0);

  const clearStoredPublicAccess = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey);
    }

    setAutoExpandPublicCartAccessKey(null);
    setStoredPublicAccess(null);
  }, [storageKey]);

  const persistPublicAccess = React.useCallback(
    (access: CartPublicAccess) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          storageKey,
          serializeCartPublicAccess(access),
        );
      }

      setStoredPublicAccess(access);
    },
    [storageKey],
  );

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

  const clearOwnSharedCartAccessKey = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey);
    }

    setAutoExpandPublicCartAccessKey(null);
  }, [storageKey]);

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

  return {
    autoExpandPublicCartAccessKey,
    clearOwnSharedCartAccessKey,
    clearStoredPublicAccess,
    isHydrated,
    notifyPublicCartUnavailable,
    persistPublicAccess,
    setStoredPublicAccess,
    storageKey,
    storedPublicAccess,
  };
}
