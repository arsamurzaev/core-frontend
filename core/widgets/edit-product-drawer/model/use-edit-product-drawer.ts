"use client";

import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import {
  CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { useProductFormFields } from "@/core/modules/product/editor/model/use-product-form-fields";
import {
  buildPersistedEditableAttributeValues,
} from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-data";
import { useEditProductDrawerState } from "@/core/widgets/edit-product-drawer/model/use-edit-product-drawer-state";
import { useEditProductImageEditor } from "@/core/widgets/edit-product-drawer/model/use-edit-product-image-editor";
import { useEditProductSubmit } from "@/core/widgets/edit-product-drawer/model/use-edit-product-submit";
import { invalidateProductQueries } from "@/core/modules/product/actions/model";
import {
  useProductControllerGetById,
  useProductControllerRemove,
  useProductControllerUpdate,
} from "@/shared/api/generated/react-query";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { confirmDelete } from "@/shared/ui/confirmation";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function getMissingProductMessage(params: {
  error: unknown;
  isError: boolean;
}): string {
  return params.isError
    ? extractApiErrorMessage(params.error)
    : "Не удалось загрузить товар для редактирования.";
}

export function useEditProductDrawer(
  productId: string,
  onExternalOpenChange?: (open: boolean) => void,
) {
  const { type } = useCatalog();
  const queryClient = useQueryClient();
  const updateProduct = useProductControllerUpdate();
  const removeProduct = useProductControllerRemove();
  const form = useForm<CreateProductFormValues>({
    defaultValues: CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const productQuery = useProductControllerGetById(productId, {
    query: {
      enabled: open && Boolean(productId),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });

  const { formFields, productAttributes, visibleAttributes } = useProductFormFields(
    {
      form,
      sourceAttributes: type.attributes,
      isActive: open,
    },
  );

  const product = productQuery.data ?? null;
  const persistedAttributeValues = React.useMemo(
    () =>
      product
        ? buildPersistedEditableAttributeValues(product, productAttributes)
        : {},
    [product, productAttributes],
  );

  const imageEditor = useEditProductImageEditor({
    isSubmitting,
  });

  const isDeleting = removeProduct.isPending;
  const isBusy = isSubmitting || isDeleting;

  const drawerState = useEditProductDrawerState({
    form,
    isSubmitting: isBusy,
    open,
    product,
    productAttributes,
    productQueryError: productQuery.error,
    productQueryIsError: productQuery.isError,
    resetFromMedia: imageEditor.resetFromMedia,
    setOpen,
  });

  const handleCloseDrawer = React.useCallback(() => {
    drawerState.closeDrawer();
    onExternalOpenChange?.(false);
  }, [drawerState, onExternalOpenChange]);

  const handleDelete = React.useCallback(() => {
    if (isBusy) {
      return;
    }

    if (!product) {
      const message = getMissingProductMessage({
        error: productQuery.error,
        isError: productQuery.isError,
      });
      drawerState.setErrorMessage(message);
      toast.error(message);
      return;
    }

    void confirmDelete({
      title: "Удалить товар?",
      description: `Товар "${product.name}" будет удален без возможности восстановления.`,
      confirmText: "Удалить",
      pendingText: "Удаление...",
      tone: "destructive",
      onConfirm: async () => {
        await removeProduct.mutateAsync({ id: product.id });
        handleCloseDrawer();
        toast.success("Товар успешно удален.");
        void invalidateProductQueries(queryClient);
      },
      onError: (error) => {
        const message = extractApiErrorMessage(error);
        drawerState.setErrorMessage(message);
        toast.error(message);
      },
    });
  }, [
    drawerState,
    handleCloseDrawer,
    isBusy,
    product,
    productQuery.error,
    productQuery.isError,
    queryClient,
    removeProduct,
  ]);

  const handleSubmit = useEditProductSubmit({
    closeDrawer: handleCloseDrawer,
    form,
    isInitialCropRequired: imageEditor.isInitialCropRequired,
    isSubmitting,
    openRequiredCropper: imageEditor.openRequiredCropper,
    pendingAddedFilesCount: imageEditor.pendingAddedFilesCount,
    persistedAttributeValues,
    product,
    productAttributes,
    productQueryError: productQuery.error,
    productQueryIsError: productQuery.isError,
    queryClient,
    resolveMediaIdsForSubmit: imageEditor.resolveMediaIdsForSubmit,
    setErrorMessage: drawerState.setErrorMessage,
    setIsSubmitting,
    updateProduct,
    visibleAttributes,
  });

  return {
    cropperApplyLabel: imageEditor.cropperApplyLabel,
    cropperDescription: imageEditor.cropperDescription,
    cropperFiles: imageEditor.cropperFiles,
    cropperInitialIndex: imageEditor.cropperInitialIndex,
    cropperMode: imageEditor.cropperMode,
    cropperTitle: imageEditor.cropperTitle,
    errorMessage: drawerState.errorMessage,
    form,
    formFields,
    handleCropApply: imageEditor.handleCropApply,
    handleCropperOpenChange: imageEditor.handleCropperOpenChange,
    handleEditItem: imageEditor.handleEditItem,
    handleFilesChange: imageEditor.handleFilesChange,
    handleDelete,
    handleOpenChange: drawerState.handleOpenChange,
    handleReset: drawerState.handleReset,
    handleSelectItemForSwap: imageEditor.handleSelectItemForSwap,
    handleSubmit,
    handleToggleReorderMode: imageEditor.handleToggleReorderMode,
    imageItems: imageEditor.imageItems,
    isCropperOpen: imageEditor.isCropperOpen,
    isBusy,
    isDeleting,
    isInitialCropRequired: imageEditor.isInitialCropRequired,
    isLoadingProduct: open && productQuery.isLoading && !product,
    isReorderMode: imageEditor.isReorderMode,
    isSubmitting,
    open: drawerState.open,
    pendingSwapIndex: imageEditor.pendingSwapIndex,
    product,
    removeItem: imageEditor.removeItem,
    uploadState: imageEditor.uploadState,
    uploadedMediaIds: imageEditor.uploadedMediaIds,
  };
}

