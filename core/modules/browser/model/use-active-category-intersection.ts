"use client";

import type { CategoryDto } from "@/shared/api/generated/react-query";
import React from "react";
import { getCategorySectionId } from "./category-scroll";

interface UseActiveCategoryIntersectionParams {
  categories: CategoryDto[];
  enabled?: boolean;
}

interface UseActiveCategoryIntersectionResult {
  activeCategoryId: string | null;
}

const ACTIVATION_ZONE_HEIGHT_PX = 24;
const FILTER_BAR_ELEMENT_ID = "catalog-filter-bar";
const FILTER_BAR_HEIGHT_CSS_VARIABLE = "--catalog-filter-bar-height";

function getFilterBarHeightFromCssVariable(): number | null {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(FILTER_BAR_HEIGHT_CSS_VARIABLE)
    .trim();
  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function getActivationLineY(): number {
  return (
    getFilterBarHeightFromCssVariable() ??
    document.getElementById(FILTER_BAR_ELEMENT_ID)?.getBoundingClientRect()
      .bottom ?? 0
  );
}

function getObserverRootMargin(): string {
  const viewportHeight = window.innerHeight;
  const lineY = Math.min(Math.max(getActivationLineY(), 0), viewportHeight);
  const bottomInset = Math.max(
    viewportHeight - lineY - ACTIVATION_ZONE_HEIGHT_PX,
    0,
  );

  return `-${lineY}px 0px -${bottomInset}px 0px`;
}

export function useActiveCategoryIntersection({
  categories,
  enabled = true,
}: UseActiveCategoryIntersectionParams): UseActiveCategoryIntersectionResult {
  const categoryIdsKey = React.useMemo(
    () => categories.map((category) => category.id).join("|"),
    [categories],
  );
  const categoryIndexById = React.useMemo(() => {
    const indexById = new Map<string, number>();

    categories.forEach((category, index) => {
      indexById.set(category.id, index);
    });

    return indexById;
  }, [categories]);
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(
    () => categories[0]?.id ?? null,
  );

  React.useEffect(() => {
    if (!enabled || categories.length === 0) {
      setActiveCategoryId(null);
      return;
    }

    setActiveCategoryId((currentCategoryId) =>
      currentCategoryId && categoryIndexById.has(currentCategoryId)
        ? currentCategoryId
        : (categories[0]?.id ?? null),
    );
  }, [categories, categoryIndexById, enabled]);

  React.useEffect(() => {
    if (!enabled || categories.length === 0) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setActiveCategoryId(categories[0]?.id ?? null);
      return;
    }

    let observer: IntersectionObserver | null = null;
    let rebuildFrame: number | null = null;

    const disconnectObserver = () => {
      observer?.disconnect();
      observer = null;
    };

    const buildObserver = () => {
      disconnectObserver();

      observer = new IntersectionObserver(
        (entries) => {
          const intersectingCategoryIds = entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => {
              const elementId = entry.target.id;
              return categories.find(
                (category) => getCategorySectionId(category.id) === elementId,
              )?.id;
            })
            .filter((categoryId): categoryId is string =>
              Boolean(categoryId),
            );

          if (intersectingCategoryIds.length === 0) {
            return;
          }

          const nextActiveCategoryId = intersectingCategoryIds.reduce(
            (bestCategoryId, categoryId) => {
              const bestIndex = categoryIndexById.get(bestCategoryId) ?? -1;
              const currentIndex = categoryIndexById.get(categoryId) ?? -1;

              return currentIndex >= bestIndex ? categoryId : bestCategoryId;
            },
          );

          setActiveCategoryId((currentCategoryId) =>
            currentCategoryId === nextActiveCategoryId
              ? currentCategoryId
              : nextActiveCategoryId,
          );
        },
        {
          root: null,
          rootMargin: getObserverRootMargin(),
          threshold: 0,
        },
      );

      categories.forEach((category) => {
        const section = document.getElementById(
          getCategorySectionId(category.id),
        );

        if (section) {
          observer?.observe(section);
        }
      });
    };

    const scheduleRebuild = () => {
      if (rebuildFrame !== null) {
        window.cancelAnimationFrame(rebuildFrame);
      }

      rebuildFrame = window.requestAnimationFrame(() => {
        rebuildFrame = null;
        buildObserver();
      });
    };

    buildObserver();
    window.addEventListener("resize", scheduleRebuild);

    const filterBar = document.getElementById(FILTER_BAR_ELEMENT_ID);
    const resizeObserver =
      filterBar && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleRebuild)
        : null;

    if (filterBar) {
      resizeObserver?.observe(filterBar);
    }

    return () => {
      if (rebuildFrame !== null) {
        window.cancelAnimationFrame(rebuildFrame);
      }

      window.removeEventListener("resize", scheduleRebuild);
      resizeObserver?.disconnect();
      disconnectObserver();
    };
  }, [categories, categoryIdsKey, categoryIndexById, enabled]);

  return { activeCategoryId };
}
