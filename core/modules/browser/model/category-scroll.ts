export const CATEGORY_SECTION_ID_PREFIX = "catalog-category-section";
export const FILTER_BAR_SCROLL_OFFSET = 8;
export const ACTIVE_CATEGORY_HYSTERESIS_PX = 12;
export const CATEGORY_SCROLL_ALIGN_TOLERANCE_PX = 8;

export interface AlignCategorySectionResult {
  found: boolean;
  didScroll: boolean;
  distanceToLine: number;
}

export { clamp } from "@/shared/lib/math";

export function getCategorySectionId(categoryId: string): string {
  return `${CATEGORY_SECTION_ID_PREFIX}-${categoryId}`;
}
