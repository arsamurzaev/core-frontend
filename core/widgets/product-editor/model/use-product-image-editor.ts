"use client";

import {
  IDLE_PRODUCT_IMAGE_UPLOAD_STATE,
  MAX_PRODUCT_IMAGES,
  clampNumber,
  getProductImageCropperCopy,
} from "@/core/widgets/product-editor/model/product-image-editor-shared";
import { useFilePreviewEntries } from "@/core/widgets/product-editor/model/use-file-preview-entries";
import { useProductImageReorderState } from "@/core/widgets/product-editor/model/use-product-image-reorder-state";
import {
  type FilePreviewEntry,
  type UploadState,
} from "@/core/widgets/product-editor/model/types";
import React from "react";

export interface UseProductImageEditorParams {
  isSubmitting: boolean;
}

export interface UseProductImageEditorResult {
  cropperApplyLabel: string;
  cropperDescription: string;
  cropperFiles: File[];
  cropperInitialIndex: number;
  cropperMode: "required-sequential" | "optional";
  cropperTitle: string;
  filePreviewByFile: Map<File, FilePreviewEntry>;
  files: File[];
  handleCropApply: (nextFiles: File[]) => void;
  handleCropperOpenChange: (nextOpen: boolean) => void;
  handleEditFile: (index: number) => void;
  handleFilesChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectFileForSwap: (index: number) => void;
  handleToggleReorderMode: () => void;
  isCropperOpen: boolean;
  isInitialCropRequired: boolean;
  isReorderMode: boolean;
  openRequiredCropper: () => void;
  pendingAddedFilesCount: number;
  pendingSwapIndex: number | null;
  removeFile: (index: number) => void;
  resetState: () => void;
  setUploadState: React.Dispatch<React.SetStateAction<UploadState>>;
  setUploadedMediaIds: React.Dispatch<React.SetStateAction<string[]>>;
  uploadState: UploadState;
  uploadedMediaIds: string[];
}

