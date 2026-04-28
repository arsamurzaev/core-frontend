export const CATEGORY_SECTION_ID_PREFIX = "catalog-category-section";
export const FILTER_BAR_SCROLL_OFFSET = 8;
export const ACTIVE_CATEGORY_HYSTERESIS_PX = 12;
export const PAGE_END_EPSILON_PX = 2;
export const PROGRAMMATIC_SCROLL_ALIGN_TOLERANCE_PX = 8;
export const PROGRAMMATIC_SCROLL_MIN_ALIGN_DELTA_PX = 6;
export const PROGRAMMATIC_SCROLL_MAX_SETTLE_ATTEMPTS = 3;
export const PROGRAMMATIC_SCROLL_ALIGN_SETTLE_DELAY_MS = 16;
export const PROGRAMMATIC_SCROLL_DATA_WAIT_DELAY_MS = 100;

export interface AlignCategorySectionResult {
  found: boolean;
  didScroll: boolean;
  distanceToLine: number;
}

export { clamp } from "@/shared/lib/math";

export function getCategorySectionId(categoryId: string): string {
  return `${CATEGORY_SECTION_ID_PREFIX}-${categoryId}`;
}
