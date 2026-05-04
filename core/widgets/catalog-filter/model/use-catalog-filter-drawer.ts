"use client";

import {
  CATALOG_FILTER_EMPTY_PATCH,
  createCatalogFilterDraftFromQueryState,
  normalizeCatalogFilterDraft,
  type CatalogFilterDraftState,
  type CatalogFilterItem,
  type CatalogFilterPatch,
} from "@/core/widgets/catalog-filter/model/catalog-filter-drawer";
import { useBrandControllerGetAll } from "@/shared/api/generated/react-query";
import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import React from "react";

interface UseCatalogFilterDrawerParams {
  open?: boolean;
  onApply: (patch?: CatalogFilterPatch) => void;
  onOpenChange?: (open: boolean) => void;
  queryState: CatalogFilterQueryState;
  shouldUseBrands?: boolean;
}

export function useCatalogFilterDrawer({
  open: controlledOpen,
  onApply,
  onOpenChange,
  queryState,
  shouldUseBrands = true,
}: UseCatalogFilterDrawerParams) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );
  const [draft, setDraft] = React.useState<CatalogFilterDraftState>(() =>
    createCatalogFilterDraftFromQueryState(queryState),
  );
  const brandsQuery = useBrandControllerGetAll({
    query: {
      enabled: open && shouldUseBrands,
      staleTime: 60_000,
    },
  });
  const brands = React.useMemo<CatalogFilterItem[]>(
    () => (shouldUseBrands ? (brandsQuery.data ?? []) : []),
    [brandsQuery.data, shouldUseBrands],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(
      createCatalogFilterDraftFromQueryState({
        ...queryState,
        brands: shouldUseBrands ? queryState.brands : [],
      }),
    );
  }, [open, queryState, shouldUseBrands]);

  const patchDraft = React.useCallback(
    (patch: CatalogFilterPatch) => {
      setDraft((previousValue) => ({ ...previousValue, ...patch }));
    },
    [],
  );

  const toggleArrayDraftValue = React.useCallback(
    (key: "categories" | "brands", value: string) => {
      const normalized = value.trim();
      if (!normalized) {
        return;
      }

      setDraft((previousValue) => {
        const currentItems = previousValue[key];
        const nextItems = currentItems.includes(normalized)
          ? currentItems.filter((item) => item !== normalized)
          : [...currentItems, normalized];

        return {
          ...previousValue,
          [key]: nextItems,
        };
      });
    },
    [],
  );

  const toggleBooleanDraftValue = React.useCallback(
    (key: "isPopular" | "isDiscount") => {
      setDraft((previousValue) => ({
        ...previousValue,
        [key]: previousValue[key] ? undefined : true,
      }));
    },
    [],
  );

  const handleClear = React.useCallback(() => {
    setDraft(
      createCatalogFilterDraftFromQueryState({
        ...queryState,
        ...CATALOG_FILTER_EMPTY_PATCH,
      }),
    );
    onApply(CATALOG_FILTER_EMPTY_PATCH);
    setOpen(false);
  }, [onApply, queryState, setOpen]);

  const handleSubmit = React.useCallback(() => {
    onApply(
      normalizeCatalogFilterDraft({
        ...draft,
        brands: shouldUseBrands ? draft.brands : [],
      }),
    );
    setOpen(false);
  }, [draft, onApply, setOpen, shouldUseBrands]);

  return {
    brands,
    brandsQuery,
    draft,
    handleClear,
    handleSubmit,
    open,
    patchDraft,
    setOpen,
    shouldUseBrands,
    toggleArrayDraftValue,
    toggleBooleanDraftValue,
  };
}
