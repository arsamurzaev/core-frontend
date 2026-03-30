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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function useEditCatalogDrawerState({
  defaultValues,
  form,
  isSubmitting,
  open: controlledOpen,
  onOpenChange,
}: UseEditCatalogDrawerStateParams) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [uploadState, setUploadState] = React.useState<MediaUploadState>(
    IDLE_MEDIA_UPLOAD_STATE,
  );
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
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
    [defaultValues, form, isSubmitting, resetFeedback, setOpen],
  );

  return {
    closeDrawer: React.useCallback(() => {
      setOpen(false);
    }, [setOpen]),
    errorMessage,
    handleOpenChange,
    open,
    resetFeedback,
    setErrorMessage,
    setUploadState,
    uploadState,
  };
}
