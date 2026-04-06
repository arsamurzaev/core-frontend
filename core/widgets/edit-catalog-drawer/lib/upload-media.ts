"use client";

import {
  buildEnqueuePayload,
  extractQueueMediaIds,
  isQueueErrorStatus,
  pollQueueStatus,
  streamQueueStatus,
} from "@/shared/lib/upload-queue";
import { type UploadState } from "@/core/modules/product/editor/model/types";
import { clamp } from "@/shared/lib/math";
import {
  s3ControllerEnqueueFromS3,
  s3ControllerPresignUpload,
  type UploadQueueStatusDto,
} from "@/shared/api/generated/react-query";
import axios from "axios";

export type MediaUploadState = UploadState;

export const IDLE_MEDIA_UPLOAD_STATE: MediaUploadState = {
  phase: "idle",
  progress: 0,
  message: "",
};

function getMediaLabel(kind: "logo" | "background"): string {
  return kind === "logo" ? "логотипа" : "фонового изображения";
}

export async function uploadCatalogImage({
  file,
  catalogId,
  kind,
  onStateChange,
}: {
  file: File;
  catalogId: string;
  kind: "logo" | "background";
  onStateChange?: (state: MediaUploadState) => void;
}): Promise<string> {
  const label = getMediaLabel(kind);
  const contentType = file.type || "application/octet-stream";

  onStateChange?.({
    phase: "uploading",
    progress: 0,
    message: `Подготовка ${label}...`,
  });

  const presign = await s3ControllerPresignUpload({
    contentType,
    folder: "catalogs",
    entityId: catalogId,
    path: kind,
  });

  await axios.put(presign.uploadUrl, file, {
    headers: {
      "Content-Type": contentType,
    },
    onUploadProgress: (event) => {
      const loaded = Math.min(event.loaded ?? 0, Math.max(file.size, 1));
      const uploadProgress = clamp((loaded / Math.max(file.size, 1)) * 50, 0, 50);
      onStateChange?.({
        phase: "uploading",
        progress: uploadProgress,
        message: `Загрузка ${label}...`,
      });
    },
  });

  onStateChange?.({
    phase: "processing",
    progress: 50,
    message: `Обработка ${label}...`,
  });

  const queued = await s3ControllerEnqueueFromS3(buildEnqueuePayload(presign));
  if (!queued.jobId) {
    throw new Error("Сервер не вернул jobId для обработки изображения.");
  }

  const handleQueueUpdate = (status: UploadQueueStatusDto) => {
    const queueProgress = clamp(Number(status.progress) || 0, 0, 100);
    onStateChange?.({
      phase: "processing",
      progress: clamp(50 + queueProgress * 0.5, 50, 100),
      message: `Обработка ${label}...`,
    });
  };

  let finalQueueStatus: UploadQueueStatusDto;

  try {
    finalQueueStatus = await streamQueueStatus(queued.jobId, handleQueueUpdate);
  } catch {
    finalQueueStatus = await pollQueueStatus(queued.jobId, handleQueueUpdate);
  }

  if (isQueueErrorStatus(finalQueueStatus.status)) {
    throw new Error(
      finalQueueStatus.error || `Ошибка при обработке ${label}.`,
    );
  }

  const mediaId = extractQueueMediaIds(finalQueueStatus)[0] ?? presign.mediaId;
  if (!mediaId) {
    throw new Error("Сервер не вернул mediaId после загрузки изображения.");
  }

  onStateChange?.({
    phase: "done",
    progress: 100,
    message: `Загрузка ${label} завершена.`,
  });

  return mediaId;
}
