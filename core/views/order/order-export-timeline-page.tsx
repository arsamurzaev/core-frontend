"use client";

import {
  type IikoOrderExportTimelineItemDto,
  useIntegrationControllerGetIikoOrderExportTimeline,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { RefreshCw } from "lucide-react";

function formatDate(value?: string | null): string {
  if (!value) return "нет даты";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "нет даты";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function statusVariant(status: IikoOrderExportTimelineItemDto["status"]) {
  if (status === "SUCCESS") return "default" as const;
  if (status === "ERROR") return "destructive" as const;
  if (status === "SKIPPED") return "outline" as const;
  return "secondary" as const;
}

export function OrderExportTimelinePage({ orderId }: { orderId: string }) {
  const timelineQuery = useIntegrationControllerGetIikoOrderExportTimeline(
    orderId,
    {
      query: {
        staleTime: 15_000,
        retry: false,
      },
    },
  );
  const items = timelineQuery.data?.items ?? [];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold">
            Заказ {orderId}
          </h1>
          <p className="mt-1 break-words text-sm text-text-muted">
            Timeline экспорта заказа в iiko.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={timelineQuery.isFetching}
          onClick={() => void timelineQuery.refetch()}
        >
          <RefreshCw className="size-4" />
          Обновить
        </Button>
      </div>

      {timelineQuery.isError ? (
        <div className="rounded-panel border border-status-danger/30 bg-status-danger-surface p-4 text-sm text-status-danger">
          {extractApiErrorMessage(timelineQuery.error)}
        </div>
      ) : null}

      <div className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
        <div className="space-y-3">
          {items.length ? (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-panel border border-line-subtle bg-surface-subtle p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words text-sm font-medium">
                      {item.title}
                    </div>
                    <p className="mt-1 break-words text-xs text-text-muted">
                      {formatDate(item.occurredAt)}
                      {item.detail ? ` · ${item.detail}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={statusVariant(item.status)}
                    className="max-w-full break-words text-left whitespace-normal"
                  >
                    {item.status}
                  </Badge>
                </div>
                {item.externalId ? (
                  <p className="mt-2 break-words text-xs text-text-muted">
                    iiko: {item.externalId}
                  </p>
                ) : null}
                {item.error ? (
                  <p className="mt-2 break-words text-xs text-status-danger">
                    {item.error}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-text-muted">
              Экспорт заказа в iiko пока не запускался или недоступен для этого
              заказа.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