export function useProductImageEditor({
  isSubmitting,
}: UseProductImageEditorParams): UseProductImageEditorResult {
  const [isCropperOpen, setIsCropperOpen] = React.useState(false);
  const [cropperInitialIndex, setCropperInitialIndex] = React.useState(0);
  const [cropperEditIndex, setCropperEditIndex] = React.useState<number | null>(
    null,
  );
  const [pendingAddedFiles, setPendingAddedFiles] = React.useState<File[]>([]);
  const [isInitialCropRequired, setIsInitialCropRequired] =
    React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadedMediaIds, setUploadedMediaIds] = React.useState<string[]>([]);
  const [uploadState, setUploadState] = React.useState<UploadState>(
    IDLE_PRODUCT_IMAGE_UPLOAD_STATE,
  );

  const filePreviewEntries = useFilePreviewEntries(files);
  const filePreviewByFile = React.useMemo(
    () => new Map(filePreviewEntries.map((entry) => [entry.file, entry] as const)),
    [filePreviewEntries],
  );

  const resetUploadProgressForFileChanges = React.useCallback(() => {
    setUploadedMediaIds((current) => (current.length === 0 ? current : []));
    setUploadState((current) =>
      current.phase === "idle" &&
      current.progress === 0 &&
      current.message === ""
        ? current
        : IDLE_PRODUCT_IMAGE_UPLOAD_STATE,
    );
  }, []);

  const swapFilesByIndexes = React.useCallback(
    (leftIndex: number, rightIndex: number) => {
      if (leftIndex === rightIndex) {
        return;
      }

      setFiles((current) => {
        if (
          leftIndex < 0 ||
          rightIndex < 0 ||
          leftIndex >= current.length ||
          rightIndex >= current.length
        ) {
          return current;
        }

        const nextFiles = [...current];
        [nextFiles[leftIndex], nextFiles[rightIndex]] = [
          nextFiles[rightIndex],
          nextFiles[leftIndex],
        ];
        return nextFiles;
      });
      resetUploadProgressForFileChanges();
    },
    [resetUploadProgressForFileChanges],
  );

  const {
    clearPendingSwapSelection,
    exitReorderMode,
    handleSelectItemForSwap,
    handleToggleReorderMode,
    isReorderMode,
    pendingSwapIndex,
  } = useProductImageReorderState({
    isCropperOpen,
    isInitialCropRequired,
    isSubmitting,
    itemCount: files.length,
    onSwap: swapFilesByIndexes,
  });

  const cropperFiles = React.useMemo(() => {
    if (cropperEditIndex !== null) {
      const targetFile = files[cropperEditIndex];
      return targetFile ? [targetFile] : [];
    }

    if (isInitialCropRequired) {
      return pendingAddedFiles;
    }

    return files;
  }, [cropperEditIndex, files, isInitialCropRequired, pendingAddedFiles]);

  const cropperCopy = React.useMemo(
    () =>
      getProductImageCropperCopy({
        isEditingSingle: cropperEditIndex !== null,
        isInitialCropRequired,
      }),
    [cropperEditIndex, isInitialCropRequired],
  );

  React.useEffect(() => {
    if (files.length === 0 && pendingAddedFiles.length === 0) {
      setIsInitialCropRequired(false);
    }
  }, [files.length, pendingAddedFiles.length]);

  React.useEffect(() => {
    if (cropperEditIndex === null) {
      return;
    }

    if (cropperEditIndex < 0 || cropperEditIndex >= files.length) {
      setCropperEditIndex(null);
    }
  }, [cropperEditIndex, files.length]);

  const resetState = React.useCallback(() => {
    setIsCropperOpen(false);
    setCropperInitialIndex(0);
    setCropperEditIndex(null);
    setPendingAddedFiles([]);
    setIsInitialCropRequired(false);
    setFiles([]);
    exitReorderMode();
    resetUploadProgressForFileChanges();
  }, [exitReorderMode, resetUploadProgressForFileChanges]);

  const handleFilesChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const remainingSlots = Math.max(0, MAX_PRODUCT_IMAGES - files.length);
      const selectedFiles = Array.from(event.target.files ?? []).slice(
        0,
        remainingSlots,
      );

      if (selectedFiles.length === 0) {
        event.target.value = "";
        return;
      }

      setPendingAddedFiles(selectedFiles);
      setCropperInitialIndex(0);
      setCropperEditIndex(null);
      setIsInitialCropRequired(true);
      exitReorderMode();
      setIsCropperOpen(true);
      resetUploadProgressForFileChanges();
      event.target.value = "";
    },
    [exitReorderMode, files.length, resetUploadProgressForFileChanges],
  );

  const removeFile = React.useCallback(
    (index: number) => {
      const nextFiles = files.filter((_, itemIndex) => itemIndex !== index);
      setFiles(nextFiles);

      if (nextFiles.length === 0) {
        setIsCropperOpen(false);
        setCropperInitialIndex(0);
        if (pendingAddedFiles.length === 0) {
          setIsInitialCropRequired(false);
        }
      } else {
        setCropperInitialIndex((current) =>
          clampNumber(current, 0, Math.max(nextFiles.length - 1, 0)),
        );
      }

      if (cropperEditIndex !== null) {
        if (index === cropperEditIndex) {
          setCropperEditIndex(null);
        } else if (index < cropperEditIndex) {
          setCropperEditIndex(cropperEditIndex - 1);
        }
      }

      clearPendingSwapSelection();
      resetUploadProgressForFileChanges();
    },
    [
      clearPendingSwapSelection,
      cropperEditIndex,
      files,
      pendingAddedFiles.length,
      resetUploadProgressForFileChanges,
    ],
  );

  const handleEditFile = React.useCallback(
    (index: number) => {
      if (isSubmitting || isCropperOpen) {
        return;
      }

      clearPendingSwapSelection();

      if (isInitialCropRequired) {
        setCropperEditIndex(null);
        setCropperInitialIndex(0);
        setIsCropperOpen(true);
        return;
      }

      setCropperEditIndex(index);
      setCropperInitialIndex(0);
      setIsCropperOpen(true);
    },
    [clearPendingSwapSelection, isCropperOpen, isInitialCropRequired, isSubmitting],
  );

  const handleCropApply = React.useCallback(
    (nextFiles: File[]) => {
      if (cropperEditIndex !== null) {
        const editedFile = nextFiles[0];
        if (editedFile) {
          setFiles((current) => {
            if (cropperEditIndex < 0 || cropperEditIndex >= current.length) {
              return current;
            }

            const nextValues = [...current];
            nextValues[cropperEditIndex] = editedFile;
            return nextValues;
          });
        }

        setCropperEditIndex(null);
        clearPendingSwapSelection();
        resetUploadProgressForFileChanges();
        setIsCropperOpen(false);
        return;
      }

      setFiles((current) => [...current, ...nextFiles]);
      setCropperInitialIndex(0);
      setIsInitialCropRequired(false);
      setCropperEditIndex(null);
      setPendingAddedFiles([]);
      clearPendingSwapSelection();
      resetUploadProgressForFileChanges();
      setIsCropperOpen(false);
    },
    [clearPendingSwapSelection, cropperEditIndex, resetUploadProgressForFileChanges],
  );

  const handleCropperOpenChange = React.useCallback((nextOpen: boolean) => {
    setIsCropperOpen(nextOpen);
    if (!nextOpen) {
      setCropperEditIndex(null);
    }
  }, []);

  const openRequiredCropper = React.useCallback(() => {
    setCropperEditIndex(null);
    setCropperInitialIndex(0);
    setIsCropperOpen(true);
  }, []);

  return {
    cropperApplyLabel: cropperCopy.applyLabel,
    cropperDescription: cropperCopy.description,
    cropperFiles,
    cropperInitialIndex,
    cropperMode: cropperCopy.mode,
    cropperTitle: cropperCopy.title,
    filePreviewByFile,
    files,
    handleCropApply,
    handleCropperOpenChange,
    handleEditFile,
    handleFilesChange,
    handleSelectFileForSwap: handleSelectItemForSwap,
    handleToggleReorderMode,
    isCropperOpen,
    isInitialCropRequired,
    isReorderMode,
    openRequiredCropper,
    pendingAddedFilesCount: pendingAddedFiles.length,
    pendingSwapIndex,
    removeFile,
    resetState,
    setUploadState,
    setUploadedMediaIds,
    uploadState,
    uploadedMediaIds,
  };
}
