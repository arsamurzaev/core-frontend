"use client";

import {
  buildMoySkladFormState,
  normalizeTimeZone,
  resolveBrowserTimeZone,
  resolveInitialFormState,
  type MoySkladFormState,
  type ValidationErrors,
} from "@/core/widgets/edit-catalog-drawer/lib/moysklad-form-state";
import {
  buildSchedulePattern,
  getSchedulePresetDescription,
  SCHEDULE_HOUR_OPTIONS,
  SCHEDULE_PRESET_OPTIONS,
  type SchedulePreset,
} from "@/core/widgets/edit-catalog-drawer/lib/moysklad-schedule";
import {
  getRunMeta,
  getRunStatusBadge,
  getRunSummary,
  getStatusBadge,
  getStatusDescription,
} from "@/core/widgets/edit-catalog-drawer/lib/moysklad-status";
import {
  getIntegrationControllerGetMoySkladQueryKey,
  getIntegrationControllerGetMoySkladRunsQueryKey,
  getIntegrationControllerGetMoySkladStatusQueryKey,
  type MoySkladIntegrationStatusDto,
  type UpdateMoySkladIntegrationDtoReq,
  type UpsertMoySkladIntegrationDtoReq,
  useIntegrationControllerCancelMoySkladSync,
  useIntegrationControllerGetMoySkladRuns,
  useIntegrationControllerGetMoySkladStatus,
  useIntegrationControllerSyncMoySkladCatalog,
  useIntegrationControllerTestMoySkladConnection,
  useIntegrationControllerUpdateMoySklad,
  useIntegrationControllerUpsertMoySklad,
} from "@/shared/api/generated/react-query";
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
  FieldTitle,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import React from "react";
import { toast } from "sonner";

const RUNS_LIMIT = 5;

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

