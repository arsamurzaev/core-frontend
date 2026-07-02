"use client";

import { buildCategoryDisplayList } from "@/core/modules/category";
import { getFieldOptionText } from "@/core/modules/product/editor/lib/select-field-utils";
import { type CategoryDto } from "@/shared/api/generated/react-query";
import { type FieldOption } from "@/shared/ui/dynamic-form";

export type CategoryListItem = Pick<
  CategoryDto,
  "id" | "name" | "descriptor" | "productCount"
> & {
  imageUrl: string | null;
};

function toCategoryListItem(option: FieldOption): CategoryListItem {
  return {
    id: String(option.value),
    name: getFieldOptionText(option),
    descriptor: null,
    productCount: 0,
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

  return buildCategoryDisplayList(categories).map((category) => ({
    id: category.id,
    name: category.name,
    descriptor: category.descriptor,
    productCount: category.productCount,
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

