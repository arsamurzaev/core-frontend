"use client";

import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { type UploadState } from "@/core/modules/product/editor/model/types";
import { useProductEditorFormState } from "@/core/modules/product/editor/model/use-product-editor-form-state";
import { ProductEditorCropper } from "@/core/modules/product/editor/ui/product-editor-cropper";
import { ProductEditorImagesPanel } from "@/core/modules/product/editor/ui/product-editor-images-panel";
import { ProductEditorMainSection } from "@/core/modules/product/editor/ui/product-editor-main-section";
import { ProductEditorResetAction } from "@/core/modules/product/editor/ui/product-editor-reset-action";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { type DynamicFieldConfig } from "@/shared/ui/dynamic-form";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

export interface ProductEditorDrawerContentProps {
  contentClassName?: string;
  cropperApplyLabel: string;
  cropperDescription: string;
  cropperFiles: File[];
  cropperInitialIndex: number;
  cropperMode: "required-sequential" | "optional";
  cropperTitle: string;
  errorMessage: string | null;
  filePreviewByFile: Map<File, { file: File; key: string; previewUrl: string }>;
  files: File[];
  form: UseFormReturn<CreateProductFormValues>;
  formFields: DynamicFieldConfig<CreateProductFormValues>[];
  imagesSection?: React.ReactNode;
  isBusy?: boolean;
  isCropperOpen: boolean;
  isInitialCropRequired: boolean;
  isReorderMode: boolean;
  isSubmitting: boolean;
  isSubmitDisabled?: boolean;
  pendingSwapIndex: number | null;
  showImagesSection?: boolean;
  submitLabel: string;
  title: string;
  trailingTitleNode?: React.ReactNode;
  uploadState: UploadState;
  uploadedMediaIds: string[];
  productTypeChangeSection?: React.ReactNode;
  productAttributes?: AttributeDto[];
  variantAttributes?: AttributeDto[];
  canUseCatalogSaleUnits?: boolean;
  canUseProductVariants?: boolean;
  onCropApply: (files: File[]) => void;
  onCropperOpenChange: (open: boolean) => void;
  onEditFile: (index: number) => void;
  onFilesChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onReset?: () => void;
  onSelectFileForSwap: (index: number) => void;
  onSubmit: () => void;
  onToggleReorderMode: () => void;
}

export const ProductEditorDrawerContent: React.FC<
  ProductEditorDrawerContentProps
> = ({
  contentClassName,
  cropperApplyLabel,
  cropperDescription,
  cropperFiles,
  cropperInitialIndex,
  cropperMode,
  cropperTitle,
  errorMessage,
  filePreviewByFile,
  files,
  form,
  formFields,
  imagesSection,
  isBusy,
  isCropperOpen,
  isInitialCropRequired,
  isReorderMode,
  isSubmitting,
  isSubmitDisabled,
  pendingSwapIndex,
  showImagesSection = true,
  submitLabel,
  title,
  trailingTitleNode,
  uploadState,
  uploadedMediaIds,
  productTypeChangeSection,
  productAttributes,
  variantAttributes,
  canUseCatalogSaleUnits = false,
  canUseProductVariants = false,
  onCropApply,
  onCropperOpenChange,
  onEditFile,
  onFilesChange,
  onRemoveFile,
  onReset,
  onSelectFileForSwap,
  onSubmit,
  onToggleReorderMode,
}) => {
  const resolvedIsBusy = isBusy ?? isSubmitting;
  const {
    discountPercent,
    hasVariantAttributes,
    priceFallback,
    saleUnits,
  } = useProductEditorFormState({
    canUseProductVariants,
    form,
    productAttributes,
    variantAttributes,
  });

  const resolvedTrailingTitleNode =
    trailingTitleNode ??
    (onReset ? (
      <ProductEditorResetAction
        disabled={resolvedIsBusy || isCropperOpen}
        onReset={onReset}
      />
    ) : undefined);

  return (
    <>
      <AppDrawer.Content className={contentClassName}>
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title={title}
            trailingTitleNode={resolvedTrailingTitleNode}
            withCloseButton={!resolvedIsBusy}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-6">
              <ProductEditorMainSection
                canUseCatalogSaleUnits={canUseCatalogSaleUnits}
                disabled={resolvedIsBusy}
                discountPercent={discountPercent}
                form={form}
                formFields={formFields}
                hasVariantAttributes={hasVariantAttributes}
                priceFallback={priceFallback}
                productTypeChangeSection={productTypeChangeSection}
                saleUnits={saleUnits}
                variantAttributes={variantAttributes}
              />

              {showImagesSection ? (
                <>
                  <hr className="-mx-5" />

                  <ProductEditorImagesPanel
                    filePreviewByFile={filePreviewByFile}
                    files={files}
                    imagesSection={imagesSection}
                    isBusy={resolvedIsBusy}
                    isCropperOpen={isCropperOpen}
                    isInitialCropRequired={isInitialCropRequired}
                    isReorderMode={isReorderMode}
                    pendingSwapIndex={pendingSwapIndex}
                    uploadState={uploadState}
                    uploadedMediaIds={uploadedMediaIds}
                    onFilesChange={onFilesChange}
                    onToggleReorderMode={onToggleReorderMode}
                    onSelectFileForSwap={onSelectFileForSwap}
                    onEditFile={onEditFile}
                    onRemoveFile={onRemoveFile}
                  />
                </>
              ) : null}

              {errorMessage ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            isAutoClose={false}
            loading={isSubmitting}
            isFooterBtnDisabled={
              isCropperOpen || resolvedIsBusy || Boolean(isSubmitDisabled)
            }
            btnText={submitLabel}
            handleClick={() => void onSubmit()}
          />
        </div>
      </AppDrawer.Content>

      {showImagesSection ? (
        <ProductEditorCropper
          open={isCropperOpen}
          onOpenChange={onCropperOpenChange}
          files={cropperFiles}
          initialIndex={cropperInitialIndex}
          mode={cropperMode}
          onApply={onCropApply}
          title={cropperTitle}
          description={cropperDescription}
          applyLabel={cropperApplyLabel}
        />
      ) : null}
    </>
  );
};
