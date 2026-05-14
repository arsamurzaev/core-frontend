"use client";

import { type UploadState } from "@/core/modules/product/editor/model/types";
import {
  ProductImagesSection,
  type ProductImageSectionItem,
} from "@/core/modules/product/editor/ui/product-images-section";
import React from "react";

interface ProductEditorImagesPanelProps {
  filePreviewByFile: Map<File, { file: File; key: string; previewUrl: string }>;
  files: File[];
  imagesSection?: React.ReactNode;
  isBusy?: boolean;
  isCropperOpen: boolean;
  isInitialCropRequired: boolean;
  isReorderMode: boolean;
  pendingSwapIndex: number | null;
  uploadState: UploadState;
  uploadedMediaIds: string[];
  onEditFile: (index: number) => void;
  onFilesChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onSelectFileForSwap: (index: number) => void;
  onToggleReorderMode: () => void;
}

export const ProductEditorImagesPanel: React.FC<
  ProductEditorImagesPanelProps
> = ({
  filePreviewByFile,
  files,
  imagesSection,
  isBusy,
  isCropperOpen,
  isInitialCropRequired,
  isReorderMode,
  pendingSwapIndex,
  uploadState,
  uploadedMediaIds,
  onEditFile,
  onFilesChange,
  onRemoveFile,
  onSelectFileForSwap,
  onToggleReorderMode,
}) => {
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

  if (imagesSection) {
    return <>{imagesSection}</>;
  }

  return (
    <ProductImagesSection
      items={defaultImageItems}
      isSubmitting={Boolean(isBusy)}
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
};
