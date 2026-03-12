"use client";

import { extractApiErrorMessage } from "@/core/widgets/create-product-drawer/lib/errors";
import { type CreateProductFormValues } from "@/core/widgets/create-product-drawer/model/form-config";
import {
  invalidateEditProductQueries,
  parseEditProductUpdatePayload,
} from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-data";
import { REQUIRED_PRODUCT_IMAGE_CROP_MESSAGE } from "@/core/widgets/product-editor/model/product-image-editor-shared";
import { type AttributeFormValue } from "@/core/widgets/product-editor/model/types";
import { validateProductFormValues } from "@/core/widgets/product-editor/model/validate-product-form-values";
import {
  type AttributeDto,
  type ProductWithDetailsDto,
  type UpdateProductDtoReq,
} from "@/shared/api/generated";
import { type QueryClient } from "@tanstack/react-query";
import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface EditProductUpdateMutation {
  mutateAsync: (params: {
    id: string;
    data: UpdateProductDtoReq;
  }) => Promise<unknown>;
}

interface UseEditProductSubmitParams {
  closeDrawer: () => void;
  form: UseFormReturn<CreateProductFormValues>;
  isInitialCropRequired: boolean;
  isSubmitting: boolean;
  openRequiredCropper: () => void;
  pendingAddedFilesCount: number;
  persistedAttributeValues: Record<string, AttributeFormValue>;
  product: ProductWithDetailsDto | null;
  productAttributes: AttributeDto[];
  productQueryError: unknown;
  productQueryIsError: boolean;
  queryClient: QueryClient;
  resolveMediaIdsForSubmit: () => Promise<string[]>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  updateProduct: EditProductUpdateMutation;
  visibleAttributes: AttributeDto[];
}

function getMissingProductMessage(params: {
  error: unknown;
  isError: boolean;
}): string {
  return params.isError
    ? extractApiErrorMessage(params.error)
    : "Не удалось загрузить товар для редактирования.";
}

export function useEditProductSubmit({
  closeDrawer,
  form,
  isInitialCropRequired,
  isSubmitting,
  openRequiredCropper,
  pendingAddedFilesCount,
  persistedAttributeValues,
  product,
  productAttributes,
  productQueryError,
  productQueryIsError,
  queryClient,
  resolveMediaIdsForSubmit,
  setErrorMessage,
  setIsSubmitting,
  updateProduct,
  visibleAttributes,
}: UseEditProductSubmitParams) {
  return React.useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    if (!product) {
      const message = getMissingProductMessage({
        error: productQueryError,
        isError: productQueryIsError,
      });
      setErrorMessage(message);
      toast.error(message);
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
      const mediaIds = await resolveMediaIdsForSubmit();
      const updatePayload = parseEditProductUpdatePayload({
        formValues: validationResult.parsedValues,
        mediaIds,
        persistedAttributeValues,
        productAttributes,
      });

      await updateProduct.mutateAsync({
        id: product.id,
        data: updatePayload,
      });

      await invalidateEditProductQueries(queryClient, product);

      toast.success("Товар успешно обновлен.");
      closeDrawer();
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    closeDrawer,
    form,
    isInitialCropRequired,
    isSubmitting,
    openRequiredCropper,
    pendingAddedFilesCount,
    persistedAttributeValues,
    product,
    productAttributes,
    productQueryError,
    productQueryIsError,
    queryClient,
    resolveMediaIdsForSubmit,
    setErrorMessage,
    setIsSubmitting,
    updateProduct,
    visibleAttributes,
  ]);
}
