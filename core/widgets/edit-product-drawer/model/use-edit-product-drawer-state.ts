"use client";

import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { buildEditProductFormValues } from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-data";
import {
  type AttributeDto,
  type ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { type CatalogPriceFormatMode } from "@/shared/lib/price-format";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

interface UseEditProductDrawerStateParams {
  form: UseFormReturn<CreateProductFormValues>;
  isSubmitting: boolean;
  open: boolean;
  product: ProductWithDetailsDto | null;
  productAttributes: AttributeDto[];
  priceFormatMode?: CatalogPriceFormatMode;
  variantAttributes?: AttributeDto[];
  productQueryError: unknown;
  productQueryIsError: boolean;
  resetFromMedia: (media: ProductWithDetailsDto["media"]) => void;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shouldSkipSchemaDrivenReset?: () => boolean;
}

export function useEditProductDrawerState({
  form,
  isSubmitting,
  open,
  product,
  productAttributes,
  priceFormatMode = "integer",
  variantAttributes = [],
  productQueryError,
  productQueryIsError,
  resetFromMedia,
  setOpen,
  shouldSkipSchemaDrivenReset,
}: UseEditProductDrawerStateParams) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const lastResetKeyRef = React.useRef<string | null>(null);

  const resetKey = React.useMemo(() => {
    if (!product) {
      return null;
    }

    const productAttributeKey = productAttributes
      .map((attribute) => attribute.id)
      .sort()
      .join(",");
    const variantAttributeKey = variantAttributes
      .map((attribute) => attribute.id)
      .sort()
      .join(",");

    return [
      product.id,
      product.updatedAt ?? "",
      productAttributeKey,
      variantAttributeKey,
    ].join(":");
  }, [product, productAttributes, variantAttributes]);

  const resetFromProduct = React.useCallback(
    (nextProduct: ProductWithDetailsDto) => {
      form.reset(
        buildEditProductFormValues(
          nextProduct,
          productAttributes,
          variantAttributes,
          priceFormatMode,
        ),
      );
      resetFromMedia(nextProduct.media);
      setErrorMessage(null);
    },
    [
      form,
      priceFormatMode,
      productAttributes,
      variantAttributes,
      resetFromMedia,
    ],
  );

  React.useEffect(() => {
    if (!open || !product) {
      return;
    }

    if (lastResetKeyRef.current === resetKey) {
      return;
    }

    if (
      lastResetKeyRef.current &&
      (form.formState.isDirty || shouldSkipSchemaDrivenReset?.())
    ) {
      return;
    }

    lastResetKeyRef.current = resetKey;
    resetFromProduct(product);
  }, [
    form.formState.isDirty,
    open,
    product,
    resetFromProduct,
    resetKey,
    shouldSkipSchemaDrivenReset,
  ]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isSubmitting) {
        return;
      }

      setOpen(nextOpen);
      if (!nextOpen) {
        lastResetKeyRef.current = null;
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
    lastResetKeyRef.current = resetKey;
  }, [isSubmitting, product, resetFromProduct, resetKey]);

  return {
    closeDrawer: React.useCallback(() => {
      setOpen(false);
      lastResetKeyRef.current = null;
      setErrorMessage(null);
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
