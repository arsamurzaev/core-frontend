"use client";

import {
  type CatalogFilterValuePatch,
  useFilterBar,
} from "@/core/widgets/filter-bar/model/use-filter-bar";
import { CatalogSearchField } from "@/core/widgets/filter-bar/ui/catalog-search-field";
import { useProductCardViewMode } from "@/core/modules/product/model/use-product-card-view-mode";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Grid2X2, StretchHorizontal } from "lucide-react";
import React, { type ReactNode } from "react";

interface RestaurantFilterBarProps {
  className?: string;
  searchTerm?: string;
  bottomRow?: ReactNode;
  onFilterToggle?: (patch?: CatalogFilterValuePatch) => void;
}

export const RestaurantFilterBar: React.FC<RestaurantFilterBarProps> = ({
  className,
  searchTerm,
  bottomRow,
  onFilterToggle,
}) => {
  const { isDetailed, toggleMode } = useProductCardViewMode();
  const { handleApplyFilters, isSticky, searchValue, setSearchValue, stickyRef } =
    useFilterBar({ onFilterToggle, searchTerm });

  return (
    <div
      id="catalog-filter-bar"
      ref={stickyRef}
      className={cn(
        "sticky top-0 z-20 rounded-b-2xl bg-white p-0 transition-all",
        isSticky && "-mx-2.5 p-4 shadow-custom",
        className,
      )}
    >
      <div className="flex gap-5">
        <CatalogSearchField
          value={searchValue}
          onChange={setSearchValue}
          onSubmit={handleApplyFilters}
        />

        <Button
          variant="ghost"
          className="shadow-custom flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          aria-label={isDetailed ? "Переключить на сетку" : "Переключить на список"}
          onClick={toggleMode}
        >
          <Grid2X2 size={20} className={cn(isDetailed && "hidden")} />
          <StretchHorizontal size={20} className={cn(!isDetailed && "hidden")} />
        </Button>
      </div>

      {bottomRow ? <div className="mt-3">{bottomRow}</div> : null}
    </div>
  );
};
