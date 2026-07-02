"use client";

import { CatalogProductsSectionsSkeleton } from "@/core/widgets/catalog-products";
import { PopularProductCarouselSkeleton } from "@/core/widgets/popular-product-carousel";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";

const HOME_CATALOG_LOADING_SECTIONS_COUNT = 1;

export function HomeCatalogFallback() {
  return (
    <div className="space-y-8" aria-hidden>
      <PopularProductCarouselSkeleton />

      <section className="space-y-4 rounded-panel">
        <div className="grid h-10 grid-cols-2 rounded-pill bg-surface-muted p-0.5">
          <Skeleton className="h-full rounded-pill" />
          <div />
        </div>

        <div className="space-y-3 rounded-panel bg-surface-base/95 p-3 shadow-surface">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 flex-1 rounded-pill" />
            <Skeleton className="size-10 rounded-pill" />
            <Skeleton className="size-10 rounded-pill" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            <Skeleton className="h-9 w-24 shrink-0 rounded-pill" />
            <Skeleton className="h-9 w-28 shrink-0 rounded-pill" />
            <Skeleton className="h-9 w-20 shrink-0 rounded-pill" />
          </div>
        </div>

        <CatalogProductsSectionsSkeleton
          className="px-1"
          sectionsCount={HOME_CATALOG_LOADING_SECTIONS_COUNT}
        />
      </section>
    </div>
  );
}
