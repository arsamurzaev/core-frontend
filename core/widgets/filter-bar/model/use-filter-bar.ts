"use client";

import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import React from "react";

export type CatalogFilterValuePatch = Partial<
  Pick<
    CatalogFilterQueryState,
    | "categories"
    | "brands"
    | "isPopular"
    | "isDiscount"
    | "searchTerm"
    | "minPrice"
    | "maxPrice"
  >
>;

interface UseFilterBarParams {
  onFilterToggle?: (patch?: CatalogFilterValuePatch) => void;
  searchTerm?: string;
}

const SEARCH_SYNC_DELAY_MS = 800;

function normalizeSearchValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function useFilterBar({
  onFilterToggle,
  searchTerm,
}: UseFilterBarParams) {
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const stickyFrameRef = React.useRef<number | null>(null);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [isSticky, setIsSticky] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState(searchTerm ?? "");

  React.useEffect(() => {
    const stickyTopOffset = 8;

    const updateStickyState = () => {
      stickyFrameRef.current = null;

      const node = stickyRef.current;
      if (!node) {
        return;
      }

      const top = node.getBoundingClientRect().top;
      const nextIsSticky = top <= stickyTopOffset;

      setIsSticky((previousValue) =>
        previousValue === nextIsSticky ? previousValue : nextIsSticky,
      );
    };

    const scheduleStickyStateUpdate = () => {
      if (stickyFrameRef.current !== null) {
        return;
      }

      stickyFrameRef.current = window.requestAnimationFrame(updateStickyState);
    };

    updateStickyState();

    window.addEventListener("scroll", scheduleStickyStateUpdate, { passive: true });
    window.addEventListener("resize", scheduleStickyStateUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleStickyStateUpdate);
      window.removeEventListener("resize", scheduleStickyStateUpdate);

      if (stickyFrameRef.current !== null) {
        window.cancelAnimationFrame(stickyFrameRef.current);
        stickyFrameRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    setSearchValue(searchTerm ?? "");
  }, [searchTerm]);

  const clearSearchSyncTimeout = React.useCallback(() => {
    if (searchTimeoutRef.current === null) {
      return;
    }

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = null;
  }, []);

  const handleApplyFilters = React.useCallback(() => {
    clearSearchSyncTimeout();

    onFilterToggle?.({
      searchTerm: normalizeSearchValue(searchValue),
    });
  }, [clearSearchSyncTimeout, onFilterToggle, searchValue]);

  React.useEffect(() => {
    clearSearchSyncTimeout();

    if (
      normalizeSearchValue(searchTerm ?? "") === normalizeSearchValue(searchValue)
    ) {
      return clearSearchSyncTimeout;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchTimeoutRef.current = null;

      onFilterToggle?.({
        searchTerm: normalizeSearchValue(searchValue),
      });
    }, SEARCH_SYNC_DELAY_MS);

    return clearSearchSyncTimeout;
  }, [clearSearchSyncTimeout, onFilterToggle, searchTerm, searchValue]);

  return {
    handleApplyFilters,
    isSticky,
    searchValue,
    setSearchValue,
    stickyRef,
  };
}
