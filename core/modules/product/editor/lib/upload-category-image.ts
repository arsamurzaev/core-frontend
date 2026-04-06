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

export type CategoryImageUploadState = UploadState;

export const IDLE_CATEGORY_IMAGE_UPLOAD_STATE: CategoryImageUploadState = {
  phase: "idle",
  progress: 0,
  message: "",
};

export async function uploadCategoryImage({
  file,
  onStateChange,
}: {
  file: File;
  onStateChange?: (state: CategoryImageUploadState) => void;
}): Promise<string> {
  const contentType = file.type || "application/octet-stream";

  onStateChange?.({
    phase: "uploading",
    progress: 0,
    message: "Подготовка изображения категории...",
  });

  const presign = await s3ControllerPresignUpload({
    contentType,
    folder: "categories",
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
        message: "Загрузка изображения категории...",
      });
    },
  });

  onStateChange?.({
    phase: "processing",
    progress: 50,
    message: "Обработка изображения категории...",
  });

  const queued = await s3ControllerEnqueueFromS3(buildEnqueuePayload(presign));
  if (!queued.jobId) {
    throw new Error("Сервер не вернул jobId для обработки изображения категории.");
  }

  const handleQueueUpdate = (status: UploadQueueStatusDto) => {
    const queueProgress = clamp(Number(status.progress) || 0, 0, 100);
    onStateChange?.({
      phase: "processing",
      progress: clamp(50 + queueProgress * 0.5, 50, 100),
      message: "Обработка изображения категории...",
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
      finalQueueStatus.error || "Ошибка при обработке изображения категории.",
    );
  }

  const mediaId = extractQueueMediaIds(finalQueueStatus)[0] ?? presign.mediaId;
  if (!mediaId) {
    throw new Error("Сервер не вернул mediaId после загрузки изображения категории.");
  }

  onStateChange?.({
    phase: "done",
    progress: 100,
    message: "Изображение категории загружено.",
  });

  return mediaId;
}
