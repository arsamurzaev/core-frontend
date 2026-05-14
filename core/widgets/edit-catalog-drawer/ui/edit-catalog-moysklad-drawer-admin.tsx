"use client";

import {
  buildMoySkladFormState,
  normalizeTimeZone,
  resolveBrowserTimeZone,
  resolveInitialFormState,
  type MoySkladFormState,
  type ValidationErrors,
} from "@/core/widgets/edit-catalog-drawer/lib/moysklad-form-state";
import { startMoySkladSyncProgressToast } from "@/core/modules/integration/model/start-moysklad-sync-progress-toast";
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
  getCatalogAdvancedSettingsControllerGetMoySkladQueryKey,
  getCatalogAdvancedSettingsControllerGetMoySkladOrderExportRefsQueryKey,
  getCatalogAdvancedSettingsControllerGetMoySkladRunsQueryKey,
  getCatalogAdvancedSettingsControllerGetMoySkladStatusQueryKey,
  getIntegrationControllerGetMoySkladOrderExportsQueryKey,
  getIntegrationControllerPreviewMoySkladMappingQueryKey,
  type ApplyMoySkladMappingDtoReq,
  type IntegrationProviderCapabilitiesDto,
  type MoySkladMappingApplyReportDto,
  type MoySkladMappingPreviewDto,
  type MoySkladIntegrationStatusDto,
  type MoySkladOrderExportDto,
  type MoySkladOrderExportRefOptionDto,
  type UpdateMoySkladIntegrationDtoReq,
  type UpsertMoySkladIntegrationDtoReq,
  useCatalogAdvancedSettingsControllerCancelMoySkladSync,
  useCatalogAdvancedSettingsControllerGetMoySkladOrderExportRefs,
  useCatalogAdvancedSettingsControllerGetMoySkladRuns,
  useCatalogAdvancedSettingsControllerGetMoySkladStatus,
  useCatalogAdvancedSettingsControllerSyncMoySkladCatalog,
  useCatalogAdvancedSettingsControllerTestMoySkladConnection,
  useCatalogAdvancedSettingsControllerUpdateMoySklad,
  useCatalogAdvancedSettingsControllerUpsertMoySklad,
  useIntegrationControllerApplyMoySkladMapping,
  useIntegrationControllerGetMoySkladOrderExports,
  useIntegrationControllerPreviewMoySkladMapping,
  useIntegrationControllerRetryMoySkladOrderExport,
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
const ORDER_EXPORTS_LIMIT = 5;

type OrderExportRefField =
  | "orderExportOrganizationId"
  | "orderExportCounterpartyId"
  | "orderExportStoreId";

const CAPABILITY_LABELS: Record<
  keyof IntegrationProviderCapabilitiesDto,
  string
> = {
  productImport: "Товары",
  variantImport: "Варианты",
  stockImport: "Остатки",
  imageImport: "Изображения",
  orderExport: "Экспорт заказов",
  reservation: "Резервы",
  webhook: "Webhook",
};

