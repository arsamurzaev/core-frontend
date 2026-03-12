"use client";

import { EMPTY_FIELD_OPTIONS } from "@/core/widgets/create-product-drawer/lib/select-field-utils";
import {
  buildCategoryList,
  type CategoryListItem,
} from "@/core/widgets/create-product-drawer/model/category-field-utils";
import { useCategoryCrudState } from "@/core/widgets/create-product-drawer/model/use-category-crud-state";
import { useCategorySelectionState } from "@/core/widgets/create-product-drawer/model/use-category-selection-state";
import { useCategoryControllerGetAll } from "@/shared/api/generated";
import {
  type DynamicFieldRenderProps,
  type FieldOption,
} from "@/shared/ui/dynamic-form";
import React from "react";

interface UseCreateProductCategoriesFieldParams {
  disabled: boolean;
  field: DynamicFieldRenderProps["field"];
  options?: FieldOption[];
  readOnly: boolean;
}

export type { CategoryListItem };

export function useCreateProductCategoriesField({
  disabled,
  field,
  options,
  readOnly,
}: UseCreateProductCategoriesFieldParams) {
  const isControlDisabled = disabled || readOnly;
  const optionList = options ?? EMPTY_FIELD_OPTIONS;

  const categoriesQuery = useCategoryControllerGetAll({
    query: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });

  const categoryList = React.useMemo(
    () => buildCategoryList(categoriesQuery.data, optionList),
    [categoriesQuery.data, optionList],
  );

  const selectionState = useCategorySelectionState({
    categoryList,
    field,
    isControlDisabled,
    isLoadingCategories: categoriesQuery.isLoading,
    optionList,
  });

  const crudState = useCategoryCrudState({
    field,
    selectedValues: selectionState.selectedValues,
    setDraftValues: selectionState.setDraftValues,
  });

  return {
    categoriesQuery,
    categoryList,
    isControlDisabled,
    ...selectionState,
    ...crudState,
  };
}
