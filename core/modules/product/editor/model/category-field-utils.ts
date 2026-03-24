"use client";

import { getFieldOptionText } from "@/core/modules/product/editor/lib/select-field-utils";
import { type CategoryDto } from "@/shared/api/generated";
import { type FieldOption } from "@/shared/ui/dynamic-form";

export type CategoryListItem = Pick<CategoryDto, "id" | "name" | "descriptor"> & {
  imageUrl: string | null;
};

function toCategoryListItem(option: FieldOption): CategoryListItem {
  return {
    id: String(option.value),
    name: getFieldOptionText(option),
    descriptor: null,
    imageUrl: null,
  };
}

function isDefinedCategory(
  value: CategoryListItem | undefined,
): value is CategoryListItem {
  return value !== undefined;
}

export function buildCategoryList(
  categories: CategoryDto[] | undefined,
  optionList: FieldOption[],
): CategoryListItem[] {
  if (!categories) {
    return optionList.map(toCategoryListItem);
  }

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    descriptor: category.descriptor,
    imageUrl: category.imageMedia?.url ?? null,
  }));
}

export function buildSelectedCategories(params: {
  selectedValues: string[];
  categoryList: CategoryListItem[];
  optionList: FieldOption[];
}) {
  const { selectedValues, categoryList, optionList } = params;

  const categoryMap = new Map(
    categoryList.map((category) => [category.id, category] as const),
  );
  const optionCategoryMap = new Map(
    optionList
      .map(toCategoryListItem)
      .map((category) => [category.id, category] as const),
  );

  return selectedValues
    .map((value) => categoryMap.get(value) ?? optionCategoryMap.get(value))
    .filter(isDefinedCategory);
}

