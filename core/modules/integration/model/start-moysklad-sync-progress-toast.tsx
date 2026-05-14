"use client";

import { apiClient } from "@/shared/api/client";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { Progress } from "@/shared/ui/progress";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 1_500;

type MoySkladSyncProgressStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "ERROR"
  | "SKIPPED";

type MoySkladSyncProgressDto = {
  runId: string;
  status: MoySkladSyncProgressStatus;
  phase: string;
  message: string;
  processed: number;
  total: number | null;
  percent: number | null;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

type StartMoySkladSyncProgressToastOptions = {
  runId: string;
  title?: string;
  onSettled?: () => void | Promise<void>;
};

const TERMINAL_STATUSES = new Set<MoySkladSyncProgressStatus>([
  "SUCCESS",
  "ERROR",
  "SKIPPED",
]);

function buildInitialProgress(runId: string): MoySkladSyncProgressDto {
  return {
    runId,
    status: "PENDING",
    phase: "QUEUED",
    message: "Sync поставлен в очередь",
    processed: 0,
    total: null,
    percent: null,
    updatedAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
  };
}

function resolveProgressValue(progress: MoySkladSyncProgressDto): number {
  if (typeof progress.percent === "number") {
    return Math.min(100, Math.max(0, progress.percent));
  }

  if (progress.status === "SUCCESS") return 100;
  if (progress.total && progress.total > 0) {
    return Math.min(
      100,
      Math.max(0, Math.round((progress.processed / progress.total) * 100)),
    );
  }

  return TERMINAL_STATUSES.has(progress.status) ? 0 : 8;
}

function formatCounter(progress: MoySkladSyncProgressDto): string {
  if (progress.total !== null) {
    return `${progress.processed}/${progress.total}`;
  }

  if (progress.processed > 0) {
    return `${progress.processed} обработано`;
  }

  return "подготовка";
}

function formatPercent(progress: MoySkladSyncProgressDto): string {
  const value = resolveProgressValue(progress);
  if (progress.percent === null && progress.total === null) return "";
  return `${value}%`;
}

function MoySkladSyncProgressToast({
  progress,
  title,
}: {
  progress: MoySkladSyncProgressDto;
  title: string;
}) {
  const percentLabel = formatPercent(progress);

  return (
    <div className="w-[320px] max-w-[calc(100vw-48px)] space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {title}
          </div>
          <div className="line-clamp-2 text-xs text-muted-foreground">
            {progress.message}
          </div>
        </div>
        <div className="shrink-0 text-xs font-medium text-muted-foreground">
          {formatCounter(progress)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={resolveProgressValue(progress)} className="h-1.5" />
        {percentLabel ? (
          <span className="w-9 shrink-0 text-right text-xs text-muted-foreground">
            {percentLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

async function fetchProgress(runId: string): Promise<MoySkladSyncProgressDto> {
  return apiClient.get<MoySkladSyncProgressDto>(
    `/integration/moysklad/runs/${encodeURIComponent(runId)}/progress`,
  );
}

export function startMoySkladSyncProgressToast({
  runId,
  title = "Синхронизация MoySklad",
  onSettled,
}: StartMoySkladSyncProgressToastOptions): () => void {
  const toastId = `moysklad-sync-${runId}`;
  let stopped = false;

  const notifySettled = async () => {
    try {
      await onSettled?.();
    } catch {
      // UI refresh failure should not replace the sync result toast.
    }
  };

  const showProgress = (progress: MoySkladSyncProgressDto) => {
    toast.loading(
      <MoySkladSyncProgressToast progress={progress} title={title} />,
      {
        id: toastId,
        duration: Infinity,
      },
    );
  };

  const poll = async () => {
    if (stopped) return;

    try {
      const progress = await fetchProgress(runId);
      if (stopped) return;

      if (progress.status === "SUCCESS") {
        toast.success(
          <MoySkladSyncProgressToast progress={progress} title={title} />,
          { id: toastId, duration: 6_000 },
        );
        await notifySettled();
        return;
      }

      if (progress.status === "ERROR" || progress.status === "SKIPPED") {
        toast.error(progress.message || "Sync MoySklad завершился с ошибкой", {
          id: toastId,
          duration: 8_000,
        });
        await notifySettled();
        return;
      }

      showProgress(progress);
      globalThis.setTimeout(poll, POLL_INTERVAL_MS);
    } catch (error) {
      if (stopped) return;
      toast.error(extractApiErrorMessage(error), {
        id: toastId,
        duration: 8_000,
      });
      await notifySettled();
    }
  };

  showProgress(buildInitialProgress(runId));
  void poll();

  return () => {
    stopped = true;
    toast.dismiss(toastId);
  };
}
