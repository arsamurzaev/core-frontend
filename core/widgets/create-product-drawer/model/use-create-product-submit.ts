"use client";

import {
  enqueueProductImages,
  waitForProductImagesProcessing,
} from "@/core/modules/product/editor/lib";
import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { REQUIRED_PRODUCT_IMAGE_CROP_MESSAGE } from "@/core/modules/product/editor/model/product-image-editor-shared";
import { type UploadState } from "@/core/modules/product/editor/model/types";
import { validateProductFormValues } from "@/core/modules/product/editor/model/validate-product-form-values";
import { UploadProgressToast } from "@/core/modules/product/editor/ui/upload-progress-toast";
import {
  invalidateCreateProductQueries,
  parseCreateProductPayload,
} from "@/core/widgets/create-product-drawer/model/create-product-drawer-data";
import {
  type AttributeDto,
  type CreateProductDtoReq,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { type CatalogPriceFormatMode } from "@/shared/lib/price-format";
import { type QueryClient } from "@tanstack/react-query";
import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface CreateProductMutation {
  mutateAsync: (params: { data: CreateProductDtoReq }) => Promise<unknown>;
}

interface UseCreateProductSubmitParams {
  closeDrawer: () => void;
  canEditPrice: boolean;
  canUseCatalogSaleUnits: boolean;
  canUseDiscounts: boolean;
  canUseProductTypes: boolean;
  canUseProductVariants: boolean;
  createProduct: CreateProductMutation;
  files: File[];
  form: UseFormReturn<CreateProductFormValues>;
  isInitialCropRequired: boolean;
  isSubmitting: boolean;
  openRequiredCropper: () => void;
  pendingAddedFilesCount: number;
  priceFormatMode: CatalogPriceFormatMode;
  productAttributes: AttributeDto[];
  queryClient: QueryClient;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  uploadedMediaIds: string[];
  variantAttributes: AttributeDto[];
  visibleAttributes: AttributeDto[];
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

export function useCreateProductSubmit({
  closeDrawer,
  canEditPrice,
  canUseCatalogSaleUnits,
  canUseDiscounts,
  canUseProductTypes,
  canUseProductVariants,
  createProduct,
  files,
  form,
  isInitialCropRequired,
  isSubmitting,
  openRequiredCropper,
  pendingAddedFilesCount,
  priceFormatMode,
  productAttributes,
  queryClient,
  setErrorMessage,
  setIsSubmitting,
  uploadedMediaIds,
  variantAttributes,
  visibleAttributes,
}: UseCreateProductSubmitParams) {
  const isSubmitLaunchingRef = React.useRef(false);

  return React.useCallback(() => {
    if (isSubmitting || isSubmitLaunchingRef.current) {
      return;
    }

    isSubmitLaunchingRef.current = true;

    const validationResult = validateProductFormValues({
      invalidFormMessage: "Заполните форму товара.",
      invalidPriceMessage: "Укажите корректную цену.",
      canEditPrice,
      canUseCatalogSaleUnits,
      canUseProductVariants,
      priceFormatMode,
      values: form.getValues(),
      variantAttributes,
      visibleAttributes,
    });
    if (!validationResult.success) {
      isSubmitLaunchingRef.current = false;
      setErrorMessage(validationResult.errorMessage);
      toast.error(validationResult.errorMessage);
      return;
    }

    if (isInitialCropRequired && pendingAddedFilesCount > 0) {
      isSubmitLaunchingRef.current = false;
      setErrorMessage(REQUIRED_PRODUCT_IMAGE_CROP_MESSAGE);
      toast.error(REQUIRED_PRODUCT_IMAGE_CROP_MESSAGE);
      openRequiredCropper();
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const parsedValues = validationResult.parsedValues;
    const normalizedPrice = validationResult.normalizedPrice;
    const filesSnapshot = [...files];
    const uploadedMediaIdsSnapshot = [...uploadedMediaIds];
    const backgroundToastId = toast.loading(
      renderProgressToast("Сохраняем товар...", 0),
    );

    closeDrawer();
    setIsSubmitting(false);
    window.setTimeout(() => {
      isSubmitLaunchingRef.current = false;
    }, 0);

    // The drawer can be reused immediately; this task must only touch snapshots.
    void (async () => {
      try {
        const queued =
          uploadedMediaIdsSnapshot.length > 0
            ? { jobId: "", mediaIds: uploadedMediaIdsSnapshot }
            : await enqueueProductImages({
                files: filesSnapshot,
                onStateChange: (state) => {
                  toast.loading(renderUploadProgressToast(state), {
                    id: backgroundToastId,
                  });
                },
              });
        const mediaIds = queued.mediaIds;

        toast.loading(renderProgressToast("Создаём товар...", 100), {
          id: backgroundToastId,
        });

        const createPayload = parseCreateProductPayload({
          formValues: parsedValues,
          mediaIds,
          normalizedPrice,
          productAttributes,
          variantAttributes,
          canEditPrice,
          canUseCatalogSaleUnits,
          canUseDiscounts,
          canUseProductTypes,
          canUseProductVariants,
        });

        await createProduct.mutateAsync({
          data: createPayload,
        });

        await invalidateCreateProductQueries(queryClient);

        if (!queued.jobId) {
          toast.success("Товар создан.", {
            id: backgroundToastId,
          });
          return;
        }

        toast.loading(renderProgressToast("Товар создан. Обрабатываем фото...", 50), {
          id: backgroundToastId,
        });

        await waitForProductImagesProcessing({
          jobId: queued.jobId,
          onStateChange: (state) => {
            toast.loading(renderUploadProgressToast(state), {
              id: backgroundToastId,
            });
          },
        });

        await invalidateCreateProductQueries(queryClient);

        toast.success("Товар создан. Фото обработаны.", {
          id: backgroundToastId,
        });
      } catch (error) {
        const message = extractApiErrorMessage(error);
        toast.error(message, { id: backgroundToastId });
      }
    })();
  }, [
    closeDrawer,
    canEditPrice,
    canUseCatalogSaleUnits,
    canUseDiscounts,
    canUseProductTypes,
    canUseProductVariants,
    createProduct,
    files,
    form,
    isInitialCropRequired,
    isSubmitting,
    openRequiredCropper,
    pendingAddedFilesCount,
    priceFormatMode,
    productAttributes,
    queryClient,
    setErrorMessage,
    setIsSubmitting,
    uploadedMediaIds,
    variantAttributes,
    visibleAttributes,
  ]);
}
