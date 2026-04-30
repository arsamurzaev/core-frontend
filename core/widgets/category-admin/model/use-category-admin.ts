"use client";

import { arrayMove } from "@dnd-kit/sortable";
import {
  parseCategoryEditorDraft,
  toCategoryUploadErrorState,
} from "@/core/modules/product/editor/lib/category-editor";
import {
  IDLE_CATEGORY_IMAGE_UPLOAD_STATE,
  uploadCategoryImage,
  type CategoryImageUploadState,
} from "@/core/modules/product/editor/lib/upload-category-image";
import {
  getCategoryControllerGetAllQueryKey,
  useCategoryControllerCreate,
  useCategoryControllerRemove,
  useCategoryControllerUpdate,
  type CategoryDto,
} from "@/shared/api/generated/react-query";
import { apiClient } from "@/shared/api/client";
import { revalidateStorefrontCacheBestEffort } from "@/shared/api/revalidate-storefront-client";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

export interface UseCategoryAdminParams {
  categories: CategoryDto[];
}

export interface UseCategoryAdminResult {
  createDescriptor: string;
  createImageFile: File | undefined;
  createName: string;
  createUploadState: CategoryImageUploadState;
  deletingCategory: CategoryDto | null;
  editDescriptor: string;
  editImageFile: File | undefined;
  editName: string;
  editUploadState: CategoryImageUploadState;
  editingCategory: CategoryDto | null;
  handleCreateCategory: () => Promise<void>;
  handleDeleteCategory: () => Promise<void>;
  handleEditOpenChange: (nextOpen: boolean) => void;
  handleReorderCategory: (params: {
    activeId: string;
    overId: string;
  }) => void;
  handleReorderOpenChange: (nextOpen: boolean) => void;
  handleSaveCategoryOrder: () => Promise<void>;
  handleStartEdit: (category: CategoryDto) => void;
  handleUpdateCategory: () => Promise<void>;
  isCreateBusy: boolean;
  isCreateOpen: boolean;
  isEditBusy: boolean;
  isReorderBusy: boolean;
  hasReorderChanges: boolean;
  isReorderOpen: boolean;
  reorderCategories: CategoryDto[];
  resetCreateForm: () => void;
  setCreateDescriptor: React.Dispatch<React.SetStateAction<string>>;
  setCreateImageFile: React.Dispatch<React.SetStateAction<File | undefined>>;
  setCreateName: React.Dispatch<React.SetStateAction<string>>;
  setDeletingCategory: React.Dispatch<
    React.SetStateAction<CategoryDto | null>
  >;
  setEditDescriptor: React.Dispatch<React.SetStateAction<string>>;
  setEditImageFile: React.Dispatch<React.SetStateAction<File | undefined>>;
  setEditName: React.Dispatch<React.SetStateAction<string>>;
  setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setReorderCategories: React.Dispatch<React.SetStateAction<CategoryDto[]>>;
}

function mapCategoriesToDraft(categories: CategoryDto[]) {
  return categories.map((category, index) => ({
    ...category,
    position: index,
  }));
}

function reorderCategoriesByIds(params: {
  activeId: string;
  overId: string;
  categories: CategoryDto[];
}) {
  const { activeId, overId, categories } = params;
  const oldIndex = categories.findIndex((category) => category.id === activeId);
  const newIndex = categories.findIndex((category) => category.id === overId);

  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return null;
  }

  const nextCategories = arrayMove(categories, oldIndex, newIndex).map(
    (category, index) => ({
      ...category,
      position: index,
    }),
  );

  return {
    nextCategories,
  };
}

