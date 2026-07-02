"use client";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { SlidersVertical } from "lucide-react";
import React from "react";

type CatalogFilterDrawerTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  activeFiltersCount: number;
};

export const CatalogFilterDrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  CatalogFilterDrawerTriggerProps
>(({ activeFiltersCount, className, type, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-pill bg-surface-base shadow-surface",
        activeFiltersCount > 0 &&
          "bg-action-primary text-action-primary-foreground",
        className,
      )}
      aria-label="Открыть фильтр"
      {...props}
    >
      {activeFiltersCount > 0 ? (
        <Badge
          variant="secondary"
          className="absolute top-0 -right-1 h-4 min-w-4 rounded-pill px-1 text-[10px] shadow-surface"
        >
          {activeFiltersCount}
        </Badge>
      ) : null}
      <SlidersVertical size={20} />
    </button>
  );
});

CatalogFilterDrawerTrigger.displayName = "CatalogFilterDrawerTrigger";
