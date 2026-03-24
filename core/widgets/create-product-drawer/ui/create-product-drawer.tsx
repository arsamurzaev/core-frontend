"use client";

import { useCreateProductDrawer } from "@/core/widgets/create-product-drawer/model/use-create-product-drawer";
import { ProductEditorDrawerContent } from "@/core/modules/product/editor/ui/product-editor-drawer-content";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
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
