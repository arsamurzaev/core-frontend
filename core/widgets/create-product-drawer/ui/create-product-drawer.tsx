"use client";

import { ProductEditorDrawerContent } from "@/core/modules/product/editor/ui";
import { useCreateProductDrawer } from "@/core/widgets/create-product-drawer/model/use-create-product-drawer";
import { EditCatalogSaleUnitsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-sale-units-drawer";
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
    open: drawerOpen,
    pendingSwapIndex,
    removeFile,
    uploadState,
    uploadedMediaIds,
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
    ) : trigger;

  return (
    <AppDrawer
      open={drawerOpen}
      onOpenChange={handleOpenChange}
      dismissible={!isSubmitting && !isProductTypeSchemaResolving}
      trigger={resolvedTrigger}
    >
      <ProductEditorDrawerContent
        contentClassName="mx-auto w-full max-w-2xl"
        title="Редактор позиции"
        submitLabel="Сохранить изменения"
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
        canUseCatalogSaleUnits={features.canUseCatalogSaleUnits}
        canUseProductVariants={features.canUseProductVariants}
        saleUnitsSettingsAction={
          features.canUseCatalogSaleUnits ? (
            <EditCatalogSaleUnitsDrawer
              disabled={isSubmitting || isProductTypeSchemaResolving}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 border-muted-foreground/55 bg-transparent px-2.5 text-muted-foreground shadow-none hover:border-muted-foreground hover:bg-muted/30 hover:text-muted-foreground"
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
