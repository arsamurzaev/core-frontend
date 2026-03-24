"use client";

import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { type MediaUploadState } from "@/core/widgets/edit-catalog-drawer/lib/upload-media";
import {
  buildCatalogEditSubmittedValues,
  invalidateCatalogEditQueries,
  parseCatalogEditFormValues,
  parseCatalogEditUpdatePayload,
  uploadCatalogEditMediaIds,
} from "@/core/widgets/edit-catalog-drawer/model/edit-catalog-drawer-data";
import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { type UpdateCatalogDtoReq } from "@/shared/api/generated";
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
  return React.useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const parsedForm = parseCatalogEditFormValues(form.getValues());
      const mediaIds = await uploadCatalogEditMediaIds({
        catalogId,
        onStateChange: setUploadState,
        values: parsedForm,
      });
      const parsedPayload = parseCatalogEditUpdatePayload({
        values: parsedForm,
        ...mediaIds,
      });

      await updateCatalog.mutateAsync({
        data: parsedPayload,
      });

      form.reset(buildCatalogEditSubmittedValues(parsedForm));
      await invalidateCatalogEditQueries(queryClient);

      resetFeedback();
      closeDrawer();
      router.refresh();
      toast.success("Профиль каталога успешно обновлен.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      setUploadState((prev) => ({
        phase: "error",
        progress: prev.progress,
        message,
      }));
      toast.error(message);
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
