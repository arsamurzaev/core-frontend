"use client";

import { extractApiErrorMessage } from "@/core/widgets/create-product-drawer/lib/errors";
import {
  invalidateCreateProductQueries,
  parseCreateProductPayload,
} from "@/core/widgets/create-product-drawer/model/create-product-drawer-data";
import { type CreateProductFormValues } from "@/core/widgets/create-product-drawer/model/form-config";
import { REQUIRED_PRODUCT_IMAGE_CROP_MESSAGE } from "@/core/widgets/product-editor/model/product-image-editor-shared";
import { type UploadState } from "@/core/widgets/product-editor/model/types";
import { uploadProductImages } from "@/core/widgets/product-editor/lib/upload-product-images";
import { validateProductFormValues } from "@/core/widgets/product-editor/model/validate-product-form-values";
import {
  type AttributeDto,
  type CreateProductDtoReq,
} from "@/shared/api/generated";
import { type QueryClient } from "@tanstack/react-query";
import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface CreateProductMutation {
  mutateAsync: (params: { data: CreateProductDtoReq }) => Promise<unknown>;
}

interface UseCreateProductSubmitParams {
  closeDrawer: () => void;
  createProduct: CreateProductMutation;
  files: File[];
  form: UseFormReturn<CreateProductFormValues>;
  isInitialCropRequired: boolean;
  isSubmitting: boolean;
  openRequiredCropper: () => void;
  pendingAddedFilesCount: number;
  productAttributes: AttributeDto[];
  queryClient: QueryClient;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setUploadState: React.Dispatch<React.SetStateAction<UploadState>>;
  setUploadedMediaIds: React.Dispatch<React.SetStateAction<string[]>>;
  uploadedMediaIds: string[];
  visibleAttributes: AttributeDto[];
}

function toUploadErrorState(current: UploadState, message: string): UploadState {
  if (current.phase === "idle") {
    return current;
  }

  return {
    ...current,
    phase: "error",
    message,
  };
}

export function useCreateProductSubmit({
  closeDrawer,
  createProduct,
  files,
  form,
  isInitialCropRequired,
  isSubmitting,
  openRequiredCropper,
  pendingAddedFilesCount,
  productAttributes,
  queryClient,
  setErrorMessage,
  setIsSubmitting,
  setUploadState,
  setUploadedMediaIds,
  uploadedMediaIds,
  visibleAttributes,
}: UseCreateProductSubmitParams) {
  return React.useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const validationResult = validateProductFormValues({
      invalidFormMessage: "Заполните форму товара.",
      invalidPriceMessage: "Укажите корректную цену.",
      values: form.getValues(),
      visibleAttributes,
    });
    if (!validationResult.success) {
      setErrorMessage(validationResult.errorMessage);
      toast.error(validationResult.errorMessage);
      return;
    }

    if (isInitialCropRequired && pendingAddedFilesCount > 0) {
      setErrorMessage(REQUIRED_PRODUCT_IMAGE_CROP_MESSAGE);
      toast.error(REQUIRED_PRODUCT_IMAGE_CROP_MESSAGE);
      openRequiredCropper();
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const mediaIds =
        uploadedMediaIds.length > 0
          ? uploadedMediaIds
          : await uploadProductImages({
              files,
              onStateChange: setUploadState,
            });
      setUploadedMediaIds(mediaIds);

      const createPayload = parseCreateProductPayload({
        formValues: validationResult.parsedValues,
        mediaIds,
        normalizedPrice: validationResult.normalizedPrice,
        productAttributes,
      });

      await createProduct.mutateAsync({
        data: createPayload,
      });

      await invalidateCreateProductQueries(queryClient);

      toast.success("Товар успешно создан.");
      closeDrawer();
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      setUploadState((current) => toUploadErrorState(current, message));
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    closeDrawer,
    createProduct,
    files,
    form,
    isInitialCropRequired,
    isSubmitting,
    openRequiredCropper,
    pendingAddedFilesCount,
    productAttributes,
    queryClient,
    setErrorMessage,
    setIsSubmitting,
    setUploadState,
    setUploadedMediaIds,
    uploadedMediaIds,
    visibleAttributes,
  ]);
}
