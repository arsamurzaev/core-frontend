"use client";

import { useEditProductDrawer } from "@/core/widgets/edit-product-drawer/model/use-edit-product-drawer";
import {
  ProductEditorDrawerContent,
  ProductImagesSection,
} from "@/core/modules/product/editor/ui";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Loader2, Trash2 } from "lucide-react";
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
    variantAttributes,
    handleCropApply,
    handleCropperOpenChange,
    handleDelete,
    handleEditItem,
    handleFilesChange,
    handleOpenChange,
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
    open: drawerOpen,
    pendingSwapIndex,
    product,
    removeItem,
    uploadState,
    uploadedMediaIds,
  } = useEditProductDrawer(productId, onOpenChange);

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
            <button
              type="button"
              onClick={handleDelete}
              disabled={isBusy || isCropperOpen}
              className="rounded p-1 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              title="Удалить товар"
            >
              <Trash2 className="size-5" />
            </button>
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
          showImagesSection
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
