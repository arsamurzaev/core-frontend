"use client";

import { startIikoSyncProgressToast } from "@/core/modules/integration";
import {
  invalidateIikoIntegrationQueries,
  invalidateProductQueries,
} from "@/core/modules/product";
import {
  getCatalogAdvancedSettingsControllerGetIikoQueryKey,
  getCatalogAdvancedSettingsControllerGetIikoRunsQueryKey,
  getCatalogAdvancedSettingsControllerGetIikoStatusQueryKey,
  getCatalogAdvancedSettingsControllerGetIikoWebhookEventsQueryKey,
  type IikoExternalMenuDto,
  type IikoImportPreviewDto,
  type IikoOrderExportDto,
  type IikoOrganizationDto,
  type IikoPriceCategoryDto,
  type IikoTerminalGroupDto,
  type IikoWebhookEventDto,
  type PreviewIikoImportDtoReq,
  type UpdateIikoIntegrationDtoReq,
  type UpsertIikoIntegrationDtoReq,
  getIntegrationControllerGetIikoOrderExportsQueryKey,
  useCatalogAdvancedSettingsControllerGetIikoRuns,
  useCatalogAdvancedSettingsControllerGetIikoStatus,
  useCatalogAdvancedSettingsControllerGetIikoWebhookEvents,
  useCatalogAdvancedSettingsControllerPreviewIikoImport,
  useCatalogAdvancedSettingsControllerRemoveIiko,
  useCatalogAdvancedSettingsControllerRetryIikoWebhookEvent,
  useCatalogAdvancedSettingsControllerDisableIikoWebhooks,
  useCatalogAdvancedSettingsControllerSetupIikoWebhooks,
  useCatalogAdvancedSettingsControllerSyncIikoCatalog,
  useCatalogAdvancedSettingsControllerSyncIikoStock,
  useCatalogAdvancedSettingsControllerTestIikoConnection,
  useCatalogAdvancedSettingsControllerUpdateIiko,
  useCatalogAdvancedSettingsControllerUpsertIiko,
  useIntegrationControllerGetIikoOrderExports,
  useIntegrationControllerRetryIikoOrderExport,
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
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  PlugZap,
  RefreshCw,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import {
  buildIikoDiagnostics,
  getIikoDiagnosticSummary,
  type IikoDiagnosticTone,
} from "../model/iiko-diagnostics";

type IikoFormState = {
  apiLogin: string;
  organizationId: string;
  organizationName: string | null;
  externalMenuId: string;
  externalMenuName: string | null;
  priceCategoryId: string;
  priceCategoryName: string | null;
  terminalGroupId: string;
  terminalGroupName: string | null;
  menuVersion: number;
  isActive: boolean;
  importImages: boolean;
  exportOrders: boolean;
  orderExportServiceType: "" | "DeliveryByCourier" | "DeliveryByClient";
  orderExportSourceKey: string;
};

type ValidationErrors = Partial<
  Record<
    | "apiLogin"
    | "organizationId"
    | "externalMenuId"
    | "priceCategoryId"
    | "terminalGroupId",
    string
  >
>;

const PRICE_CATEGORY_NONE_VALUE = "__none";
const ORDER_EXPORT_SERVICE_TYPE_AUTO_VALUE = "__auto";
const ORDER_EXPORTS_LIMIT = 5;
const IIKO_RUNS_LIMIT = 8;
const IIKO_WEBHOOK_EVENTS_LIMIT = 8;

function formatSyncTimestamp(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getOrderExportStatusBadge(status: IikoOrderExportDto["status"]) {
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

function getWebhookEventStatusBadge(status: IikoWebhookEventDto["status"]) {
  switch (status) {
    case "PROCESSED":
      return { label: "Обработано", variant: "default" as const };
    case "FAILED":
      return { label: "Ошибка", variant: "destructive" as const };
    case "PROCESSING":
      return { label: "В работе", variant: "secondary" as const };
    case "PENDING":
      return { label: "В очереди", variant: "secondary" as const };
    case "SKIPPED":
      return { label: "Пропущено", variant: "outline" as const };
    default:
      return { label: status, variant: "outline" as const };
  }
}

function formatWebhookDetailValue(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function formatIikoDiffStatus(value?: string | null): string {
  switch (value) {
    case "new":
      return "новый";
    case "price_changed":
      return "цена";
    case "name_changed":
      return "название";
    case "changed":
      return "изменится";
    case "unchanged":
      return "без изменений";
    case "skipped":
      return "skip";
    default:
      return value ?? "—";
  }
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(Number(value));
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

function getStatusDescription(
  configured: boolean,
  hasActiveRun: boolean,
  lastRunAt?: string | null,
) {
  if (!configured) {
    return "Добавьте apiLogin, проверьте подключение, выберите организацию и External Menu.";
  }

  if (hasActiveRun) {
    return "Сейчас выполняется или ожидает запуска импорт меню iiko.";
  }

  if (lastRunAt) {
    return `Последний импорт меню: ${lastRunAt}.`;
  }

  return "apiLogin, организация и External Menu сохранены, импорт запускается вручную.";
}

function resolveOrganizationName(
  organizations: IikoOrganizationDto[],
  organizationId: string,
  fallback?: string | null,
) {
  return (
    organizations.find((organization) => organization.id === organizationId)
      ?.name ??
    fallback ??
    null
  );
}

function resolveExternalMenuName(
  externalMenus: IikoExternalMenuDto[],
  externalMenuId: string,
  fallback?: string | null,
) {
  return (
    externalMenus.find((externalMenu) => externalMenu.id === externalMenuId)
      ?.name ??
    fallback ??
    null
  );
}

function resolvePriceCategoryName(
  priceCategories: IikoPriceCategoryDto[],
  priceCategoryId: string,
  fallback?: string | null,
) {
  return (
    priceCategories.find(
      (priceCategory) => priceCategory.id === priceCategoryId,
    )?.name ??
    fallback ??
    null
  );
}

function resolveTerminalGroupName(
  terminalGroups: IikoTerminalGroupDto[],
  terminalGroupId: string,
  fallback?: string | null,
) {
  return (
    terminalGroups.find((terminalGroup) => terminalGroup.id === terminalGroupId)
      ?.name ??
    fallback ??
    null
  );
}

function formatCounter(value?: number | null) {
  return (value ?? 0).toLocaleString("ru-RU");
}

function formatIikoPreviewSkipReason(reason: string) {
  switch (reason) {
    case "hidden":
      return "скрыт";
    case "no_price":
      return "без цены";
    case "combo":
      return "combo";
    case "modifier":
      return "модификатор";
    case "unsupported_type":
      return "тип";
    case "unsupported_order_item_type":
      return "order type";
    default:
      return reason;
  }
}

function getIikoDiagnosticIcon(tone: IikoDiagnosticTone): LucideIcon {
  switch (tone) {
    case "ok":
      return CheckCircle2;
    case "warning":
      return AlertTriangle;
    case "error":
      return XCircle;
    case "pending":
    default:
      return Clock3;
  }
}

function getIikoDiagnosticToneClassName(tone: IikoDiagnosticTone) {
  switch (tone) {
    case "ok":
      return "text-status-success";
    case "warning":
      return "text-status-warning";
    case "error":
      return "text-status-danger";
    case "pending":
    default:
      return "text-text-muted";
  }
}

async function refreshIikoQueries(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetIikoStatusQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetIikoQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetIikoRunsQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey:
        getCatalogAdvancedSettingsControllerGetIikoWebhookEventsQueryKey({
          limit: IIKO_WEBHOOK_EVENTS_LIMIT,
        }),
    }),
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetIikoOrderExportsQueryKey({
        limit: ORDER_EXPORTS_LIMIT,
      }),
    }),
    invalidateIikoIntegrationQueries(queryClient),
  ]);
}

