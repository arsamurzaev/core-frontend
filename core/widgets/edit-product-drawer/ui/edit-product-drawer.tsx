"use client";

import { useEditProductDrawer } from "@/core/widgets/edit-product-drawer/model/use-edit-product-drawer";
import {
  ProductEditorDrawerContent,
  ProductImagesSection,
} from "@/core/modules/product/editor";
import {
  ProductPriceListInlineFields,
  ProductPriceListPricesField,
  ProductPriceListSettingsDrawer,
} from "@/core/modules/catalog-price-list";
import { ProductModifierBindingsField } from "@/core/modules/product-modifier";
import { EditCatalogSaleUnitsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-sale-units-drawer";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Loader2, Settings, Trash2 } from "lucide-react";
import React from "react";

interface EditProductDrawerProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supportsBrands?: boolean;
  supportsCategoryDetails?: boolean;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function resolveSaleUnitTargetId(params: {
  unit: { catalogSaleUnitId?: string; id?: string };
  variantKey?: string;
}): string | null {
  const id = normalizeText(params.unit.id);

  if (id) {
    return id;
  }

  const catalogSaleUnitId = normalizeText(params.unit.catalogSaleUnitId);

  if (!catalogSaleUnitId) {
    return null;
  }

  const draftId = `draft:${catalogSaleUnitId}`;

  return params.variantKey
    ? `${draftId}:variant:${params.variantKey}`
    : draftId;
}

export const EditProductDrawer: React.FC<EditProductDrawerProps> = ({
  productId,
  open,
  onOpenChange,
  supportsBrands = true,
  supportsCategoryDetails = true,
}) => {
  const {
    cropperApplyLabel,
    cropperDescription,
    cropperFiles,
    cropperInitialIndex,
    cropperMode,
    cropperTitle,
    canDeleteProduct,
    errorMessage,
    features,
    form,
    formFields,
    productAttributes,
    variantAttributes,
    handleCropApply,
    handleCropperOpenChange,
    handleDelete,
    handleEditItem,
    handleFilesChange,
    handleOpenChange,
    hasPriceListPriceDraftsEdited,
    handleSelectItemForSwap,
    handleSubmit,
    handleToggleReorderMode,
    imageItems,
    isBusy,
    isCropperOpen,
    isInitialCropRequired,
    isLoadingProduct,
    isReorderMode,
    isSubmitting,
    modifierDrafts,
    open: drawerOpen,
    pendingSwapIndex,
    priceFormatMode,
    priceListPriceDrafts,
    markPriceListPriceDraftsEdited,
    product,
    removeItem,
    uploadState,
    uploadedMediaIds,
    setAreModifierDraftsReady,
    setModifierDrafts,
    setPriceListPriceDrafts,
  } = useEditProductDrawer(productId, onOpenChange, {
    supportsBrands,
    supportsCategoryDetails,
  });

  React.useEffect(() => {
    handleOpenChange(open);
  }, [handleOpenChange, open]);

  const handleDrawerOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      handleOpenChange(nextOpen);
      onOpenChange(nextOpen);
    },
    [handleOpenChange, onOpenChange],
  );

  return (
    <AppDrawer
      open={drawerOpen}
      onOpenChange={handleDrawerOpenChange}
      dismissible={!isBusy}
    >
      {isLoadingProduct || !product ? (
        <AppDrawer.Content className="w-full">
          <div className="flex min-h-0 flex-1 flex-col">
            <AppDrawer.Header
              title="Редактор позиции"
              withCloseButton={!isBusy}
            />
            <hr />

            <DrawerScrollArea className="px-5 py-6">
              <div className="space-y-4">
                {isLoadingProduct ? (
                  <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Загрузка товара...
                  </div>
                ) : errorMessage ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {errorMessage}
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    Не удалось подготовить товар к редактированию.
                  </div>
                )}
              </div>
            </DrawerScrollArea>

            <AppDrawer.Footer className="border-t" hasFooterBtn={false} />
          </div>
        </AppDrawer.Content>
      ) : (
        <ProductEditorDrawerContent
          contentClassName="w-full"
          title="Редактор позиции"
          submitLabel="Сохранить изменения"
          form={form}
          formFields={formFields}
          errorMessage={errorMessage}
          trailingTitleNode={
            canDeleteProduct ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isBusy || isCropperOpen}
                className="rounded p-1 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                title="Удалить товар"
              >
                <Trash2 className="size-5" />
              </button>
            ) : undefined
          }
          imagesSection={
            <ProductImagesSection
              items={imageItems}
              isSubmitting={isBusy}
              isCropperOpen={isCropperOpen}
              isReorderMode={isReorderMode}
              isInitialCropRequired={isInitialCropRequired}
              pendingSwapIndex={pendingSwapIndex}
              uploadState={uploadState}
              uploadedMediaIds={uploadedMediaIds}
              onFilesChange={handleFilesChange}
              onToggleReorderMode={handleToggleReorderMode}
              onSelectFileForSwap={handleSelectItemForSwap}
              onEditFile={handleEditItem}
              onRemoveFile={removeItem}
            />
          }
          files={[]}
          filePreviewByFile={new Map()}
          isBusy={isBusy}
          isSubmitting={isSubmitting}
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
              <ProductPriceListPricesField
                disabled={isBusy || isCropperOpen}
                drafts={priceListPriceDrafts}
                form={form}
                hasExternalEdits={hasPriceListPriceDraftsEdited}
                onChange={setPriceListPriceDrafts}
                product={product}
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
                disabled={isBusy || isCropperOpen}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 border-muted-foreground/55 bg-transparent px-2.5 text-muted-foreground shadow-none hover:border-muted-foreground hover:bg-muted/30 hover:text-muted-foreground"
                    disabled={isBusy || isCropperOpen}
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
              <ProductPriceListInlineFields
                disabled={isBusy || isCropperOpen}
                drafts={priceListPriceDrafts}
                onEdited={markPriceListPriceDraftsEdited}
                onChange={setPriceListPriceDrafts}
                priceFormatMode={priceFormatMode}
                rowKey={`PRODUCT:${product.id}`}
                target="PRODUCT"
                targetId={product.id}
              />
            ) : undefined
          }
          renderSaleUnitPriceListFields={
            features.canUseCatalogPriceLists
              ? ({ relation, unit, variantRow }) => {
                  const targetId = resolveSaleUnitTargetId({
                    unit,
                    variantKey: variantRow?.key,
                  });
                  const parentTargetId = relation
                    ? resolveSaleUnitTargetId({
                        unit: relation.parentUnit,
                        variantKey: variantRow?.key,
                      })
                    : null;

                  if (!targetId) {
                    return null;
                  }

                  return (
                    <ProductPriceListInlineFields
                      disabled={isBusy || isCropperOpen}
                      drafts={priceListPriceDrafts}
                      onEdited={markPriceListPriceDraftsEdited}
                      onChange={setPriceListPriceDrafts}
                      priceFormatMode={priceFormatMode}
                      priceHintSource={
                        parentTargetId
                          ? {
                              multiplier: relation?.multiplier,
                              parentRowKey: `SALE_UNIT:${parentTargetId}`,
                            }
                          : undefined
                      }
                      rowKey={`SALE_UNIT:${targetId}`}
                      target="SALE_UNIT"
                      targetId={targetId}
                    />
                  );
                }
              : undefined
          }
          renderVariantPriceListFields={
            features.canUseCatalogPriceLists
              ? ({ row }) => {
                  const targetId = `draft-variant:${row.key}`;

                  return (
                    <ProductPriceListInlineFields
                      disabled={isBusy || isCropperOpen}
                      drafts={priceListPriceDrafts}
                      onEdited={markPriceListPriceDraftsEdited}
                      onChange={setPriceListPriceDrafts}
                      priceFormatMode={priceFormatMode}
                      rowKey={`VARIANT:${targetId}`}
                      target="VARIANT"
                      targetId={targetId}
                    />
                  );
                }
              : undefined
          }
          modifiersSection={
            features.canEditProductModifiers ? (
              <ProductModifierBindingsField
                disabled={isBusy || isCropperOpen}
                drafts={modifierDrafts}
                onChange={setModifierDrafts}
                onReadyChange={setAreModifierDraftsReady}
                product={product}
              />
            ) : undefined
          }
          saleUnitsSettingsAction={
            features.canUseCatalogSaleUnits ? (
              <EditCatalogSaleUnitsDrawer
                disabled={isBusy || isCropperOpen}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 border-muted-foreground/55 bg-transparent px-2.5 text-muted-foreground shadow-none hover:border-muted-foreground hover:bg-muted/30 hover:text-muted-foreground"
                    disabled={isBusy || isCropperOpen}
                    title="Добавить/изменить единицы продажи"
                  >
                    <Settings className="size-4" />
                    Добавить/изменить ед.
                  </Button>
                }
              />
            ) : undefined
          }
          showImagesSection
          productAttributes={productAttributes}
          variantAttributes={variantAttributes}
          onSubmit={handleSubmit}
          onFilesChange={handleFilesChange}
          onToggleReorderMode={handleToggleReorderMode}
          onSelectFileForSwap={handleSelectItemForSwap}
          onEditFile={handleEditItem}
          onRemoveFile={removeItem}
          onCropperOpenChange={handleCropperOpenChange}
          onCropApply={handleCropApply}
        />
      )}
    </AppDrawer>
  );
};
