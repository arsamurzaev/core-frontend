"use client";

import {
  CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  type CreateProductFormValues,
} from "@/core/widgets/create-product-drawer/model/form-config";
import {
  buildPersistedEditableAttributeValues,
} from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-data";
import { useEditProductDrawerState } from "@/core/widgets/edit-product-drawer/model/use-edit-product-drawer-state";
import { useEditProductImageEditor } from "@/core/widgets/edit-product-drawer/model/use-edit-product-image-editor";
import { useEditProductSubmit } from "@/core/widgets/edit-product-drawer/model/use-edit-product-submit";
import { useProductFormFields } from "@/core/widgets/product-editor/model/use-product-form-fields";
import {
  useProductControllerGetById,
  useProductControllerUpdate,
} from "@/shared/api/generated";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";

export function useEditProductDrawer(productId: string) {
  const { type } = useCatalog();
  const queryClient = useQueryClient();
  const updateProduct = useProductControllerUpdate();
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
      includeCategories: false,
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

  const drawerState = useEditProductDrawerState({
    form,
    isSubmitting,
    open,
    product,
    productAttributes,
    productQueryError: productQuery.error,
    productQueryIsError: productQuery.isError,
    resetFromMedia: imageEditor.resetFromMedia,
    setOpen,
  });

  const handleSubmit = useEditProductSubmit({
    closeDrawer: drawerState.closeDrawer,
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
    handleOpenChange: drawerState.handleOpenChange,
    handleReset: drawerState.handleReset,
    handleSelectItemForSwap: imageEditor.handleSelectItemForSwap,
    handleSubmit,
    handleToggleReorderMode: imageEditor.handleToggleReorderMode,
    imageItems: imageEditor.imageItems,
    isCropperOpen: imageEditor.isCropperOpen,
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
