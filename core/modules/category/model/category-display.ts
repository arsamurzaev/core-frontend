import type { CategoryDto } from "@/shared/api/generated/react-query";

const CATEGORY_PATH_SEPARATOR = " / ";

function categoryHasProducts(category: CategoryDto): boolean {
  return typeof category.productCount !== "number" || category.productCount > 0;
}

function buildCategoryDisplayName(
  category: CategoryDto,
  categoryById: ReadonlyMap<string, CategoryDto>,
): string {
  const names: string[] = [];
  const visitedIds = new Set<string>();
  let current: CategoryDto | undefined = category;

  while (current && !visitedIds.has(current.id)) {
    visitedIds.add(current.id);

    const name = current.name.trim();
    if (name) {
      names.unshift(name);
    }

    current = current.parentId ? categoryById.get(current.parentId) : undefined;
  }

  return names.join(CATEGORY_PATH_SEPARATOR) || category.name;
}

export function buildCategoryDisplayList(
  categories: CategoryDto[],
  options: { hideEmpty?: boolean } = {},
): CategoryDto[] {
  const categoryById = new Map(
    categories.map((category) => [category.id, category] as const),
  );

  return categories
    .filter((category) => !options.hideEmpty || categoryHasProducts(category))
    .map((category) => ({
      ...category,
      name: buildCategoryDisplayName(category, categoryById),
    }));
}
