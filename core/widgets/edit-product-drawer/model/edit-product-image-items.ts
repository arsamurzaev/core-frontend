import { type FilePreviewEntry } from "@/core/modules/product/editor/model/types";
import { type ProductImageSectionItem } from "@/core/modules/product/editor/ui/product-images-section";
import { type ProductMediaDto } from "@/shared/api/generated/react-query";

export type EditProductImageItem =
  | {
      id: string;
      kind: "remote";
      label: string;
      mediaId: string;
      previewUrl: string;
    }
  | {
      id: string;
      kind: "local";
      file: File;
      label: string;
      uploadedMediaId?: string;
    };

export function buildInitialEditProductImageItems(
  media: ProductMediaDto[] | null | undefined,
): EditProductImageItem[] {
  return [...(media ?? [])]
    .sort((left, right) => left.position - right.position)
    .flatMap((entry, index) => {
      const mediaId = entry.media?.id;
      const previewUrl = entry.media?.variants?.[0]?.url ?? entry.media?.url ?? null;

      if (!mediaId || !previewUrl) {
        return [];
      }

      return [
        {
          id: `remote-${mediaId}`,
          kind: "remote" as const,
          label: entry.media.originalName || `Фото ${index + 1}`,
          mediaId,
          previewUrl,
        },
      ];
    });
}

export function buildEditProductImageSectionItems(
  items: EditProductImageItem[],
  localPreviewByFile: Map<File, FilePreviewEntry>,
): ProductImageSectionItem[] {
  return items.flatMap((item) => {
    if (item.kind === "remote") {
      return [
        {
          key: item.id,
          label: item.label,
          previewUrl: item.previewUrl,
        },
      ];
    }

    const previewEntry = localPreviewByFile.get(item.file);
    if (!previewEntry) {
      return [];
    }

    return [
      {
        key: item.id,
        label: item.label,
        previewUrl: previewEntry.previewUrl,
      },
    ];
  });
}

export function collectUploadedEditProductMediaIds(
  items: EditProductImageItem[],
): string[] {
  return items.flatMap((item) =>
    item.kind === "local" && item.uploadedMediaId ? [item.uploadedMediaId] : [],
  );
}

export function createLocalEditProductImageItem(
  file: File,
  id: string,
): Extract<EditProductImageItem, { kind: "local" }> {
  return {
    id,
    kind: "local",
    file,
    label: file.name,
  };
}

export function resolveEditProductMediaIds(
  items: EditProductImageItem[],
): string[] {
  return items.flatMap((item) =>
    item.kind === "remote"
      ? [item.mediaId]
      : item.uploadedMediaId
        ? [item.uploadedMediaId]
        : [],
  );
}

export async function fetchRemoteEditProductImageAsFile(
  item: Extract<EditProductImageItem, { kind: "remote" }>,
): Promise<File> {
  const response = await fetch(item.previewUrl, {
    cache: "no-store",
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить фото для редактирования.");
  }

  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const normalizedName = item.label.trim() || `${item.mediaId}.jpg`;

  return new File([blob], normalizedName, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
