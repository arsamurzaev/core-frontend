export const CATEGORY_SECTION_ID_PREFIX = "catalog-category-section";
export const FILTER_PRODUCTS_RESULTS_SECTION_ID =
  "catalog-filter-results-section";
export const CATEGORY_SECTION_SCROLL_MARGIN_TOP =
  "calc(var(--catalog-filter-bar-height, 120px) + 8px)";
const CATEGORY_SECTION_SCROLL_OFFSET_PX = 8;

function getFilterBarHeight(): number {
  const cssValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--catalog-filter-bar-height")
    .trim();
  const parsedCssValue = Number.parseFloat(cssValue);

  if (Number.isFinite(parsedCssValue) && parsedCssValue > 0) {
    return parsedCssValue;
  }

  return (
    document.getElementById("catalog-filter-bar")?.getBoundingClientRect()
      .height ?? 120
  );
}

export function getCategorySectionId(categoryId: string): string {
  return `${CATEGORY_SECTION_ID_PREFIX}-${categoryId}`;
}

export function scrollCategorySectionIntoView(categoryId: string): void {
  const section = document.getElementById(getCategorySectionId(categoryId));

  if (!section) {
    return;
  }

  const targetTop =
    window.scrollY +
    section.getBoundingClientRect().top -
    getFilterBarHeight() -
    CATEGORY_SECTION_SCROLL_OFFSET_PX;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: "instant",
  });
}
