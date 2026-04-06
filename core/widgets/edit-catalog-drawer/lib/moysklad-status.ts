import {
  type MoySkladIntegrationStatusDto,
  type MoySkladSyncRunDto,
} from "@/shared/api/generated/react-query";

export function formatSyncTimestamp(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function getStatusBadge(params: {
  configured: boolean;
  isActive?: boolean;
  hasActiveRun: boolean;
}) {
  if (params.hasActiveRun) {
    return { label: "Синхронизация", variant: "default" as const };
  }
  if (!params.configured) {
    return { label: "Не настроено", variant: "secondary" as const };
  }
  if (params.isActive === false) {
    return { label: "Выключено", variant: "secondary" as const };
  }
  return { label: "Подключено", variant: "default" as const };
}

export function getStatusDescription(status?: MoySkladIntegrationStatusDto): string {
  if (!status?.configured) {
    return "Добавьте токен и базовые параметры синхронизации.";
  }
  if (status.activeRun) {
    return "Сейчас выполняется или ожидает запуска очередной sync MoySklad.";
  }
  const lastRunAt =
    formatSyncTimestamp(status.lastRun?.finishedAt) ??
    formatSyncTimestamp(status.integration?.lastSyncAt);
  if (lastRunAt) {
    return `Последний sync: ${lastRunAt}.`;
  }
  return "Токен и параметры интеграции уже сохранены.";
}

export function getRunStatusBadge(status: MoySkladSyncRunDto["status"]) {
  switch (status) {
    case "RUNNING": return { label: "В работе", variant: "default" as const };
    case "PENDING": return { label: "В очереди", variant: "secondary" as const };
    case "SUCCESS": return { label: "Успешно", variant: "default" as const };
    case "ERROR": return { label: "Ошибка", variant: "destructive" as const };
    case "SKIPPED": return { label: "Пропущен", variant: "secondary" as const };
    default: return { label: status, variant: "secondary" as const };
  }
}

export function getRunMeta(run: MoySkladSyncRunDto): string {
  const mode = run.mode === "PRODUCT" ? "Товар" : "Каталог";
  const trigger = run.trigger === "SCHEDULED" ? "По расписанию" : "Вручную";
  const timestamp =
    formatSyncTimestamp(run.finishedAt) ??
    formatSyncTimestamp(run.startedAt) ??
    formatSyncTimestamp(run.requestedAt);
  return [mode, trigger, timestamp].filter(Boolean).join(" • ");
}

export function getRunSummary(run: MoySkladSyncRunDto): string {
  if (run.status === "ERROR" && run.error) return run.error;
  if (run.mode === "PRODUCT") {
    return `Создано: ${run.createdProducts}, обновлено: ${run.updatedProducts}, изображений: ${run.imagesImported}`;
  }
  return `Всего: ${run.totalProducts}, создано: ${run.createdProducts}, обновлено: ${run.updatedProducts}, архивировано: ${run.deletedProducts}`;
}