function formatDateTime(value?: string | null): string {
  if (!value) return "нет даты";

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOptionalDateTime(value?: string | null): string | null {
  if (!value) return null;
  return formatDateTime(value);
}

function getOrderExportStatusBadge(status: MoySkladOrderExportDto["status"]) {
  switch (status) {
    case "SUCCESS":
      return { label: "Готово", variant: "default" as const };
    case "ERROR":
      return { label: "Ошибка", variant: "destructive" as const };
    case "RUNNING":
      return { label: "Выполняется", variant: "secondary" as const };
    case "PENDING":
      return { label: "В очереди", variant: "secondary" as const };
    case "SKIPPED":
      return { label: "Пропущено", variant: "outline" as const };
    default:
      return { label: status, variant: "outline" as const };
  }
}

function getMappingPreviewSummary(preview?: MoySkladMappingPreviewDto): string {
  if (!preview)
    return "Загрузите preview, чтобы увидеть неизвестные характеристики.";

  const counters = preview.counters;
  return [
    `${counters.characteristics} характеристик`,
    `${counters.unknownAttributes} новых атрибутов`,
    `${counters.unknownEnumValues} новых значений`,
    `${counters.suggestedExistingValues} подсказок`,
  ].join(" · ");
}

function getMappingReportSummary(
  report?: MoySkladMappingApplyReportDto | null,
) {
  if (!report) return null;

  return [
    `создано: ${report.created.total}`,
    `связано: ${report.linked.total}`,
    `пропущено: ${report.skipped.total}`,
  ].join(" · ");
}

function getRefOptionLabel(option: MoySkladOrderExportRefOptionDto): string {
  return option.archived ? `${option.name} (архив)` : option.name;
}

function getRefOptionMeta(
  option: MoySkladOrderExportRefOptionDto,
): string | null {
  const parts = [option.code, option.externalCode].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function withSelectedRefOption(
  options: MoySkladOrderExportRefOptionDto[],
  selectedId: string,
  fallbackName: string,
): MoySkladOrderExportRefOptionDto[] {
  if (!selectedId || options.some((option) => option.id === selectedId)) {
    return options;
  }

  return [
    {
      id: selectedId,
      name: `${fallbackName} больше не найден`,
      code: null,
      externalCode: selectedId,
      archived: true,
    },
    ...options,
  ];
}

async function refreshIntegrationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetMoySkladStatusQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetMoySkladQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetMoySkladRunsQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey:
        getCatalogAdvancedSettingsControllerGetMoySkladOrderExportRefsQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetMoySkladOrderExportsQueryKey({
        limit: ORDER_EXPORTS_LIMIT,
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerPreviewMoySkladMappingQueryKey(),
    }),
  ]);
}