export const EditCatalogMoySkladDrawerAdmin: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const statusQuery = useIntegrationControllerGetMoySkladStatus({
    query: { staleTime: 30_000 },
  });
  const runsQuery = useIntegrationControllerGetMoySkladRuns(
    { limit: RUNS_LIMIT },
    { query: { enabled: open, staleTime: 30_000 } },
  );
  const upsertMutation = useIntegrationControllerUpsertMoySklad();
  const updateMutation = useIntegrationControllerUpdateMoySklad();
  const testConnectionMutation = useIntegrationControllerTestMoySkladConnection();
  const syncCatalogMutation = useIntegrationControllerSyncMoySkladCatalog();
  const cancelSyncMutation = useIntegrationControllerCancelMoySkladSync();

  const [formState, setFormState] =
    React.useState<MoySkladFormState>(resolveInitialFormState);
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
    updateMutation.isPending ||
    testConnectionMutation.isPending ||
    syncCatalogMutation.isPending ||
    cancelSyncMutation.isPending;

  const statusBadge = getStatusBadge({
    configured: isConfigured,
    isActive: integration?.isActive,
    hasActiveRun: Boolean(status?.activeRun),
  });
  const statusDescription = getStatusDescription(status);
  const syncHistory = runsQuery.data ?? [];

  const resetLocalState = React.useCallback(
    (nextStatus?: MoySkladIntegrationStatusDto) => {
      const preferredTimeZone = normalizeTimeZone(
        nextStatus?.integration?.scheduleTimezone ?? resolveBrowserTimeZone(),
      );

      setFormState(buildMoySkladFormState(nextStatus, preferredTimeZone));
      setValidationErrors({});
      setErrorMessage(null);
    },
    [],
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen) {
        resetLocalState(statusQuery.data);
        void statusQuery.refetch();
        void runsQuery.refetch();
      }
    },
    [resetLocalState, runsQuery, statusQuery],
  );

  const setFieldValue = React.useCallback(
    <TKey extends keyof MoySkladFormState>(
      key: TKey,
      value: MoySkladFormState[TKey],
    ) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
      setErrorMessage(null);

      if (key === "token") {
        setValidationErrors((prev) => ({ ...prev, token: undefined }));
      }
    },
    [],
  );

  const setSchedulePreset = React.useCallback((value: SchedulePreset) => {
    setFormState((prev) => ({
      ...prev,
      schedulePreset: value,
      scheduleTouched: true,
      legacySchedulePattern: null,
    }));
    setErrorMessage(null);
  }, []);

  const setScheduleHour = React.useCallback((value: string) => {
    setFormState((prev) => ({
      ...prev,
      scheduleHour: value,
      scheduleTouched: true,
      legacySchedulePattern: null,
    }));
    setErrorMessage(null);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (isBusy) return;

    const trimmedToken = formState.token.trim();
    const trimmedPriceTypeName = formState.priceTypeName.trim();
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
      const schedulePattern = !formState.scheduleEnabled
        ? ""
        : !formState.scheduleTouched && formState.legacySchedulePattern
          ? formState.legacySchedulePattern
          : buildSchedulePattern(
              formState.schedulePreset,
              formState.scheduleHour,
            );

      const commonPayload = {
        isActive: formState.isActive,
        priceTypeName: trimmedPriceTypeName || undefined,
        importImages: formState.importImages,
        syncStock: formState.syncStock,
        scheduleEnabled: formState.scheduleEnabled,
        schedulePattern,
        scheduleTimezone: formState.scheduleTimezone,
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
          ? "Настройки MoySklad сохранены."
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
    formState,
    isBusy,
    isConfigured,
    queryClient,
    updateMutation,
    upsertMutation,
  ]);

  const handleTestConnection = React.useCallback(async () => {
    if (isBusy) return;

    const trimmedToken = formState.token.trim();

    if (!isConfigured && !trimmedToken) {
      setValidationErrors({ token: "Введите токен MoySklad." });
      return;
    }

    try {
      await testConnectionMutation.mutateAsync({
        data: trimmedToken ? { token: trimmedToken } : {},
      });
      toast.success("Подключение к MoySklad успешно.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [formState.token, isBusy, isConfigured, testConnectionMutation]);

  const handleSyncNow = React.useCallback(async () => {
    if (isBusy || !isConfigured) return;

    try {
      await syncCatalogMutation.mutateAsync();
      await refreshIntegrationQueries(queryClient);
      toast.success("Sync MoySklad поставлен в очередь.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [isBusy, isConfigured, queryClient, syncCatalogMutation]);

  const handleCancelSync = React.useCallback(async () => {
    if (isBusy || !status?.activeRun) return;

    try {
      await cancelSyncMutation.mutateAsync();
      await refreshIntegrationQueries(queryClient);
      toast.success("Текущий sync MoySklad отменён.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [cancelSyncMutation, isBusy, queryClient, status?.activeRun]);

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
          className="h-auto w-full min-w-0 items-start justify-between rounded-2xl border border-black/10 px-4 py-4 text-left whitespace-normal hover:bg-muted/30"
          disabled={disabled}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                MoySklad
              </span>
              <Badge
                variant={statusBadge.variant}
                className="max-w-full break-words text-left whitespace-normal"
              >
                {statusBadge.label}
              </Badge>
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
              {statusDescription}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="MoySklad"
            description="Подключите токен и управляйте параметрами синхронизации каталога."
            withCloseButton={!isBusy}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-5">
              <div className="rounded-2xl border border-black/10 bg-muted/15 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">Статус</span>
                  <Badge
                    variant={statusBadge.variant}
                    className="max-w-full break-words text-left whitespace-normal"
                  >
                    {statusBadge.label}
                  </Badge>
                </div>
                <p className="mt-2 break-words text-sm text-muted-foreground">
                  {statusDescription}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-background/70 p-4">
                  <div className="text-sm font-medium">Текущий запуск</div>
                  <p className="mt-2 break-words text-sm text-muted-foreground">
                    {status?.activeRun
                      ? getRunMeta(status.activeRun)
                      : "Сейчас активного запуска нет."}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-background/70 p-4">
                  <div className="text-sm font-medium">Последний результат</div>
                  <p className="mt-2 break-words text-sm text-muted-foreground">
                    {status?.lastRun
                      ? getRunSummary(status.lastRun)
                      : "История запусков пока пустая."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto whitespace-normal text-left"
                  onClick={() => void handleTestConnection()}
                  disabled={isBusy}
                >
                  Проверить подключение
                </Button>
                <Button
                  type="button"
                  className="h-auto whitespace-normal text-left"
                  onClick={() => void handleSyncNow()}
                  disabled={isBusy || !isConfigured}
                >
                  Запустить sync
                </Button>
                {status?.activeRun ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto whitespace-normal text-left"
                    onClick={() => void handleCancelSync()}
                    disabled={isBusy}
                  >
                    Отменить sync
                  </Button>
                ) : null}
              </div>

              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="moysklad-token">Токен</FieldLabel>
                  <FieldContent>
                    <Input
                      autoComplete="off"
                      value={formState.token}
                      onChange={(e) => setFieldValue("token", e.target.value)}
                      placeholder={
                        integration?.tokenPreview
                          ? `${integration.tokenPreview} • оставьте пустым, чтобы не менять`
                          : "Введите токен MoySklad"
                      }
                      disabled={isBusy}
                    />
                    <FieldDescription className="break-words">
                      {isConfigured
                        ? "Если оставить поле пустым, текущий токен сохранится."
                        : "Токен нужен для первого подключения и синхронизации."}
                    </FieldDescription>
                    <FieldError>{validationErrors.token}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="moysklad-price-type">
                    Тип цены
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      autoComplete="off"
                      value={formState.priceTypeName}
                      onChange={(e) =>
                        setFieldValue("priceTypeName", e.target.value)
                      }
                      placeholder="Цена продажи"
                      disabled={isBusy}
                    />
                    <FieldDescription className="break-words">
                      Оставьте пустым, если хотите использовать стандартный тип
                      цены.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </div>

              <div className="space-y-3 rounded-2xl border border-black/10 bg-muted/10 p-4">
                {(
                  [
                    {
                      key: "isActive" as const,
                      title: "Интеграция активна",
                      description:
                        "Если выключить, sync запускаться не будет.",
                    },
                    {
                      key: "importImages" as const,
                      title: "Импортировать изображения",
                      description:
                        "Подтягивать фотографии товаров из MoySklad.",
                    },
                    {
                      key: "syncStock" as const,
                      title: "Синхронизировать остатки",
                      description:
                        "Обновлять наличие товара по данным MoySklad.",
                    },
                    {
                      key: "scheduleEnabled" as const,
                      title: "Плановый sync",
                      description:
                        "Запускайте синхронизацию по понятному шаблону без ручного cron.",
                    },
                  ] satisfies {
                    key: keyof MoySkladFormState;
                    title: string;
                    description: string;
                  }[]
                ).map(({ key, title, description }) => (
                  <Field key={key} orientation="responsive">
                    <FieldContent>
                      <FieldTitle>{title}</FieldTitle>
                      <FieldDescription className="break-words">
                        {description}
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      checked={formState[key] as boolean}
                      onCheckedChange={(checked) => setFieldValue(key, checked)}
                      disabled={isBusy}
                    />
                  </Field>
                ))}
              </div>

              {formState.scheduleEnabled ? (
                <div className="space-y-4 rounded-2xl border border-black/10 bg-muted/10 p-4">
                  <Field>
                    <FieldLabel>Частота синхронизации</FieldLabel>
                    <FieldContent>
                      <Select
                        value={formState.schedulePreset}
                        onValueChange={(value) =>
                          setSchedulePreset(value as SchedulePreset)
                        }
                        disabled={isBusy}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите частоту" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHEDULE_PRESET_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription className="break-words">
                        {getSchedulePresetDescription(formState.schedulePreset)}
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  {formState.schedulePreset === "daily" ? (
                    <Field>
                      <FieldLabel>Время запуска</FieldLabel>
                      <FieldContent>
                        <Select
                          value={formState.scheduleHour}
                          onValueChange={setScheduleHour}
                          disabled={isBusy}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите время" />
                          </SelectTrigger>
                          <SelectContent>
                            {SCHEDULE_HOUR_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription className="break-words">
                          Запуск будет происходить каждый день в выбранный час.
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  ) : null}

                  <div className="rounded-2xl border border-black/10 bg-background/70 p-3">
                    <div className="text-sm font-medium">Часовой пояс</div>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {formState.scheduleTimezone}. Определяем автоматически по
                      браузеру, а если это недоступно, используем Москву.
                    </p>
                  </div>

                  {formState.legacySchedulePattern &&
                  !formState.scheduleTouched ? (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
                      Сейчас у интеграции сохранено нестандартное расписание:{" "}
                      <span className="font-medium">
                        {formState.legacySchedulePattern}
                      </span>
                      . Пока вы не меняете этот блок, оно сохранится как есть.
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-2xl border border-black/10 bg-muted/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">Последние запуски</span>
                  {runsQuery.isFetching ? (
                    <span className="text-xs text-muted-foreground">
                      Обновляем…
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 space-y-3">
                  {syncHistory.length ? (
                    syncHistory.map((run) => {
                      const badge = getRunStatusBadge(run.status);

                      return (
                        <div
                          key={run.id}
                          className="rounded-2xl border border-black/10 bg-background/70 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="break-words text-sm font-medium">
                              {getRunMeta(run)}
                            </span>
                            <Badge
                              variant={badge.variant}
                              className="max-w-full break-words text-left whitespace-normal"
                            >
                              {badge.label}
                            </Badge>
                          </div>
                          <p className="mt-2 break-words text-sm text-muted-foreground">
                            {getRunSummary(run)}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      История запусков пока пустая.
                    </p>
                  )}
                </div>
              </div>

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
            btnText={
              isConfigured ? "Сохранить настройки" : "Подключить MoySklad"
            }
            handleClick={() => void handleSubmit()}
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
