"use client";

import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import {
  buildEditProductFormValues,
} from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-data";
import {
  type AttributeDto,
  type ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";

import React from "react";
import { type UseFormReturn } from "react-hook-form";

interface UseEditProductDrawerStateParams {
  form: UseFormReturn<CreateProductFormValues>;
  isSubmitting: boolean;
  open: boolean;
  product: ProductWithDetailsDto | null;
  productAttributes: AttributeDto[];
  variantAttributes?: AttributeDto[];
  productQueryError: unknown;
  productQueryIsError: boolean;
  resetFromMedia: (media: ProductWithDetailsDto["media"]) => void;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useEditProductDrawerState({
  form,
  isSubmitting,
  open,
  product,
  productAttributes,
  variantAttributes = [],
  productQueryError,
  productQueryIsError,
  resetFromMedia,
  setOpen,
}: UseEditProductDrawerStateParams) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const resetFromProduct = React.useCallback(
    (nextProduct: ProductWithDetailsDto) => {
      form.reset(buildEditProductFormValues(nextProduct, productAttributes, variantAttributes));
      resetFromMedia(nextProduct.media);
      setErrorMessage(null);
    },
    [form, productAttributes, variantAttributes, resetFromMedia],
  );

  React.useEffect(() => {
    if (!open || !product) {
      return;
    }

    resetFromProduct(product);
  }, [open, product, resetFromProduct]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isSubmitting) {
        return;
      }

      setOpen(nextOpen);
      if (!nextOpen) {
        setErrorMessage(null);
      }
    },
    [isSubmitting, setOpen],
  );

  const handleReset = React.useCallback(() => {
    if (isSubmitting || !product) {
      return;
    }

    resetFromProduct(product);
  }, [isSubmitting, product, resetFromProduct]);

  return {
    closeDrawer: React.useCallback(() => {
      setOpen(false);
    }, [setOpen]),
    errorMessage:
      errorMessage ??
      (open && productQueryIsError && !product
        ? extractApiErrorMessage(productQueryError)
        : null),
    handleOpenChange,
    handleReset,
    open,
    setErrorMessage,
  };
}
