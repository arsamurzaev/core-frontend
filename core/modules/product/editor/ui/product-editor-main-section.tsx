"use client";

import {
  CREATE_PRODUCT_FIELD_GROUP_PROPS,
  CREATE_PRODUCT_FIELDSET_PROPS,
  CREATE_PRODUCT_FORM_LAYOUT,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import {
  buildVariantMatrixRows,
  type SaleUnitFormValue,
  type SaleUnitsFormValue,
  type VariantCombinationFormValue,
  type VariantMatrixRow,
} from "@/core/modules/product/editor/model/product-variants";
import {
  ProductSaleUnitsField,
  type SaleUnitPriceListRelationHint,
} from "@/core/modules/product/editor/ui/product-sale-units-field";
import { ProductVariantsField } from "@/core/modules/product/editor/ui/product-variants-field";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import { type CatalogPriceFormatMode } from "@/shared/lib/price-format";
import { DynamicForm, type DynamicFieldConfig } from "@/shared/ui/dynamic-form";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

interface ProductEditorMainSectionProps {
  canEditPrice?: boolean;
  canUseCatalogSaleUnits?: boolean;
  disabled?: boolean;
  discountPercent: number;
  form: UseFormReturn<CreateProductFormValues>;
  formFields: DynamicFieldConfig<CreateProductFormValues>[];
  hasVariantAttributes: boolean;
  hideBasePrices?: boolean;
  priceFormatMode?: CatalogPriceFormatMode;
  priceListSettingsAction?: React.ReactNode;
  productPriceListFields?: React.ReactNode;
  priceFallback?: string;
  renderSaleUnitPriceListFields?: (params: {
    index: number;
    relation?: SaleUnitPriceListRelationHint;
    unit: SaleUnitFormValue;
    variantRow?: VariantMatrixRow;
  }) => React.ReactNode;
  renderVariantPriceListFields?: (params: {
    item: VariantCombinationFormValue;
    row: VariantMatrixRow;
  }) => React.ReactNode;
  saleUnitsSettingsAction?: React.ReactNode;
  productTypeChangeSection?: React.ReactNode;
  saleUnits: SaleUnitsFormValue | undefined;
  variantAttributes?: AttributeDto[];
}

export const ProductEditorMainSection: React.FC<
  ProductEditorMainSectionProps
> = ({
  canEditPrice = true,
  canUseCatalogSaleUnits = false,
  disabled,
  discountPercent,
  form,
  formFields,
  hasVariantAttributes,
  hideBasePrices = false,
  priceFormatMode = "integer",
  priceListSettingsAction,
  productPriceListFields,
  priceFallback,
  renderSaleUnitPriceListFields,
  renderVariantPriceListFields,
  saleUnitsSettingsAction,
  productTypeChangeSection,
  saleUnits,
  variantAttributes,
}) => {
  const showBaseSaleUnits = canUseCatalogSaleUnits && !hasVariantAttributes;
  const watchedVariants = form.watch("variants");
  const hasSaleUnitRows = React.useMemo(
    () =>
      (saleUnits ?? []).some(
        (unit) =>
          Boolean(unit.id?.trim()) ||
          Boolean(unit.catalogSaleUnitId?.trim()) ||
          Boolean(unit.label?.trim()),
      ),
    [saleUnits],
  );
  const hasActiveVariantRows = React.useMemo(
    () =>
      hasVariantAttributes && variantAttributes
        ? buildVariantMatrixRows(watchedVariants, variantAttributes).some(
            (row) => row.item.status !== "DISABLED",
          )
        : false,
    [hasVariantAttributes, variantAttributes, watchedVariants],
  );
  const shouldRenderProductPriceListFields =
    hideBasePrices &&
    Boolean(productPriceListFields) &&
    !hasSaleUnitRows &&
    !hasActiveVariantRows;
  const shouldSplitCommercialFields =
    showBaseSaleUnits || shouldRenderProductPriceListFields;
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
      {shouldSplitCommercialFields
        ? renderDynamicForm(formFieldsBeforeSaleUnits)
        : renderDynamicForm(formFields)}

      {priceListSettingsAction ? (
        <div className="flex min-w-0 justify-end">
          {priceListSettingsAction}
        </div>
      ) : null}

      {shouldRenderProductPriceListFields ? (
        <div className="min-w-0">{productPriceListFields}</div>
      ) : null}

      {showBaseSaleUnits ? (
        <div className="min-w-0 px-0">
          <ProductSaleUnitsField
            disabled={disabled || !canEditPrice}
            canEditPrices={canEditPrice}
            discountPercent={discountPercent}
            priceFormatMode={priceFormatMode}
            priceFallback={priceFallback}
            renderPriceListFields={
              renderSaleUnitPriceListFields
                ? ({ index, relation, unit }) =>
                    renderSaleUnitPriceListFields({ index, relation, unit })
                : undefined
            }
            saleUnits={saleUnits}
            settingsAction={saleUnitsSettingsAction}
            hidePrices={hideBasePrices}
            title="Единицы продажи"
            onChange={handleSaleUnitsChange}
          />
        </div>
      ) : null}

      {shouldSplitCommercialFields
        ? renderDynamicForm(formFieldsAfterSaleUnits)
        : null}

      {productTypeChangeSection}

      {hasVariantAttributes && variantAttributes ? (
        <ProductVariantsField
          canUseCatalogSaleUnits={canUseCatalogSaleUnits}
          canEditPrices={canEditPrice}
          form={form}
          variantAttributes={variantAttributes}
          discountPercent={discountPercent}
          disabled={disabled}
          priceFormatMode={priceFormatMode}
          hideBasePrices={hideBasePrices}
          renderSaleUnitPriceListFields={
            renderSaleUnitPriceListFields
              ? ({ index, relation, row, unit }) =>
                  renderSaleUnitPriceListFields({
                    index,
                    relation,
                    unit,
                    variantRow: row,
                  })
              : undefined
          }
          renderVariantPriceListFields={renderVariantPriceListFields}
        />
      ) : null}
    </section>
  );
};
