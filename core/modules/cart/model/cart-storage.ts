"use client";

import React from "react";

export function buildCurrentCartStorageKey(catalogId: string): string {
  return `catalog-current-cart:${catalogId}`;
}

export function buildManagerOrderStorageKey(catalogId: string): string {
  return `catalog-manager-order:${catalogId}`;
}

export function useCartStorageFlags(catalogId: string) {
  const currentCartStorageKey = React.useMemo(
    () => buildCurrentCartStorageKey(catalogId),
    [catalogId],
  );
  const managerOrderStorageKey = React.useMemo(
    () => buildManagerOrderStorageKey(catalogId),
    [catalogId],
  );
  const [hasStoredCurrentCart, setHasStoredCurrentCart] = React.useState(false);
  const [hasActiveManagerOrder, setHasActiveManagerOrder] =
    React.useState(false);

  const persistStoredCurrentCart = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(currentCartStorageKey, "1");
    }

    setHasStoredCurrentCart(true);
  }, [currentCartStorageKey]);

  const clearStoredCurrentCart = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(currentCartStorageKey);
    }

    setHasStoredCurrentCart(false);
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

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setHasStoredCurrentCart(
      window.localStorage.getItem(currentCartStorageKey) === "1",
    );
    setHasActiveManagerOrder(
      window.localStorage.getItem(managerOrderStorageKey) === "1",
    );
  }, [currentCartStorageKey, managerOrderStorageKey]);

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

  return {
    clearActiveManagerOrder,
    clearStoredCurrentCart,
    currentCartStorageKey,
    hasActiveManagerOrder,
    hasStoredCurrentCart,
    managerOrderStorageKey,
    persistActiveManagerOrder,
    persistStoredCurrentCart,
  };
}
