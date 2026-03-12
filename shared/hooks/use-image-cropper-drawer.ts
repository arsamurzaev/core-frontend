"use client";

import React from "react";
import type { CropperRef } from "react-advanced-cropper";
import { toast } from "sonner";

import {
  buildCropperDrawOptions,
  buildCropperInitialCoordinates,
  createAutoCenteredCropFile,
  createCropperResultFile,
  createCropperSourceItems,
  revokeCropperPreviewUrls,
  revokeCropperSourceItems,
  resolveCropperApplyButtonLabel,
  resolveCropperOutputOptions,
  resolveInitialCropperIndex,
  type CropperDraft,
  type CropperInitialCoordinatesInput,
  type CropperOutputOptions,
  type CropperSessionMode,
  type CropperSourceItem,
} from "@/shared/lib/image-cropper";

type UseImageCropperDrawerParams = {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  files: File[];
  initialIndex: number;
  mode: CropperSessionMode;
  onApply: (files: File[]) => void | Promise<void>;
  aspectRatio: number;
  applyLabel: string;
  outputOptions?: CropperOutputOptions;
};

export function useImageCropperDrawer({
  open,
  onOpenChange,
  files,
  initialIndex,
  mode,
  onApply,
  aspectRatio,
  applyLabel,
  outputOptions,
}: UseImageCropperDrawerParams) {
  const cropperRef = React.useRef<CropperRef | null>(null);
  const draftsRef = React.useRef<Record<string, CropperDraft>>({});
  const editedFilesRef = React.useRef<Record<string, File>>({});
  const previewUrlsRef = React.useRef<Record<string, string>>({});

  const [sourceItems, setSourceItems] = React.useState<CropperSourceItem[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [previewById, setPreviewById] = React.useState<Record<string, string>>(
    {},
  );
  const [isApplying, setIsApplying] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [cropperRevision, setCropperRevision] = React.useState(0);

  const isRequiredSequential = mode === "required-sequential";
  const resolvedOutputOptions = React.useMemo(
    () => resolveCropperOutputOptions(outputOptions),
    [outputOptions],
  );

  const clearEditedResults = React.useCallback(() => {
    editedFilesRef.current = {};
    draftsRef.current = {};
    setPreviewById((prev) => {
      revokeCropperPreviewUrls(prev);
      return {};
    });
  }, []);

  React.useEffect(() => {
    previewUrlsRef.current = previewById;
  }, [previewById]);

  React.useEffect(
    () => () => {
      revokeCropperPreviewUrls(previewUrlsRef.current);
    },
    [],
  );

  React.useEffect(() => {
    clearEditedResults();
    setErrorMessage(null);
    setActiveIndex(resolveInitialCropperIndex(initialIndex, files.length));
    setCropperRevision(0);
  }, [clearEditedResults, files, initialIndex]);

  React.useEffect(() => {
    const items = createCropperSourceItems(files);
    setSourceItems(items);

    return () => {
      revokeCropperSourceItems(items);
    };
  }, [files]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setActiveIndex(resolveInitialCropperIndex(initialIndex, sourceItems.length));
    setCropperRevision(0);
  }, [initialIndex, open, sourceItems.length]);

  React.useEffect(() => {
    if (sourceItems.length === 0) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex >= sourceItems.length) {
      setActiveIndex(sourceItems.length - 1);
    }
  }, [activeIndex, sourceItems.length]);

  const activeItem = sourceItems[activeIndex] ?? null;
  const activeDraft = activeItem ? draftsRef.current[activeItem.id] : undefined;
  const cropperKey = activeItem
    ? `${activeItem.id}-${cropperRevision}`
    : "cropper-empty";

  const buildInitialCoordinates = React.useCallback(
    (input: CropperInitialCoordinatesInput) =>
      buildCropperInitialCoordinates(input, aspectRatio),
    [aspectRatio],
  );

  const setEditedPreview = React.useCallback((itemId: string, file: File) => {
    editedFilesRef.current[itemId] = file;

    const previewUrl = URL.createObjectURL(file);
    setPreviewById((prev) => {
      if (prev[itemId]) {
        URL.revokeObjectURL(prev[itemId]);
      }

      return {
        ...prev,
        [itemId]: previewUrl,
      };
    });
  }, []);

  const applyCurrentCrop = React.useCallback(async (): Promise<File | null> => {
    if (!activeItem) {
      return null;
    }

    const cropper = cropperRef.current;
    if (!cropper) {
      return null;
    }

    const canvas = cropper.getCanvas(buildCropperDrawOptions(resolvedOutputOptions));
    if (!canvas) {
      throw new Error("Кроппер еще не готов. Попробуйте снова через секунду.");
    }

    const file = await createCropperResultFile(
      canvas,
      activeItem.file,
      resolvedOutputOptions,
    );
    setEditedPreview(activeItem.id, file);
    return file;
  }, [activeItem, resolvedOutputOptions, setEditedPreview]);

  const handleCropperUpdate = React.useCallback(
    (cropper: CropperRef) => {
      if (!activeItem) {
        return;
      }

      draftsRef.current[activeItem.id] = {
        coordinates: cropper.getCoordinates(),
        transforms: cropper.getTransforms(),
      };
    },
    [activeItem],
  );

  const handleSelectItem = React.useCallback(
    async (index: number) => {
      if (isRequiredSequential || index === activeIndex || isApplying || isSwitching) {
        return;
      }

      setIsSwitching(true);
      setErrorMessage(null);

      try {
        await applyCurrentCrop();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Не удалось сохранить текущую обрезку перед переключением.",
        );
      } finally {
        setActiveIndex(index);
        setCropperRevision(0);
        setIsSwitching(false);
      }
    },
    [activeIndex, applyCurrentCrop, isApplying, isRequiredSequential, isSwitching],
  );

  const handleResetCurrent = React.useCallback(() => {
    if (!activeItem || isApplying || isSwitching) {
      return;
    }

    delete draftsRef.current[activeItem.id];
    delete editedFilesRef.current[activeItem.id];

    setPreviewById((prev) => {
      if (!prev[activeItem.id]) {
        return prev;
      }

      URL.revokeObjectURL(prev[activeItem.id]);

      const next = { ...prev };
      delete next[activeItem.id];
      return next;
    });

    setCropperRevision((value) => value + 1);
    setErrorMessage(null);
  }, [activeItem, isApplying, isSwitching]);

  const handleApply = React.useCallback(async () => {
    if (isApplying || sourceItems.length === 0) {
      return;
    }

    setIsApplying(true);
    setErrorMessage(null);

    try {
      if (isRequiredSequential) {
        const croppedCurrent = await applyCurrentCrop();
        if (!croppedCurrent || !activeItem) {
          throw new Error("Не удалось сохранить обрезку для текущего изображения.");
        }

        const isLastImage = activeIndex >= sourceItems.length - 1;
        if (!isLastImage) {
          setActiveIndex(activeIndex + 1);
          setCropperRevision(0);
          return;
        }

        const resultFiles = sourceItems.map((item, index) => {
          const edited = editedFilesRef.current[item.id];
          if (!edited) {
            throw new Error(`Сначала обрежьте изображение ${index + 1}.`);
          }

          return edited;
        });

        await onApply(resultFiles);
        onOpenChange(false);
        return;
      }

      await applyCurrentCrop();

      const resultFiles: File[] = [];
      for (const item of sourceItems) {
        const edited = editedFilesRef.current[item.id];
        if (edited) {
          resultFiles.push(edited);
          continue;
        }

        resultFiles.push(
          await createAutoCenteredCropFile(item, aspectRatio, resolvedOutputOptions),
        );
      }

      await onApply(resultFiles);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось применить обрезку изображений.";

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsApplying(false);
    }
  }, [
    activeIndex,
    activeItem,
    applyCurrentCrop,
    aspectRatio,
    isApplying,
    isRequiredSequential,
    onApply,
    onOpenChange,
    resolvedOutputOptions,
    sourceItems,
  ]);

  const applyButtonLabel = React.useMemo(
    () =>
      resolveCropperApplyButtonLabel({
        activeIndex,
        applyLabel,
        isRequiredSequential,
        totalItems: sourceItems.length,
      }),
    [activeIndex, applyLabel, isRequiredSequential, sourceItems.length],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && (isApplying || isSwitching)) {
        return;
      }

      onOpenChange(nextOpen);
    },
    [isApplying, isSwitching, onOpenChange],
  );

  return {
    activeDraft,
    activeIndex,
    activeItem,
    applyButtonLabel,
    buildInitialCoordinates,
    cropperKey,
    cropperRef,
    errorMessage,
    handleApply,
    handleCropperUpdate,
    handleOpenChange,
    handleResetCurrent,
    handleSelectItem,
    isApplying,
    isRequiredSequential,
    isSwitching,
    previewById,
    sourceItems,
  };
}
