"use client";

import { type CatalogFilterValuePatch } from "@/core/widgets/filter-bar/model/use-filter-bar";
import { FilterBar } from "@/core/widgets/filter-bar/ui/filter-bar";
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
  return (
    <FilterBar
      className={className}
      searchTerm={searchTerm}
      bottomRow={bottomRow}
      hideFilter
      stickySearchMode="inline"
      onFilterToggle={onFilterToggle}
    />
  );
};
