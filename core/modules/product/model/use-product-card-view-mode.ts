"use client";

import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME =
  "grid grid-cols-[repeat(auto-fill,minmax(127px,1fr))] gap-3 max-[475px]:grid-cols-2 lg:grid-cols-4";
export const PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME = "grid grid-cols-1 gap-4";
export const PRODUCT_CARD_VIEW_MODES = ["grid", "detailed"] as const;

export type ProductCardViewMode = (typeof PRODUCT_CARD_VIEW_MODES)[number];

const DEFAULT_PRODUCT_CARD_VIEW_MODE: ProductCardViewMode = "grid";
const PRODUCT_CARD_VIEW_MODE_STORAGE_KEY = "product-card-view-mode";

interface ProductCardViewModeStoreState {
  byCatalog: Record<string, ProductCardViewMode>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setMode: (catalogKey: string, mode: ProductCardViewMode) => void;
}

const getCatalogViewModeKey = (
  catalogId?: string | null,
  catalogSlug?: string | null,
): string => {
  const normalizedCatalogId = catalogId?.trim();
  if (normalizedCatalogId) {
    return normalizedCatalogId;
  }

  const normalizedCatalogSlug = catalogSlug?.trim();
  if (normalizedCatalogSlug) {
    return `slug:${normalizedCatalogSlug}`;
  }

  return "default";
};

const isProductCardViewMode = (
  value: unknown,
): value is ProductCardViewMode => {
  return PRODUCT_CARD_VIEW_MODES.includes(value as ProductCardViewMode);
};

const readPersistedProductCardViewMode = (
  catalogKey: string,
): ProductCardViewMode | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(
      PRODUCT_CARD_VIEW_MODE_STORAGE_KEY,
    );

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as {
      state?: {
        byCatalog?: Record<string, unknown>;
      };
    };
    const persistedMode = parsedValue.state?.byCatalog?.[catalogKey];

    return isProductCardViewMode(persistedMode) ? persistedMode : null;
  } catch {
    return null;
  }
};

const useProductCardViewModeStore = create<ProductCardViewModeStoreState>()(
  persist(
    (set) => ({
      byCatalog: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setMode: (catalogKey, mode) =>
        set((state) => {
          if (state.byCatalog[catalogKey] === mode) {
            return state;
          }

          return {
            byCatalog: {
              ...state.byCatalog,
              [catalogKey]: mode,
            },
          };
        }),
    }),
    {
      name: PRODUCT_CARD_VIEW_MODE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        byCatalog: state.byCatalog,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useProductCardViewMode() {
  const { catalog } = useCatalogState();
  const catalogKey = React.useMemo(
    () => getCatalogViewModeKey(catalog?.id, catalog?.slug),
    [catalog?.id, catalog?.slug],
  );
  const mode = useProductCardViewModeStore(
    React.useCallback(
      (state: ProductCardViewModeStoreState) =>
        state.byCatalog[catalogKey] ?? DEFAULT_PRODUCT_CARD_VIEW_MODE,
      [catalogKey],
    ),
  );
  const hasHydrated = useProductCardViewModeStore((state) => state.hasHydrated);
  const setStoreMode = useProductCardViewModeStore((state) => state.setMode);
  const preHydratedMode = React.useMemo(
    () => (hasHydrated ? null : readPersistedProductCardViewMode(catalogKey)),
    [catalogKey, hasHydrated],
  );

  React.useLayoutEffect(() => {
    if (hasHydrated) {
      return;
    }

    const persistedMode = preHydratedMode;

    if (persistedMode && persistedMode !== mode) {
      setStoreMode(catalogKey, persistedMode);
    }
  }, [catalogKey, hasHydrated, mode, preHydratedMode, setStoreMode]);

  const resolvedMode = preHydratedMode ?? mode;

  const setMode = React.useCallback(
    (nextMode: ProductCardViewMode) => {
      setStoreMode(catalogKey, nextMode);
    },
    [catalogKey, setStoreMode],
  );

  const toggleMode = React.useCallback(() => {
    setStoreMode(catalogKey, resolvedMode === "detailed" ? "grid" : "detailed");
  }, [catalogKey, resolvedMode, setStoreMode]);

  return React.useMemo(
    () => ({
      mode: resolvedMode,
      hasHydrated,
      isDetailed: resolvedMode === "detailed",
      setMode,
      toggleMode,
    }),
    [hasHydrated, resolvedMode, setMode, toggleMode],
  );
}
