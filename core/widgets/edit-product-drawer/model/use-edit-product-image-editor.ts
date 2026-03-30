"use client";

import {
  buildEditProductImageSectionItems,
  buildInitialEditProductImageItems,
  collectUploadedEditProductMediaIds,
  createLocalEditProductImageItem,
  fetchRemoteEditProductImageAsFile,
  resolveEditProductMediaIds,
  type EditProductImageItem,
} from "@/core/widgets/edit-product-drawer/model/edit-product-image-items";
import { uploadProductImages } from "@/core/modules/product/editor/lib/upload-product-images";
import {
  IDLE_PRODUCT_IMAGE_UPLOAD_STATE,
  MAX_PRODUCT_IMAGES,
  clampNumber,
  getProductImageCropperCopy,
} from "@/core/modules/product/editor/model/product-image-editor-shared";
import { type UploadState } from "@/core/modules/product/editor/model/types";
import { useFilePreviewEntries } from "@/core/modules/product/editor/model/use-file-preview-entries";
import { useProductImageReorderState } from "@/core/modules/product/editor/model/use-product-image-reorder-state";
import { type ProductMediaDto } from "@/shared/api/generated/react-query";
import React from "react";
import { toast } from "sonner";

export interface UseEditProductImageEditorParams {
  isSubmitting: boolean;
}

