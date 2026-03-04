"use client";

import {
  CREATE_PRODUCT_FIELD_GROUP_PROPS,
  CREATE_PRODUCT_FIELDSET_PROPS,
  CREATE_PRODUCT_FORM_LAYOUT,
  createProductFormSchema,
  PRODUCT_IMAGE_ASPECT_RATIO,
} from "@/core/widgets/create-product-drawer/model/form-config";
import { useCreateProductDrawer } from "@/core/widgets/create-product-drawer/model/use-create-product-drawer";
import { ProductImagesSection } from "@/core/widgets/create-product-drawer/ui/product-images-section";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { DynamicForm } from "@/shared/ui/dynamic-form";
import { ImageCropperDrawer } from "@/shared/ui/image-cropper-drawer";
import { RefreshCcw } from "lucide-react";
import React from "react";

interface CreateProductDrawerProps {
  className?: string;
}

export const CreateProductDrawer: React.FC<CreateProductDrawerProps> = ({
  className,
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
    form,
    formFields,
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
    isReorderMode,
    isSubmitting,
    open,
    pendingSwapIndex,
    removeFile,
    uploadState,
    uploadedMediaIds,
  } = useCreateProductDrawer();

  return (
    <AppDrawer
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isSubmitting}
      trigger={
        <Button className={cn("col-span-2", className)}>
          + Добавить позицию
        </Button>
      }
    >
      <AppDrawer.Content className="mx-auto w-full max-w-2xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Редактор позиции"
            trailingTitleNode={
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting || isCropperOpen}
                className="rounded p-1 transition-colors hover:bg-gray-100 disabled:opacity-50"
                title="Очистить форму"
              >
                <RefreshCcw className="size-5" />
              </button>
            }
            withCloseButton={!isSubmitting}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-6">
              <section className="space-y-3">
                <DynamicForm
                  schema={createProductFormSchema}
                  form={form}
                  fields={formFields}
                  onSubmit={() => undefined}
                  disabled={isSubmitting}
                  className="space-y-0"
                  layout={CREATE_PRODUCT_FORM_LAYOUT}
                  fieldSetProps={CREATE_PRODUCT_FIELDSET_PROPS}
                  fieldGroupProps={CREATE_PRODUCT_FIELD_GROUP_PROPS}
                />
              </section>

              <hr className="-mx-5" />

              <ProductImagesSection
                files={files}
                filePreviewByFile={filePreviewByFile}
                isSubmitting={isSubmitting}
                isCropperOpen={isCropperOpen}
                isReorderMode={isReorderMode}
                isInitialCropRequired={isInitialCropRequired}
                pendingSwapIndex={pendingSwapIndex}
                uploadState={uploadState}
                uploadedMediaIds={uploadedMediaIds}
                onFilesChange={handleFilesChange}
                onToggleReorderMode={handleToggleReorderMode}
                onSelectFileForSwap={handleSelectFileForSwap}
                onEditFile={handleEditFile}
                onRemoveFile={removeFile}
              />

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
            isFooterBtnDisabled={isCropperOpen}
            btnText="Сохранить изменения"
            handleClick={() => void handleSubmit()}
          />
        </div>
      </AppDrawer.Content>

      <ImageCropperDrawer
        open={isCropperOpen}
        onOpenChange={handleCropperOpenChange}
        files={cropperFiles}
        initialIndex={cropperInitialIndex}
        mode={cropperMode}
        onApply={handleCropApply}
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
    </AppDrawer>
  );
};

