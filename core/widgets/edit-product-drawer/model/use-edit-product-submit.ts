"use client";

import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { REQUIRED_PRODUCT_IMAGE_CROP_MESSAGE } from "@/core/modules/product/editor/model/product-image-editor-shared";
import {
  buildSetVariantsPayloads,
  type VariantsFormValue,
} from "@/core/modules/product/editor/model/product-variants";
import {
  type AttributeFormValue,
  type UploadState,
} from "@/core/modules/product/editor/model/types";
import { validateProductFormValues } from "@/core/modules/product/editor/model/validate-product-form-values";
import { UploadProgressToast } from "@/core/modules/product/editor/ui/upload-progress-toast";
import { waitForProductImagesProcessing } from "@/core/modules/product/editor/lib";
import { type ResolvedEditProductMediaSubmit } from "@/core/widgets/edit-product-drawer/model/use-edit-product-image-editor";
import {
  invalidateEditProductQueries,
  parseEditProductUpdatePayload,
} from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-data";
import {
  type AttributeDto,
  type ProductWithDetailsDto,
  type SetProductVariantsDtoReq,
  type UpdateProductDtoReq,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
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

interface EditProductSetVariantsMutation {
  mutateAsync: (params: {
    id: string;
    data: SetProductVariantsDtoReq;
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
  resolveMediaIdsForSubmit: (
    onUploadStateChange?: (state: UploadState) => void,
  ) => Promise<ResolvedEditProductMediaSubmit>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setVariants: EditProductSetVariantsMutation;
  updateProduct: EditProductUpdateMutation;
  variantAttributes: AttributeDto[];
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

function renderProgressToast(label: string, progress: number) {
  return React.createElement(UploadProgressToast, { label, progress });
}

function renderUploadProgressToast(state: UploadState) {
  return renderProgressToast(
    state.message.trim() || "Обработка фотографий...",
    state.progress,
  );
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
  setVariants,
  updateProduct,
  variantAttributes,
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

    const productId = product.id;
    const parsedValues = validationResult.parsedValues;
    const backgroundToastId = toast.loading(
      renderProgressToast("Сохраняем изменения...", 0),
    );

    closeDrawer();

    void (async () => {
      try {
        const { mediaIds, processingJobIds } = await resolveMediaIdsForSubmit((state) => {
          toast.loading(renderUploadProgressToast(state), {
            id: backgroundToastId,
          });
        });

        toast.loading(renderProgressToast("Обновляем товар...", 100), {
          id: backgroundToastId,
        });

        const updatePayload = parseEditProductUpdatePayload({
          formValues: parsedValues,
          mediaIds,
          persistedAttributeValues,
          productAttributes,
        });

        await updateProduct.mutateAsync({
          id: productId,
          data: updatePayload,
        });

        const setVariantsPayloads = buildSetVariantsPayloads(
          (parsedValues.variants ?? {}) as VariantsFormValue,
          variantAttributes,
        );

        await Promise.all(
          setVariantsPayloads.map((payload) =>
            setVariants.mutateAsync({ id: productId, data: payload }),
          ),
        );

        void invalidateEditProductQueries(queryClient);

        if (processingJobIds.length === 0) {
          toast.success("Товар обновлён.", {
            id: backgroundToastId,
          });
          return;
        }

        toast.loading(renderProgressToast("Товар обновлён. Обрабатываем фото...", 50), {
          id: backgroundToastId,
        });

        for (const jobId of processingJobIds) {
          await waitForProductImagesProcessing({
            jobId,
            onStateChange: (state) => {
              toast.loading(renderUploadProgressToast(state), {
                id: backgroundToastId,
              });
            },
          });
        }

        void invalidateEditProductQueries(queryClient);

        toast.success("Товар обновлён. Фото обработаны.", {
          id: backgroundToastId,
        });
      } catch (error) {
        const message = extractApiErrorMessage(error);
        setErrorMessage(message);
        toast.error(message, { id: backgroundToastId });
      } finally {
        setIsSubmitting(false);
      }
    })();
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
    setVariants,
    updateProduct,
    variantAttributes,
    visibleAttributes,
  ]);
}
