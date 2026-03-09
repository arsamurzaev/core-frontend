"use client";

import { useCatalogState } from "@/shared/providers/catalog-provider";
import React from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME =
  "grid grid-cols-[repeat(auto-fill,minmax(127px,1fr))] gap-4";
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

  const setMode = React.useCallback(
    (nextMode: ProductCardViewMode) => {
      setStoreMode(catalogKey, nextMode);
    },
    [catalogKey, setStoreMode],
  );

  const toggleMode = React.useCallback(() => {
    setStoreMode(catalogKey, mode === "detailed" ? "grid" : "detailed");
  }, [catalogKey, mode, setStoreMode]);

  return React.useMemo(
    () => ({
      mode,
      hasHydrated,
      isDetailed: mode === "detailed",
      setMode,
      toggleMode,
    }),
    [hasHydrated, mode, setMode, toggleMode],
  );
}
