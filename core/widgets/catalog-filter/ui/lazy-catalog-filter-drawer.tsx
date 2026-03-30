"use client";

import type { CatalogFilterDrawerProps } from "@/core/widgets/catalog-filter/ui/catalog-filter-drawer";
import { CatalogFilterDrawerTrigger } from "@/core/widgets/catalog-filter/ui/catalog-filter-drawer-trigger";
import dynamic from "next/dynamic";
import React from "react";

const CatalogFilterDrawerDynamic = dynamic(
  () =>
    import("@/core/widgets/catalog-filter/ui/catalog-filter-drawer").then(
      (module) => module.CatalogFilterDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

type LazyCatalogFilterDrawerProps = Omit<
  CatalogFilterDrawerProps,
  "open" | "onOpenChange" | "trigger"
>;

export const LazyCatalogFilterDrawer: React.FC<LazyCatalogFilterDrawerProps> = (
  props,
) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleClick = React.useCallback(() => {
    setIsMounted(true);
    setOpen(true);
  }, []);

  return (
    <>
      <CatalogFilterDrawerTrigger
        activeFiltersCount={props.activeFiltersCount}
        onClick={handleClick}
      />
      {isMounted ? (
        <CatalogFilterDrawerDynamic
          {...props}
          open={open}
          onOpenChange={setOpen}
          trigger={null}
        />
      ) : null}
    </>
  );
};
