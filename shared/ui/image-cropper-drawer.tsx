"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerScrollArea,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { ChevronLeft, ChevronRight, Crop, Loader2, RotateCcw } from "lucide-react";
import NextImage from "next/image";
import React from "react";
import {
  Cropper,
  ImageRestriction,
  Priority,
  RectangleStencil,
  type Coordinates,
  type CropperRef,
  type DrawOptions,
  type Transforms,
} from "react-advanced-cropper";
import { toast } from "sonner";

type CropperOutputOptions = {
  mimeType?: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxArea?: number;
  minWidth?: number;
  minHeight?: number;
  imageSmoothingEnabled?: boolean;
  imageSmoothingQuality?: "low" | "medium" | "high";
  fillColor?: string;
  fileNameSuffix?: string;
};

type CropperSessionMode = "optional" | "required-sequential";

type ImageCropperDrawerProps = {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  files: File[];
  initialIndex?: number;
  mode?: CropperSessionMode;
  onApply: (files: File[]) => void | Promise<void>;
  className?: string;
  aspectRatio?: number;
  title?: React.ReactNode;
  description?: React.ReactNode;
  cancelLabel?: string;
  applyLabel?: string;
  outputOptions?: CropperOutputOptions;
};

type CropperSourceItem = {
  id: string;
  file: File;
  sourceUrl: string;
};

type CropperDraft = {
  coordinates: Coordinates | null;
  transforms: Transforms;
};

const FALLBACK_MIME_TYPE = "image/jpeg";
const SUPPORTED_EXPORT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const DEFAULT_OUTPUT_OPTIONS: Required<
  Pick<
    CropperOutputOptions,
    "quality" | "imageSmoothingEnabled" | "imageSmoothingQuality" | "fileNameSuffix"
  >
> = {
  quality: 0.92,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: "high",
  fileNameSuffix: "crop",
};

function resolveStencilRatio(
  stencilRatio: { minimum?: number; maximum?: number } | undefined,
  fallbackRatio: number,
): number {
  const minimum = stencilRatio?.minimum;
  const maximum = stencilRatio?.maximum;

  if (
    typeof minimum === "number" &&
    Number.isFinite(minimum) &&
    typeof maximum === "number" &&
    Number.isFinite(maximum) &&
    Math.abs(minimum - maximum) < 0.0001
  ) {
    return minimum;
  }

  return fallbackRatio;
}

function createFileId(file: File, index: number): string {
  return `${index}-${file.name}-${file.size}-${file.lastModified}`;
}

function getFileBaseName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) return fileName;
  return fileName.slice(0, dotIndex);
}

function getExtensionByMimeType(mimeType: string): string {
  return MIME_EXTENSION_MAP[mimeType] ?? "jpg";
}

function resolveOutputMimeType(
  requestedMimeType: string | undefined,
  sourceMimeType: string,
): string {
  if (
    requestedMimeType &&
    SUPPORTED_EXPORT_MIME_TYPES.has(requestedMimeType)
  ) {
    return requestedMimeType;
  }

  if (SUPPORTED_EXPORT_MIME_TYPES.has(sourceMimeType)) {
    return sourceMimeType;
  }

  return FALLBACK_MIME_TYPE;
}

function buildDrawOptions(options: CropperOutputOptions): DrawOptions {
  return {
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    maxArea: options.maxArea,
    minWidth: options.minWidth,
    minHeight: options.minHeight,
    imageSmoothingEnabled:
      options.imageSmoothingEnabled ?? DEFAULT_OUTPUT_OPTIONS.imageSmoothingEnabled,
    imageSmoothingQuality:
      options.imageSmoothingQuality ?? DEFAULT_OUTPUT_OPTIONS.imageSmoothingQuality,
    fillColor: options.fillColor,
  };
}

function createCenterCropRegion(
  width: number,
  height: number,
  aspectRatio: number,
): Coordinates {
  const sourceRatio = width / height;

  if (sourceRatio > aspectRatio) {
    const cropWidth = height * aspectRatio;
    return {
      left: (width - cropWidth) / 2,
      top: 0,
      width: cropWidth,
      height,
    };
  }

  const cropHeight = width / aspectRatio;
  return {
    left: 0,
    top: (height - cropHeight) / 2,
    width,
    height: cropHeight,
  };
}