export const EditCatalogMoySkladDrawerAdmin: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const statusQuery = useCatalogAdvancedSettingsControllerGetMoySkladStatus({
    query: { staleTime: 30_000 },
  });
  const status = statusQuery.data;
  const integration = status?.integration;
  const isConfigured = Boolean(status?.configured);
  const runsQuery = useCatalogAdvancedSettingsControllerGetMoySkladRuns(
    { limit: RUNS_LIMIT },
    { query: { enabled: open, staleTime: 30_000 } },
  );
  const orderExportRefsQuery =
    useCatalogAdvancedSettingsControllerGetMoySkladOrderExportRefs({
      query: {
        enabled: open && isConfigured,
        staleTime: 5 * 60_000,
        retry: false,
      },
    });
  const orderExportsQuery = useIntegrationControllerGetMoySkladOrderExports(
    { limit: ORDER_EXPORTS_LIMIT },
    { query: { enabled: open, staleTime: 30_000 } },
  );
  const mappingPreviewQuery = useIntegrationControllerPreviewMoySkladMapping({
    query: { enabled: false, staleTime: 30_000 },
  });
  const upsertMutation = useCatalogAdvancedSettingsControllerUpsertMoySklad();
  const updateMutation = useCatalogAdvancedSettingsControllerUpdateMoySklad();
  const testConnectionMutation =
    useCatalogAdvancedSettingsControllerTestMoySkladConnection();
  const syncCatalogMutation =
    useCatalogAdvancedSettingsControllerSyncMoySkladCatalog();
  const cancelSyncMutation =
    useCatalogAdvancedSettingsControllerCancelMoySkladSync();
  const applyMappingMutation = useIntegrationControllerApplyMoySkladMapping();
  const retryOrderExportMutation =
    useIntegrationControllerRetryMoySkladOrderExport();

  const [formState, setFormState] = React.useState<MoySkladFormState>(
    resolveInitialFormState,
  );
  const [validationErrors, setValidationErrors] =
    React.useState<ValidationErrors>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [mappingReport, setMappingReport] =
    React.useState<MoySkladMappingApplyReportDto | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const isBusy =
    disabled ||
    isSaving ||
    upsertMutation.isPending ||
    updateMutation.isPending ||
    testConnectionMutation.isPending ||
    syncCatalogMutation.isPending ||
    cancelSyncMutation.isPending ||
    applyMappingMutation.isPending ||
    retryOrderExportMutation.isPending;

  const statusBadge = getStatusBadge({
    configured: isConfigured,
    isActive: integration?.isActive,
    hasActiveRun: Boolean(status?.activeRun),
  });
  const statusDescription = getStatusDescription(status);
  const syncHistory = runsQuery.data ?? [];
  const orderExports = orderExportsQuery.data ?? [];
  const orderExportRefs = orderExportRefsQuery.data;
  const mappingPreview = mappingPreviewQuery.data;
  const mappingReportSummary = getMappingReportSummary(mappingReport);
  const organizationOptions = React.useMemo(
    () =>
      withSelectedRefOption(
        orderExportRefs?.organizations ?? [],
        formState.orderExportOrganizationId,
        "Организация",
      ),
    [formState.orderExportOrganizationId, orderExportRefs?.organizations],
  );
  const counterpartyOptions = React.useMemo(
    () =>
      withSelectedRefOption(
        orderExportRefs?.counterparties ?? [],
        formState.orderExportCounterpartyId,
        "Контрагент",
      ),
    [formState.orderExportCounterpartyId, orderExportRefs?.counterparties],
  );
  const storeOptions = React.useMemo(
    () =>
      withSelectedRefOption(
        orderExportRefs?.stores ?? [],
        formState.orderExportStoreId,
        "Склад",
      ),
    [formState.orderExportStoreId, orderExportRefs?.stores],
  );

  const resetLocalState = React.useCallback(
    (nextStatus?: MoySkladIntegrationStatusDto) => {
      const preferredTimeZone = normalizeTimeZone(
        nextStatus?.integration?.scheduleTimezone ?? resolveBrowserTimeZone(),
      );

      setFormState(buildMoySkladFormState(nextStatus, preferredTimeZone));
      setValidationErrors({});
      setErrorMessage(null);
      setMappingReport(null);
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
        if (isConfigured) {
          void orderExportRefsQuery.refetch();
        }
        void orderExportsQuery.refetch();
      }
    },
    [
      isConfigured,
      orderExportRefsQuery,
      orderExportsQuery,
      resetLocalState,
      runsQuery,
      statusQuery,
    ],
  );

  const setFieldValue = React.useCallback(
    <TKey extends keyof MoySkladFormState>(
      key: TKey,
      value: MoySkladFormState[TKey],
    ) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
      setErrorMessage(null);

      if (
        key === "token" ||
        key === "orderExportOrganizationId" ||
        key === "orderExportCounterpartyId" ||
        key === "orderExportStoreId"
      ) {
        setValidationErrors((prev) => ({ ...prev, [key]: undefined }));
      }

      if (key === "exportOrders" && value === false) {
        setValidationErrors((prev) => ({
          ...prev,
          orderExportOrganizationId: undefined,
          orderExportCounterpartyId: undefined,
          orderExportStoreId: undefined,
        }));
      }

      if ((key === "syncStock" || key === "isActive") && value === false) {
        setFormState((prev) => ({ ...prev, stockWebhookEnabled: false }));
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

    if (formState.exportOrders) {
      if (!formState.orderExportOrganizationId) {
        nextErrors.orderExportOrganizationId =
          "Выберите организацию, от имени которой будет создан заказ.";
      }
      if (!formState.orderExportCounterpartyId) {
        nextErrors.orderExportCounterpartyId =
          "Выберите контрагента для заказов с сайта.";
      }
      if (!formState.orderExportStoreId) {
        nextErrors.orderExportStoreId =
          "Выберите склад, с которого будут списываться позиции.";
      }
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
        stockWebhookEnabled:
          formState.isActive &&
          formState.syncStock &&
          formState.stockWebhookEnabled,
        exportOrders: formState.exportOrders,
        orderExportOrganizationId: formState.exportOrders
          ? formState.orderExportOrganizationId
          : null,
        orderExportCounterpartyId: formState.exportOrders
          ? formState.orderExportCounterpartyId
          : null,
        orderExportStoreId: formState.exportOrders
          ? formState.orderExportStoreId
          : null,
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
      const queued = await syncCatalogMutation.mutateAsync();
      await refreshIntegrationQueries(queryClient);
      startMoySkladSyncProgressToast({
        runId: queued.runId,
        title: "Синхронизация каталога MoySklad",
        onSettled: () => refreshIntegrationQueries(queryClient),
      });
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

  const handleLoadMappingPreview = React.useCallback(async () => {
    if (isBusy || !isConfigured) return;

    try {
      setMappingReport(null);
      await mappingPreviewQuery.refetch();
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [isBusy, isConfigured, mappingPreviewQuery]);

  const handleApplyMappingPreview = React.useCallback(async () => {
    if (isBusy || !mappingPreview) return;

    const payload: ApplyMoySkladMappingDtoReq = {
      attributes: mappingPreview.unknownAttributes.map((attribute) => ({
        externalName: attribute.externalName,
        action: "CREATE",
        key: attribute.suggestedKey,
        displayName: attribute.externalName,
      })),
      enumValues: mappingPreview.unknownEnumValues.map((enumValue) => ({
        externalAttributeName: enumValue.externalAttributeName,
        externalValue: enumValue.externalValue,
        action: "CREATE",
        value: enumValue.normalizedValue,
        displayName: enumValue.externalValue,
      })),
    };

    try {
      const report = await applyMappingMutation.mutateAsync({ data: payload });
      setMappingReport(report);
      await mappingPreviewQuery.refetch();
      toast.success("Mapping MoySklad применён.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [applyMappingMutation, isBusy, mappingPreview, mappingPreviewQuery]);

  const handleRetryOrderExport = React.useCallback(
    async (id: string) => {
      if (isBusy) return;

      try {
        await retryOrderExportMutation.mutateAsync({ id });
        await orderExportsQuery.refetch();
        toast.success("Экспорт заказа поставлен в очередь.");
      } catch (error) {
        const message = extractApiErrorMessage(error);
        setErrorMessage(message);
        toast.error(message);
      }
    },
    [isBusy, orderExportsQuery, retryOrderExportMutation],
  );

  const renderOrderExportRefSelect = (
    field: OrderExportRefField,
    label: string,
    placeholder: string,
    options: MoySkladOrderExportRefOptionDto[],
  ) => (
    <Field key={field}>
      <FieldLabel>{label}</FieldLabel>
      <FieldContent>
        <Select
          value={formState[field]}
          onValueChange={(value) => setFieldValue(field, value)}
          disabled={
            isBusy || orderExportRefsQuery.isFetching || !options.length
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => {
              const meta = getRefOptionMeta(option);

              return (
                <SelectItem key={option.id} value={option.id}>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {getRefOptionLabel(option)}
                    </span>
                    {meta ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {meta}
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <FieldError>{validationErrors[field]}</FieldError>
      </FieldContent>
    </Field>
  );

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

              {integration?.capabilities ? (
                <div className="rounded-2xl border border-black/10 bg-muted/10 p-4">
                  <div className="text-sm font-medium">
                    Возможности provider
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(CAPABILITY_LABELS).map(([key, label]) => {
                      const enabled =
                        integration.capabilities[
                          key as keyof IntegrationProviderCapabilitiesDto
                        ];

                      return (
                        <Badge
                          key={key}
                          variant={enabled ? "default" : "outline"}
                          className="max-w-full break-words text-left whitespace-normal"
                        >
                          {label}: {enabled ? "доступно" : "недоступно"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ) : null}

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
                      description: "Если выключить, sync запускаться не будет.",
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
                      key: "stockWebhookEnabled" as const,
                      title: "Быстрые остатки через webhook",
                      description:
                        "Получать изменения остатков из MoySklad без ожидания планового sync.",
                    },
                    {
                      key: "exportOrders" as const,
                      title: "Экспортировать заказы",
                      description:
                        "Передавать оформленные заказы в MoySklad, если provider это поддерживает.",
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
                      onCheckedChange={(checked) => {
                        setFieldValue(key, checked);
                        if (key === "exportOrders" && checked && isConfigured) {
                          void orderExportRefsQuery.refetch();
                        }
                      }}
                      disabled={
                        isBusy ||
                        (key === "exportOrders" &&
                          (!isConfigured ||
                            integration?.capabilities.orderExport === false)) ||
                        (key === "stockWebhookEnabled" &&
                          (!formState.isActive ||
                            !formState.syncStock ||
                            integration?.capabilities.webhook === false))
                      }
                    />
                  </Field>
                ))}
              </div>

              {integration?.stockWebhook ? (
                <div className="rounded-2xl border border-black/10 bg-muted/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium">Webhook остатков</span>
                    <Badge
                      variant={
                        integration.stockWebhook.enabled &&
                        integration.stockWebhook.registered
                          ? "default"
                          : "outline"
                      }
                      className="max-w-full break-words text-left whitespace-normal"
                    >
                      {integration.stockWebhook.enabled &&
                      integration.stockWebhook.registered
                        ? "зарегистрирован"
                        : integration.stockWebhook.enabled
                          ? "ожидает регистрации"
                          : "выключен"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <span>
                      Тип отчета: {integration.stockWebhook.reportType || "all"}
                    </span>
                    <span>
                      Остатки: {integration.stockWebhook.stockType || "stock"}
                    </span>
                    <span>
                      Получен:{" "}
                      {formatOptionalDateTime(
                        integration.stockWebhook.lastReceivedAt,
                      ) ?? "еще нет"}
                    </span>
                    <span>
                      Обработан:{" "}
                      {formatOptionalDateTime(
                        integration.stockWebhook.lastProcessedAt,
                      ) ?? "еще нет"}
                    </span>
                  </div>
                  {integration.stockWebhook.lastError ? (
                    <p className="mt-3 break-words text-sm text-destructive">
                      {integration.stockWebhook.lastError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {formState.exportOrders ? (
                <div className="space-y-4 rounded-2xl border border-black/10 bg-muted/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        Куда создавать заказы
                      </div>
                      <p className="mt-1 break-words text-sm text-muted-foreground">
                        Эти значения берём из MoySklad. После сохранения новый
                        завершённый заказ появится в разделе «Заказы
                        покупателей».
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto whitespace-normal text-left"
                      onClick={() => void orderExportRefsQuery.refetch()}
                      disabled={isBusy || orderExportRefsQuery.isFetching}
                    >
                      Обновить списки
                    </Button>
                  </div>

                  {orderExportRefsQuery.isFetching ? (
                    <p className="text-sm text-muted-foreground">
                      Загружаем данные из MoySklad…
                    </p>
                  ) : null}

                  {orderExportRefsQuery.isError ? (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {extractApiErrorMessage(orderExportRefsQuery.error)}
                    </div>
                  ) : null}

                  <div className="grid gap-4">
                    {renderOrderExportRefSelect(
                      "orderExportOrganizationId",
                      "Организация",
                      "Выберите организацию",
                      organizationOptions,
                    )}
                    {renderOrderExportRefSelect(
                      "orderExportCounterpartyId",
                      "Контрагент",
                      "Выберите контрагента",
                      counterpartyOptions,
                    )}
                    {renderOrderExportRefSelect(
                      "orderExportStoreId",
                      "Склад",
                      "Выберите склад",
                      storeOptions,
                    )}
                  </div>

                  {!orderExportRefsQuery.isFetching &&
                  (!organizationOptions.length ||
                    !counterpartyOptions.length ||
                    !storeOptions.length) ? (
                    <p className="break-words text-sm text-muted-foreground">
                      Если какой-то список пустой, проверьте права токена и
                      наличие организации, контрагента и склада в MoySklad.
                    </p>
                  ) : null}
                </div>
              ) : null}

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
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
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
                  <div>
                    <div className="text-sm font-medium">
                      Mapping характеристик
                    </div>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {getMappingPreviewSummary(mappingPreview)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto whitespace-normal text-left"
                      onClick={() => void handleLoadMappingPreview()}
                      disabled={
                        isBusy ||
                        !isConfigured ||
                        mappingPreviewQuery.isFetching
                      }
                    >
                      Обновить preview
                    </Button>
                    <Button
                      type="button"
                      className="h-auto whitespace-normal text-left"
                      onClick={() => void handleApplyMappingPreview()}
                      disabled={
                        isBusy ||
                        !mappingPreview ||
                        (!mappingPreview.unknownAttributes.length &&
                          !mappingPreview.unknownEnumValues.length)
                      }
                    >
                      Создать новые
                    </Button>
                  </div>
                </div>

                {mappingReportSummary ? (
                  <div className="mt-3 rounded-2xl border border-black/10 bg-background/70 p-3 text-sm text-muted-foreground">
                    Последнее применение: {mappingReportSummary}
                  </div>
                ) : null}

                {mappingPreview ? (
                  <div className="mt-3 grid gap-3">
                    {mappingPreview.unknownAttributes
                      .slice(0, 4)
                      .map((item) => (
                        <div
                          key={item.externalName}
                          className="rounded-2xl border border-black/10 bg-background/70 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="break-words text-sm font-medium">
                              {item.externalName}
                            </span>
                            <Badge variant="outline">
                              {item.occurrences} шт.
                            </Badge>
                          </div>
                          <p className="mt-1 break-words text-sm text-muted-foreground">
                            Новый ключ: {item.suggestedKey}
                          </p>
                          {item.suggestedExistingAttributes.length ? (
                            <p className="mt-1 break-words text-xs text-muted-foreground">
                              Похожие:{" "}
                              {item.suggestedExistingAttributes
                                .slice(0, 3)
                                .map((attribute) => attribute.displayName)
                                .join(", ")}
                            </p>
                          ) : null}
                        </div>
                      ))}

                    {mappingPreview.unknownEnumValues
                      .slice(0, 4)
                      .map((item) => (
                        <div
                          key={`${item.externalAttributeName}:${item.externalValue}`}
                          className="rounded-2xl border border-black/10 bg-background/70 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="break-words text-sm font-medium">
                              {item.externalAttributeName}
                            </span>
                            <Badge variant="outline">
                              {item.occurrences} шт.
                            </Badge>
                          </div>
                          <p className="mt-1 break-words text-sm text-muted-foreground">
                            Значение: {item.externalValue}
                          </p>
                        </div>
                      ))}

                    {!mappingPreview.unknownAttributes.length &&
                    !mappingPreview.unknownEnumValues.length ? (
                      <p className="text-sm text-muted-foreground">
                        Неизвестных характеристик и значений нет.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

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
                          <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                            <span>
                              Товары: {run.products.created}/
                              {run.products.updated}/{run.products.skipped}
                            </span>
                            <span>
                              Варианты: {run.variants.created}/
                              {run.variants.updated}/{run.variants.skipped}
                            </span>
                            <span>
                              Остатки: {run.stockRows.applied}/
                              {run.stockRows.skipped}
                            </span>
                          </div>
                          {run.warnings.length || run.errors.length ? (
                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {[...run.errors, ...run.warnings]
                                .slice(0, 3)
                                .map((issue) => (
                                  <p
                                    key={`${issue.code}:${issue.externalId ?? ""}`}
                                    className="break-words"
                                  >
                                    {issue.code}: {issue.message}
                                    {issue.count ? ` (${issue.count})` : ""}
                                  </p>
                                ))}
                            </div>
                          ) : null}
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

              <div className="rounded-2xl border border-black/10 bg-muted/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">Экспорт заказов</span>
                  {orderExportsQuery.isFetching ? (
                    <span className="text-xs text-muted-foreground">
                      Обновляем…
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 space-y-3">
                  {orderExports.length ? (
                    orderExports.map((orderExport) => {
                      const badge = getOrderExportStatusBadge(
                        orderExport.status,
                      );

                      return (
                        <div
                          key={orderExport.id}
                          className="rounded-2xl border border-black/10 bg-background/70 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="break-words text-sm font-medium">
                              Заказ {orderExport.orderId}
                            </span>
                            <Badge
                              variant={badge.variant}
                              className="max-w-full break-words text-left whitespace-normal"
                            >
                              {badge.label}
                            </Badge>
                          </div>
                          <p className="mt-2 break-words text-sm text-muted-foreground">
                            Запрошен {formatDateTime(orderExport.requestedAt)} ·
                            попыток: {orderExport.attempts}
                          </p>
                          {orderExport.externalId ? (
                            <p className="mt-1 break-words text-xs text-muted-foreground">
                              MoySklad: {orderExport.externalId}
                            </p>
                          ) : null}
                          {orderExport.lastError ? (
                            <p className="mt-1 break-words text-xs text-destructive">
                              {orderExport.lastError}
                            </p>
                          ) : null}
                          {orderExport.status === "ERROR" ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3 h-auto whitespace-normal text-left"
                              onClick={() =>
                                void handleRetryOrderExport(orderExport.id)
                              }
                              disabled={isBusy}
                            >
                              Повторить экспорт
                            </Button>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Экспортов заказов пока нет.
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
