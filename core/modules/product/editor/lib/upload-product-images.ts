"use client";

import {
  extractQueueMediaIds,
  isQueueErrorStatus,
  pollQueueStatus,
  streamQueueStatus,
} from "@/shared/lib/upload-queue";
import { type UploadState } from "@/core/modules/product/editor/model/types";
import { clamp } from "@/shared/lib/math";
import {
  type S3ControllerEnqueueFromS3Body,
  type UploadQueueStatusDto,
  s3ControllerEnqueueFromS3,
  s3ControllerPresignUpload,
} from "@/shared/api/generated/react-query";
import axios from "axios";

function buildEnqueueFromS3Payload(
  keys: string[],
): S3ControllerEnqueueFromS3Body {
  const items = keys.map((key) => ({ key }));
  return { items };
}

export async function uploadProductImages({
  files,
  onStateChange,
}: {
  files: File[];
  onStateChange?: (state: UploadState) => void;
}): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }

  const uploadedBytesByFile = new Map<number, number>();
  const totalBytes = files.reduce((sum, file) => sum + Math.max(file.size, 1), 0);
  const uploadedKeys: string[] = [];

  const recalcUploadProgress = () => {
    const loaded = Array.from(uploadedBytesByFile.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
    const uploadPercent = clamp((loaded / totalBytes) * 50, 0, 50);
    onStateChange?.({
      phase: "uploading",
      progress: uploadPercent,
      message: "Загрузка файлов в S3...",
    });
  };

  for (const [index, file] of files.entries()) {
    const contentType = file.type || "application/octet-stream";
    const presign = await s3ControllerPresignUpload({
      contentType,
      folder: "products",
    });

    uploadedKeys.push(presign.key);

    await axios.put(presign.uploadUrl, file, {
      headers: {
        "Content-Type": contentType,
      },
      onUploadProgress: (event) => {
        const loaded = Math.min(event.loaded ?? 0, file.size);
        uploadedBytesByFile.set(index, loaded);
        recalcUploadProgress();
      },
    });

    uploadedBytesByFile.set(index, file.size);
    recalcUploadProgress();
  }

  onStateChange?.({
    phase: "processing",
    progress: 50,
    message: "Постановка файлов в очередь обработки...",
  });

  const enqueuePayload = buildEnqueueFromS3Payload(uploadedKeys);
  const queued = await s3ControllerEnqueueFromS3(enqueuePayload);

  if (!queued.jobId) {
    throw new Error("Сервер не вернул jobId для отслеживания обработки.");
  }

  const handleQueueUpdate = (statusData: UploadQueueStatusDto) => {
    const queueProgress = clamp(Number(statusData.progress) || 0, 0, 100);
    const totalProgress = clamp(50 + queueProgress * 0.5, 50, 100);

    onStateChange?.({
      phase: "processing",
      progress: totalProgress,
      message: "Обработка изображений...",
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
      finalQueueStatus.error || "Ошибка при обработке загруженных изображений.",
    );
  }

  const mediaIds = extractQueueMediaIds(finalQueueStatus);
  if (mediaIds.length === 0) {
    throw new Error("Сервер не вернул mediaId после обработки файлов.");
  }

  onStateChange?.({
    phase: "done",
    progress: 100,
    message: "Изображения успешно загружены.",
  });

  return mediaIds;
}
