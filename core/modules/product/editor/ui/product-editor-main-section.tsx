"use client";

import {
  CREATE_PRODUCT_FIELD_GROUP_PROPS,
  CREATE_PRODUCT_FIELDSET_PROPS,
  CREATE_PRODUCT_FORM_LAYOUT,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { type SaleUnitsFormValue } from "@/core/modules/product/editor/model/product-variants";
import { ProductSaleUnitsField } from "@/core/modules/product/editor/ui/product-sale-units-field";
import { ProductVariantsField } from "@/core/modules/product/editor/ui/product-variants-field";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import {
  DynamicForm,
  type DynamicFieldConfig,
} from "@/shared/ui/dynamic-form";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

interface ProductEditorMainSectionProps {
  canUseCatalogSaleUnits?: boolean;
  disabled?: boolean;
  discountPercent: number;
  form: UseFormReturn<CreateProductFormValues>;
  formFields: DynamicFieldConfig<CreateProductFormValues>[];
  hasVariantAttributes: boolean;
  priceFallback?: string;
  productTypeChangeSection?: React.ReactNode;
  saleUnits: SaleUnitsFormValue | undefined;
  variantAttributes?: AttributeDto[];
}

export const ProductEditorMainSection: React.FC<
  ProductEditorMainSectionProps
> = ({
  canUseCatalogSaleUnits = false,
  disabled,
  discountPercent,
  form,
  formFields,
  hasVariantAttributes,
  priceFallback,
  productTypeChangeSection,
  saleUnits,
  variantAttributes,
}) => {
  function handleSaleUnitsChange(nextSaleUnits: SaleUnitsFormValue) {
    form.setValue("saleUnits", nextSaleUnits, {
      shouldDirty: true,
    });
  }

  return (
    <section className="space-y-3">
      <DynamicForm
        form={form}
        fields={formFields}
        onSubmit={() => undefined}
        disabled={disabled}
        className="space-y-0"
        layout={CREATE_PRODUCT_FORM_LAYOUT}
        fieldSetProps={CREATE_PRODUCT_FIELDSET_PROPS}
        fieldGroupProps={CREATE_PRODUCT_FIELD_GROUP_PROPS}
      />

      {canUseCatalogSaleUnits && !hasVariantAttributes ? (
        <div className="pl-0 sm:pl-[200px]">
          <ProductSaleUnitsField
            disabled={disabled}
            discountPercent={discountPercent}
            priceFallback={priceFallback}
            saleUnits={saleUnits}
            title="Единицы продажи"
            onChange={handleSaleUnitsChange}
          />
        </div>
      ) : null}

      {productTypeChangeSection}

      {hasVariantAttributes && variantAttributes ? (
        <ProductVariantsField
          canUseCatalogSaleUnits={canUseCatalogSaleUnits}
          form={form}
          variantAttributes={variantAttributes}
          discountPercent={discountPercent}
          disabled={disabled}
        />
      ) : null}
    </section>
  );
};