function constrainOutputSize(
  width: number,
  height: number,
  options: CropperOutputOptions,
): { width: number; height: number } {
  let resultWidth = width;
  let resultHeight = height;

  if (options.maxWidth && resultWidth > options.maxWidth) {
    const ratio = options.maxWidth / resultWidth;
    resultWidth = options.maxWidth;
    resultHeight *= ratio;
  }

  if (options.maxHeight && resultHeight > options.maxHeight) {
    const ratio = options.maxHeight / resultHeight;
    resultHeight = options.maxHeight;
    resultWidth *= ratio;
  }

  if (
    options.maxArea &&
    resultWidth > 0 &&
    resultHeight > 0 &&
    resultWidth * resultHeight > options.maxArea
  ) {
    const ratio = Math.sqrt(options.maxArea / (resultWidth * resultHeight));
    resultWidth *= ratio;
    resultHeight *= ratio;
  }

  return {
    width: Math.max(1, Math.round(resultWidth)),
    height: Math.max(1, Math.round(resultHeight)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Не удалось сформировать файл изображения из canvas."));
      },
      mimeType,
      quality,
    );
  });
}

function loadImageFromUrl(sourceUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Не удалось загрузить изображение: ${sourceUrl}`));
    image.src = sourceUrl;
  });
}

function createResultFileName(
  sourceFile: File,
  mimeType: string,
  suffix: string,
): string {
  const baseName = getFileBaseName(sourceFile.name);
  const extension = getExtensionByMimeType(mimeType);
  return `${baseName}-${suffix}.${extension}`;
}

function resolveInitialActiveIndex(
  value: number | undefined,
  totalItems: number,
): number {
  if (totalItems <= 0) {
    return 0;
  }

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(value as number), 0), totalItems - 1);
}

export const ImageCropperDrawer: React.FC<ImageCropperDrawerProps> = ({
  open,
  onOpenChange,
  files,
  initialIndex = 0,
  mode = "optional",
  onApply,
  className,
  aspectRatio = 3 / 4,
  title = "Обрезка изображений",
  description = "Настройте обрезку одного или нескольких изображений перед загрузкой.",
  cancelLabel = "Отмена",
  applyLabel = "Применить",
  outputOptions,
}) => {
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

  const resolvedOutputOptions = React.useMemo<CropperOutputOptions>(
    () => ({
      ...DEFAULT_OUTPUT_OPTIONS,
      ...(outputOptions ?? {}),
    }),
    [outputOptions],
  );

  const clearEditedResults = React.useCallback(() => {
    editedFilesRef.current = {};
    draftsRef.current = {};
    setPreviewById((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      return {};
    });
  }, []);

  React.useEffect(() => {
    previewUrlsRef.current = previewById;
  }, [previewById]);

  React.useEffect(
    () => () => {
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  React.useEffect(() => {
    clearEditedResults();
    setErrorMessage(null);
    setActiveIndex(resolveInitialActiveIndex(initialIndex, files.length));
    setCropperRevision(0);
  }, [clearEditedResults, files, initialIndex]);

  React.useEffect(() => {
    const items = files.map((file, index) => ({
      id: createFileId(file, index),
      file,
      sourceUrl: URL.createObjectURL(file),
    }));

    setSourceItems(items);

    return () => {
      for (const item of items) {
        URL.revokeObjectURL(item.sourceUrl);
      }
    };
  }, [files]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setActiveIndex(resolveInitialActiveIndex(initialIndex, sourceItems.length));
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

  const activeDraft = activeItem
    ? draftsRef.current[activeItem.id]
    : undefined;

  const cropperKey = activeItem
    ? `${activeItem.id}-${cropperRevision}`
    : "cropper-empty";

  const buildFileFromCanvas = React.useCallback(
    async (canvas: HTMLCanvasElement, sourceFile: File): Promise<File> => {
      const mimeType = resolveOutputMimeType(
        resolvedOutputOptions.mimeType,
        sourceFile.type,
      );
      const blob = await canvasToBlob(
        canvas,
        mimeType,
        resolvedOutputOptions.quality ?? DEFAULT_OUTPUT_OPTIONS.quality,
      );
      const fileName = createResultFileName(
        sourceFile,
        mimeType,
        resolvedOutputOptions.fileNameSuffix ?? DEFAULT_OUTPUT_OPTIONS.fileNameSuffix,
      );

      return new File([blob], fileName, {
        type: blob.type || mimeType,
        lastModified: Date.now(),
      });
    },
    [resolvedOutputOptions],
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
    if (!activeItem) return null;
    const cropper = cropperRef.current;
    if (!cropper) return null;

    const canvas = cropper.getCanvas(buildDrawOptions(resolvedOutputOptions));
    if (!canvas) {
      throw new Error("Кроппер еще не готов. Попробуйте снова через секунду.");
    }

    const file = await buildFileFromCanvas(canvas, activeItem.file);
    setEditedPreview(activeItem.id, file);
    return file;
  }, [activeItem, buildFileFromCanvas, resolvedOutputOptions, setEditedPreview]);

  const buildInitialCoordinates = React.useCallback(
    ({
      imageSize,
      stencilRatio,
    }: {
      imageSize: { width: number; height: number };
      stencilRatio?: { minimum?: number; maximum?: number };
    }): Coordinates => {
      const ratio = resolveStencilRatio(stencilRatio, aspectRatio);
      return createCenterCropRegion(imageSize.width, imageSize.height, ratio);
    },
    [aspectRatio],
  );

  const createAutoCenteredCrop = React.useCallback(
    async (item: CropperSourceItem): Promise<File> => {
      const image = await loadImageFromUrl(item.sourceUrl);
      const region = createCenterCropRegion(
        image.naturalWidth,
        image.naturalHeight,
        aspectRatio,
      );

      const outputSize = constrainOutputSize(
        region.width,
        region.height,
        resolvedOutputOptions,
      );

      const canvas = document.createElement("canvas");
      canvas.width = outputSize.width;
      canvas.height = outputSize.height;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Не удалось создать контекст canvas.");
      }

      if (resolvedOutputOptions.fillColor) {
        context.fillStyle = resolvedOutputOptions.fillColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.imageSmoothingEnabled =
        resolvedOutputOptions.imageSmoothingEnabled ??
        DEFAULT_OUTPUT_OPTIONS.imageSmoothingEnabled;
      context.imageSmoothingQuality =
        resolvedOutputOptions.imageSmoothingQuality ??
        DEFAULT_OUTPUT_OPTIONS.imageSmoothingQuality;

      context.drawImage(
        image,
        region.left,
        region.top,
        region.width,
        region.height,
        0,
        0,
        outputSize.width,
        outputSize.height,
      );

      return buildFileFromCanvas(canvas, item.file);
    },
    [aspectRatio, buildFileFromCanvas, resolvedOutputOptions],
  );

  const handleSelectItem = React.useCallback(
    async (index: number) => {
      if (isRequiredSequential) return;
      if (index === activeIndex || isApplying || isSwitching) return;

      setIsSwitching(true);
      setErrorMessage(null);

      try {
        await applyCurrentCrop();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось сохранить текущую обрезку перед переключением.";
        setErrorMessage(message);
      } finally {
        setActiveIndex(index);
        setCropperRevision(0);
        setIsSwitching(false);
      }
    },
    [activeIndex, applyCurrentCrop, isApplying, isRequiredSequential, isSwitching],
  );

  const handleResetCurrent = React.useCallback(() => {
    if (!activeItem || isApplying || isSwitching) return;

    delete draftsRef.current[activeItem.id];
    delete editedFilesRef.current[activeItem.id];

    setPreviewById((prev) => {
      if (!prev[activeItem.id]) return prev;
      URL.revokeObjectURL(prev[activeItem.id]);

      const next = { ...prev };
      delete next[activeItem.id];
      return next;
    });

    setCropperRevision((value) => value + 1);
    setErrorMessage(null);
  }, [activeItem, isApplying, isSwitching]);

  const handleApply = React.useCallback(async () => {
    if (isApplying || sourceItems.length === 0) return;

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

        const autoCropped = await createAutoCenteredCrop(item);
        resultFiles.push(autoCropped);
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
    applyCurrentCrop,
    createAutoCenteredCrop,
    isApplying,
    activeIndex,
    activeItem,
    isRequiredSequential,
    onApply,
    onOpenChange,
    sourceItems,
  ]);

  const applyButtonLabel = React.useMemo(() => {
    if (!isRequiredSequential) {
      return applyLabel;
    }

    if (activeIndex >= sourceItems.length - 1) {
      return "Завершить обрезку";
    }

    return "Обрезать и далее";
  }, [activeIndex, applyLabel, isRequiredSequential, sourceItems.length]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && (isApplying || isSwitching)) {
        return;
      }

      onOpenChange(nextOpen);
    },
    [isApplying, isSwitching, onOpenChange],
  );

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isApplying && !isSwitching}
    >
      <DrawerContent className={cn("mx-auto w-full max-w-5xl", className)}>
        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="space-y-2">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <DrawerScrollArea className="px-4 pb-4">
            {sourceItems.length === 0 ? (
              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                Изображения не выбраны.
              </div>
            ) : (
              <div className="space-y-3">
                {sourceItems.length > 1 && !isRequiredSequential ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleSelectItem(Math.max(activeIndex - 1, 0))}
                      disabled={activeIndex === 0 || isApplying || isSwitching}
                      aria-label="Предыдущее изображение"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    <div className="flex-1 overflow-x-auto">
                      <ul className="flex gap-2 pb-1">
                        {sourceItems.map((item, index) => {
                          const isActive = index === activeIndex;
                          const previewUrl = previewById[item.id] ?? item.sourceUrl;
                          const isEdited = Boolean(previewById[item.id]);

                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => void handleSelectItem(index)}
                                className={cn(
                                  "relative flex h-16 w-12 overflow-hidden rounded-md border",
                                  isActive
                                    ? "border-primary ring-2 ring-primary/40"
                                    : "border-border",
                                )}
                                disabled={isApplying || isSwitching}
                                aria-label={`Выбрать изображение ${index + 1}`}
                              >
                                <NextImage
                                  src={previewUrl}
                                  alt={`Изображение ${index + 1}`}
                                  width={48}
                                  height={64}
                                  unoptimized
                                  className="h-full w-full object-cover"
                                />
                                {isEdited ? (
                                  <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center text-[10px] uppercase tracking-wide text-white">
                                    Обрезано
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        handleSelectItem(
                          Math.min(activeIndex + 1, sourceItems.length - 1),
                        )
                      }
                      disabled={
                        activeIndex === sourceItems.length - 1 ||
                        isApplying ||
                        isSwitching
                      }
                      aria-label="Следующее изображение"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                ) : null}

                {sourceItems.length > 1 && isRequiredSequential ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                    {`Шаг ${activeIndex + 1} из ${sourceItems.length}: обрежьте текущее изображение и продолжайте.`}
                  </div>
                ) : null}

                {activeItem ? (
                  <div className="rounded-xl border bg-muted/20 p-2">
                    <Cropper
                      key={cropperKey}
                      ref={cropperRef}
                      src={activeItem.sourceUrl}
                      className="h-[58dvh] w-full"
                      stencilComponent={RectangleStencil}
                      stencilProps={{
                        aspectRatio,
                        movable: true,
                        resizable: true,
                      }}
                      imageRestriction={ImageRestriction.stencil}
                      priority={Priority.coordinates}
                      transitions={false}
                      transformImage={{ adjustStencil: false }}
                      defaultCoordinates={
                        activeDraft?.coordinates ?? buildInitialCoordinates
                      }
                      defaultTransforms={activeDraft?.transforms ?? undefined}
                      onUpdate={(cropper) => {
                        if (!activeItem) return;
                        draftsRef.current[activeItem.id] = {
                          coordinates: cropper.getCoordinates(),
                          transforms: cropper.getTransforms(),
                        };
                      }}
                    />
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
                  <div className="text-xs text-muted-foreground">
                    {sourceItems.length > 0
                      ? `Изображение ${activeIndex + 1} из ${sourceItems.length}. Соотношение ${aspectRatio.toFixed(2)}`
                      : "Нет изображения"}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetCurrent}
                    disabled={!activeItem || isApplying || isSwitching}
                    className="gap-2"
                  >
                    <RotateCcw className="size-4" />
                    {isRequiredSequential
                      ? "Сбросить текущую обрезку"
                      : "Сбросить текущее"}
                  </Button>
                </div>

                {errorMessage ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {errorMessage}
                  </div>
                ) : null}
              </div>
            )}
          </DrawerScrollArea>

          <DrawerFooter className="border-t">
            <div className="grid w-full gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isApplying || isSwitching}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                onClick={() => void handleApply()}
                disabled={sourceItems.length === 0 || isApplying || isSwitching}
                className="gap-2"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <Crop className="size-4" />
                    {applyButtonLabel}
                  </>
                )}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
