"use client";

import {
  IDLE_MEDIA_UPLOAD_STATE,
  type MediaUploadState,
} from "@/core/widgets/edit-catalog-drawer/lib/upload-media";
import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

interface UseEditCatalogDrawerStateParams {
  defaultValues: CatalogEditFormValues;
  form: UseFormReturn<CatalogEditFormValues>;
  isSubmitting: boolean;
}

export function useEditCatalogDrawerState({
  defaultValues,
  form,
  isSubmitting,
}: UseEditCatalogDrawerStateParams) {
  const [open, setOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [uploadState, setUploadState] = React.useState<MediaUploadState>(
    IDLE_MEDIA_UPLOAD_STATE,
  );

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

  return {
    closeDrawer: React.useCallback(() => {
      setOpen(false);
    }, []),
    errorMessage,
    handleOpenChange,
    open,
    resetFeedback,
    setErrorMessage,
    setUploadState,
    uploadState,
  };
}
