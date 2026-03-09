"use client";
/* eslint-disable @next/next/no-img-element */

import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { AspectRatio } from "@/shared/ui/aspect-ratio";
import { ImageCropperDrawer } from "@/shared/ui/image-cropper-drawer";
import React from "react";
import { type ControllerRenderProps } from "react-hook-form";

type CatalogEditMediaFieldProps = {
  field: ControllerRenderProps<CatalogEditFormValues, "logoFile" | "bgFile">;
  disabled?: boolean;
  readOnly?: boolean;
  shape: "circle" | "wide";
  existingUrl?: string | null;
  fallbackSrc: string;
  aspectRatio: number;
  cropperTitle: string;
  cropperDescription: string;
  triggerText: string;
  caption?: string;
  outputOptions?: React.ComponentProps<typeof ImageCropperDrawer>["outputOptions"];
};

export const CatalogEditMediaField: React.FC<CatalogEditMediaFieldProps> = ({
  field,
  disabled = false,
  readOnly = false,
  shape,
  existingUrl,
  fallbackSrc,
  aspectRatio,
  cropperTitle,
  cropperDescription,
  triggerText,
  caption,
  outputOptions,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [cropperOpen, setCropperOpen] = React.useState(false);
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);

  const selectedFile = field.value instanceof File ? field.value : null;
  const selectedPreviewUrl = React.useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  React.useEffect(() => {
    return () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl);
      }
    };
  }, [selectedPreviewUrl]);

  const displaySrc = selectedPreviewUrl ?? existingUrl ?? fallbackSrc;
  const isDisabled = disabled || readOnly;

  const handlePickFile = React.useCallback(() => {
    if (isDisabled) {
      return;
    }

    inputRef.current?.click();
  }, [isDisabled]);

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0];
      event.currentTarget.value = "";

      if (!nextFile) {
        return;
      }

      setPendingFiles([nextFile]);
      setCropperOpen(true);
    },
    [],
  );

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setCropperOpen(nextOpen);
    if (!nextOpen) {
      setPendingFiles([]);
    }
  }, []);

  const handleApply = React.useCallback(
    async (files: File[]) => {
      field.onChange(files[0] ?? undefined);
      field.onBlur();
      setPendingFiles([]);
      setCropperOpen(false);
    },
    [field],
  );

  return (
    <>
      <div className="flex w-full flex-col items-center gap-4">
        {shape === "circle" ? (
          <div className="h-[90px] w-[90px] rounded-full bg-white shadow-[0_0_6px_0] shadow-black/50">
            <img
              alt=""
              src={displaySrc}
              className="h-full w-full rounded-full object-contain"
            />
          </div>
        ) : (
          <AspectRatio ratio={aspectRatio} className="w-full">
            <div className="relative flex h-full w-full items-center justify-center">
              <img
                alt=""
                src={displaySrc}
                className="h-full w-full object-contain"
              />
            </div>
          </AspectRatio>
        )}

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handlePickFile}
            disabled={isDisabled}
            className="text-sm font-medium underline underline-offset-2 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            {triggerText}
            <span className="text-destructive">*</span>
          </button>
          {caption ? (
            <p className="text-muted-foreground text-center text-xs font-light">
              {caption}
            </p>
          ) : null}
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
        aspectRatio={aspectRatio}
        title={cropperTitle}
        description={cropperDescription}
        outputOptions={outputOptions}
      />
    </>
  );
};