export const EditCatalogIikoDrawer: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const queryClient = useQueryClient();
  const statusQuery = useCatalogAdvancedSettingsControllerGetIikoStatus({
    query: {
      staleTime: 30_000,
    },
  });
  const upsertMutation = useCatalogAdvancedSettingsControllerUpsertIiko();
  const updateMutation = useCatalogAdvancedSettingsControllerUpdateIiko();
  const removeMutation = useCatalogAdvancedSettingsControllerRemoveIiko();
  const testConnectionMutation =
    useCatalogAdvancedSettingsControllerTestIikoConnection();
  const previewMutation =
    useCatalogAdvancedSettingsControllerPreviewIikoImport();
  const syncMutation = useCatalogAdvancedSettingsControllerSyncIikoCatalog();
  const stockSyncMutation = useCatalogAdvancedSettingsControllerSyncIikoStock();
  const setupWebhooksMutation =
    useCatalogAdvancedSettingsControllerSetupIikoWebhooks();
  const disableWebhooksMutation =
    useCatalogAdvancedSettingsControllerDisableIikoWebhooks();
  const retryWebhookEventMutation =
    useCatalogAdvancedSettingsControllerRetryIikoWebhookEvent();
  const retryOrderExportMutation =
    useIntegrationControllerRetryIikoOrderExport();

  const [open, setOpen] = React.useState(false);
  const orderExportsQuery = useIntegrationControllerGetIikoOrderExports(
    { limit: ORDER_EXPORTS_LIMIT },
    {
      query: {
        enabled: open,
        staleTime: 30_000,
      },
    },
  );
  const runsQuery = useCatalogAdvancedSettingsControllerGetIikoRuns(
    { limit: IIKO_RUNS_LIMIT },
    {
      query: {
        enabled: open,
        staleTime: 30_000,
      },
    },
  );
  const webhookEventsQuery =
    useCatalogAdvancedSettingsControllerGetIikoWebhookEvents(
      { limit: IIKO_WEBHOOK_EVENTS_LIMIT },
      {
        query: {
          enabled: open && Boolean(statusQuery.data?.configured),
          staleTime: 15_000,
        },
      },
    );
  const [organizations, setOrganizations] = React.useState<
    IikoOrganizationDto[]
  >([]);
  const [externalMenus, setExternalMenus] = React.useState<
    IikoExternalMenuDto[]
  >([]);
  const [priceCategories, setPriceCategories] = React.useState<
    IikoPriceCategoryDto[]
  >([]);
  const [terminalGroups, setTerminalGroups] = React.useState<
    IikoTerminalGroupDto[]
  >([]);
  const [preview, setPreview] = React.useState<IikoImportPreviewDto | null>(
    null,
  );
  const [formState, setFormState] = React.useState<IikoFormState>({
    apiLogin: "",
    organizationId: "",
    organizationName: null,
    externalMenuId: "",
    externalMenuName: null,
    priceCategoryId: "",
    priceCategoryName: null,
    terminalGroupId: "",
    terminalGroupName: null,
    menuVersion: 4,
    isActive: true,
    importImages: false,
    exportOrders: false,
    orderExportServiceType: "",
    orderExportSourceKey: "",
  });
  const [validationErrors, setValidationErrors] =
    React.useState<ValidationErrors>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const autoRefreshConnectionRef = React.useRef(false);

  const status = statusQuery.data;
  const integration = status?.integration;
  const isConfigured = Boolean(status?.configured);
  const hasActiveRun = Boolean(status?.activeRun);
  const isBusy =
    disabled ||
    upsertMutation.isPending ||
    updateMutation.isPending ||
    removeMutation.isPending ||
    testConnectionMutation.isPending ||
    previewMutation.isPending ||
    syncMutation.isPending ||
    stockSyncMutation.isPending ||
    setupWebhooksMutation.isPending ||
    disableWebhooksMutation.isPending ||
    retryWebhookEventMutation.isPending ||
    retryOrderExportMutation.isPending;
  const orderExports = React.useMemo(
    () => orderExportsQuery.data ?? [],
    [orderExportsQuery.data],
  );
  const webhookEvents = React.useMemo(
    () => webhookEventsQuery.data ?? [],
    [webhookEventsQuery.data],
  );
  const runs = React.useMemo(() => runsQuery.data ?? [], [runsQuery.data]);
  const integrationTimeline = React.useMemo(() => {
    const items = [
      ...webhookEvents.map((event) => ({
        id: `webhook:${event.id}`,
        type: "webhook",
        title: event.eventType,
        detail: event.error ?? event.jobId ?? "webhook iiko",
        status: event.status,
        occurredAt: event.processedAt ?? event.receivedAt,
      })),
      ...runs.map((run) => ({
        id: `run:${run.id}`,
        type: "sync",
        title: run.mode === "STOCK" ? "Stop-list sync" : "Menu sync",
        detail: run.error ?? run.trigger ?? run.mode,
        status: run.status,
        occurredAt: run.finishedAt ?? run.startedAt ?? run.createdAt,
      })),
      ...orderExports.map((orderExport) => ({
        id: `order-export:${orderExport.id}`,
        type: "order",
        title: `Заказ ${orderExport.orderId}`,
        detail:
          orderExport.lastError ?? orderExport.externalId ?? "экспорт iiko",
        status: orderExport.status,
        occurredAt:
          orderExport.exportedAt ??
          orderExport.startedAt ??
          orderExport.requestedAt,
      })),
    ];

    return items
      .filter((item) => Boolean(item.occurredAt))
      .sort(
        (left, right) =>
          new Date(right.occurredAt ?? 0).getTime() -
          new Date(left.occurredAt ?? 0).getTime(),
      )
      .slice(0, 10);
  }, [orderExports, runs, webhookEvents]);
  const lastRunAt =
    formatSyncTimestamp(status?.lastRun?.finishedAt) ??
    formatSyncTimestamp(integration?.lastMenuSyncedAt) ??
    formatSyncTimestamp(integration?.lastSyncAt);
  const statusBadge = getStatusBadge({
    configured: isConfigured,
    isActive: integration?.isActive,
    hasActiveRun,
  });
  const statusDescription = getStatusDescription(
    isConfigured,
    hasActiveRun,
    lastRunAt,
  );
  const diagnosticItems = React.useMemo(
    () =>
      buildIikoDiagnostics({
        integration,
        formState,
        priceCategories,
        terminalGroups,
        runs,
        activeRun: status?.activeRun,
        preview,
        orderExports,
        webhookEvents,
        formatDate: formatSyncTimestamp,
      }),
    [
      formState,
      integration,
      orderExports,
      preview,
      priceCategories,
      runs,
      status?.activeRun,
      terminalGroups,
      webhookEvents,
    ],
  );
  const diagnosticSummary = React.useMemo(
    () => getIikoDiagnosticSummary(diagnosticItems),
    [diagnosticItems],
  );
  const selectedTerminalGroup = React.useMemo(
    () =>
      terminalGroups.find(
        (terminalGroup) => terminalGroup.id === formState.terminalGroupId,
      ) ?? null,
    [formState.terminalGroupId, terminalGroups],
  );

  const resetLocalState = React.useCallback(() => {
    setFormState({
      apiLogin: "",
      organizationId: integration?.organizationId ?? "",
      organizationName: integration?.organizationName ?? null,
      externalMenuId: integration?.externalMenuId ?? "",
      externalMenuName: integration?.externalMenuName ?? null,
      priceCategoryId: integration?.priceCategoryId ?? "",
      priceCategoryName: integration?.priceCategoryName ?? null,
      terminalGroupId: integration?.terminalGroupId ?? "",
      terminalGroupName: integration?.terminalGroupName ?? null,
      menuVersion: integration?.menuVersion ?? 4,
      isActive: integration?.isActive ?? true,
      importImages: integration?.importImages ?? false,
      exportOrders: integration?.exportOrders ?? false,
      orderExportServiceType: integration?.orderExportServiceType ?? "",
      orderExportSourceKey: integration?.orderExportSourceKey ?? "",
    });
    setOrganizations(
      integration
        ? [
            {
              id: integration.organizationId,
              name: integration.organizationName ?? integration.organizationId,
              isActive: null,
            },
          ]
        : [],
    );
    setExternalMenus(
      integration?.externalMenuId
        ? [
            {
              id: integration.externalMenuId,
              name: integration.externalMenuName ?? integration.externalMenuId,
            },
          ]
        : [],
    );
    setPriceCategories(
      integration?.priceCategoryId
        ? [
            {
              id: integration.priceCategoryId,
              name:
                integration.priceCategoryName ?? integration.priceCategoryId,
            },
          ]
        : [],
    );
    setTerminalGroups(
      integration?.terminalGroupId
        ? [
            {
              id: integration.terminalGroupId,
              name:
                integration.terminalGroupName ?? integration.terminalGroupId,
              organizationId: integration.organizationId,
              isActive: null,
              isAlive: null,
            },
          ]
        : [],
    );
    setPreview(null);
    setValidationErrors({});
    setErrorMessage(null);
  }, [integration]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen) {
        autoRefreshConnectionRef.current = false;
        resetLocalState();
        void statusQuery.refetch();
        void orderExportsQuery.refetch();
        void runsQuery.refetch();
      }
    },
    [orderExportsQuery, resetLocalState, runsQuery, statusQuery],
  );

  const updateField = React.useCallback(
    <TKey extends keyof IikoFormState>(
      key: TKey,
      value: IikoFormState[TKey],
    ) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
      setErrorMessage(null);
      setValidationErrors((prev) => ({ ...prev, [key]: undefined }));
      if (
        key === "apiLogin" ||
        key === "organizationId" ||
        key === "externalMenuId" ||
        key === "priceCategoryId"
      ) {
        setPreview(null);
      }
    },
    [],
  );

  const handleTestConnection = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const apiLogin = formState.apiLogin.trim();
      if (!apiLogin && !isConfigured) {
        setValidationErrors((prev) => ({
          ...prev,
          apiLogin: "Введите apiLogin iiko.",
        }));
        return;
      }

      try {
        setErrorMessage(null);
        const result = await testConnectionMutation.mutateAsync({
          data: apiLogin ? { apiLogin } : {},
        });
        const nextOrganizations = result.organizations ?? [];
        const nextExternalMenus = result.externalMenus ?? [];
        const nextPriceCategories = result.priceCategories ?? [];
        const nextTerminalGroups = result.terminalGroups ?? [];
        setOrganizations(nextOrganizations);
        setExternalMenus(nextExternalMenus);
        setPriceCategories(nextPriceCategories);
        setTerminalGroups(nextTerminalGroups);

        const preferredOrganization =
          nextOrganizations.find(
            (organization) => organization.isActive !== false,
          ) ?? nextOrganizations[0];
        const preferredExternalMenu =
          nextExternalMenus.find(
            (externalMenu) => externalMenu.id === formState.externalMenuId,
          ) ?? nextExternalMenus[0];
        const preferredPriceCategory =
          nextPriceCategories.find(
            (priceCategory) => priceCategory.id === formState.priceCategoryId,
          ) ?? nextPriceCategories[0];
        const preferredTerminalGroup =
          nextTerminalGroups.find(
            (terminalGroup) => terminalGroup.id === formState.terminalGroupId,
          ) ??
          nextTerminalGroups.find(
            (terminalGroup) =>
              terminalGroup.organizationId === preferredOrganization?.id,
          ) ??
          nextTerminalGroups[0];

        setFormState((prev) => ({
          ...prev,
          organizationId: preferredOrganization?.id ?? prev.organizationId,
          organizationName:
            preferredOrganization?.name ?? prev.organizationName,
          externalMenuId: preferredExternalMenu?.id ?? prev.externalMenuId,
          externalMenuName:
            preferredExternalMenu?.name ?? prev.externalMenuName,
          priceCategoryId: preferredPriceCategory?.id ?? prev.priceCategoryId,
          priceCategoryName:
            preferredPriceCategory?.name ?? prev.priceCategoryName,
          terminalGroupId: preferredTerminalGroup?.id ?? prev.terminalGroupId,
          terminalGroupName:
            preferredTerminalGroup?.name ?? prev.terminalGroupName,
        }));
        setPreview(null);

        if (!options?.silent) {
          toast.success("Подключение к iiko успешно.");
        }
      } catch (error) {
        const message = extractApiErrorMessage(error);
        setErrorMessage(message);
        if (!options?.silent) {
          toast.error(message);
        }
      }
    },
    [
      formState.apiLogin,
      formState.externalMenuId,
      formState.priceCategoryId,
      formState.terminalGroupId,
      isConfigured,
      testConnectionMutation,
    ],
  );

  React.useEffect(() => {
    if (!open || !isConfigured || autoRefreshConnectionRef.current) return;
    if (formState.apiLogin.trim() || testConnectionMutation.isPending) return;

    autoRefreshConnectionRef.current = true;
    void handleTestConnection({ silent: true });
  }, [
    formState.apiLogin,
    handleTestConnection,
    isConfigured,
    open,
    testConnectionMutation.isPending,
  ]);

  const handleSubmit = React.useCallback(async () => {
    if (isBusy) return;

    const apiLogin = formState.apiLogin.trim();
    const organizationId = formState.organizationId.trim();
    const externalMenuId = formState.externalMenuId.trim();
    const priceCategoryId = formState.priceCategoryId.trim();
    const terminalGroupId = formState.terminalGroupId.trim();
    const nextErrors: ValidationErrors = {};

    if (!isConfigured && !apiLogin) {
      nextErrors.apiLogin = "Введите apiLogin iiko.";
    }

    if (!organizationId) {
      nextErrors.organizationId = "Выберите организацию iiko.";
    }

    if (!externalMenuId) {
      nextErrors.externalMenuId = "Выберите внешнее меню iiko.";
    }

    if (priceCategories.length > 0 && !priceCategoryId) {
      nextErrors.priceCategoryId = "Выберите ценовую категорию iiko.";
    }

    if (terminalGroups.length > 0 && !terminalGroupId) {
      nextErrors.terminalGroupId = "Выберите точку iiko для stop-list.";
    }

    const selectedTerminalGroup = terminalGroups.find(
      (terminalGroup) => terminalGroup.id === terminalGroupId,
    );
    if (formState.exportOrders && !terminalGroupId) {
      nextErrors.terminalGroupId = "Выберите точку iiko для экспорта заказов.";
    }
    if (formState.exportOrders && selectedTerminalGroup?.isActive === false) {
      nextErrors.terminalGroupId =
        "Для экспорта заказов выберите активную точку iiko. Эта точка неактивна или не зарегистрирована.";
    }
    if (formState.exportOrders && selectedTerminalGroup?.isAlive === false) {
      nextErrors.terminalGroupId =
        "Для экспорта заказов выберите доступную точку iiko. Эта точка сейчас не принимает команды Cloud API.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    const organizationName = resolveOrganizationName(
      organizations,
      organizationId,
      formState.organizationName,
    );
    const externalMenuName = resolveExternalMenuName(
      externalMenus,
      externalMenuId,
      formState.externalMenuName,
    );
    const priceCategoryName = priceCategoryId
      ? resolvePriceCategoryName(
          priceCategories,
          priceCategoryId,
          formState.priceCategoryName,
        )
      : null;
    const terminalGroupName = terminalGroupId
      ? resolveTerminalGroupName(
          terminalGroups,
          terminalGroupId,
          formState.terminalGroupName,
        )
      : null;
    const menuVersion = formState.menuVersion || 4;

    try {
      setErrorMessage(null);

      if (isConfigured) {
        const payload: UpdateIikoIntegrationDtoReq = {
          ...(apiLogin ? { apiLogin } : {}),
          organizationId,
          organizationName,
          externalMenuId,
          externalMenuName,
          priceCategoryId: priceCategoryId || null,
          priceCategoryName,
          terminalGroupId: terminalGroupId || null,
          terminalGroupName,
          menuVersion,
          isActive: formState.isActive,
          importImages: formState.importImages,
          exportOrders: formState.exportOrders,
          orderExportServiceType: formState.orderExportServiceType || null,
          orderExportSourceKey: formState.orderExportSourceKey.trim() || null,
        };

        await updateMutation.mutateAsync({ data: payload });
      } else {
        const payload: UpsertIikoIntegrationDtoReq = {
          apiLogin,
          organizationId,
          organizationName,
          externalMenuId,
          externalMenuName,
          priceCategoryId: priceCategoryId || null,
          priceCategoryName,
          terminalGroupId: terminalGroupId || null,
          terminalGroupName,
          menuVersion,
          isActive: formState.isActive,
          importImages: formState.importImages,
          exportOrders: formState.exportOrders,
          orderExportServiceType: formState.orderExportServiceType || null,
          orderExportSourceKey: formState.orderExportSourceKey.trim() || null,
        };

        await upsertMutation.mutateAsync({ data: payload });
      }

      await refreshIikoQueries(queryClient);
      toast.success(
        isConfigured
          ? "Настройки iiko сохранены."
          : "Интеграция iiko подключена.",
      );
      setOpen(false);
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [
    formState.apiLogin,
    formState.externalMenuId,
    formState.externalMenuName,
    formState.importImages,
    formState.isActive,
    formState.menuVersion,
    formState.exportOrders,
    formState.orderExportServiceType,
    formState.orderExportSourceKey,
    formState.organizationId,
    formState.organizationName,
    formState.priceCategoryId,
    formState.priceCategoryName,
    formState.terminalGroupId,
    formState.terminalGroupName,
    externalMenus,
    isBusy,
    isConfigured,
    organizations,
    priceCategories,
    queryClient,
    terminalGroups,
    updateMutation,
    upsertMutation,
  ]);

  const handlePreview = React.useCallback(async () => {
    if (isBusy) return;

    const apiLogin = formState.apiLogin.trim();
    const organizationId = formState.organizationId.trim();
    const externalMenuId = formState.externalMenuId.trim();
    const priceCategoryId = formState.priceCategoryId.trim();
    const nextErrors: ValidationErrors = {};

    if (!isConfigured && !apiLogin) {
      nextErrors.apiLogin = "Введите apiLogin iiko.";
    }

    if (!organizationId) {
      nextErrors.organizationId = "Выберите организацию iiko.";
    }

    if (!externalMenuId) {
      nextErrors.externalMenuId = "Выберите внешнее меню iiko.";
    }

    if (priceCategories.length > 0 && !priceCategoryId) {
      nextErrors.priceCategoryId = "Выберите ценовую категорию iiko.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    const payload: PreviewIikoImportDtoReq = {
      ...(apiLogin ? { apiLogin } : {}),
      organizationId,
      externalMenuId,
      externalMenuName: resolveExternalMenuName(
        externalMenus,
        externalMenuId,
        formState.externalMenuName,
      ),
      priceCategoryId: priceCategoryId || null,
      menuVersion: formState.menuVersion || 4,
    };

    try {
      setErrorMessage(null);
      const result = await previewMutation.mutateAsync({ data: payload });
      setPreview(result);
      toast.success("Предпросмотр меню iiko получен.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [
    externalMenus,
    formState.apiLogin,
    formState.externalMenuId,
    formState.externalMenuName,
    formState.menuVersion,
    formState.organizationId,
    formState.priceCategoryId,
    isBusy,
    isConfigured,
    previewMutation,
    priceCategories.length,
  ]);

  const handleSync = React.useCallback(async () => {
    if (isBusy || !isConfigured || !integration?.externalMenuId) return;

    try {
      const result = await syncMutation.mutateAsync();
      await refreshIikoQueries(queryClient);
      startIikoSyncProgressToast({
        runId: result.runId,
        title: "Синхронизация меню iiko",
        onSettled: async () => {
          await Promise.allSettled([
            refreshIikoQueries(queryClient),
            invalidateProductQueries(queryClient),
          ]);
        },
      });
      toast.success("Импорт меню iiko поставлен в очередь.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [
    integration?.externalMenuId,
    isBusy,
    isConfigured,
    queryClient,
    syncMutation,
  ]);

  const handleStockSync = React.useCallback(async () => {
    if (isBusy || !isConfigured || integration?.isActive === false) return;

    try {
      const result = await stockSyncMutation.mutateAsync();
      await refreshIikoQueries(queryClient);
      startIikoSyncProgressToast({
        runId: result.runId,
        title: "Обновление stop-list iiko",
        onSettled: async () => {
          await Promise.allSettled([
            refreshIikoQueries(queryClient),
            invalidateProductQueries(queryClient),
          ]);
        },
      });
      toast.success("Обновление stop-list iiko поставлено в очередь.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [
    integration?.isActive,
    isBusy,
    isConfigured,
    queryClient,
    stockSyncMutation,
  ]);

  const handleSetupWebhooks = React.useCallback(async () => {
    if (isBusy || !isConfigured || integration?.isActive === false) return;

    try {
      setErrorMessage(null);
      await setupWebhooksMutation.mutateAsync();
      await refreshIikoQueries(queryClient);
      toast.success("Вебхуки iiko зарегистрированы.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [
    integration?.isActive,
    isBusy,
    isConfigured,
    queryClient,
    setupWebhooksMutation,
  ]);

  const handleDisableWebhooks = React.useCallback(async () => {
    if (isBusy || !isConfigured) return;

    try {
      setErrorMessage(null);
      await disableWebhooksMutation.mutateAsync();
      await refreshIikoQueries(queryClient);
      toast.success("Вебхуки iiko отключены.");
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [disableWebhooksMutation, isBusy, isConfigured, queryClient]);

  const handleRetryWebhookEvent = React.useCallback(
    async (eventId: string) => {
      if (isBusy) return;

      try {
        setErrorMessage(null);
        await retryWebhookEventMutation.mutateAsync({ eventId });
        await Promise.allSettled([
          webhookEventsQuery.refetch(),
          refreshIikoQueries(queryClient),
        ]);
        toast.success("Событие вебхука iiko обработано повторно.");
      } catch (error) {
        const message = extractApiErrorMessage(error);
        setErrorMessage(message);
        toast.error(message);
      }
    },
    [isBusy, queryClient, retryWebhookEventMutation, webhookEventsQuery],
  );

  const handleRetryOrderExport = React.useCallback(
    async (id: string) => {
      if (isBusy) return;

      try {
        await retryOrderExportMutation.mutateAsync({ id });
        await orderExportsQuery.refetch();
        toast.success("Экспорт заказа iiko поставлен в очередь.");
      } catch (error) {
        const message = extractApiErrorMessage(error);
        setErrorMessage(message);
        toast.error(message);
      }
    },
    [isBusy, orderExportsQuery, retryOrderExportMutation],
  );

  const handleRemove = React.useCallback(async () => {
    if (isBusy || !isConfigured) return;

    try {
      await removeMutation.mutateAsync();
      await refreshIikoQueries(queryClient);
      toast.success("Интеграция iiko отключена.");
      setOpen(false);
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [isBusy, isConfigured, queryClient, removeMutation]);

  const canSync = Boolean(
    isConfigured && integration?.organizationId && integration?.externalMenuId,
  );
  const previewStats = preview?.stats;
  const previewSkippedItems =
    preview?.items.filter((item) => !item.willImport) ?? [];

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
          className="h-auto w-full min-w-0 items-start justify-between rounded-panel border border-line-subtle px-4 py-4 text-left whitespace-normal hover:bg-surface-muted/50"
          disabled={disabled}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-text-primary">iiko</span>
              <Badge
                variant={statusBadge.variant}
                className="max-w-full break-words text-left whitespace-normal"
              >
                {statusBadge.label}
              </Badge>
            </div>
            <p className="mt-1 break-words text-sm text-text-muted whitespace-normal">
              {statusDescription}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-text-muted" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="iiko"
            description="Подключите iikoCloud, выберите организацию, External Menu и ценовую категорию."
            withCloseButton={!isBusy}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-5">
              <div className="rounded-panel border border-line-subtle bg-surface-subtle p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">Статус</span>
                  <Badge
                    variant={statusBadge.variant}
                    className="max-w-full break-words text-left whitespace-normal"
                  >
                    {statusBadge.label}
                  </Badge>
                </div>
                <p className="mt-2 break-words text-sm text-text-muted">
                  {statusDescription}
                </p>
                {integration ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-muted">
                    <div>
                      <span className="block text-text-primary">
                        {integration.totalProducts}
                      </span>
                      товаров
                    </div>
                    <div>
                      <span className="block text-text-primary">
                        {integration.lastRevision ?? "—"}
                      </span>
                      revision
                    </div>
                    <div>
                      <span className="block truncate text-text-primary">
                        {integration.externalMenuName ??
                          integration.externalMenuId ??
                          "—"}
                      </span>
                      меню
                    </div>
                    <div>
                      <span className="block truncate text-text-primary">
                        {integration.priceCategoryName ??
                          integration.priceCategoryId ??
                          "—"}
                      </span>
                      цены
                    </div>
                    <div>
                      <span className="block truncate text-text-primary">
                        {integration.terminalGroupName ??
                          integration.terminalGroupId ??
                          "—"}
                      </span>
                      stop-list
                    </div>
                    <div>
                      <span className="block truncate text-text-primary">
                        {formatSyncTimestamp(
                          integration.lastStopListSyncedAt,
                        ) ?? "—"}
                      </span>
                      остатки
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Диагностика iiko</div>
                    <p className="mt-1 break-words text-sm text-text-muted">
                      Быстрая проверка всей цепочки: меню, цены, terminal group,
                      stop-list и экспорт заказов.
                    </p>
                  </div>
                  <Badge
                    variant={diagnosticSummary.badgeVariant}
                    className="max-w-full break-words text-left whitespace-normal"
                  >
                    {diagnosticSummary.label}
                  </Badge>
                </div>
                <div className="mt-3 overflow-hidden rounded-control border border-line-subtle">
                  {diagnosticItems.map((item) => {
                    const DiagnosticIcon = getIikoDiagnosticIcon(item.tone);

                    return (
                      <div
                        key={item.key}
                        className="flex items-start gap-3 border-b border-line-subtle px-3 py-2.5 text-sm last:border-b-0"
                      >
                        <DiagnosticIcon
                          className={`mt-0.5 size-4 shrink-0 ${getIikoDiagnosticToneClassName(item.tone)}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="break-words font-medium">
                            {item.label}
                          </div>
                          <div className="mt-0.5 break-words text-xs text-text-muted">
                            {item.detail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {runsQuery.isFetching ||
                orderExportsQuery.isFetching ||
                webhookEventsQuery.isFetching ? (
                  <p className="mt-2 text-xs text-text-muted">
                    Обновляем статусы iiko...
                  </p>
                ) : null}
              </div>

              <div className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Вебхуки iiko</div>
                    <p className="mt-1 break-words text-sm text-text-muted">
                      iiko будет сам присылать изменения stop-list, меню и
                      статусы заказов.
                    </p>
                  </div>
                  <Badge
                    variant={
                      integration?.webhook.enabled &&
                      integration.webhook.hasSecret
                        ? "default"
                        : "secondary"
                    }
                  >
                    {integration?.webhook.enabled &&
                    integration.webhook.hasSecret
                      ? "Включены"
                      : "Не настроены"}
                  </Badge>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-text-muted sm:grid-cols-2">
                  <div className="rounded-control border border-line-subtle bg-surface-subtle p-2">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {integration?.webhook.lastEventType ?? "—"}
                    </span>
                    последнее событие
                  </div>
                  <div className="rounded-control border border-line-subtle bg-surface-subtle p-2">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {formatSyncTimestamp(
                        integration?.webhook.lastReceivedAt,
                      ) ?? "—"}
                    </span>
                    получено
                  </div>
                  <div className="rounded-control border border-line-subtle bg-surface-subtle p-2">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {formatSyncTimestamp(
                        integration?.webhook.lastConfiguredAt,
                      ) ?? "—"}
                    </span>
                    регистрация
                  </div>
                  <div className="rounded-control border border-line-subtle bg-surface-subtle p-2">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {integration?.webhook.urlPreview ?? "—"}
                    </span>
                    endpoint
                  </div>
                </div>

                {integration?.webhook.lastError ? (
                  <p className="mt-3 break-words text-xs text-status-danger">
                    {integration.webhook.lastError}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      isBusy ||
                      !isConfigured ||
                      integration?.isActive === false ||
                      !integration?.organizationId
                    }
                    onClick={() => void handleSetupWebhooks()}
                  >
                    <PlugZap className="size-4" />
                    Зарегистрировать
                  </Button>
                  {integration?.webhook.enabled ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isBusy || !isConfigured}
                      onClick={() => void handleDisableWebhooks()}
                    >
                      Отключить
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-panel border border-line-subtle bg-surface-subtle p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      Журнал webhook событий
                    </div>
                    <p className="mt-1 break-words text-sm text-text-muted">
                      Последние входящие события от iiko и результат обработки.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {webhookEvents.length} / {IIKO_WEBHOOK_EVENTS_LIMIT}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy || !isConfigured}
                      onClick={() => void webhookEventsQuery.refetch()}
                    >
                      <RefreshCw className="size-4" />
                      Обновить
                    </Button>
                  </div>
                </div>

                {webhookEventsQuery.isError ? (
                  <p className="mt-3 break-words text-xs text-status-danger">
                    {extractApiErrorMessage(webhookEventsQuery.error)}
                  </p>
                ) : null}

                <div className="mt-3 space-y-3">
                  {webhookEvents.length ? (
                    webhookEvents.map((event) => {
                      const badge = getWebhookEventStatusBadge(event.status);
                      const receivedAt =
                        formatSyncTimestamp(event.receivedAt) ?? "нет даты";
                      const processedAt = formatSyncTimestamp(
                        event.processedAt,
                      );
                      const detailEntries = Object.entries(event.details ?? {})
                        .map(
                          ([key, value]) =>
                            [key, formatWebhookDetailValue(value)] as const,
                        )
                        .filter(([, value]) => Boolean(value));

                      return (
                        <div
                          key={event.id}
                          className="rounded-panel border border-line-subtle bg-surface-raised/70 p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="break-words text-sm font-medium">
                                {event.eventType}
                              </div>
                              <p className="mt-1 break-words text-xs text-text-muted">
                                Получено {receivedAt}
                                {processedAt
                                  ? ` · обработано ${processedAt}`
                                  : ""}
                              </p>
                            </div>
                            <Badge
                              variant={badge.variant}
                              className="max-w-full break-words text-left whitespace-normal"
                            >
                              {badge.label}
                            </Badge>
                          </div>

                          {detailEntries.length ? (
                            <div className="mt-3 grid gap-2 text-xs text-text-muted sm:grid-cols-2">
                              {detailEntries.map(([key, value]) => (
                                <div
                                  key={key}
                                  className="min-w-0 rounded-control border border-line-subtle bg-surface-subtle p-2"
                                >
                                  <span className="block truncate font-medium text-text-primary">
                                    {value}
                                  </span>
                                  {key}
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {event.jobId ? (
                            <p className="mt-2 break-words text-xs text-text-muted">
                              job: {event.jobId}
                            </p>
                          ) : null}
                          {event.error ? (
                            <p className="mt-2 break-words text-xs text-status-danger">
                              {event.error}
                            </p>
                          ) : null}
                          {event.status === "FAILED" ||
                          event.status === "SKIPPED" ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3 h-auto whitespace-normal text-left"
                              disabled={isBusy}
                              onClick={() =>
                                void handleRetryWebhookEvent(event.id)
                              }
                            >
                              Повторить обработку
                            </Button>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-text-muted">
                      Событий пока нет. После регистрации webhook здесь появятся
                      stop-list, меню и статусы заказов.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      Лента интеграции iiko
                    </div>
                    <p className="mt-1 break-words text-sm text-text-muted">
                      Sync, webhook и экспорт заказов в одном порядке по
                      времени.
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {integrationTimeline.length}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {integrationTimeline.length ? (
                    integrationTimeline.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-control border border-line-subtle bg-surface-subtle p-3"
                      >
                        <div className="mt-1 size-2 rounded-pill bg-line-default" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-words text-sm font-medium">
                              {item.title}
                            </span>
                            <Badge variant="secondary">{item.type}</Badge>
                            <Badge variant="outline">{item.status}</Badge>
                          </div>
                          <p className="mt-1 break-words text-xs text-text-muted">
                            {formatSyncTimestamp(item.occurredAt) ?? "нет даты"}
                            {item.detail ? ` · ${item.detail}` : ""}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-muted">
                      Событий пока нет. После sync, webhook или экспорта заказа
                      здесь появится единая история.
                    </p>
                  )}
                </div>
              </div>

              <Field>
                <FieldLabel htmlFor="iiko-api-login">apiLogin</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    <Input
                      id="iiko-api-login"
                      autoComplete="off"
                      value={formState.apiLogin}
                      onChange={(event) =>
                        updateField("apiLogin", event.target.value)
                      }
                      placeholder={
                        integration?.apiLoginPreview
                          ? `${integration.apiLoginPreview} • оставьте пустым, чтобы не менять`
                          : "Введите apiLogin iiko"
                      }
                      disabled={isBusy}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0"
                      disabled={
                        isBusy || (!formState.apiLogin.trim() && !isConfigured)
                      }
                      onClick={() => void handleTestConnection()}
                    >
                      <PlugZap className="size-4" />
                      Проверить
                    </Button>
                  </div>
                  <FieldDescription className="break-words">
                    Backend сам получает access token; в базе сохраняется только
                    зашифрованный apiLogin.
                  </FieldDescription>
                  <FieldError>{validationErrors.apiLogin}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="iiko-organization">Организация</FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.organizationId}
                    onValueChange={(value) => {
                      const preferredTerminalGroup =
                        terminalGroups.find(
                          (terminalGroup) =>
                            terminalGroup.organizationId === value,
                        ) ?? terminalGroups[0];
                      updateField("organizationId", value);
                      setFormState((prev) => ({
                        ...prev,
                        organizationName: resolveOrganizationName(
                          organizations,
                          value,
                          prev.organizationName,
                        ),
                        terminalGroupId:
                          preferredTerminalGroup?.id ?? prev.terminalGroupId,
                        terminalGroupName:
                          preferredTerminalGroup?.name ??
                          prev.terminalGroupName,
                      }));
                    }}
                    disabled={isBusy || organizations.length === 0}
                  >
                    <SelectTrigger id="iiko-organization">
                      <SelectValue placeholder="Проверьте apiLogin и выберите организацию" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((organization) => (
                        <SelectItem
                          key={organization.id}
                          value={organization.id}
                        >
                          {organization.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription className="break-words">
                    {organizations.length > 0
                      ? "Список пришёл из iikoCloud после проверки подключения."
                      : "Сначала проверьте apiLogin, чтобы получить список организаций."}
                  </FieldDescription>
                  <FieldError>{validationErrors.organizationId}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="iiko-external-menu">
                  Внешнее меню
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.externalMenuId}
                    onValueChange={(value) => {
                      const externalMenuName = resolveExternalMenuName(
                        externalMenus,
                        value,
                        null,
                      );
                      setFormState((prev) => ({
                        ...prev,
                        externalMenuId: value,
                        externalMenuName,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        externalMenuId: undefined,
                      }));
                      setErrorMessage(null);
                      setPreview(null);
                    }}
                    disabled={isBusy || externalMenus.length === 0}
                  >
                    <SelectTrigger id="iiko-external-menu">
                      <SelectValue placeholder="Проверьте apiLogin и выберите внешнее меню" />
                    </SelectTrigger>
                    <SelectContent>
                      {externalMenus.map((externalMenu) => (
                        <SelectItem
                          key={externalMenu.id}
                          value={externalMenu.id}
                        >
                          {externalMenu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription className="break-words">
                    Импорт идет из External Menu iiko, поэтому здесь нужно
                    выбрать меню вроде «Мой каталог», а не общий справочник
                    номенклатуры.
                  </FieldDescription>
                  <FieldError>{validationErrors.externalMenuId}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="iiko-price-category">
                  Ценовая категория
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={
                      formState.priceCategoryId || PRICE_CATEGORY_NONE_VALUE
                    }
                    onValueChange={(value) => {
                      const priceCategoryId =
                        value === PRICE_CATEGORY_NONE_VALUE ? "" : value;
                      const priceCategoryName = priceCategoryId
                        ? resolvePriceCategoryName(
                            priceCategories,
                            priceCategoryId,
                            null,
                          )
                        : null;
                      setFormState((prev) => ({
                        ...prev,
                        priceCategoryId,
                        priceCategoryName,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        priceCategoryId: undefined,
                      }));
                      setErrorMessage(null);
                      setPreview(null);
                    }}
                    disabled={isBusy || priceCategories.length === 0}
                  >
                    <SelectTrigger id="iiko-price-category">
                      <SelectValue placeholder="Выберите ценовую категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PRICE_CATEGORY_NONE_VALUE}>
                        Без ценовой категории
                      </SelectItem>
                      {priceCategories.map((priceCategory) => (
                        <SelectItem
                          key={priceCategory.id}
                          value={priceCategory.id}
                        >
                          {priceCategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription className="break-words">
                    Если iiko вернул ценовые категории, выберите ту же
                    категорию, которую привязали в настройках API-логина.
                  </FieldDescription>
                  <FieldError>{validationErrors.priceCategoryId}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="iiko-terminal-group">
                  Точка / stop-list
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={formState.terminalGroupId}
                    onValueChange={(value) => {
                      const terminalGroupName = resolveTerminalGroupName(
                        terminalGroups,
                        value,
                        null,
                      );
                      setFormState((prev) => ({
                        ...prev,
                        terminalGroupId: value,
                        terminalGroupName,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        terminalGroupId: undefined,
                      }));
                      setErrorMessage(null);
                    }}
                    disabled={isBusy || terminalGroups.length === 0}
                  >
                    <SelectTrigger id="iiko-terminal-group">
                      <SelectValue placeholder="Проверьте apiLogin и выберите точку" />
                    </SelectTrigger>
                    <SelectContent>
                      {terminalGroups.map((terminalGroup) => (
                        <SelectItem
                          key={terminalGroup.id}
                          value={terminalGroup.id}
                        >
                          {terminalGroup.name}
                          {terminalGroup.isActive === false
                            ? " (неактивна)"
                            : ""}
                          {terminalGroup.isAlive === false
                            ? " (недоступна)"
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTerminalGroup ? (
                    <div className="mt-2 space-y-2 rounded-control border border-line-subtle bg-surface-subtle p-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {selectedTerminalGroup.name}
                        </span>
                        <Badge
                          variant={
                            selectedTerminalGroup.isActive === false
                              ? "secondary"
                              : "default"
                          }
                        >
                          {selectedTerminalGroup.isActive === false
                            ? "Неактивна"
                            : "Активна"}
                        </Badge>
                        <Badge
                          variant={
                            selectedTerminalGroup.isAlive === false
                              ? "destructive"
                              : selectedTerminalGroup.isAlive === true
                                ? "default"
                                : "secondary"
                          }
                        >
                          {selectedTerminalGroup.isAlive === false
                            ? "Cloud API недоступна"
                            : selectedTerminalGroup.isAlive === true
                              ? "Cloud API доступна"
                              : "Cloud API: нет данных"}
                        </Badge>
                      </div>
                      <div className="grid gap-1 text-text-muted">
                        <span className="break-all">
                          Terminal group ID: {selectedTerminalGroup.id}
                        </span>
                        {selectedTerminalGroup.organizationId ? (
                          <span className="break-all">
                            Organization ID:{" "}
                            {selectedTerminalGroup.organizationId}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <FieldDescription className="break-words">
                    {terminalGroups.length > 0
                      ? "Stop-list в iiko привязан к группе терминалов. Для экспорта заказов iiko принимает только активную и зарегистрированную точку."
                      : "iiko пока не вернул terminal groups. Нажмите «Проверить» после подключения точки к API login и доступа к группам терминалов."}
                  </FieldDescription>
                  <FieldError>{validationErrors.terminalGroupId}</FieldError>
                </FieldContent>
              </Field>

              <div className="space-y-3">
                <Field
                  orientation="responsive"
                  className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4"
                >
                  <FieldContent>
                    <FieldTitle>Интеграция активна</FieldTitle>
                    <FieldDescription className="break-words">
                      Отключите, чтобы временно запретить ручной импорт меню.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    checked={formState.isActive}
                    onCheckedChange={(checked) =>
                      updateField("isActive", checked)
                    }
                    disabled={isBusy}
                  />
                </Field>

                <Field
                  orientation="responsive"
                  className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4"
                >
                  <FieldContent>
                    <FieldTitle>Импортировать изображения</FieldTitle>
                    <FieldDescription className="break-words">
                      Ошибки загрузки картинок не остановят импорт меню.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    checked={formState.importImages}
                    onCheckedChange={(checked) =>
                      updateField("importImages", checked)
                    }
                    disabled={isBusy}
                  />
                </Field>

                <Field
                  orientation="responsive"
                  className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4"
                >
                  <FieldContent>
                    <FieldTitle>Экспорт заказов</FieldTitle>
                    <FieldDescription className="break-words">
                      После завершения заказа администратором backend отправит
                      его в iiko через выбранную точку.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    checked={formState.exportOrders}
                    onCheckedChange={(checked) =>
                      updateField("exportOrders", checked)
                    }
                    disabled={isBusy}
                  />
                </Field>

                {formState.exportOrders ? (
                  <div className="grid gap-3 rounded-panel border border-line-subtle bg-surface-raised/70 p-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="iiko-order-service-type">
                        Тип заказа
                      </FieldLabel>
                      <FieldContent>
                        <Select
                          value={
                            formState.orderExportServiceType ||
                            ORDER_EXPORT_SERVICE_TYPE_AUTO_VALUE
                          }
                          onValueChange={(value) =>
                            updateField(
                              "orderExportServiceType",
                              value === ORDER_EXPORT_SERVICE_TYPE_AUTO_VALUE
                                ? ""
                                : (value as
                                    | "DeliveryByCourier"
                                    | "DeliveryByClient"),
                            )
                          }
                          disabled={isBusy}
                        >
                          <SelectTrigger id="iiko-order-service-type">
                            <SelectValue placeholder="Авто" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value={ORDER_EXPORT_SERVICE_TYPE_AUTO_VALUE}
                            >
                              Авто
                            </SelectItem>
                            <SelectItem value="DeliveryByCourier">
                              Доставка курьером
                            </SelectItem>
                            <SelectItem value="DeliveryByClient">
                              Самовывоз
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="iiko-order-source-key">
                        Source key
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="iiko-order-source-key"
                          value={formState.orderExportSourceKey}
                          onChange={(event) =>
                            updateField(
                              "orderExportSourceKey",
                              event.target.value,
                            )
                          }
                          placeholder="catalog-api"
                          disabled={isBusy}
                        />
                      </FieldContent>
                    </Field>
                  </div>
                ) : null}
              </div>

              <div className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Preview импорта</div>
                    <p className="mt-1 break-words text-sm text-text-muted">
                      Быстрая проверка меню до сохранения и запуска
                      синхронизации.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isBusy}
                    onClick={() => void handlePreview()}
                  >
                    <RefreshCw className="size-4" />
                    Preview
                  </Button>
                </div>

                {previewStats ? (
                  <>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-text-muted sm:grid-cols-4">
                      {[
                        ["Категории", previewStats.categories],
                        ["Товары", previewStats.visibleItems],
                        ["Скрытые", previewStats.hiddenItems],
                        ["Без цены", previewStats.itemsWithoutPrice],
                        ["Варианты", previewStats.variants],
                        ["Combo", previewStats.combos],
                        ["С модификаторами", previewStats.itemsWithModifiers],
                        ["Всего позиций", previewStats.items],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="rounded-control border border-line-subtle bg-surface-subtle p-2"
                        >
                          <span className="block text-sm font-medium text-text-primary">
                            {formatCounter(Number(value))}
                          </span>
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-muted sm:grid-cols-4">
                      {[
                        ["Новые", preview.diff.newItems],
                        ["Связанные", preview.diff.matchedItems],
                        ["Изменятся", preview.diff.changedItems],
                        ["Цены", preview.diff.priceChanges],
                        ["Названия", preview.diff.nameChanges],
                        ["Без изменений", preview.diff.unchangedItems],
                        ["Пропадут", preview.diff.missingLinkedItems],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="rounded-control border border-line-subtle bg-surface-subtle p-2"
                        >
                          <span className="block text-sm font-medium text-text-primary">
                            {formatCounter(Number(value))}
                          </span>
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 max-h-40 overflow-auto rounded-control border border-line-subtle">
                      {preview.items.slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3 border-b px-3 py-2 text-xs last:border-b-0"
                        >
                          <div className="min-w-0">
                            <span className="block min-w-0 truncate">
                              {item.name}
                            </span>
                            {item.skipReasons.length > 0 ? (
                              <span className="mt-0.5 block truncate text-text-muted">
                                {item.skipReasons
                                  .map(formatIikoPreviewSkipReason)
                                  .join(", ")}
                              </span>
                            ) : null}
                            {item.diffStatus &&
                            item.diffStatus !== "skipped" ? (
                              <span className="mt-0.5 block truncate text-text-muted">
                                {formatIikoDiffStatus(item.diffStatus)}
                                {item.diffStatus.includes("price")
                                  ? `: ${formatMoney(item.localPrice)} → ${formatMoney(item.price)}`
                                  : ""}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 flex-wrap justify-end gap-1">
                            <Badge
                              variant={
                                item.willImport ? "default" : "secondary"
                              }
                            >
                              {item.willImport ? "import" : "skip"}
                            </Badge>
                            {item.diffStatus ? (
                              <Badge variant="outline">
                                {formatIikoDiffStatus(item.diffStatus)}
                              </Badge>
                            ) : null}
                            {item.hasModifiers ? (
                              <Badge variant="secondary">mods</Badge>
                            ) : null}
                            {item.variants > 1 ? (
                              <Badge variant="default">
                                {item.variants} sizes
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                    {previewSkippedItems.length > 0 ? (
                      <p className="mt-2 break-words text-xs text-text-muted">
                        Пропущено позиций:{" "}
                        {formatCounter(previewSkippedItems.length)}. Основные
                        причины показаны в строках preview.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-3 break-words text-sm text-text-muted">
                    Preview покажет категории, видимые товары, скрытые позиции,
                    товары без цены, варианты, combo и наличие модификаторов.
                  </p>
                )}
              </div>

              {integration?.capabilities ? (
                <div className="rounded-panel border border-line-subtle bg-surface-raised/70 p-4">
                  <div className="text-sm font-medium">Возможности MVP</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      ["Товары", integration.capabilities.productImport],
                      ["Варианты", integration.capabilities.variantImport],
                      ["Картинки", integration.capabilities.imageImport],
                      ["Остатки", integration.capabilities.stockImport],
                      ["Заказы", integration.capabilities.orderExport],
                      ["Webhook", integration.capabilities.webhook],
                    ].map(([label, enabled]) => (
                      <Badge
                        key={String(label)}
                        variant={enabled ? "default" : "secondary"}
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-panel border border-line-subtle bg-surface-subtle p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    Экспорт заказов iiko
                  </span>
                  {orderExportsQuery.isFetching ? (
                    <span className="text-xs text-text-muted">
                      Обновляем...
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 space-y-3">
                  {orderExports.length ? (
                    orderExports.map((orderExport) => {
                      const badge = getOrderExportStatusBadge(
                        orderExport.status,
                      );
                      const requestedAt =
                        formatSyncTimestamp(orderExport.requestedAt) ??
                        "нет даты";
                      const canRetry =
                        orderExport.status === "ERROR" ||
                        orderExport.status === "SKIPPED";

                      return (
                        <div
                          key={orderExport.id}
                          className="rounded-panel border border-line-subtle bg-surface-raised/70 p-3"
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
                          <p className="mt-2 break-words text-sm text-text-muted">
                            Запрошен {requestedAt} · попыток:{" "}
                            {orderExport.attempts}
                          </p>
                          {orderExport.externalId ? (
                            <p className="mt-1 break-words text-xs text-text-muted">
                              iiko: {orderExport.externalId}
                            </p>
                          ) : null}
                          {orderExport.lastError ? (
                            <p className="mt-1 break-words text-xs text-status-danger">
                              {orderExport.lastError}
                            </p>
                          ) : null}
                          {canRetry ? (
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
                    <p className="text-sm text-text-muted">
                      Экспортов заказов пока нет.
                    </p>
                  )}
                </div>
              </div>

              {errorMessage || integration?.lastSyncError ? (
                <div className="rounded-panel border border-status-danger/30 bg-status-danger-surface p-4 text-sm text-status-danger">
                  {errorMessage ?? integration?.lastSyncError}
                </div>
              ) : null}
            </div>
          </DrawerScrollArea>

          <div className="flex flex-wrap items-center gap-2 border-t px-5 py-4">
            {isConfigured ? (
              <Button
                type="button"
                variant="secondary"
                disabled={
                  isBusy ||
                  hasActiveRun ||
                  integration?.isActive === false ||
                  !canSync
                }
                onClick={() => void handleSync()}
              >
                <RefreshCw className="size-4" />
                Синхронизировать
              </Button>
            ) : null}
            {isConfigured ? (
              <Button
                type="button"
                variant="secondary"
                disabled={
                  isBusy || hasActiveRun || integration?.isActive === false
                }
                onClick={() => void handleStockSync()}
              >
                <RefreshCw className="size-4" />
                Stop-list
              </Button>
            ) : null}
            {isConfigured ? (
              <Button
                type="button"
                variant="destructive"
                disabled={isBusy || hasActiveRun}
                onClick={() => void handleRemove()}
              >
                <Trash2 className="size-4" />
                Отключить
              </Button>
            ) : null}
            <Button
              type="button"
              className="ml-auto"
              disabled={isBusy}
              onClick={() => void handleSubmit()}
            >
              {isConfigured ? "Сохранить" : "Подключить iiko"}
            </Button>
          </div>
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
