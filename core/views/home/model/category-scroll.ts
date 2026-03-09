export const CATEGORY_SECTION_ID_PREFIX = "catalog-category-section";
export const FILTER_BAR_SCROLL_OFFSET = 8;
export const ACTIVE_CATEGORY_HYSTERESIS_PX = 12;
export const PAGE_END_EPSILON_PX = 2;
export const PROGRAMMATIC_SCROLL_DEFAULT_SETTLE_DELAY_MS = 190;
export const PROGRAMMATIC_SCROLL_MIN_SETTLE_DELAY_MS = 120;
export const PROGRAMMATIC_SCROLL_MAX_SETTLE_DELAY_MS = 320;
export const PROGRAMMATIC_SCROLL_FRAME_DELAY_FACTOR = 8;
export const PROGRAMMATIC_SCROLL_FRAME_SAMPLE_SIZE = 8;
export const PROGRAMMATIC_SCROLL_ALIGN_TOLERANCE_PX = 8;
export const PROGRAMMATIC_SCROLL_MIN_ALIGN_DELTA_PX = 2;
export const PROGRAMMATIC_SCROLL_MAX_SETTLE_ATTEMPTS = 8;

export interface AlignCategorySectionResult {
  found: boolean;
  didScroll: boolean;
  distanceToLine: number;
}

export function getCategorySectionId(categoryId: string): string {
  return `${CATEGORY_SECTION_ID_PREFIX}-${categoryId}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
