"use client";

import {
  getIntegrationControllerGetMoySkladQueryKey,
  getIntegrationControllerGetMoySkladRunsQueryKey,
  getIntegrationControllerGetMoySkladStatusQueryKey,
  type MoySkladIntegrationStatusDto,
  type UpdateMoySkladIntegrationDtoReq,
  type UpsertMoySkladIntegrationDtoReq,
  useIntegrationControllerGetMoySkladStatus,
  useIntegrationControllerUpdateMoySklad,
  useIntegrationControllerUpsertMoySklad,
} from "@/shared/api/generated";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import React from "react";
import { toast } from "sonner";

const DEFAULT_SCHEDULE_TIMEZONE = "Europe/Moscow";
const DEFAULT_DAILY_SYNC_HOUR = "0";

type CatalogFormState = {
  token: string;
};

type ValidationErrors = Partial<Record<"token", string>>;

function resolveBrowserTimeZone(): string | null {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim();
    return timeZone || null;
  } catch {
    return null;
  }
}

function normalizeTimeZone(value?: string | null): string {
  return value?.trim() || DEFAULT_SCHEDULE_TIMEZONE;
}

function formatSyncTimestamp(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStatusBadge(params: {
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

function getStatusDescription(status?: MoySkladIntegrationStatusDto): string {
  if (!status?.configured) {
    return "Добавьте токен для подключения.";
  }

  if (status.activeRun) {
    return "Сейчас выполняется или ожидает запуска синхронизация.";
  }

  const lastRunAt =
    formatSyncTimestamp(status.lastRun?.finishedAt) ??
    formatSyncTimestamp(status.integration?.lastSyncAt);

  if (lastRunAt) {
    return `Последний sync: ${lastRunAt}.`;
  }

  return "Интеграция уже подключена и работает с базовыми настройками.";
}

async function refreshIntegrationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetMoySkladStatusQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetMoySkladQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetMoySkladRunsQueryKey(),
    }),
  ]);
}

export const EditCatalogMoySkladDrawerCatalog: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const queryClient = useQueryClient();
  const statusQuery = useIntegrationControllerGetMoySkladStatus({
    query: {
      staleTime: 30_000,
    },
  });
  const upsertMutation = useIntegrationControllerUpsertMoySklad();
  const updateMutation = useIntegrationControllerUpdateMoySklad();

  const [open, setOpen] = React.useState(false);
  const [formState, setFormState] = React.useState<CatalogFormState>({
    token: "",
  });
  const [validationErrors, setValidationErrors] =
    React.useState<ValidationErrors>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const status = statusQuery.data;
  const integration = status?.integration;
  const isConfigured = Boolean(status?.configured);
  const isBusy =
    disabled ||
    isSaving ||
    upsertMutation.isPending ||
    updateMutation.isPending;
  const statusBadge = getStatusBadge({
    configured: isConfigured,
    isActive: integration?.isActive,
    hasActiveRun: Boolean(status?.activeRun),
  });
  const statusDescription = getStatusDescription(status);

  const resetLocalState = React.useCallback(() => {
    setFormState({ token: "" });
    setValidationErrors({});
    setErrorMessage(null);
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen) {
        resetLocalState();
        void statusQuery.refetch();
      }
    },
    [resetLocalState, statusQuery],
  );

  const setFieldValue = React.useCallback((value: string) => {
    setFormState({ token: value });
    setErrorMessage(null);
    setValidationErrors((prev) => ({ ...prev, token: undefined }));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (isBusy) return;

    const trimmedToken = formState.token.trim();
    const nextErrors: ValidationErrors = {};

    if (!isConfigured && !trimmedToken) {
      nextErrors.token = "Введите токен MoySklad.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const preferredTimeZone = normalizeTimeZone(
        integration?.scheduleTimezone ?? resolveBrowserTimeZone(),
      );

      const commonPayload = {
        isActive: true,
        importImages: true,
        syncStock: true,
        scheduleEnabled: true,
        schedulePattern: `0 ${DEFAULT_DAILY_SYNC_HOUR} * * *`,
        scheduleTimezone: preferredTimeZone,
      };

      if (isConfigured) {
        const payload: UpdateMoySkladIntegrationDtoReq = {
          ...commonPayload,
          ...(trimmedToken ? { token: trimmedToken } : {}),
        };

        await updateMutation.mutateAsync({ data: payload });
      } else {
        const payload: UpsertMoySkladIntegrationDtoReq = {
          ...commonPayload,
          token: trimmedToken,
        };

        await upsertMutation.mutateAsync({ data: payload });
      }

      await refreshIntegrationQueries(queryClient);
      toast.success(
        isConfigured
          ? "Токен MoySklad обновлён."
          : "Интеграция MoySklad подключена. Первичный импорт запускается автоматически.",
      );
      setOpen(false);
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    formState.token,
    integration?.scheduleTimezone,
    isBusy,
    isConfigured,
    queryClient,
    updateMutation,
    upsertMutation,
  ]);

  return (
    <AppDrawer
      nested
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isBusy}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between rounded-2xl border border-black/10 px-4 py-4 text-left hover:bg-muted/30"
          disabled={disabled}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                MoySklad
              </span>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusDescription}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="mx-auto w-full max-w-xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="MoySklad"
            description="Вставьте токен, а остальное приложение настроит автоматически."
            withCloseButton={!isBusy}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-5">
              <div className="rounded-2xl border border-black/10 bg-muted/15 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Статус</span>
                  <Badge variant={statusBadge.variant}>
                    {statusBadge.label}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {statusDescription}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-background/70 p-4">
                <div className="text-sm font-medium">
                  Что включится по умолчанию
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Импорт изображений, синхронизация остатков и ежедневный sync.
                  Часовой пояс берём из браузера, а если он недоступен,
                  используем Москву.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="moysklad-token-catalog">Токен</FieldLabel>
                <FieldContent>
                  <Input
                    autoComplete="off"
                    value={formState.token}
                    onChange={(event) => setFieldValue(event.target.value)}
                    placeholder={
                      integration?.tokenPreview
                        ? `${integration.tokenPreview} • оставьте пустым, чтобы не менять`
                        : "Введите токен MoySklad"
                    }
                    disabled={isBusy}
                  />
                  <FieldDescription>
                    {isConfigured
                      ? "Если оставить поле пустым, текущий токен сохранится."
                      : "После сохранения первый импорт запустится автоматически."}
                  </FieldDescription>
                  <FieldError>{validationErrors.token}</FieldError>
                </FieldContent>
              </Field>

              {errorMessage ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            isAutoClose={false}
            loading={isBusy}
            btnText={isConfigured ? "Обновить токен" : "Подключить MoySklad"}
            handleClick={() => void handleSubmit()}
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