export function useEditProductImageEditor({
  isSubmitting,
}: UseEditProductImageEditorParams) {
  const [items, setItems] = React.useState<EditProductImageItem[]>([]);
  const [isCropperOpen, setIsCropperOpen] = React.useState(false);
  const [cropperInitialIndex, setCropperInitialIndex] = React.useState(0);
  const [cropperEditTargetId, setCropperEditTargetId] = React.useState<
    string | null
  >(null);
  const [pendingAddedFiles, setPendingAddedFiles] = React.useState<File[]>([]);
  const [isInitialCropRequired, setIsInitialCropRequired] =
    React.useState(false);
  const [uploadState, setUploadState] = React.useState<UploadState>(
    IDLE_PRODUCT_IMAGE_UPLOAD_STATE,
  );
  const idSequenceRef = React.useRef(0);

  const localFiles = React.useMemo(
    () => items.flatMap((item) => (item.kind === "local" ? [item.file] : [])),
    [items],
  );
  const localPreviewEntries = useFilePreviewEntries(localFiles);
  const localPreviewByFile = React.useMemo(
    () => new Map(localPreviewEntries.map((entry) => [entry.file, entry] as const)),
    [localPreviewEntries],
  );

  const imageItems = React.useMemo(
    () => buildEditProductImageSectionItems(items, localPreviewByFile),
    [items, localPreviewByFile],
  );

  const resetUploadProgress = React.useCallback(() => {
    setUploadState((current) =>
      current.phase === "idle" &&
      current.progress === 0 &&
      current.message === ""
        ? current
        : IDLE_PRODUCT_IMAGE_UPLOAD_STATE,
    );
  }, []);

  const swapItemsByIndexes = React.useCallback(
    (leftIndex: number, rightIndex: number) => {
      if (leftIndex === rightIndex) {
        return;
      }

      setItems((current) => {
        if (
          leftIndex < 0 ||
          rightIndex < 0 ||
          leftIndex >= current.length ||
          rightIndex >= current.length
        ) {
          return current;
        }

        const nextItems = [...current];
        [nextItems[leftIndex], nextItems[rightIndex]] = [
          nextItems[rightIndex],
          nextItems[leftIndex],
        ];
        return nextItems;
      });
      resetUploadProgress();
    },
    [resetUploadProgress],
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
    itemCount: items.length,
    onSwap: swapItemsByIndexes,
  });

  const cropperFiles = React.useMemo(() => {
    if (cropperEditTargetId) {
      const targetItem = items.find((item) => item.id === cropperEditTargetId);
      if (targetItem?.kind === "local") {
        return [targetItem.file];
      }

      return [];
    }

    if (isInitialCropRequired) {
      return pendingAddedFiles;
    }

    return [];
  }, [cropperEditTargetId, isInitialCropRequired, items, pendingAddedFiles]);

  const cropperCopy = React.useMemo(
    () =>
      getProductImageCropperCopy({
        isEditingSingle: Boolean(cropperEditTargetId),
        isInitialCropRequired,
      }),
    [cropperEditTargetId, isInitialCropRequired],
  );

  const uploadedMediaIds = React.useMemo(
    () => collectUploadedEditProductMediaIds(items),
    [items],
  );

  React.useEffect(() => {
    if (items.length === 0 && pendingAddedFiles.length === 0) {
      setIsInitialCropRequired(false);
    }
  }, [items.length, pendingAddedFiles.length]);

  React.useEffect(() => {
    if (!cropperEditTargetId) {
      return;
    }

    if (!items.some((item) => item.id === cropperEditTargetId)) {
      setCropperEditTargetId(null);
    }
  }, [cropperEditTargetId, items]);

  const createLocalItemId = React.useCallback(() => {
    const nextId = `local-${idSequenceRef.current}`;
    idSequenceRef.current += 1;
    return nextId;
  }, []);

  const resetFromMedia = React.useCallback(
    (media: ProductMediaDto[] | null | undefined) => {
      setItems(buildInitialEditProductImageItems(media));
      setIsCropperOpen(false);
      setCropperInitialIndex(0);
      setCropperEditTargetId(null);
      setPendingAddedFiles([]);
      setIsInitialCropRequired(false);
      exitReorderMode();
      setUploadState(IDLE_PRODUCT_IMAGE_UPLOAD_STATE);
    },
    [exitReorderMode],
  );

  const handleFilesChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const remainingSlots = Math.max(0, MAX_PRODUCT_IMAGES - items.length);
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
      setCropperEditTargetId(null);
      setIsInitialCropRequired(true);
      exitReorderMode();
      setIsCropperOpen(true);
      resetUploadProgress();
      event.target.value = "";
    },
    [exitReorderMode, items.length, resetUploadProgress],
  );

  const removeItem = React.useCallback(
    (index: number) => {
      setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
      clearPendingSwapSelection();
      resetUploadProgress();
    },
    [clearPendingSwapSelection, resetUploadProgress],
  );

  const handleEditItem = React.useCallback(
    async (index: number) => {
      if (isSubmitting || isCropperOpen) {
        return;
      }

      const targetItem = items[index];
      if (!targetItem) {
        return;
      }

      clearPendingSwapSelection();

      if (targetItem.kind === "local") {
        setCropperEditTargetId(targetItem.id);
        setCropperInitialIndex(0);
        setIsCropperOpen(true);
        return;
      }

      try {
        const file = await fetchRemoteEditProductImageAsFile(targetItem);
        const nextId = createLocalItemId();

        setItems((current) =>
          current.map((item) =>
            item.id === targetItem.id
              ? createLocalEditProductImageItem(file, nextId)
              : item,
          ),
        );
        resetUploadProgress();
        setCropperEditTargetId(nextId);
        setCropperInitialIndex(0);
        setIsCropperOpen(true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось подготовить фотографию к редактированию.";
        toast.error(message);
      }
    },
    [
      clearPendingSwapSelection,
      createLocalItemId,
      isCropperOpen,
      isSubmitting,
      items,
      resetUploadProgress,
    ],
  );

  const handleCropApply = React.useCallback(
    (nextFiles: File[]) => {
      if (cropperEditTargetId) {
        const editedFile = nextFiles[0];
        if (!editedFile) {
          return;
        }

        setItems((current) =>
          current.map((item) =>
            item.id === cropperEditTargetId
              ? createLocalEditProductImageItem(editedFile, createLocalItemId())
              : item,
          ),
        );
        setCropperEditTargetId(null);
        clearPendingSwapSelection();
        resetUploadProgress();
        setIsCropperOpen(false);
        return;
      }

      const nextLocalItems = nextFiles.map((file) =>
        createLocalEditProductImageItem(file, createLocalItemId()),
      );

      setItems((current) => [...current, ...nextLocalItems]);
      setCropperInitialIndex(0);
      setIsInitialCropRequired(false);
      setPendingAddedFiles([]);
      clearPendingSwapSelection();
      resetUploadProgress();
      setIsCropperOpen(false);
    },
    [
      clearPendingSwapSelection,
      createLocalItemId,
      cropperEditTargetId,
      resetUploadProgress,
    ],
  );

  const handleCropperOpenChange = React.useCallback((nextOpen: boolean) => {
    setIsCropperOpen(nextOpen);
    if (!nextOpen) {
      setCropperEditTargetId(null);
    }
  }, []);

  const openRequiredCropper = React.useCallback(() => {
    setCropperEditTargetId(null);
    setCropperInitialIndex(0);
    setIsCropperOpen(true);
  }, []);

  const resolveMediaIdsForSubmit = React.useCallback(async (): Promise<string[]> => {
    const nextItems = [...items];
    const pendingLocalItems = nextItems.filter(
      (item): item is Extract<EditProductImageItem, { kind: "local" }> =>
        item.kind === "local" && !item.uploadedMediaId,
    );

    if (pendingLocalItems.length === 0) {
      return resolveEditProductMediaIds(nextItems);
    }

    for (const [index, item] of pendingLocalItems.entries()) {
      const mediaId = (
        await uploadProductImages({
          files: [item.file],
          onStateChange: (state) => {
            const totalProgress =
              ((index + state.progress / 100) / pendingLocalItems.length) * 100;
            setUploadState({
              phase: state.phase,
              progress: clampNumber(totalProgress, 0, 100),
              message:
                pendingLocalItems.length > 1
                  ? `${state.message} (${index + 1}/${pendingLocalItems.length})`
                  : state.message,
            });
          },
        })
      )[0];

      if (!mediaId) {
        throw new Error("Сервер не вернул mediaId после загрузки фотографии.");
      }

      const itemIndex = nextItems.findIndex((entry) => entry.id === item.id);
      if (itemIndex !== -1) {
        nextItems[itemIndex] = {
          ...nextItems[itemIndex],
          uploadedMediaId: mediaId,
        } as Extract<EditProductImageItem, { kind: "local" }>;
      }
    }

    setItems(nextItems);
    setUploadState({
      phase: "done",
      progress: 100,
      message: "Изображения успешно загружены.",
    });

    return resolveEditProductMediaIds(nextItems);
  }, [items]);

  return {
    cropperApplyLabel: cropperCopy.applyLabel,
    cropperDescription: cropperCopy.description,
    cropperFiles,
    cropperInitialIndex,
    cropperMode: cropperCopy.mode,
    cropperTitle: cropperCopy.title,
    handleCropApply,
    handleCropperOpenChange,
    handleEditItem,
    handleFilesChange,
    handleSelectItemForSwap,
    handleToggleReorderMode,
    imageItems,
    isCropperOpen,
    isInitialCropRequired,
    isReorderMode,
    openRequiredCropper,
    pendingAddedFilesCount: pendingAddedFiles.length,
    pendingSwapIndex,
    removeItem,
    resetFromMedia,
    resolveMediaIdsForSubmit,
    uploadState,
    uploadedMediaIds,
  };
}
