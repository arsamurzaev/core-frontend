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
import { type CatalogPriceFormatMode } from "@/shared/lib/price-format";
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
  priceFormatMode?: CatalogPriceFormatMode;
  priceFallback?: string;
  saleUnitsSettingsAction?: React.ReactNode;
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
  priceFormatMode = "integer",
  priceFallback,
  saleUnitsSettingsAction,
  productTypeChangeSection,
  saleUnits,
  variantAttributes,
}) => {
  const showBaseSaleUnits = canUseCatalogSaleUnits && !hasVariantAttributes;
  const saleUnitsInsertOrder = React.useMemo(() => {
    const discountToggleOrder = formFields.find(
      (field) => field.name === "hasDiscount",
    )?.layout?.order;

    return typeof discountToggleOrder === "number" ? discountToggleOrder : 70;
  }, [formFields]);
  const formFieldsBeforeSaleUnits = React.useMemo(
    () =>
      formFields.filter(
        (field) => (field.layout?.order ?? 0) < saleUnitsInsertOrder,
      ),
    [formFields, saleUnitsInsertOrder],
  );
  const formFieldsAfterSaleUnits = React.useMemo(
    () =>
      formFields.filter(
        (field) => (field.layout?.order ?? 0) >= saleUnitsInsertOrder,
      ),
    [formFields, saleUnitsInsertOrder],
  );

  function handleSaleUnitsChange(nextSaleUnits: SaleUnitsFormValue) {
    form.setValue("saleUnits", nextSaleUnits, {
      shouldDirty: true,
    });
  }

  function renderDynamicForm(
    fields: DynamicFieldConfig<CreateProductFormValues>[],
  ) {
    if (fields.length === 0) {
      return null;
    }

    return (
      <DynamicForm
        form={form}
        fields={fields}
        onSubmit={() => undefined}
        disabled={disabled}
        className="space-y-0"
        layout={CREATE_PRODUCT_FORM_LAYOUT}
        fieldSetProps={CREATE_PRODUCT_FIELDSET_PROPS}
        fieldGroupProps={CREATE_PRODUCT_FIELD_GROUP_PROPS}
      />
    );
  }

  return (
    <section className="space-y-3">
      {showBaseSaleUnits
        ? renderDynamicForm(formFieldsBeforeSaleUnits)
        : renderDynamicForm(formFields)}

      {showBaseSaleUnits ? (
        <div className="min-w-0 px-0">
          <ProductSaleUnitsField
            disabled={disabled}
            discountPercent={discountPercent}
            priceFormatMode={priceFormatMode}
            priceFallback={priceFallback}
            saleUnits={saleUnits}
            settingsAction={saleUnitsSettingsAction}
            title="Единицы продажи"
            onChange={handleSaleUnitsChange}
          />
        </div>
      ) : null}

      {showBaseSaleUnits ? renderDynamicForm(formFieldsAfterSaleUnits) : null}

      {productTypeChangeSection}

      {hasVariantAttributes && variantAttributes ? (
        <ProductVariantsField
          canUseCatalogSaleUnits={canUseCatalogSaleUnits}
          form={form}
          variantAttributes={variantAttributes}
          discountPercent={discountPercent}
          disabled={disabled}
          priceFormatMode={priceFormatMode}
        />
      ) : null}
    </section>
  );
};
