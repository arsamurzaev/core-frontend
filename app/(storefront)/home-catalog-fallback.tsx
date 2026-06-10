"use client";

import { CatalogProductsSectionsSkeleton } from "@/core/widgets/catalog-products/ui/catalog-products-skeleton";
import { PopularProductCarouselSkeleton } from "@/core/widgets/popular-product-carousel/ui/skeleton/popular-product-carousel-skeleton";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";

const HOME_CATALOG_LOADING_SECTIONS_COUNT = 1;

export function HomeCatalogFallback() {
  return (
    <div className="space-y-8" aria-hidden>
      <PopularProductCarouselSkeleton />

      <section className="space-y-4 rounded-xl">
        <div className="grid h-10 grid-cols-2 rounded-full bg-muted p-0.5">
          <Skeleton className="h-full rounded-full" />
          <div />
        </div>

        <div className="space-y-3 rounded-2xl bg-background/95 p-3 shadow-custom">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 flex-1 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            <Skeleton className="h-9 w-24 shrink-0 rounded-full" />
            <Skeleton className="h-9 w-28 shrink-0 rounded-full" />
            <Skeleton className="h-9 w-20 shrink-0 rounded-full" />
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
