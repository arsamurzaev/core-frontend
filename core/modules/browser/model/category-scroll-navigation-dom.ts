"use client";

import {
  ACTIVE_CATEGORY_HYSTERESIS_PX,
  type AlignCategorySectionResult,
  FILTER_BAR_SCROLL_OFFSET,
  getCategorySectionId,
  PAGE_END_EPSILON_PX,
  PROGRAMMATIC_SCROLL_ALIGN_TOLERANCE_PX,
} from "./category-scroll";

interface CategorySectionSnapshot {
  id: string;
  rect: DOMRect;
}

function getCategorySections(categoryIds: string[]): CategorySectionSnapshot[] {
  return categoryIds
    .map((categoryId) => {
      const element = document.getElementById(getCategorySectionId(categoryId));

      if (!element) {
        return null;
      }

      return {
        id: categoryId,
        rect: element.getBoundingClientRect(),
      };
    })
    .filter(
      (section): section is CategorySectionSnapshot => section !== null,
    );
}

let cachedLineY: number | null = null;

export function invalidateCategoryScrollCache(): void {
  cachedLineY = null;
}

export function getActiveCategoryLineY(): number {
  if (cachedLineY !== null) {
    return cachedLineY;
  }
  const filterBar = document.getElementById("catalog-filter-bar");
  cachedLineY = (filterBar?.getBoundingClientRect().bottom ?? 0) + FILTER_BAR_SCROLL_OFFSET;
  return cachedLineY;
}

export function alignCategorySectionToLine(params: {
  categoryId: string;
  behavior: ScrollBehavior;
  minDeltaPx?: number;
}): AlignCategorySectionResult {
  const { categoryId, behavior, minDeltaPx = 0 } = params;
  const target = document.getElementById(getCategorySectionId(categoryId));

  if (!target) {
    return {
      found: false,
      didScroll: false,
      distanceToLine: Number.POSITIVE_INFINITY,
    };
  }

  const deltaY = target.getBoundingClientRect().top - getActiveCategoryLineY();
  const distanceToLine = Math.abs(deltaY);

  if (distanceToLine <= minDeltaPx) {
    return {
      found: true,
      didScroll: false,
      distanceToLine,
    };
  }

  const nextTop = Math.max(window.scrollY + deltaY, 0);
  const scrollDistance = Math.abs(nextTop - window.scrollY);

  if (scrollDistance <= minDeltaPx) {
    return {
      found: true,
      didScroll: false,
      distanceToLine,
    };
  }

  window.scrollTo({
    top: nextTop,
    behavior,
  });

  return {
    found: true,
    didScroll: true,
    distanceToLine,
  };
}

export function resolveActiveCategoryIdByLine(params: {
  categoryIds: string[];
  currentActiveCategoryId: string | null;
  lineY: number;
}): string | null {
  const { categoryIds, currentActiveCategoryId, lineY } = params;

  if (categoryIds.length === 0) {
    return null;
  }

  const sections = getCategorySections(categoryIds);
  if (sections.length === 0) {
    return currentActiveCategoryId ?? categoryIds[0] ?? null;
  }

  const firstSection = sections[0];
  const lastSection = sections[sections.length - 1];

  if (lineY < firstSection.rect.top) {
    return firstSection.id;
  }

  if (lineY >= lastSection.rect.bottom) {
    return lastSection.id;
  }

  if (currentActiveCategoryId) {
    const currentSection = sections.find(
      (section) => section.id === currentActiveCategoryId,
    );

    if (currentSection) {
      const isWithinCurrentSection =
        currentSection.rect.top - ACTIVE_CATEGORY_HYSTERESIS_PX <= lineY &&
        currentSection.rect.bottom + ACTIVE_CATEGORY_HYSTERESIS_PX > lineY;

      if (isWithinCurrentSection) {
        return currentActiveCategoryId;
      }
    }
  }

  let candidateId = firstSection.id;
  for (const section of sections) {
    if (section.rect.top <= lineY) {
      candidateId = section.id;
      continue;
    }

    break;
  }

  return candidateId;
}

export function isCategoryProgrammaticTargetReached(params: {
  categoryIds: string[];
  targetId: string;
}): boolean {
  const { categoryIds, targetId } = params;
  const lineY = getActiveCategoryLineY();
  const target = document.getElementById(getCategorySectionId(targetId));

  if (!target) {
    return false;
  }

  const targetRect = target.getBoundingClientRect();
  const distanceToLine = Math.abs(targetRect.top - lineY);

  if (distanceToLine <= PROGRAMMATIC_SCROLL_ALIGN_TOLERANCE_PX) {
    return true;
  }

  const lastCategoryId = categoryIds[categoryIds.length - 1] ?? null;
  if (targetId !== lastCategoryId) {
    return false;
  }

  const isAtPageBottom =
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - PAGE_END_EPSILON_PX;

  if (!isAtPageBottom) {
    return false;
  }

  const isTargetVisible =
    targetRect.top < window.innerHeight && targetRect.bottom > 0;

  return isTargetVisible;
}
