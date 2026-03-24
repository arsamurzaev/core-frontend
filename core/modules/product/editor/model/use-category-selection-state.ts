"use client";

import { areStringSetsEqual } from "@/core/modules/product/editor/lib/select-field-utils";
import {
  buildSelectedCategories,
  type CategoryListItem,
} from "@/core/modules/product/editor/model/category-field-utils";
import {
  type DynamicFieldRenderProps,
  type FieldOption,
} from "@/shared/ui/dynamic-form";
import React from "react";

interface UseCategorySelectionStateParams {
  categoryList: CategoryListItem[];
  field: DynamicFieldRenderProps["field"];
  isControlDisabled: boolean;
  isLoadingCategories: boolean;
  optionList: FieldOption[];
}

export function useCategorySelectionState({
  categoryList,
  field,
  isControlDisabled,
  isLoadingCategories,
  optionList,
}: UseCategorySelectionStateParams) {
  const [open, setOpen] = React.useState(false);
  const [draftValues, setDraftValues] = React.useState<string[]>([]);

  const selectedValues = React.useMemo(
    () =>
      Array.isArray(field.value)
        ? field.value.map((value) => String(value))
        : [],
    [field.value],
  );

  const selectedCategories = React.useMemo(
    () =>
      buildSelectedCategories({
        selectedValues,
        categoryList,
        optionList,
      }),
    [categoryList, optionList, selectedValues],
  );

  React.useEffect(() => {
    if (isLoadingCategories && categoryList.length === 0) {
      return;
    }

    const availableIds = new Set(categoryList.map((category) => category.id));
    const nextSelectedValues = selectedValues.filter((value) =>
      availableIds.has(value),
    );

    if (nextSelectedValues.length === selectedValues.length) {
      return;
    }

    field.onChange(nextSelectedValues);
    field.onBlur();
  }, [categoryList, field, isLoadingCategories, selectedValues]);

  React.useEffect(() => {
    if (isLoadingCategories && categoryList.length === 0) {
      return;
    }

    const availableIds = new Set(categoryList.map((category) => category.id));
    setDraftValues((current) =>
      current.filter((value) => availableIds.has(value)),
    );
  }, [categoryList, isLoadingCategories]);

  const openDrawer = React.useCallback(() => {
    if (isControlDisabled) {
      return;
    }

    setDraftValues(selectedValues);
    setOpen(true);
  }, [isControlDisabled, selectedValues]);

  const toggleDraftValue = React.useCallback((value: string) => {
    setDraftValues((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }, []);

  const handleApply = React.useCallback(() => {
    field.onChange(draftValues);
    field.onBlur();
    setOpen(false);
  }, [draftValues, field]);

  return {
    draftValues,
    handleApply,
    hasChanges: !areStringSetsEqual(draftValues, selectedValues),
    open,
    openDrawer,
    selectedCategories,
    selectedValues,
    setDraftValues,
    setOpen,
    toggleDraftValue,
  };
}

