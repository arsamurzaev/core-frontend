"use client";

import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { type MediaUploadState } from "@/core/widgets/edit-catalog-drawer/lib/upload-media";
import {
  buildCatalogEditSubmittedValues,
  invalidateCatalogEditQueries,
  uploadCatalogEditMediaIds,
} from "@/core/widgets/edit-catalog-drawer/model/edit-catalog-drawer-data";
import {
  buildCatalogEditUpdatePayload,
  normalizeCatalogEditFormValues,
  type CatalogEditFormValues,
} from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { type UpdateCatalogDtoReq } from "@/shared/api/generated/react-query";
import { type QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface EditCatalogUpdateMutation {
  mutateAsync: (params: { data: UpdateCatalogDtoReq }) => Promise<unknown>;
}

interface UseEditCatalogSubmitParams {
  catalogId: string;
  closeDrawer: () => void;
  form: UseFormReturn<CatalogEditFormValues>;
  isSubmitting: boolean;
  queryClient: QueryClient;
  resetFeedback: () => void;
  router: ReturnType<typeof useRouter>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setUploadState: React.Dispatch<React.SetStateAction<MediaUploadState>>;
  updateCatalog: EditCatalogUpdateMutation;
}

type EditCatalogSubmitOptions = {
  closeAfterSave?: boolean;
};

export function useEditCatalogSubmit({
  catalogId,
  closeDrawer,
  form,
  isSubmitting,
  queryClient,
  resetFeedback,
  router,
  setErrorMessage,
  setIsSubmitting,
  setUploadState,
  updateCatalog,
}: UseEditCatalogSubmitParams) {
  return React.useCallback(async (options: EditCatalogSubmitOptions = {}) => {
    const { closeAfterSave = true } = options;

    if (isSubmitting) {
      return false;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      setErrorMessage("Форма содержит некорректные данные профиля.");
      return false;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const parsedForm = normalizeCatalogEditFormValues(form.getValues());
      const mediaIds = await uploadCatalogEditMediaIds({
        catalogId,
        onStateChange: setUploadState,
        values: parsedForm,
      });
      const parsedPayload = buildCatalogEditUpdatePayload(parsedForm, mediaIds);

      await updateCatalog.mutateAsync({
        data: parsedPayload,
      });

      form.reset(buildCatalogEditSubmittedValues(parsedForm));
      await invalidateCatalogEditQueries(queryClient);

      resetFeedback();
      if (closeAfterSave) {
        closeDrawer();
      }
      router.refresh();
      toast.success("Профиль каталога успешно обновлен.");
      return true;
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      setUploadState((prev) => ({
        phase: "error",
        progress: prev.progress,
        message,
      }));
      toast.error(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    catalogId,
    closeDrawer,
    form,
    isSubmitting,
    queryClient,
    resetFeedback,
    router,
    setErrorMessage,
    setIsSubmitting,
    setUploadState,
    updateCatalog,
  ]);
}
