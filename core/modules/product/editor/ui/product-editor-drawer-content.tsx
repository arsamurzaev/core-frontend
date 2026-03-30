"use client";

import {
  CREATE_PRODUCT_FIELD_GROUP_PROPS,
  CREATE_PRODUCT_FIELDSET_PROPS,
  CREATE_PRODUCT_FORM_LAYOUT,
  type CreateProductFormValues,
  PRODUCT_IMAGE_ASPECT_RATIO,
} from "@/core/modules/product/editor/model/form-config";
import { type UploadState } from "@/core/modules/product/editor/model/types";
import {
  ProductImagesSection,
  type ProductImageSectionItem,
} from "@/core/modules/product/editor/ui/product-images-section";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import {
  DynamicForm,
  type DynamicFieldConfig,
} from "@/shared/ui/dynamic-form";
import { ImageCropperDrawer } from "@/shared/ui/image-cropper-drawer";
import { RefreshCcw } from "lucide-react";
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
  pendingSwapIndex: number | null;
  showImagesSection?: boolean;
  submitLabel: string;
  title: string;
  trailingTitleNode?: React.ReactNode;
  uploadState: UploadState;
  uploadedMediaIds: string[];
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
  pendingSwapIndex,
  showImagesSection = true,
  submitLabel,
  title,
  trailingTitleNode,
  uploadState,
  uploadedMediaIds,
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

  const defaultImageItems = React.useMemo<ProductImageSectionItem[]>(
    () =>
      files.flatMap((file) => {
        const previewEntry = filePreviewByFile.get(file);
        if (!previewEntry) {
          return [];
        }

        return [
          {
            key: previewEntry.key,
            label: file.name,
            previewUrl: previewEntry.previewUrl,
          },
        ];
      }),
    [filePreviewByFile, files],
  );

  const resolvedImagesSection = React.useMemo(() => {
    if (imagesSection) {
      return imagesSection;
    }

    return (
      <ProductImagesSection
        items={defaultImageItems}
        isSubmitting={resolvedIsBusy}
        isCropperOpen={isCropperOpen}
        isReorderMode={isReorderMode}
        isInitialCropRequired={isInitialCropRequired}
        pendingSwapIndex={pendingSwapIndex}
        uploadState={uploadState}
        uploadedMediaIds={uploadedMediaIds}
        onFilesChange={onFilesChange}
        onToggleReorderMode={onToggleReorderMode}
        onSelectFileForSwap={onSelectFileForSwap}
        onEditFile={onEditFile}
        onRemoveFile={onRemoveFile}
      />
    );
  }, [
    defaultImageItems,
    imagesSection,
    isCropperOpen,
    isInitialCropRequired,
    isReorderMode,
    onEditFile,
    onFilesChange,
    onRemoveFile,
    onSelectFileForSwap,
    onToggleReorderMode,
    pendingSwapIndex,
    resolvedIsBusy,
    uploadState,
    uploadedMediaIds,
  ]);

  const defaultTrailingNode = React.useMemo(() => {
    if (!onReset) {
      return undefined;
    }

    return (
      <button
        type="button"
        onClick={onReset}
        disabled={resolvedIsBusy || isCropperOpen}
        className="rounded p-1 transition-colors hover:bg-gray-100 disabled:opacity-50"
        title="Очистить форму"
      >
        <RefreshCcw className="size-5" />
      </button>
    );
  }, [isCropperOpen, onReset, resolvedIsBusy]);

  return (
    <>
      <AppDrawer.Content className={contentClassName}>
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title={title}
            trailingTitleNode={trailingTitleNode ?? defaultTrailingNode}
            withCloseButton={!resolvedIsBusy}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-6">
              <section className="space-y-3">
                <DynamicForm
                  form={form}
                  fields={formFields}
                  onSubmit={() => undefined}
                  disabled={resolvedIsBusy}
                  className="space-y-0"
                  layout={CREATE_PRODUCT_FORM_LAYOUT}
                  fieldSetProps={CREATE_PRODUCT_FIELDSET_PROPS}
                  fieldGroupProps={CREATE_PRODUCT_FIELD_GROUP_PROPS}
                />
              </section>

              {showImagesSection ? (
                <>
                  <hr className="-mx-5" />

                  {resolvedImagesSection}
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
            isFooterBtnDisabled={isCropperOpen || resolvedIsBusy}
            btnText={submitLabel}
            handleClick={() => void onSubmit()}
          />
        </div>
      </AppDrawer.Content>

      {showImagesSection ? (
        <ImageCropperDrawer
          open={isCropperOpen}
          onOpenChange={onCropperOpenChange}
          files={cropperFiles}
          initialIndex={cropperInitialIndex}
          mode={cropperMode}
          onApply={onCropApply}
          aspectRatio={PRODUCT_IMAGE_ASPECT_RATIO}
          title={cropperTitle}
          description={cropperDescription}
          applyLabel={cropperApplyLabel}
          outputOptions={{
            maxHeight: 2400,
            quality: 0.92,
            mimeType: "image/jpeg",
            fileNameSuffix: "product",
          }}
        />
      ) : null}
    </>
  );
};