export function useCategoryAdmin({
  categories,
}: UseCategoryAdminParams): UseCategoryAdminResult {
  const queryClient = useQueryClient();
  const createCategory = useCategoryControllerCreate();
  const updateCategory = useCategoryControllerUpdate();
  const removeCategory = useCategoryControllerRemove();

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createDescriptor, setCreateDescriptor] = React.useState("");
  const [createImageFile, setCreateImageFile] = React.useState<File | undefined>(
    undefined,
  );
  const [createUploadState, setCreateUploadState] =
    React.useState<CategoryImageUploadState>(IDLE_CATEGORY_IMAGE_UPLOAD_STATE);

  const [editingCategory, setEditingCategory] =
    React.useState<CategoryDto | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editDescriptor, setEditDescriptor] = React.useState("");
  const [editImageFile, setEditImageFile] = React.useState<File | undefined>(
    undefined,
  );
  const [editUploadState, setEditUploadState] =
    React.useState<CategoryImageUploadState>(IDLE_CATEGORY_IMAGE_UPLOAD_STATE);

  const [deletingCategory, setDeletingCategory] =
    React.useState<CategoryDto | null>(null);

  const [isReorderOpen, setIsReorderOpen] = React.useState(false);
  const [isReorderBusy, setIsReorderBusy] = React.useState(false);
  const [reorderCategories, setReorderCategories] = React.useState<CategoryDto[]>(
    () => mapCategoriesToDraft(categories),
  );

  const invalidateCategories = React.useCallback(async () => {
    await Promise.allSettled([
      queryClient.invalidateQueries({
        queryKey: getCategoryControllerGetAllQueryKey(),
      }),
      revalidateStorefrontCacheBestEffort(),
    ]);
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

  React.useEffect(() => {
    if (isReorderOpen) {
      return;
    }

    setReorderCategories(mapCategoriesToDraft(categories));
  }, [categories, isReorderOpen]);

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
      setIsCreateOpen(false);
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

  const handleStartEdit = React.useCallback((category: CategoryDto) => {
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
      const queryKey = getCategoryControllerGetAllQueryKey();
      queryClient.setQueryData<CategoryDto[]>(queryKey, (current) =>
        current
          ?.filter((category) => category.id !== deletingCategory.id)
          .map((category, index) => ({ ...category, position: index })) ?? [],
      );
      setReorderCategories((current) =>
        current
          .filter((category) => category.id !== deletingCategory.id)
          .map((category, index) => ({ ...category, position: index })),
      );
      await revalidateStorefrontCacheBestEffort();
      if (editingCategory?.id === deletingCategory.id) {
        resetEditForm();
      }
      setDeletingCategory(null);
      toast.success("Категория успешно удалена.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
      throw error;
    }
  }, [
    deletingCategory,
    editingCategory,
    removeCategory,
    queryClient,
    resetEditForm,
  ]);

  const handleReorderOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setIsReorderOpen(nextOpen);
      setReorderCategories(mapCategoriesToDraft(categories));
    },
    [categories],
  );

  const handleReorderCategory = React.useCallback(
    (params: { activeId: string; overId: string }) => {
      if (isReorderBusy) {
        return;
      }

      const reorderResult = reorderCategoriesByIds({
        activeId: params.activeId,
        overId: params.overId,
        categories: reorderCategories,
      });

      if (!reorderResult) {
        return;
      }

      setReorderCategories(reorderResult.nextCategories);
    },
    [isReorderBusy, reorderCategories],
  );

  const hasReorderChanges = React.useMemo(() => {
    if (categories.length !== reorderCategories.length) {
      return true;
    }

    return reorderCategories.some(
      (category, index) => categories[index]?.id !== category.id,
    );
  }, [categories, reorderCategories]);

  const handleSaveCategoryOrder = React.useCallback(async () => {
    if (isReorderBusy || !hasReorderChanges) {
      return;
    }

    const nextCategories = reorderCategories.map((category, index) => ({
      ...category,
      position: index,
    }));

    try {
      setIsReorderBusy(true);

      const savedCategories = await apiClient.patch<CategoryDto[]>(
        "/category/positions",
        {
          categories: nextCategories.map((category, index) => ({
            id: category.id,
            position: index,
          })),
        },
      );

      queryClient.setQueryData(
        getCategoryControllerGetAllQueryKey(),
        savedCategories,
      );
      setReorderCategories(mapCategoriesToDraft(savedCategories));
      await revalidateStorefrontCacheBestEffort();
      setIsReorderOpen(false);
      toast.success("Порядок категорий сохранён.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    } finally {
      setIsReorderBusy(false);
    }
  }, [
    hasReorderChanges,
    invalidateCategories,
    isReorderBusy,
    queryClient,
    reorderCategories,
  ]);

  const isCreateBusy =
    createCategory.isPending ||
    createUploadState.phase === "uploading" ||
    createUploadState.phase === "processing";

  const isEditBusy =
    updateCategory.isPending ||
    editUploadState.phase === "uploading" ||
    editUploadState.phase === "processing";

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
    handleReorderCategory,
    handleReorderOpenChange,
    handleSaveCategoryOrder,
    handleStartEdit,
    handleUpdateCategory,
    hasReorderChanges,
    isCreateBusy,
    isCreateOpen,
    isEditBusy,
    isReorderBusy,
    isReorderOpen,
    reorderCategories,
    resetCreateForm,
    setCreateDescriptor,
    setCreateImageFile,
    setCreateName,
    setDeletingCategory,
    setEditDescriptor,
    setEditImageFile,
    setEditName,
    setIsCreateOpen,
    setReorderCategories,
  };
}
