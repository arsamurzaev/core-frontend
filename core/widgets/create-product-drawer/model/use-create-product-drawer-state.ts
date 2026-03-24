"use client";

import {
  CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import {
  buildInitialAttributeValues,
} from "@/core/modules/product/editor/model/product-attributes";
import { type AttributeDto } from "@/shared/api/generated";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

interface UseCreateProductDrawerStateParams {
  form: UseFormReturn<CreateProductFormValues>;
  isSubmitting: boolean;
  open: boolean;
  productAttributes: AttributeDto[];
  resetImageState: () => void;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCreateProductDrawerState({
  form,
  isSubmitting,
  open,
  productAttributes,
  resetImageState,
  setOpen,
}: UseCreateProductDrawerStateParams) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const resetState = React.useCallback(() => {
    form.reset({
      ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
      attributes: buildInitialAttributeValues(productAttributes),
    });
    resetImageState();
    setErrorMessage(null);
  }, [form, productAttributes, resetImageState]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isSubmitting) {
        return;
      }

      setOpen(nextOpen);
      if (!nextOpen) {
        resetState();
      }
    },
    [isSubmitting, resetState, setOpen],
  );

  const handleReset = React.useCallback(() => {
    if (isSubmitting) {
      return;
    }

    resetState();
  }, [isSubmitting, resetState]);

  const closeDrawer = React.useCallback(() => {
    setOpen(false);
    resetState();
  }, [resetState, setOpen]);

  return {
    closeDrawer,
    errorMessage,
    handleOpenChange,
    handleReset,
    open,
    resetState,
    setErrorMessage,
  };
}

