export const CATEGORY_SECTION_ID_PREFIX = "catalog-category-section";
export const CATALOG_PRODUCTS_SECTION_ID = "catalog-products-section";
export const FILTER_PRODUCTS_RESULTS_SECTION_ID =
  "catalog-filter-results-section";
export const CATEGORY_SECTION_SCROLL_MARGIN_TOP =
  "calc(var(--catalog-filter-bar-height, 120px) + 16px)";
const CATEGORY_SECTION_SCROLL_OFFSET_PX = 16;

type CategorySectionScroller = (
  categoryId: string,
  options?: { behavior?: ScrollBehavior },
) => boolean;

const categorySectionScrollers = new Set<CategorySectionScroller>();

export interface CategorySectionScrollTarget {
  section: HTMLElement;
  top: number;
}

function getFilterBarHeight(): number {
  const filterBarHeight = document
    .getElementById("catalog-filter-bar")
    ?.getBoundingClientRect().height;

  if (typeof filterBarHeight === "number" && filterBarHeight > 0) {
    return filterBarHeight;
  }

  const cssValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--catalog-filter-bar-height")
    .trim();
  const parsedCssValue = Number.parseFloat(cssValue);

  if (Number.isFinite(parsedCssValue) && parsedCssValue > 0) {
    return parsedCssValue;
  }

  return 120;
}

export function getCategorySectionScrollOffset(): number {
  return getFilterBarHeight() + CATEGORY_SECTION_SCROLL_OFFSET_PX;
}

export function getCategorySectionScrollTargetOffset(): number {
  return getCategorySectionScrollOffset();
}

export function getCategorySectionId(categoryId: string): string {
  return `${CATEGORY_SECTION_ID_PREFIX}-${categoryId}`;
}

export function registerCategorySectionScroller(
  scroller: CategorySectionScroller,
): () => void {
  categorySectionScrollers.add(scroller);

  return () => {
    categorySectionScrollers.delete(scroller);
  };
}

export function getCategorySectionScrollTarget(
  categoryId: string,
): CategorySectionScrollTarget | null {
  const section = document.getElementById(getCategorySectionId(categoryId));

  if (!section) {
    return null;
  }

  const targetTop =
    window.scrollY +
    section.getBoundingClientRect().top -
    getCategorySectionScrollTargetOffset();

  return {
    section,
    top: Math.max(0, targetTop),
  };
}

export function scrollCategorySectionIntoView(
  categoryId: string,
  options: { behavior?: ScrollBehavior } = {},
): boolean {
  for (const scroller of Array.from(categorySectionScrollers).reverse()) {
    if (scroller(categoryId, options)) {
      return true;
    }
  }

  const target = getCategorySectionScrollTarget(categoryId);

  if (!target) {
    return false;
  }

  window.scrollTo({
    top: target.top,
    behavior: options.behavior ?? "instant",
  });

  return true;
}
