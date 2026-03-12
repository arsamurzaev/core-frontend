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

const SEARCH_SYNC_DELAY_MS = 400;

function normalizeSearchValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function useFilterBar({
  onFilterToggle,
  searchTerm,
}: UseFilterBarParams) {
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [isSticky, setIsSticky] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState(searchTerm ?? "");

  React.useEffect(() => {
    const stickyTopOffset = 8;

    const updateStickyState = () => {
      const node = stickyRef.current;
      if (!node) {
        return;
      }

      const top = node.getBoundingClientRect().top;
      setIsSticky(top <= stickyTopOffset);
    };

    updateStickyState();

    window.addEventListener("scroll", updateStickyState, { passive: true });
    window.addEventListener("resize", updateStickyState);

    return () => {
      window.removeEventListener("scroll", updateStickyState);
      window.removeEventListener("resize", updateStickyState);
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

    searchTimeoutRef.current = setTimeout(() => {
      searchTimeoutRef.current = null;

      if (
        normalizeSearchValue(searchTerm ?? "") ===
        normalizeSearchValue(searchValue)
      ) {
        return;
      }

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
