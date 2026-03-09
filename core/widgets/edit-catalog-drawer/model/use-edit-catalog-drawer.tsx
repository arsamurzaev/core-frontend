"use client";

import {
  extractApiErrorMessage,
  formatGeneratedZodError,
} from "@/core/widgets/create-product-drawer/lib/errors";
import {
  IDLE_MEDIA_UPLOAD_STATE,
  uploadCatalogImage,
} from "@/core/widgets/edit-catalog-drawer/lib/upload-media";
import {
  buildCatalogEditFormDefaultValues,
  buildCatalogEditUpdatePayload,
  catalogEditFormSchema,
  type CatalogEditFormValues,
} from "@/core/widgets/edit-catalog-drawer/model/form-config";
import {
  getCatalogControllerGetCurrentQueryKey,
  useCatalogControllerUpdateCurrent,
} from "@/shared/api/generated";
import { CatalogControllerUpdateCurrentBody } from "@/shared/api/generated/zod";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function useEditCatalogDrawer() {
  const catalog = useCatalog();
  const queryClient = useQueryClient();
  const router = useRouter();
  const updateCatalog = useCatalogControllerUpdateCurrent();
  const defaultValues = React.useMemo(
    () => buildCatalogEditFormDefaultValues(catalog),
    [catalog],
  );

  const form = useForm<CatalogEditFormValues>({
    defaultValues,
    resolver: zodResolver(catalogEditFormSchema),
    mode: "onChange",
  });

  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [uploadState, setUploadState] = React.useState(IDLE_MEDIA_UPLOAD_STATE);

  const resetFeedback = React.useCallback(() => {
    setErrorMessage(null);
    setUploadState({ ...IDLE_MEDIA_UPLOAD_STATE });
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isSubmitting) {
        return;
      }

      setOpen(nextOpen);
      form.reset(defaultValues);
      resetFeedback();
    },
    [defaultValues, form, isSubmitting, resetFeedback],
  );

  const handleSubmit = React.useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const parsedForm = catalogEditFormSchema.safeParse(form.getValues());
      if (!parsedForm.success) {
        throw new Error(
          formatGeneratedZodError(
            parsedForm.error,
            "Форма содержит некорректные данные профиля.",
          ),
        );
      }

      const logoMediaId =
        parsedForm.data.logoFile instanceof File
          ? await uploadCatalogImage({
              file: parsedForm.data.logoFile,
              catalogId: catalog.id,
              kind: "logo",
              onStateChange: setUploadState,
            })
          : undefined;

      const bgMediaId =
        parsedForm.data.bgFile instanceof File
          ? await uploadCatalogImage({
              file: parsedForm.data.bgFile,
              catalogId: catalog.id,
              kind: "background",
              onStateChange: setUploadState,
            })
          : undefined;

      const payloadCandidate = buildCatalogEditUpdatePayload(parsedForm.data, {
        logoMediaId,
        bgMediaId,
      });
      const parsedPayload = CatalogControllerUpdateCurrentBody.safeParse(
        payloadCandidate,
      );

      if (!parsedPayload.success) {
        throw new Error(
          formatGeneratedZodError(
            parsedPayload.error,
            "Не удалось подготовить запрос на обновление профиля каталога.",
          ),
        );
      }

      await updateCatalog.mutateAsync({
        data: parsedPayload.data,
      });

      form.reset({
        ...parsedForm.data,
        logoFile: undefined,
        bgFile: undefined,
      });

      await queryClient.invalidateQueries({
        queryKey: getCatalogControllerGetCurrentQueryKey(),
      });

      resetFeedback();
      setOpen(false);
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
    catalog.id,
    form,
    isSubmitting,
    queryClient,
    resetFeedback,
    router,
    updateCatalog,
  ]);

  return {
    bgUrl: catalog.config?.bgMedia?.url,
    errorMessage,
    form,
    handleOpenChange,
    handleSubmit,
    isSubmitting,
    logoUrl: catalog.config?.logoMedia?.url,
    open,
    uploadState,
  };
}
