"use client";

import {
  CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  type CreateProductFormValues,
} from "@/core/widgets/create-product-drawer/model/form-config";
import { useCreateProductDrawerState } from "@/core/widgets/create-product-drawer/model/use-create-product-drawer-state";
import { useCreateProductSubmit } from "@/core/widgets/create-product-drawer/model/use-create-product-submit";
import { useProductFormFields } from "@/core/widgets/product-editor/model/use-product-form-fields";
import { useProductImageEditor } from "@/core/widgets/product-editor/model/use-product-image-editor";
import { useProductControllerCreate } from "@/shared/api/generated";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";

export function useCreateProductDrawer() {
  const { type } = useCatalog();
  const queryClient = useQueryClient();
  const createProduct = useProductControllerCreate();
  const form = useForm<CreateProductFormValues>({
    defaultValues: CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const { formFields, productAttributes, visibleAttributes } = useProductFormFields(
    {
      form,
      sourceAttributes: type.attributes,
      isActive: open,
    },
  );

  const imageEditor = useProductImageEditor({ isSubmitting });

  const drawerState = useCreateProductDrawerState({
    form,
    isSubmitting,
    open,
    productAttributes,
    resetImageState: imageEditor.resetState,
    setOpen,
  });

  const handleSubmit = useCreateProductSubmit({
    closeDrawer: drawerState.closeDrawer,
    createProduct,
    files: imageEditor.files,
    form,
    isInitialCropRequired: imageEditor.isInitialCropRequired,
    isSubmitting,
    openRequiredCropper: imageEditor.openRequiredCropper,
    pendingAddedFilesCount: imageEditor.pendingAddedFilesCount,
    productAttributes,
    queryClient,
    setErrorMessage: drawerState.setErrorMessage,
    setIsSubmitting,
    setUploadState: imageEditor.setUploadState,
    setUploadedMediaIds: imageEditor.setUploadedMediaIds,
    uploadedMediaIds: imageEditor.uploadedMediaIds,
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
    filePreviewByFile: imageEditor.filePreviewByFile,
    files: imageEditor.files,
    form,
    formFields,
    handleCropApply: imageEditor.handleCropApply,
    handleCropperOpenChange: imageEditor.handleCropperOpenChange,
    handleEditFile: imageEditor.handleEditFile,
    handleFilesChange: imageEditor.handleFilesChange,
    handleOpenChange: drawerState.handleOpenChange,
    handleReset: drawerState.handleReset,
    handleSelectFileForSwap: imageEditor.handleSelectFileForSwap,
    handleSubmit,
    handleToggleReorderMode: imageEditor.handleToggleReorderMode,
    isCropperOpen: imageEditor.isCropperOpen,
    isInitialCropRequired: imageEditor.isInitialCropRequired,
    isReorderMode: imageEditor.isReorderMode,
    isSubmitting,
    open: drawerState.open,
    pendingSwapIndex: imageEditor.pendingSwapIndex,
    removeFile: imageEditor.removeFile,
    uploadState: imageEditor.uploadState,
    uploadedMediaIds: imageEditor.uploadedMediaIds,
  };
}
