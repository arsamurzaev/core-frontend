"use client";

import {
  CREATE_PRODUCT_FORM_FIELD_CLASS,
  CREATE_PRODUCT_FORM_LABEL_CLASS,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { CreateProductBrandField } from "@/core/modules/product/editor/ui/create-product-brand-field";
import { CreateProductCategoriesField } from "@/core/modules/product/editor/ui/create-product-categories-field";
import { ProductTypeSelectField } from "@/core/modules/product/editor/ui/product-type-select-field";
import {
  type DynamicFieldConfig,
  type DynamicFieldRenderProps,
} from "@/shared/ui/dynamic-form";
import React from "react";

export interface BuildProductEditorCustomFieldsParams {
  brandOptions: DynamicFieldConfig<CreateProductFormValues>["options"];
  canUseProductTypes: boolean;
  categoryOptions: DynamicFieldConfig<CreateProductFormValues>["options"];
  disableProductTypeField: boolean;
  includeCategories: boolean;
  onProductTypeChange?: (productTypeId: string | null) => void;
  productTypeOptions: DynamicFieldConfig<CreateProductFormValues>["options"];
  shouldUseBrands: boolean;
  supportsCategoryDetails: boolean;
}

export function buildProductEditorCustomFields({
  brandOptions,
  canUseProductTypes,
  categoryOptions,
  disableProductTypeField,
  includeCategories,
  onProductTypeChange,
  productTypeOptions,
  shouldUseBrands,
  supportsCategoryDetails,
}: BuildProductEditorCustomFieldsParams): DynamicFieldConfig<CreateProductFormValues>[] {
  const fields: Array<DynamicFieldConfig<CreateProductFormValues> | null> = [
    shouldUseBrands
      ? {
          name: "brandId",
          label: "Бренд",
          component: CreateProductBrandField,
          options: brandOptions,
          placeholder: "Выбрать бренд",
          hideError: true,
          orientation: "horizontal",
          labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
          className: CREATE_PRODUCT_FORM_FIELD_CLASS,
          layout: { colSpan: 2, order: 40 },
        }
      : null,
    canUseProductTypes
      ? {
          name: "productTypeId",
          label: "Тип товара",
          kind: "select",
          options: productTypeOptions,
          placeholder: "Без типа",
          disabled: disableProductTypeField,
          description: disableProductTypeField
            ? "Тип товара задан интеграцией MoySklad и меняется только через синхронизацию."
            : undefined,
          render: onProductTypeChange
            ? (props: DynamicFieldRenderProps<CreateProductFormValues>) =>
                React.createElement(ProductTypeSelectField, {
                  ...props,
                  onProductTypeChange,
                })
            : undefined,
          hideError: true,
          orientation: "horizontal",
          labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
          className: CREATE_PRODUCT_FORM_FIELD_CLASS,
          layout: { colSpan: 2, order: 45 },
        }
      : null,
    includeCategories
      ? {
          name: "categoryIds",
          label: "Категории",
          component: (props: DynamicFieldRenderProps<CreateProductFormValues>) =>
            React.createElement(CreateProductCategoriesField, {
              ...props,
              supportsCategoryDetails,
            }),
          options: categoryOptions,
          placeholder: "Выбрать категорию",
          hideError: true,
          orientation: "horizontal",
          labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
          className: CREATE_PRODUCT_FORM_FIELD_CLASS,
          multiple: true,
          layout: { colSpan: 2, order: 50 },
        }
      : null,
    {
      name: "hasDiscount",
      label: "Есть скидка",
      kind: "checkbox",
      hideError: true,
      orientation: "horizontal",
      className: "items-center",
      layout: { colSpan: 2, order: 70 },
    },
  ];

  return fields.filter(
    (field): field is DynamicFieldConfig<CreateProductFormValues> =>
      field !== null,
  );
}
