"use client";

import {
  buildCreateProductFormFields,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { buildProductEditorCustomFields } from "@/core/modules/product/editor/model/product-form-custom-fields";
import {
  applyBooleanAttributeDefaults,
  clearAttributeValues,
  getDiscountedPriceAttributeIdToReset,
} from "@/core/modules/product/editor/model/product-form-effects";
import { patchProductDiscountFields } from "@/core/modules/product/editor/model/product-form-discount-fields";
import {
  getProductEditorProductAttributes,
  getProductEditorVariantAttributes,
  mergeProductEditorAttributes,
  resolveProductTypeAttributes,
  shouldResolveProductTypeAttributes,
} from "@/core/modules/product/editor/model/product-form-attributes";
import {
  buildBrandOptions,
  buildCategoryOptions,
  buildProductTypeOptions,
} from "@/core/modules/product/editor/model/product-form-options";
import {
  filterVisibleDiscountAttributes,
  getDiscountAttributeIds,
  isSaleUnitPricingDraftTouched,
} from "@/core/modules/product/editor/model/product-discount";
import { buildAttributesFromProductTypeMatrixSchema } from "@/core/modules/product/editor/model/product-types";
import { CreateProductDiscountDateRangeField } from "@/core/modules/product/editor/ui/create-product-discount-date-range-field";
import { CreateProductDiscountLinkedField } from "@/core/modules/product/editor/ui/create-product-discount-linked-field";
import {
  type AttributeDto,
  useBrandControllerGetAll,
  useCategoryControllerGetAll,
  useProductTypeControllerGetAll,
  useProductTypeControllerGetMatrixEditorSchema,
} from "@/shared/api/generated/react-query";

import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

export interface UseProductFormFieldsParams {
  form: UseFormReturn<CreateProductFormValues>;
  sourceAttributes: AttributeDto[] | null | undefined;
  disableProductTypeField?: boolean;
  canUseProductTypes?: boolean;
  canUseProductVariants?: boolean;
  canUseCatalogSaleUnits?: boolean;
  isActive?: boolean;
  includeCategories?: boolean;
  supportsBrands?: boolean;
  supportsCategoryDetails?: boolean;
  schemaProductTypeId?: string | null;
  onProductTypeChange?: (productTypeId: string | null) => void;
  useSelectedProductTypeSchema?: boolean;
}

export function useProductFormFields({
  form,
  sourceAttributes,
  disableProductTypeField = false,
  canUseProductTypes = false,
  canUseProductVariants = false,
  canUseCatalogSaleUnits = false,
  isActive = false,
  includeCategories = true,
  supportsBrands = true,
  supportsCategoryDetails = true,
  schemaProductTypeId,
  onProductTypeChange,
  useSelectedProductTypeSchema = true,
}: UseProductFormFieldsParams) {
  const shouldUseBrands = supportsBrands;
  const brandsQuery = useBrandControllerGetAll({
    query: {
      enabled: shouldUseBrands,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const categoriesQuery = useCategoryControllerGetAll({
    query: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const productTypesQuery = useProductTypeControllerGetAll(undefined, {
    query: {
      enabled: isActive && canUseProductTypes,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const selectedProductTypeId =
    schemaProductTypeId === undefined ? form.watch("productTypeId") : undefined;
  const resolvedSchemaProductTypeId =
    schemaProductTypeId === undefined
      ? selectedProductTypeId
      : schemaProductTypeId;
  const matrixSchemaQuery = useProductTypeControllerGetMatrixEditorSchema(
    resolvedSchemaProductTypeId ?? "",
    {
      query: {
        enabled:
          isActive &&
          canUseProductTypes &&
          useSelectedProductTypeSchema &&
          Boolean(resolvedSchemaProductTypeId),
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    },
  );
  const matrixAttributes = React.useMemo(
    () => buildAttributesFromProductTypeMatrixSchema(matrixSchemaQuery.data),
    [matrixSchemaQuery.data],
  );
  const shouldResolveFromProductType = shouldResolveProductTypeAttributes({
    canUseProductTypes,
    productTypeId: resolvedSchemaProductTypeId,
    useSelectedProductTypeSchema,
  });
  const productTypeAttributes = React.useMemo(
    () =>
      resolveProductTypeAttributes({
        matrixAttributes,
        shouldResolveFromProductType,
      }),
    [matrixAttributes, shouldResolveFromProductType],
  );
  const resolvedProductAttributes = React.useMemo(
    () =>
      mergeProductEditorAttributes({
        productTypeAttributes,
        sourceAttributes,
      }),
    [productTypeAttributes, sourceAttributes],
  );

  const productAttributes = React.useMemo(
    () => getProductEditorProductAttributes(resolvedProductAttributes),
    [resolvedProductAttributes],
  );

  const variantAttributes = React.useMemo(
    () =>
      getProductEditorVariantAttributes({
        canUseProductVariants,
        isMatrixSchemaError: matrixSchemaQuery.isError,
        productTypeAttributes,
        shouldResolveFromProductType,
      }),
    [
      canUseProductVariants,
      matrixSchemaQuery.isError,
      productTypeAttributes,
      shouldResolveFromProductType,
    ],
  );
  const isProductTypeSchemaResolving =
    shouldResolveFromProductType &&
    (matrixSchemaQuery.isLoading || matrixSchemaQuery.isFetching);
  const watchedSaleUnits = form.watch("saleUnits");
  const hasSaleUnitPricing = React.useMemo(
    () => (watchedSaleUnits ?? []).some(isSaleUnitPricingDraftTouched),
    [watchedSaleUnits],
  );
  const shouldUsePercentDiscountOnly =
    (canUseProductVariants && variantAttributes.length > 0) ||
    (canUseCatalogSaleUnits && hasSaleUnitPricing);

  const brandOptions = React.useMemo(
    () => buildBrandOptions(brandsQuery.data, shouldUseBrands),
    [brandsQuery.data, shouldUseBrands],
  );

  const categoryOptions = React.useMemo(
    () => buildCategoryOptions(categoriesQuery.data),
    [categoriesQuery.data],
  );
  const productTypeOptions = React.useMemo(
    () => buildProductTypeOptions(productTypesQuery.data),
    [productTypesQuery.data],
  );

  const hasDiscount = form.watch("hasDiscount");

  const discountAttributeIds = React.useMemo(
    () => getDiscountAttributeIds(productAttributes),
    [productAttributes],
  );

  const visibleAttributes = React.useMemo(
    () =>
      filterVisibleDiscountAttributes(productAttributes, {
        hasDiscount,
        shouldUsePercentDiscountOnly,
      }),
    [hasDiscount, productAttributes, shouldUsePercentDiscountOnly],
  );

  const baseFormFields = React.useMemo(
    () => {
      const customFields = buildProductEditorCustomFields({
        brandOptions,
        canUseProductTypes,
        categoryOptions,
        disableProductTypeField,
        includeCategories,
        onProductTypeChange,
        productTypeOptions,
        shouldUseBrands,
        supportsCategoryDetails,
      });

      return buildCreateProductFormFields(visibleAttributes, customFields);
    },
    [
      brandOptions,
      canUseProductTypes,
      categoryOptions,
      disableProductTypeField,
      includeCategories,
      onProductTypeChange,
      productTypeOptions,
      shouldUseBrands,
      supportsCategoryDetails,
      visibleAttributes,
    ],
  );

  React.useEffect(() => {
    if (!shouldUseBrands) {
      form.setValue("brandId", undefined);
    }
  }, [form, shouldUseBrands]);

  const formFields = React.useMemo(() => {
    return patchProductDiscountFields({
      fields: baseFormFields,
      productAttributes,
      renderDiscountDateRangeField:
        ({ relatedAttributeId }) =>
        (props: DynamicFieldRenderProps<CreateProductFormValues>) =>
          React.createElement(CreateProductDiscountDateRangeField, {
            ...props,
            relatedAttributeId,
          }),
      renderDiscountLinkedField:
        ({ mode, relatedAttributeId }) =>
        (props: DynamicFieldRenderProps<CreateProductFormValues>) =>
          React.createElement(CreateProductDiscountLinkedField, {
            ...props,
            mode,
            relatedAttributeId,
          }),
      shouldUsePercentDiscountOnly,
    });
  }, [baseFormFields, productAttributes, shouldUsePercentDiscountOnly]);

  React.useEffect(() => {
    if (!isActive) {
      return;
    }

    const currentValues = form.getValues("attributes");
    const result = applyBooleanAttributeDefaults(
      productAttributes,
      currentValues,
    );

    if (result.changed) {
      form.setValue("attributes", result.values);
    }
  }, [form, isActive, productAttributes]);

  React.useEffect(() => {
    if (hasDiscount || discountAttributeIds.length === 0) {
      return;
    }

    const currentValues = form.getValues("attributes");
    const result = clearAttributeValues(discountAttributeIds, currentValues);

    if (result.changed) {
      form.setValue("attributes", result.values);
    }
  }, [discountAttributeIds, form, hasDiscount]);

  React.useEffect(() => {
    if (!shouldUsePercentDiscountOnly) {
      return;
    }

    const currentValues = form.getValues("attributes");
    const discountedPriceAttributeId = getDiscountedPriceAttributeIdToReset(
      productAttributes,
      currentValues,
    );
    if (!discountedPriceAttributeId) {
      return;
    }

    form.setValue(`attributes.${discountedPriceAttributeId}`, null, {
      shouldDirty: true,
    });
  }, [form, productAttributes, shouldUsePercentDiscountOnly]);

  return {
    formFields,
    isProductTypeSchemaResolving,
    productAttributes,
    variantAttributes,
    visibleAttributes,
  };
}
