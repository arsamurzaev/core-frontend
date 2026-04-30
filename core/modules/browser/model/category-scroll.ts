export const CATEGORY_SECTION_ID_PREFIX = "catalog-category-section";
export const FILTER_PRODUCTS_RESULTS_SECTION_ID =
  "catalog-filter-results-section";
export const FILTER_BAR_SCROLL_OFFSET = 0;
export const ACTIVE_CATEGORY_LINE_OFFSET = 24;
export const ACTIVE_CATEGORY_HYSTERESIS_PX = 4;
export const CATEGORY_SCROLL_ALIGN_TOLERANCE_PX = 8;
export const CATEGORY_SCROLL_REALIGN_ATTEMPTS = 8;
export const CATEGORY_SCROLL_REALIGN_DELAY_MS = 80;

export interface AlignCategorySectionResult {
  found: boolean;
  didScroll: boolean;
  distanceToLine: number;
}

export { clamp } from "@/shared/lib/math";

export function getCategorySectionId(categoryId: string): string {
  return `${CATEGORY_SECTION_ID_PREFIX}-${categoryId}`;
}
