"use client";
/* eslint-disable @next/next/no-img-element */

import { useSingleImageCropperField } from "@/shared/hooks/use-single-image-cropper-field";
import { AspectRatio } from "@/shared/ui/aspect-ratio";
import { Button } from "@/shared/ui/button";
import { ImageCropperDrawer } from "@/shared/ui/image-cropper-drawer";
import { Trash2 } from "lucide-react";
import React from "react";

type CreateProductCategoryImageFieldProps = {
  file?: File;
  existingUrl?: string | null;
  disabled?: boolean;
  readOnly?: boolean;
  onChange: (file?: File) => void;
};

const CATEGORY_IMAGE_ASPECT_RATIO = 2 / 1;

export const CreateProductCategoryImageField: React.FC<
  CreateProductCategoryImageFieldProps
> = ({
  file,
  existingUrl,
  disabled = false,
  readOnly = false,
  onChange,
}) => {
  const {
    cropperOpen,
    displaySrc,
    handleApply,
    handleClearFile,
    handleFileChange,
    handleOpenChange,
    handlePickFile,
    inputRef,
    isDisabled,
    pendingFiles,
  } = useSingleImageCropperField({
    file,
    disabled,
    readOnly,
    existingUrl,
    fallbackSrc: "/default-bg.png",
    onApplyFile: onChange,
  });

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <AspectRatio ratio={CATEGORY_IMAGE_ASPECT_RATIO} className="w-full">
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/20">
              <img
                alt=""
                src={displaySrc}
                className="h-full w-full object-contain"
              />
            </div>
          </AspectRatio>

          {file ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 rounded-full bg-background"
              onClick={handleClearFile}
              disabled={isDisabled}
              aria-label="Удалить выбранное изображение категории"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handlePickFile}
            disabled={isDisabled}
            className="text-sm font-medium underline underline-offset-2 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            Изменить фон категории
          </button>
          <p className="text-muted-foreground text-center text-xs font-light">
            соотношение 2:1
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isDisabled}
        />
      </div>

      <ImageCropperDrawer
        open={cropperOpen}
        onOpenChange={handleOpenChange}
        files={pendingFiles}
        onApply={handleApply}
        aspectRatio={CATEGORY_IMAGE_ASPECT_RATIO}
        title="Изменить задний фон категории"
        description="Подготовьте изображение категории в соотношении 2:1 перед сохранением."
        outputOptions={{
          maxWidth: 2400,
          quality: 0.92,
          mimeType: "image/jpeg",
          fileNameSuffix: "category",
        }}
      />
    </>
  );
};
