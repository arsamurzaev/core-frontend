"use client";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { SlidersVertical } from "lucide-react";
import React from "react";

type CatalogFilterDrawerTriggerProps = {
  activeFiltersCount: number;
  className?: string;
};

export const CatalogFilterDrawerTrigger: React.FC<
  CatalogFilterDrawerTriggerProps
> = ({ activeFiltersCount, className }) => {
  return (
    <button
      type="button"
      className={cn(
        "shadow-custom relative flex h-10 w-10 items-center justify-center rounded-full bg-background",
        activeFiltersCount > 0 && "bg-primary text-primary-foreground",
        className,
      )}
      aria-label="Открыть фильтр"
    >
      {activeFiltersCount > 0 ? (
        <Badge
          variant="secondary"
          className="shadow-custom absolute top-0 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px]"
        >
          {activeFiltersCount}
        </Badge>
      ) : null}
      <SlidersVertical size={20} />
    </button>
  );
};
