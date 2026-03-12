import type { Coordinates, DrawOptions, Transforms } from "react-advanced-cropper";

export type CropperOutputOptions = {
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

export type CropperSessionMode = "optional" | "required-sequential";

export type CropperSourceItem = {
  id: string;
  file: File;
  sourceUrl: string;
};

export type CropperDraft = {
  coordinates: Coordinates | null;
  transforms: Transforms;
};

export type CropperInitialCoordinatesInput = {
  imageSize: { width: number; height: number };
  stencilRatio?: { minimum?: number; maximum?: number };
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

export const DEFAULT_IMAGE_CROPPER_OUTPUT_OPTIONS: Required<
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

function getFileBaseName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return fileName;
  }

  return fileName.slice(0, dotIndex);
}

function getExtensionByMimeType(mimeType: string): string {
  return MIME_EXTENSION_MAP[mimeType] ?? "jpg";
}

function resolveOutputMimeType(
  requestedMimeType: string | undefined,
  sourceMimeType: string,
): string {
  if (requestedMimeType && SUPPORTED_EXPORT_MIME_TYPES.has(requestedMimeType)) {
    return requestedMimeType;
  }

  if (SUPPORTED_EXPORT_MIME_TYPES.has(sourceMimeType)) {
    return sourceMimeType;
  }

  return FALLBACK_MIME_TYPE;
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

function createResultFileName(
  sourceFile: File,
  mimeType: string,
  suffix: string,
): string {
  const baseName = getFileBaseName(sourceFile.name);
  const extension = getExtensionByMimeType(mimeType);
  return `${baseName}-${suffix}.${extension}`;
}

function getRequiredCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Не удалось создать контекст canvas.");
  }

  return context;
}

async function canvasToBlob(
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

async function loadImageFromUrl(sourceUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Не удалось загрузить изображение: ${sourceUrl}`));
    image.src = sourceUrl;
  });
}

export function createCropperFileId(file: File, index: number): string {
  return `${index}-${file.name}-${file.size}-${file.lastModified}`;
}

export function createCropperSourceItems(files: File[]): CropperSourceItem[] {
  return files.map((file, index) => ({
    id: createCropperFileId(file, index),
    file,
    sourceUrl: URL.createObjectURL(file),
  }));
}

export function revokeCropperSourceItems(items: CropperSourceItem[]): void {
  for (const item of items) {
    URL.revokeObjectURL(item.sourceUrl);
  }
}

export function revokeCropperPreviewUrls(previewById: Record<string, string>): void {
  Object.values(previewById).forEach((url) => {
    URL.revokeObjectURL(url);
  });
}

export function resolveCropperOutputOptions(
  outputOptions: CropperOutputOptions | undefined,
): CropperOutputOptions {
  return {
    ...DEFAULT_IMAGE_CROPPER_OUTPUT_OPTIONS,
    ...(outputOptions ?? {}),
  };
}

export function buildCropperDrawOptions(options: CropperOutputOptions): DrawOptions {
  return {
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    maxArea: options.maxArea,
    minWidth: options.minWidth,
    minHeight: options.minHeight,
    imageSmoothingEnabled:
      options.imageSmoothingEnabled ??
      DEFAULT_IMAGE_CROPPER_OUTPUT_OPTIONS.imageSmoothingEnabled,
    imageSmoothingQuality:
      options.imageSmoothingQuality ??
      DEFAULT_IMAGE_CROPPER_OUTPUT_OPTIONS.imageSmoothingQuality,
    fillColor: options.fillColor,
  };
}

export function buildCropperInitialCoordinates(
  input: CropperInitialCoordinatesInput,
  aspectRatio: number,
): Coordinates {
  const ratio = resolveStencilRatio(input.stencilRatio, aspectRatio);
  return createCenterCropRegion(input.imageSize.width, input.imageSize.height, ratio);
}

export async function createCropperResultFile(
  canvas: HTMLCanvasElement,
  sourceFile: File,
  outputOptions: CropperOutputOptions,
): Promise<File> {
  const mimeType = resolveOutputMimeType(outputOptions.mimeType, sourceFile.type);
  const blob = await canvasToBlob(
    canvas,
    mimeType,
    outputOptions.quality ?? DEFAULT_IMAGE_CROPPER_OUTPUT_OPTIONS.quality,
  );
  const fileName = createResultFileName(
    sourceFile,
    mimeType,
    outputOptions.fileNameSuffix ??
      DEFAULT_IMAGE_CROPPER_OUTPUT_OPTIONS.fileNameSuffix,
  );

  return new File([blob], fileName, {
    type: blob.type || mimeType,
    lastModified: Date.now(),
  });
}

export async function createAutoCenteredCropFile(
  item: CropperSourceItem,
  aspectRatio: number,
  outputOptions: CropperOutputOptions,
): Promise<File> {
  const image = await loadImageFromUrl(item.sourceUrl);
  const region = createCenterCropRegion(
    image.naturalWidth,
    image.naturalHeight,
    aspectRatio,
  );
  const outputSize = constrainOutputSize(
    region.width,
    region.height,
    outputOptions,
  );

  const canvas = document.createElement("canvas");
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  const context = getRequiredCanvasContext(canvas);
  if (outputOptions.fillColor) {
    context.fillStyle = outputOptions.fillColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.imageSmoothingEnabled =
    outputOptions.imageSmoothingEnabled ??
    DEFAULT_IMAGE_CROPPER_OUTPUT_OPTIONS.imageSmoothingEnabled;
  context.imageSmoothingQuality =
    outputOptions.imageSmoothingQuality ??
    DEFAULT_IMAGE_CROPPER_OUTPUT_OPTIONS.imageSmoothingQuality;

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

  return createCropperResultFile(canvas, item.file, outputOptions);
}

export function resolveInitialCropperIndex(
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

export function resolveCropperApplyButtonLabel(params: {
  activeIndex: number;
  applyLabel: string;
  isRequiredSequential: boolean;
  totalItems: number;
}): string {
  if (!params.isRequiredSequential) {
    return params.applyLabel;
  }

  if (params.activeIndex >= params.totalItems - 1) {
    return "Завершить обрезку";
  }

  return "Обрезать и далее";
}
