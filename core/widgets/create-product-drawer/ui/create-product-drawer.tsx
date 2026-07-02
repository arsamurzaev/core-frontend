"use client";

import { ProductEditorDrawerContent } from "@/core/modules/product/editor";
import {
  ProductPriceListCreateInlineFields,
  ProductPriceListCreatePricesField,
  ProductPriceListSettingsDrawer,
} from "@/core/modules/catalog-price-list";
import { ProductModifierCreateBindingsField } from "@/core/modules/product-modifier";
import { useCreateProductDrawer } from "@/core/widgets/create-product-drawer/model/use-create-product-drawer";
import { EditCatalogSaleUnitsDrawer } from "@/core/widgets/edit-catalog-drawer";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { Settings } from "lucide-react";
import React from "react";

interface CreateProductDrawerProps {
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  supportsBrands?: boolean;
  supportsCategoryDetails?: boolean;
  trigger?: React.ReactNode;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function resolveCreateSaleUnitPriceListRowKey(params: {
  catalogSaleUnitId?: unknown;
  variantKey?: string;
}): string | null {
  const catalogSaleUnitId = normalizeText(params.catalogSaleUnitId);
  if (!catalogSaleUnitId) return null;

  return params.variantKey
    ? `SALE_UNIT:${params.variantKey}:${catalogSaleUnitId}`
    : `SALE_UNIT:default:${catalogSaleUnitId}`;
}

export const CreateProductDrawer: React.FC<CreateProductDrawerProps> = ({
  className,
  open,
  onOpenChange,
  supportsBrands = true,
  supportsCategoryDetails = true,
  trigger,
}) => {
  const {
    cropperApplyLabel,
    cropperDescription,
    cropperFiles,
    cropperInitialIndex,
    cropperMode,
    cropperTitle,
    errorMessage,
    filePreviewByFile,
    files,
    features,
    form,
    formFields,
    productAttributes,
    variantAttributes,
    handleCropApply,
    handleCropperOpenChange,
    handleEditFile,
    handleFilesChange,
    handleOpenChange,
    handleReset,
    handleSelectFileForSwap,
    handleSubmit,
    handleToggleReorderMode,
    isCropperOpen,
    isInitialCropRequired,
    isProductTypeSchemaResolving,
    isReorderMode,
    isSubmitting,
    modifierDrafts,
    open: drawerOpen,
    pendingSwapIndex,
    priceFormatMode,
    priceListPriceDrafts,
    removeFile,
    uploadState,
    uploadedMediaIds,
    setModifierDrafts,
    setPriceListPriceDrafts,
  } = useCreateProductDrawer({
    open,
    onOpenChange,
    supportsBrands,
    supportsCategoryDetails,
  });

  const resolvedTrigger =
    trigger === undefined ? (
      <Button className={cn("col-span-2", className)}>
        + Добавить позицию
      </Button>
    ) : (
      trigger
    );

  return (
    <AppDrawer
      open={drawerOpen}
      onOpenChange={handleOpenChange}
      dismissible={!isSubmitting && !isProductTypeSchemaResolving}
      trigger={resolvedTrigger}
    >
      <ProductEditorDrawerContent
        contentClassName="mx-auto w-full max-w-2xl"
        title="Добавление позиции"
        submitLabel="Добавить позицию"
        form={form}
        formFields={formFields}
        errorMessage={errorMessage}
        files={files}
        filePreviewByFile={filePreviewByFile}
        isSubmitting={isSubmitting}
        isBusy={isSubmitting || isProductTypeSchemaResolving}
        isCropperOpen={isCropperOpen}
        isReorderMode={isReorderMode}
        isInitialCropRequired={isInitialCropRequired}
        pendingSwapIndex={pendingSwapIndex}
        uploadState={uploadState}
        uploadedMediaIds={uploadedMediaIds}
        cropperFiles={cropperFiles}
        cropperInitialIndex={cropperInitialIndex}
        cropperMode={cropperMode}
        cropperTitle={cropperTitle}
        cropperDescription={cropperDescription}
        cropperApplyLabel={cropperApplyLabel}
        canEditPrice={features.canEditProductPrice}
        canUseCatalogSaleUnits={features.canUseCatalogSaleUnits}
        canUseDiscounts={features.canUseProductDiscounts}
        canUseProductVariants={features.canUseProductVariants}
        hideBasePrices={features.hideBasePrices}
        priceListController={
          features.canUseCatalogPriceLists ? (
            <ProductPriceListCreatePricesField
              disabled={isSubmitting || isProductTypeSchemaResolving}
              drafts={priceListPriceDrafts}
              form={form}
              onChange={setPriceListPriceDrafts}
              renderMode="controller"
              canUseCatalogSaleUnits={features.canUseCatalogSaleUnits}
              canUseProductVariants={features.canUseProductVariants}
              variantAttributes={variantAttributes}
            />
          ) : undefined
        }
        priceListSettingsAction={
          features.canUseCatalogPriceLists ? (
            <ProductPriceListSettingsDrawer
              disabled={isSubmitting || isProductTypeSchemaResolving}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 border-line-default bg-transparent px-2.5 text-text-muted shadow-none hover:border-line-default hover:bg-surface-muted hover:text-text-primary"
                  disabled={isSubmitting || isProductTypeSchemaResolving}
                  title="Настроить прайс-листы"
                >
                  <Settings className="size-4" />
                  Прайс-листы
                </Button>
              }
            />
          ) : undefined
        }
        productPriceListFields={
          features.canUseCatalogPriceLists ? (
            <ProductPriceListCreateInlineFields
              disabled={isSubmitting || isProductTypeSchemaResolving}
              drafts={priceListPriceDrafts}
              onChange={setPriceListPriceDrafts}
              priceFormatMode={priceFormatMode}
              rowKey="PRODUCT"
              target="PRODUCT"
            />
          ) : undefined
        }
        renderSaleUnitPriceListFields={
          features.canUseCatalogPriceLists
            ? ({ relation, unit, variantRow }) => {
                const rowKey = resolveCreateSaleUnitPriceListRowKey({
                  catalogSaleUnitId: unit.catalogSaleUnitId,
                  variantKey: variantRow?.key,
                });
                const parentRowKey = relation
                  ? resolveCreateSaleUnitPriceListRowKey({
                      catalogSaleUnitId: relation.parentUnit.catalogSaleUnitId,
                      variantKey: variantRow?.key,
                    })
                  : null;

                if (!rowKey) {
                  return null;
                }

                return (
                  <ProductPriceListCreateInlineFields
                    catalogSaleUnitId={normalizeText(unit.catalogSaleUnitId)}
                    disabled={isSubmitting || isProductTypeSchemaResolving}
                    drafts={priceListPriceDrafts}
                    onChange={setPriceListPriceDrafts}
                    priceFormatMode={priceFormatMode}
                    priceHintSource={
                      parentRowKey
                        ? {
                            multiplier: relation?.multiplier,
                            parentRowKey,
                          }
                        : undefined
                    }
                    rowKey={rowKey}
                    target="SALE_UNIT"
                    variantAttributes={variantRow?.attributes}
                  />
                );
              }
            : undefined
        }
        renderVariantPriceListFields={
          features.canUseCatalogPriceLists
            ? ({ row }) => (
                <ProductPriceListCreateInlineFields
                  disabled={isSubmitting || isProductTypeSchemaResolving}
                  drafts={priceListPriceDrafts}
                  onChange={setPriceListPriceDrafts}
                  priceFormatMode={priceFormatMode}
                  rowKey={`VARIANT:${row.key}`}
                  target="VARIANT"
                  variantAttributes={row.attributes}
                />
              )
            : undefined
        }
        modifiersSection={
          features.canUseCatalogModifiers ? (
            <ProductModifierCreateBindingsField
              disabled={isSubmitting || isProductTypeSchemaResolving}
              drafts={modifierDrafts}
              onChange={setModifierDrafts}
            />
          ) : undefined
        }
        saleUnitsSettingsAction={
          features.canUseCatalogSaleUnits ? (
            <EditCatalogSaleUnitsDrawer
              disabled={isSubmitting || isProductTypeSchemaResolving}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 border-line-default bg-transparent px-2.5 text-text-muted shadow-none hover:border-line-default hover:bg-surface-muted hover:text-text-primary"
                  disabled={isSubmitting || isProductTypeSchemaResolving}
                  title="Добавить/изменить единицы продажи"
                >
                  <Settings className="size-4" />
                  Добавить/изменить ед.
                </Button>
              }
            />
          ) : undefined
        }
        productAttributes={productAttributes}
        variantAttributes={variantAttributes}
        onReset={handleReset}
        onSubmit={handleSubmit}
        onFilesChange={handleFilesChange}
        onToggleReorderMode={handleToggleReorderMode}
        onSelectFileForSwap={handleSelectFileForSwap}
        onEditFile={handleEditFile}
        onRemoveFile={removeFile}
        onCropperOpenChange={handleCropperOpenChange}
        onCropApply={handleCropApply}
      />
    </AppDrawer>
  );
};
