"use client";

import {
  CATALOG_FILTER_EMPTY_PATCH,
  createCatalogFilterDraftFromQueryState,
  normalizeCatalogFilterDraft,
  type CatalogFilterDraftState,
  type CatalogFilterItem,
  type CatalogFilterPatch,
} from "@/core/widgets/catalog-filter/model/catalog-filter-drawer";
import { useBrandControllerGetAll } from "@/shared/api/generated";
import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import React from "react";

interface UseCatalogFilterDrawerParams {
  onApply: (patch?: CatalogFilterPatch) => void;
  queryState: CatalogFilterQueryState;
}

export function useCatalogFilterDrawer({
  onApply,
  queryState,
}: UseCatalogFilterDrawerParams) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<CatalogFilterDraftState>(() =>
    createCatalogFilterDraftFromQueryState(queryState),
  );
  const brandsQuery = useBrandControllerGetAll();
  const brands = React.useMemo<CatalogFilterItem[]>(
    () => brandsQuery.data ?? [],
    [brandsQuery.data],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(createCatalogFilterDraftFromQueryState(queryState));
  }, [open, queryState]);

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
  }, [onApply, queryState]);

  const handleSubmit = React.useCallback(() => {
    onApply(normalizeCatalogFilterDraft(draft));
    setOpen(false);
  }, [draft, onApply]);

  return {
    brands,
    brandsQuery,
    draft,
    handleClear,
    handleSubmit,
    open,
    patchDraft,
    setOpen,
    toggleArrayDraftValue,
    toggleBooleanDraftValue,
  };
}
