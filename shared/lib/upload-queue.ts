import {
  API_BASE_URL,
  FORWARDED_HOST_HEADER,
  getForwardedHost,
} from "@/shared/api/client";
import {
  type UploadQueueStatusDto,
  s3ControllerGetQueueStatus,
} from "@/shared/api/generated";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isQueueDoneStatus(status: string | undefined): boolean {
  if (!status) return false;
  const normalized = status.toUpperCase();
  return (
    normalized === "DONE" ||
    normalized === "COMPLETED" ||
    normalized === "SUCCESS"
  );
}

export function isQueueErrorStatus(status: string | undefined): boolean {
  if (!status) return false;
  const normalized = status.toUpperCase();
  return (
    normalized === "ERROR" ||
    normalized === "FAILED" ||
    normalized === "FAIL" ||
    normalized === "CANCELED" ||
    normalized === "CANCELLED"
  );
}

export function extractQueueMediaIds(status: UploadQueueStatusDto): string[] {
  const mediaIds = new Set<string>();

  if (status.result?.mediaId) {
    mediaIds.add(status.result.mediaId);
  }

  for (const item of status.results ?? []) {
    if (item.mediaId) {
      mediaIds.add(item.mediaId);
    }
  }

  return Array.from(mediaIds);
}

function parseSseChunk(chunk: string): UploadQueueStatusDto | null {
  const dataLines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"));

  if (dataLines.length === 0) {
    return null;
  }

  const dataText = dataLines.map((line) => line.slice(5).trim()).join("\n");
  if (!dataText || dataText === "[DONE]") {
    return null;
  }

  try {
    const parsed = JSON.parse(dataText) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    if (isRecord(parsed.data)) {
      return parsed.data as unknown as UploadQueueStatusDto;
    }

    return parsed as unknown as UploadQueueStatusDto;
  } catch {
    return null;
  }
}

export async function streamQueueStatus(
  jobId: string,
  onUpdate: (status: UploadQueueStatusDto) => void,
): Promise<UploadQueueStatusDto> {
  const url = `${API_BASE_URL}/s3/images/queue/${encodeURIComponent(jobId)}/stream`;
  const headers = new Headers({ Accept: "text/event-stream" });
  const forwardedHost = getForwardedHost();

  if (forwardedHost) {
    headers.set(FORWARDED_HOST_HEADER, forwardedHost);
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers,
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE stream is not available (${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let lastStatus: UploadQueueStatusDto | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const status = parseSseChunk(chunk);
      if (!status) continue;

      lastStatus = status;
      onUpdate(status);

      if (isQueueDoneStatus(status.status) || isQueueErrorStatus(status.status)) {
        await reader.cancel();
        return status;
      }
    }
  }

  if (lastStatus) {
    return lastStatus;
  }

  throw new Error("SSE stream ended without queue status.");
}

export async function pollQueueStatus(
  jobId: string,
  onUpdate: (status: UploadQueueStatusDto) => void,
): Promise<UploadQueueStatusDto> {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const status = await s3ControllerGetQueueStatus(jobId);
    onUpdate(status);

    if (isQueueDoneStatus(status.status) || isQueueErrorStatus(status.status)) {
      return status;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }

  throw new Error("Превышено время ожидания обработки файлов.");
}
