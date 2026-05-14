"use client";

import { PRODUCT_IMAGE_ASPECT_RATIO } from "@/core/modules/product/editor/model/form-config";
import { ImageCropperDrawer } from "@/shared/ui/image-cropper-drawer";
import React from "react";

interface ProductEditorCropperProps {
  applyLabel: string;
  description: string;
  files: File[];
  initialIndex: number;
  mode: "required-sequential" | "optional";
  open: boolean;
  title: string;
  onApply: (files: File[]) => void;
  onOpenChange: (open: boolean) => void;
}

export const ProductEditorCropper: React.FC<ProductEditorCropperProps> = ({
  applyLabel,
  description,
  files,
  initialIndex,
  mode,
  open,
  title,
  onApply,
  onOpenChange,
}) => {
  return (
    <ImageCropperDrawer
      open={open}
      onOpenChange={onOpenChange}
      files={files}
      initialIndex={initialIndex}
      mode={mode}
      onApply={onApply}
      aspectRatio={PRODUCT_IMAGE_ASPECT_RATIO}
      title={title}
      description={description}
      applyLabel={applyLabel}
      outputOptions={{
        maxHeight: 2400,
        quality: 0.92,
        mimeType: "image/jpeg",
        fileNameSuffix: "product",
      }}
    />
  );
};
