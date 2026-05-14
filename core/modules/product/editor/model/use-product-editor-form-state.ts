"use client";

import {
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { resolveDiscountPercent } from "@/core/modules/product/editor/model/product-discount";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

interface UseProductEditorFormStateParams {
  canUseProductVariants?: boolean;
  form: UseFormReturn<CreateProductFormValues>;
  productAttributes?: AttributeDto[];
  variantAttributes?: AttributeDto[];
}

export function useProductEditorFormState({
  canUseProductVariants = false,
  form,
  productAttributes,
  variantAttributes,
}: UseProductEditorFormStateParams) {
  const saleUnits = form.watch("saleUnits");
  const priceFallback = form.watch("price");
  const attributes = form.watch("attributes");
  const hasVariantAttributes =
    canUseProductVariants && Boolean(variantAttributes?.length);
  const discountPercent = React.useMemo(
    () => resolveDiscountPercent(productAttributes ?? [], attributes),
    [attributes, productAttributes],
  );

  return {
    discountPercent,
    hasVariantAttributes,
    priceFallback,
    saleUnits,
  };
}
