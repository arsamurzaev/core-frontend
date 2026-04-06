"use client";

import { ProductEditorDrawerContent } from "@/core/modules/product/editor/ui";
import { useCreateProductDrawer } from "@/core/widgets/create-product-drawer/model/use-create-product-drawer";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import React from "react";

interface CreateProductDrawerProps {
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const CreateProductDrawer: React.FC<CreateProductDrawerProps> = ({
  className,
  open,
  onOpenChange,
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
    form,
    formFields,
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
      dismissible={!isSubmitting}
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
