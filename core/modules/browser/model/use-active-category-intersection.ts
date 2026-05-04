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

const ACTIVATION_LINE_OFFSET_PX = 24;
const FILTER_BAR_ELEMENT_ID = "catalog-filter-bar";
const FILTER_BAR_HEIGHT_CSS_VARIABLE = "--catalog-filter-bar-height";
const VIRTUAL_CATEGORY_ROW_SELECTOR = "[data-catalog-category-id]";

function getFilterBarHeightFromCssVariable(): number | null {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(FILTER_BAR_HEIGHT_CSS_VARIABLE)
    .trim();
  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function getActivationLineY(): number {
  const filterBarBottom = document
    .getElementById(FILTER_BAR_ELEMENT_ID)
    ?.getBoundingClientRect().bottom;

  if (typeof filterBarBottom === "number" && filterBarBottom > 0) {
    return filterBarBottom;
  }

  return getFilterBarHeightFromCssVariable() ?? 0;
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

    let rebuildFrame: number | null = null;

    const resolveActiveCategoryIdFromVirtualRows = (
      activationLineY: number,
    ): string | null => {
      const renderedRows = Array.from(
        document.querySelectorAll<HTMLElement>(VIRTUAL_CATEGORY_ROW_SELECTOR),
      );

      if (renderedRows.length === 0) {
        return null;
      }

      let nextActiveCategoryId = categories[0]?.id ?? null;

      for (const row of renderedRows) {
        const categoryId = row.dataset.catalogCategoryId;

        if (!categoryId || !categoryIndexById.has(categoryId)) {
          continue;
        }

        const rect = row.getBoundingClientRect();

        if (rect.top <= activationLineY && rect.bottom > activationLineY) {
          return categoryId;
        }

        if (rect.top <= activationLineY) {
          nextActiveCategoryId = categoryId;
          continue;
        }

        break;
      }

      return nextActiveCategoryId;
    };

    const resolveActiveCategoryId = () => {
      const activationLineY = Math.min(
        Math.max(getActivationLineY() + ACTIVATION_LINE_OFFSET_PX, 0),
        window.innerHeight,
      );
      const virtualRowCategoryId =
        resolveActiveCategoryIdFromVirtualRows(activationLineY);

      if (virtualRowCategoryId) {
        return virtualRowCategoryId;
      }

      let nextActiveCategoryId = categories[0]?.id ?? null;

      for (const category of categories) {
        const section = document.getElementById(
          getCategorySectionId(category.id),
        );

        if (!section) {
          continue;
        }

        const rect = section.getBoundingClientRect();

        if (rect.top <= activationLineY && rect.bottom > activationLineY) {
          return category.id;
        }

        if (rect.top <= activationLineY) {
          nextActiveCategoryId = category.id;
          continue;
        }

        break;
      }

      return nextActiveCategoryId;
    };

    const updateActiveCategory = () => {
      rebuildFrame = null;
      const nextActiveCategoryId = resolveActiveCategoryId();

      setActiveCategoryId((currentCategoryId) =>
        currentCategoryId === nextActiveCategoryId
          ? currentCategoryId
          : nextActiveCategoryId,
      );
    };

    const scheduleRebuild = () => {
      if (rebuildFrame !== null) {
        return;
      }

      rebuildFrame = window.requestAnimationFrame(() => {
        updateActiveCategory();
      });
    };

    updateActiveCategory();
    window.addEventListener("scroll", scheduleRebuild, { passive: true });
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

      window.removeEventListener("scroll", scheduleRebuild);
      window.removeEventListener("resize", scheduleRebuild);
      resizeObserver?.disconnect();
    };
  }, [categories, categoryIdsKey, categoryIndexById, enabled]);

  return { activeCategoryId };
}
