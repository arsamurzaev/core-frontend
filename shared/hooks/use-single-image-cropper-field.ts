"use client";

import React from "react";

type UseSingleImageCropperFieldParams = {
  file?: File;
  disabled?: boolean;
  readOnly?: boolean;
  existingUrl?: string | null;
  fallbackSrc: string;
  onApplyFile: (file?: File) => void | Promise<void>;
};

export function useSingleImageCropperField({
  file,
  disabled = false,
  readOnly = false,
  existingUrl,
  fallbackSrc,
  onApplyFile,
}: UseSingleImageCropperFieldParams) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [cropperOpen, setCropperOpen] = React.useState(false);
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);

  const previewUrl = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const isDisabled = disabled || readOnly;
  const displaySrc = previewUrl ?? existingUrl ?? fallbackSrc;

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
      await onApplyFile(files[0] ?? undefined);
      setPendingFiles([]);
      setCropperOpen(false);
    },
    [onApplyFile],
  );

  const handleClearFile = React.useCallback(() => {
    void Promise.resolve(onApplyFile(undefined));
  }, [onApplyFile]);

  return {
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
  };
}
