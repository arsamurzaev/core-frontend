"use client";

import { buildUniqueBrandSlug } from "@/core/widgets/create-product-drawer/lib/brand-slug";
import { extractApiErrorMessage } from "@/core/widgets/create-product-drawer/lib/errors";
import {
  EMPTY_FIELD_OPTIONS,
  getFieldOptionText,
  normalizeSingleLineText,
} from "@/core/widgets/create-product-drawer/lib/select-field-utils";
import {
  type BrandDto,
  getBrandControllerGetAllQueryKey,
  useBrandControllerCreate,
  useBrandControllerGetAll,
  useBrandControllerRemove,
  useBrandControllerUpdate,
} from "@/shared/api/generated";
import {
  type DynamicFieldRenderProps,
  type FieldOption,
} from "@/shared/ui/dynamic-form";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";

const MAX_BRAND_NAME_LENGTH = 40;

export type BrandListItem = Pick<BrandDto, "id" | "name" | "slug">;

interface UseCreateProductBrandFieldParams {
  disabled: boolean;
  field: DynamicFieldRenderProps["field"];
  options?: FieldOption[];
  readOnly: boolean;
}

function validateBrandName(value: string): string | null {
  if (!value) {
    return "Введите название бренда.";
  }

  if (value.length > MAX_BRAND_NAME_LENGTH) {
    return `Максимум ${MAX_BRAND_NAME_LENGTH} символов.`;
  }

  return null;
}

function toBrandListItem(option: FieldOption): BrandListItem {
  return {
    id: String(option.value),
    name: getFieldOptionText(option),
    slug: "",
  };
}

export function useCreateProductBrandField({
  disabled,
  field,
  options,
  readOnly,
}: UseCreateProductBrandFieldParams) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState<string | null>(null);
  const [createName, setCreateName] = React.useState("");
  const [editingBrand, setEditingBrand] = React.useState<BrandListItem | null>(
    null,
  );
  const [editName, setEditName] = React.useState("");
  const [deletingBrand, setDeletingBrand] = React.useState<BrandListItem | null>(
    null,
  );

  const isControlDisabled = disabled || readOnly;
  const optionList = options ?? EMPTY_FIELD_OPTIONS;
  const selectedValue =
    field.value === undefined || field.value === null ? "" : String(field.value);

  const brandsQuery = useBrandControllerGetAll({
    query: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const createBrand = useBrandControllerCreate();
  const updateBrand = useBrandControllerUpdate();
  const removeBrand = useBrandControllerRemove();

  const brandList = React.useMemo<BrandListItem[]>(
    () =>
      brandsQuery.data
        ? brandsQuery.data.map((brand) => ({
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
          }))
        : optionList.map(toBrandListItem),
    [brandsQuery.data, optionList],
  );

  const selectedBrand = React.useMemo(
    () =>
      brandList.find((brand) => brand.id === selectedValue) ??
      optionList
        .map(toBrandListItem)
        .find((brand) => brand.id === selectedValue) ??
      null,
    [brandList, optionList, selectedValue],
  );

  React.useEffect(() => {
    if (brandsQuery.isLoading && brandList.length === 0) {
      return;
    }

    if (!selectedValue) {
      return;
    }

    if (brandList.some((brand) => brand.id === selectedValue)) {
      return;
    }

    field.onChange(undefined);
    field.onBlur();
  }, [brandList, brandsQuery.isLoading, field, selectedValue]);

  React.useEffect(() => {
    if (brandsQuery.isLoading && brandList.length === 0) {
      return;
    }

    if (!draftValue) {
      return;
    }

    if (brandList.some((brand) => brand.id === draftValue)) {
      return;
    }

    setDraftValue(null);
  }, [brandList, brandsQuery.isLoading, draftValue]);

  const openDrawer = React.useCallback(() => {
    if (isControlDisabled) {
      return;
    }

    setDraftValue(selectedValue || null);
    setOpen(true);
  }, [isControlDisabled, selectedValue]);

  const hasChanges = (draftValue ?? "") !== selectedValue;

  const handleApply = React.useCallback(() => {
    field.onChange(draftValue ?? undefined);
    field.onBlur();
    setOpen(false);
  }, [draftValue, field]);

  const invalidateBrands = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getBrandControllerGetAllQueryKey(),
    });
  }, [queryClient]);

  const handleCreateBrand = React.useCallback(async () => {
    const normalizedName = normalizeSingleLineText(createName);
    const validationError = validateBrandName(normalizedName);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await createBrand.mutateAsync({
        data: {
          name: normalizedName,
          slug: buildUniqueBrandSlug(normalizedName, brandList),
        },
      });
      await invalidateBrands();
      setCreateName("");
      toast.success("Бренд успешно добавлен.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    }
  }, [brandList, createBrand, createName, invalidateBrands]);

  const handleStartEdit = React.useCallback((brand: BrandListItem) => {
    setEditingBrand(brand);
    setEditName(brand.name);
  }, []);

  const handleEditOpenChange = React.useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      return;
    }

    setEditingBrand(null);
    setEditName("");
  }, []);

  const handleUpdateBrand = React.useCallback(async () => {
    if (!editingBrand) {
      return;
    }

    const normalizedName = normalizeSingleLineText(editName);
    const validationError = validateBrandName(normalizedName);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await updateBrand.mutateAsync({
        id: editingBrand.id,
        data: {
          name: normalizedName,
          slug: buildUniqueBrandSlug(normalizedName, brandList, editingBrand.id),
        },
      });
      await invalidateBrands();
      setEditingBrand(null);
      setEditName("");
      toast.success("Бренд успешно обновлен.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    }
  }, [brandList, editName, editingBrand, invalidateBrands, updateBrand]);

  const handleDeleteBrand = React.useCallback(async () => {
    if (!deletingBrand) {
      return;
    }

    try {
      await removeBrand.mutateAsync({ id: deletingBrand.id });
      await invalidateBrands();

      if (selectedValue === deletingBrand.id) {
        field.onChange(undefined);
        field.onBlur();
      }

      setDraftValue((current) =>
        current === deletingBrand.id ? null : current,
      );
      setDeletingBrand(null);
      toast.success("Бренд успешно удален.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
      throw error;
    }
  }, [
    deletingBrand,
    field,
    invalidateBrands,
    removeBrand,
    selectedValue,
  ]);

  return {
    brandList,
    brandsQuery,
    createBrand,
    createName,
    deletingBrand,
    draftValue,
    editName,
    editingBrand,
    handleApply,
    handleCreateBrand,
    handleDeleteBrand,
    handleEditOpenChange,
    handleStartEdit,
    handleUpdateBrand,
    hasChanges,
    isControlDisabled,
    open,
    openDrawer,
    selectedBrand,
    setCreateName,
    setDeletingBrand,
    setDraftValue,
    setEditName,
    setOpen,
    updateBrand,
  };
}
