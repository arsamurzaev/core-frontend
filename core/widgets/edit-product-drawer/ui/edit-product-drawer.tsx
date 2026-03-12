"use client";

import { useEditProductDrawer } from "@/core/widgets/edit-product-drawer/model/use-edit-product-drawer";
import { ProductEditorDrawerContent } from "@/core/widgets/product-editor/ui/product-editor-drawer-content";
import { ProductImagesSection } from "@/core/widgets/product-editor/ui/product-images-section";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Loader2 } from "lucide-react";
import React from "react";

interface EditProductDrawerProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProductDrawer: React.FC<EditProductDrawerProps> = ({
  productId,
  open,
  onOpenChange,
}) => {
  const {
    cropperApplyLabel,
    cropperDescription,
    cropperFiles,
    cropperInitialIndex,
    cropperMode,
    cropperTitle,
    errorMessage,
    form,
    formFields,
    handleCropApply,
    handleCropperOpenChange,
    handleEditItem,
    handleFilesChange,
    handleOpenChange,
    handleReset,
    handleSelectItemForSwap,
    handleSubmit,
    handleToggleReorderMode,
    imageItems,
    isCropperOpen,
    isInitialCropRequired,
    isReorderMode,
    isLoadingProduct,
    isSubmitting,
    pendingSwapIndex,
    product,
    removeItem,
    uploadState,
    uploadedMediaIds,
  } = useEditProductDrawer(productId);

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
      open={open}
      onOpenChange={handleDrawerOpenChange}
      dismissible={!isSubmitting}
    >
      {isLoadingProduct || !product ? (
        <AppDrawer.Content className="mx-auto w-full max-w-2xl">
          <div className="flex min-h-0 flex-1 flex-col">
            <AppDrawer.Header
              title="Редактор позиции"
              withCloseButton={!isSubmitting}
            />
            <hr />

            <DrawerScrollArea className="px-5 py-6">
              <div className="space-y-4">
                {isLoadingProduct ? (
                  <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
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
          contentClassName="mx-auto w-full max-w-2xl"
          title="Редактор позиции"
          submitLabel="Сохранить изменения"
          form={form}
          formFields={formFields}
          errorMessage={errorMessage}
          imagesSection={
            <ProductImagesSection
              items={imageItems}
              isSubmitting={isSubmitting}
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
          showImagesSection
          onReset={handleReset}
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
