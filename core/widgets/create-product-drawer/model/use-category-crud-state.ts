"use client";

import { extractApiErrorMessage } from "@/core/widgets/create-product-drawer/lib/errors";
import {
  parseCategoryEditorDraft,
  toCategoryUploadErrorState,
} from "@/core/widgets/create-product-drawer/lib/category-editor";
import {
  IDLE_CATEGORY_IMAGE_UPLOAD_STATE,
  uploadCategoryImage,
  type CategoryImageUploadState,
} from "@/core/widgets/create-product-drawer/lib/upload-category-image";
import { type CategoryListItem } from "@/core/widgets/create-product-drawer/model/category-field-utils";
import {
  getCategoryControllerGetAllQueryKey,
  useCategoryControllerCreate,
  useCategoryControllerRemove,
  useCategoryControllerUpdate,
} from "@/shared/api/generated";
import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";

interface UseCategoryCrudStateParams {
  field: DynamicFieldRenderProps["field"];
  selectedValues: string[];
  setDraftValues: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useCategoryCrudState({
  field,
  selectedValues,
  setDraftValues,
}: UseCategoryCrudStateParams) {
  const queryClient = useQueryClient();
  const createCategory = useCategoryControllerCreate();
  const updateCategory = useCategoryControllerUpdate();
  const removeCategory = useCategoryControllerRemove();

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createDescriptor, setCreateDescriptor] = React.useState("");
  const [createImageFile, setCreateImageFile] = React.useState<File | undefined>(
    undefined,
  );
  const [createUploadState, setCreateUploadState] =
    React.useState<CategoryImageUploadState>(IDLE_CATEGORY_IMAGE_UPLOAD_STATE);
  const [editingCategory, setEditingCategory] =
    React.useState<CategoryListItem | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editDescriptor, setEditDescriptor] = React.useState("");
  const [editImageFile, setEditImageFile] = React.useState<File | undefined>(
    undefined,
  );
  const [editUploadState, setEditUploadState] =
    React.useState<CategoryImageUploadState>(IDLE_CATEGORY_IMAGE_UPLOAD_STATE);
  const [deletingCategory, setDeletingCategory] =
    React.useState<CategoryListItem | null>(null);

  const invalidateCategories = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getCategoryControllerGetAllQueryKey(),
    });
  }, [queryClient]);

  const resetCreateForm = React.useCallback(() => {
    setCreateName("");
    setCreateDescriptor("");
    setCreateImageFile(undefined);
    setCreateUploadState(IDLE_CATEGORY_IMAGE_UPLOAD_STATE);
  }, []);

  const resetEditForm = React.useCallback(() => {
    setEditingCategory(null);
    setEditName("");
    setEditDescriptor("");
    setEditImageFile(undefined);
    setEditUploadState(IDLE_CATEGORY_IMAGE_UPLOAD_STATE);
  }, []);

  const handleCreateCategory = React.useCallback(async () => {
    const parsedDraft = parseCategoryEditorDraft({
      name: createName,
      descriptor: createDescriptor,
    });
    if (!parsedDraft.success) {
      toast.error(parsedDraft.errorMessage);
      return;
    }

    try {
      const imageMediaId = createImageFile
        ? await uploadCategoryImage({
            file: createImageFile,
            onStateChange: setCreateUploadState,
          })
        : undefined;

      await createCategory.mutateAsync({
        data: {
          name: parsedDraft.values.name,
          descriptor: parsedDraft.values.descriptor || undefined,
          ...(imageMediaId ? { imageMediaId } : {}),
        },
      });
      await invalidateCategories();
      resetCreateForm();
      setIsCreateDrawerOpen(false);
      toast.success("Категория успешно добавлена.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setCreateUploadState((current) =>
        toCategoryUploadErrorState(current, message),
      );
      toast.error(message);
    }
  }, [
    createCategory,
    createDescriptor,
    createImageFile,
    createName,
    invalidateCategories,
    resetCreateForm,
  ]);

  const handleStartEdit = React.useCallback((category: CategoryListItem) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditDescriptor(category.descriptor ?? "");
    setEditImageFile(undefined);
    setEditUploadState(IDLE_CATEGORY_IMAGE_UPLOAD_STATE);
  }, []);

  const handleEditOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        return;
      }

      resetEditForm();
    },
    [resetEditForm],
  );

  const handleUpdateCategory = React.useCallback(async () => {
    if (!editingCategory) {
      return;
    }

    const parsedDraft = parseCategoryEditorDraft({
      name: editName,
      descriptor: editDescriptor,
    });
    if (!parsedDraft.success) {
      toast.error(parsedDraft.errorMessage);
      return;
    }

    try {
      const imageMediaId = editImageFile
        ? await uploadCategoryImage({
            file: editImageFile,
            onStateChange: setEditUploadState,
          })
        : undefined;

      await updateCategory.mutateAsync({
        id: editingCategory.id,
        data: {
          name: parsedDraft.values.name,
          descriptor: parsedDraft.values.descriptor || null,
          ...(imageMediaId ? { imageMediaId } : {}),
        },
      });
      await invalidateCategories();
      resetEditForm();
      toast.success("Категория успешно обновлена.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setEditUploadState((current) =>
        toCategoryUploadErrorState(current, message),
      );
      toast.error(message);
    }
  }, [
    editDescriptor,
    editImageFile,
    editName,
    editingCategory,
    invalidateCategories,
    resetEditForm,
    updateCategory,
  ]);

  const handleDeleteCategory = React.useCallback(async () => {
    if (!deletingCategory) {
      return;
    }

    try {
      await removeCategory.mutateAsync({ id: deletingCategory.id });
      await invalidateCategories();

      if (selectedValues.includes(deletingCategory.id)) {
        const nextSelectedValues = selectedValues.filter(
          (value) => value !== deletingCategory.id,
        );
        field.onChange(nextSelectedValues);
        field.onBlur();
      }

      setDraftValues((current) =>
        current.filter((value) => value !== deletingCategory.id),
      );
      setDeletingCategory(null);
      toast.success("Категория успешно удалена.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
      throw error;
    }
  }, [
    deletingCategory,
    field,
    invalidateCategories,
    removeCategory,
    selectedValues,
    setDraftValues,
  ]);

  return {
    createDescriptor,
    createImageFile,
    createName,
    createUploadState,
    deletingCategory,
    editDescriptor,
    editImageFile,
    editName,
    editUploadState,
    editingCategory,
    handleCreateCategory,
    handleDeleteCategory,
    handleEditOpenChange,
    handleStartEdit,
    handleUpdateCategory,
    isCreateBusy:
      createCategory.isPending ||
      createUploadState.phase === "uploading" ||
      createUploadState.phase === "processing",
    isCreateDrawerOpen,
    isEditBusy:
      updateCategory.isPending ||
      editUploadState.phase === "uploading" ||
      editUploadState.phase === "processing",
    resetCreateForm,
    setCreateDescriptor,
    setCreateImageFile,
    setCreateName,
    setDeletingCategory,
    setEditDescriptor,
    setEditImageFile,
    setEditName,
    setIsCreateDrawerOpen,
  };
}
