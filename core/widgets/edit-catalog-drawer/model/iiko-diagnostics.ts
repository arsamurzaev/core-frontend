import type {
  IikoImportPreviewDto,
  IikoIntegrationDto,
  IikoOrderExportDto,
  IikoPriceCategoryDto,
  IikoSyncRunDto,
  IikoTerminalGroupDto,
  IikoWebhookEventDto,
} from "@/shared/api/generated/react-query";

export type IikoDiagnosticTone = "ok" | "warning" | "error" | "pending";

export type IikoDiagnosticItem = {
  key: string;
  label: string;
  detail: string;
  tone: IikoDiagnosticTone;
};

export type IikoDiagnosticsFormState = {
  apiLogin: string;
  organizationId: string;
  organizationName: string | null;
  externalMenuId: string;
  externalMenuName: string | null;
  priceCategoryId: string;
  priceCategoryName: string | null;
  terminalGroupId: string;
  terminalGroupName: string | null;
  exportOrders: boolean;
  isActive: boolean;
};

export type IikoDiagnosticSummary = {
  label: string;
  tone: IikoDiagnosticTone;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  errors: number;
  warnings: number;
  pending: number;
};

type BuildIikoDiagnosticsInput = {
  integration?: IikoIntegrationDto | null;
  formState: IikoDiagnosticsFormState;
  priceCategories: IikoPriceCategoryDto[];
  terminalGroups: IikoTerminalGroupDto[];
  runs: IikoSyncRunDto[];
  activeRun?: IikoSyncRunDto | null;
  preview?: IikoImportPreviewDto | null;
  orderExports: IikoOrderExportDto[];
  webhookEvents?: IikoWebhookEventDto[];
  formatDate?: (value?: string | null) => string | null;
};

const DEFAULT_FORMAT_DATE = (value?: string | null) => value ?? null;

function nonEmpty(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatEntity(name?: string | null, id?: string | null): string | null {
  const value = nonEmpty(name) ?? nonEmpty(id);
  return value;
}

function findLatestRun(
  runs: IikoSyncRunDto[],
  predicate: (run: IikoSyncRunDto) => boolean,
): IikoSyncRunDto | null {
  return runs.find(predicate) ?? null;
}

function describeRunError(run: IikoSyncRunDto | null): string | null {
  if (!run || run.status !== "ERROR") return null;

  return run.error
    ? `Ошибка: ${run.error}`
    : "Последний запуск завершился ошибкой.";
}

export function buildIikoDiagnostics({
  integration,
  formState,
  priceCategories,
  terminalGroups,
  runs,
  activeRun,
  preview,
  orderExports,
  webhookEvents = [],
  formatDate = DEFAULT_FORMAT_DATE,
}: BuildIikoDiagnosticsInput): IikoDiagnosticItem[] {
  const items: IikoDiagnosticItem[] = [];

  const organizationId =
    nonEmpty(formState.organizationId) ?? nonEmpty(integration?.organizationId);
  const organizationName = formatEntity(
    formState.organizationName ?? integration?.organizationName,
    organizationId,
  );
  const externalMenuId =
    nonEmpty(formState.externalMenuId) ?? nonEmpty(integration?.externalMenuId);
  const externalMenuName = formatEntity(
    formState.externalMenuName ?? integration?.externalMenuName,
    externalMenuId,
  );
  const priceCategoryId =
    nonEmpty(formState.priceCategoryId) ??
    nonEmpty(integration?.priceCategoryId);
  const priceCategoryName = formatEntity(
    formState.priceCategoryName ?? integration?.priceCategoryName,
    priceCategoryId,
  );
  const terminalGroupId =
    nonEmpty(formState.terminalGroupId) ??
    nonEmpty(integration?.terminalGroupId);
  const selectedTerminalGroup =
    terminalGroups.find(
      (terminalGroup) => terminalGroup.id === terminalGroupId,
    ) ?? null;
  const terminalGroupName = formatEntity(
    selectedTerminalGroup?.name ??
      formState.terminalGroupName ??
      integration?.terminalGroupName,
    terminalGroupId,
  );
  const hasApiLogin = Boolean(
    integration?.hasApiLogin || nonEmpty(formState.apiLogin),
  );

  items.push(
    hasApiLogin
      ? {
          key: "api-login",
          label: "apiLogin",
          detail: integration?.apiLoginPreview
            ? `Сохранен: ${integration.apiLoginPreview}`
            : "Введен и готов к проверке.",
          tone: "ok",
        }
      : {
          key: "api-login",
          label: "apiLogin",
          detail: "Введите apiLogin и проверьте подключение.",
          tone: "error",
        },
  );

  items.push(
    organizationId
      ? {
          key: "organization",
          label: "Организация",
          detail: organizationName ?? organizationId,
          tone: "ok",
        }
      : {
          key: "organization",
          label: "Организация",
          detail: "Выберите организацию из ответа iiko.",
          tone: "error",
        },
  );

  items.push(
    externalMenuId
      ? {
          key: "external-menu",
          label: "External Menu",
          detail: externalMenuName ?? externalMenuId,
          tone: "ok",
        }
      : {
          key: "external-menu",
          label: "External Menu",
          detail: "Выберите внешнее меню, из него импортируется каталог.",
          tone: "error",
        },
  );

  if (priceCategories.length > 0) {
    items.push(
      priceCategoryId
        ? {
            key: "price-category",
            label: "Ценовая категория",
            detail: priceCategoryName ?? priceCategoryId,
            tone: "ok",
          }
        : {
            key: "price-category",
            label: "Ценовая категория",
            detail: "iiko вернул ценовые категории, выберите нужную.",
            tone: "error",
          },
    );
  } else {
    items.push({
      key: "price-category",
      label: "Ценовая категория",
      detail: priceCategoryId
        ? (priceCategoryName ?? priceCategoryId)
        : "Нет данных от iiko или меню работает без ценовой категории.",
      tone: priceCategoryId ? "ok" : "pending",
    });
  }

  if (!terminalGroupId) {
    items.push({
      key: "terminal-group",
      label: "Точка / терминал",
      detail:
        formState.exportOrders || integration?.exportOrders
          ? "Выберите terminal group для stop-list и экспорта заказов."
          : "Не выбрана, stop-list и экспорт заказов будут недоступны.",
      tone:
        formState.exportOrders || integration?.exportOrders
          ? "error"
          : "warning",
    });
  } else if (!selectedTerminalGroup) {
    items.push({
      key: "terminal-group",
      label: "Точка / терминал",
      detail:
        terminalGroups.length > 0
          ? `${terminalGroupName ?? terminalGroupId}: сохраненная точка не пришла в ответе iiko.`
          : `${terminalGroupName ?? terminalGroupId}: нажмите проверку подключения, чтобы обновить статус.`,
      tone: terminalGroups.length > 0 ? "warning" : "pending",
    });
  } else if (selectedTerminalGroup.isActive === false) {
    items.push({
      key: "terminal-group",
      label: "Точка / терминал",
      detail: `${terminalGroupName ?? terminalGroupId}: терминал неактивен или не зарегистрирован.`,
      tone: "error",
    });
  } else if (selectedTerminalGroup.isAlive === false) {
    items.push({
      key: "terminal-group",
      label: "Точка / терминал",
      detail: `${terminalGroupName ?? terminalGroupId}: Cloud API сейчас не принимает команды.`,
      tone: "error",
    });
  } else if (selectedTerminalGroup.isAlive === null) {
    items.push({
      key: "terminal-group",
      label: "Точка / терминал",
      detail: `${terminalGroupName ?? terminalGroupId}: iiko пока не вернул статус доступности.`,
      tone: "warning",
    });
  } else {
    items.push({
      key: "terminal-group",
      label: "Точка / терминал",
      detail: terminalGroupName ?? terminalGroupId,
      tone: "ok",
    });
  }

  const lastMenuRun = findLatestRun(runs, (run) => run.mode !== "STOCK");
  const activeMenuRun =
    activeRun && activeRun.mode !== "STOCK" ? activeRun : null;
  const menuRunError =
    describeRunError(lastMenuRun) ??
    (integration?.lastSyncStatus === "ERROR"
      ? (integration.lastSyncError ??
        "Последний импорт меню завершился ошибкой.")
      : null);
  const lastMenuAt =
    formatDate(integration?.lastMenuSyncedAt) ??
    formatDate(lastMenuRun?.finishedAt) ??
    formatDate(integration?.lastSyncAt);

  if (activeMenuRun) {
    items.push({
      key: "menu-sync",
      label: "Импорт меню",
      detail: "Импорт меню выполняется или ожидает очередь.",
      tone: "pending",
    });
  } else if (menuRunError) {
    items.push({
      key: "menu-sync",
      label: "Импорт меню",
      detail: menuRunError,
      tone: "error",
    });
  } else if (lastMenuAt) {
    items.push({
      key: "menu-sync",
      label: "Импорт меню",
      detail: `Последний успешный запуск: ${lastMenuAt}`,
      tone: "ok",
    });
  } else {
    items.push({
      key: "menu-sync",
      label: "Импорт меню",
      detail: externalMenuId
        ? "После сохранения запустите синхронизацию меню."
        : "Сначала выберите External Menu.",
      tone: "warning",
    });
  }

  const lastStockRun = findLatestRun(runs, (run) => run.mode === "STOCK");
  const activeStockRun =
    activeRun && activeRun.mode === "STOCK" ? activeRun : null;
  const stockRunError = describeRunError(lastStockRun);
  const lastStockAt =
    formatDate(integration?.lastStopListSyncedAt) ??
    formatDate(lastStockRun?.finishedAt);

  if (activeStockRun) {
    items.push({
      key: "stock-sync",
      label: "Stop-list",
      detail: "Обновление stop-list выполняется или ожидает очередь.",
      tone: "pending",
    });
  } else if (!terminalGroupId) {
    items.push({
      key: "stock-sync",
      label: "Stop-list",
      detail:
        "Выберите terminal group, чтобы скрывать закончившиеся товары для клиента.",
      tone: "warning",
    });
  } else if (stockRunError) {
    items.push({
      key: "stock-sync",
      label: "Stop-list",
      detail: stockRunError,
      tone: "error",
    });
  } else if (lastStockAt) {
    items.push({
      key: "stock-sync",
      label: "Stop-list",
      detail: `Последнее обновление: ${lastStockAt}`,
      tone: "ok",
    });
  } else {
    items.push({
      key: "stock-sync",
      label: "Stop-list",
      detail: "После выбора точки запустите первое обновление stop-list.",
      tone: "warning",
    });
  }

  if (preview?.stats) {
    items.push({
      key: "preview",
      label: "Preview",
      detail:
        preview.stats.visibleItems > 0
          ? `Готово к импорту: ${preview.stats.visibleItems} товаров, ${preview.stats.variants} вариантов.`
          : "Preview не нашел видимых товаров с валидной ценой.",
      tone: preview.stats.visibleItems > 0 ? "ok" : "warning",
    });
  } else {
    items.push({
      key: "preview",
      label: "Preview",
      detail:
        "Запустите preview перед первым импортом или после смены меню/цен.",
      tone: "pending",
    });
  }

  const exportOrdersEnabled =
    formState.exportOrders || Boolean(integration?.exportOrders);
  const lastOrderExport = orderExports[0] ?? null;

  if (!exportOrdersEnabled) {
    items.push({
      key: "order-export",
      label: "Экспорт заказов",
      detail: "Выключен в настройках iiko.",
      tone: "pending",
    });
  } else if (!terminalGroupId) {
    items.push({
      key: "order-export",
      label: "Экспорт заказов",
      detail: "Для отправки заказов нужна выбранная terminal group.",
      tone: "error",
    });
  } else if (!lastOrderExport) {
    items.push({
      key: "order-export",
      label: "Экспорт заказов",
      detail: "Включен, новых экспортов пока не было.",
      tone: "ok",
    });
  } else if (lastOrderExport.status === "ERROR") {
    items.push({
      key: "order-export",
      label: "Экспорт заказов",
      detail:
        lastOrderExport.lastError ?? "Последний экспорт завершился ошибкой.",
      tone: "error",
    });
  } else if (
    lastOrderExport.status === "PENDING" ||
    lastOrderExport.status === "RUNNING"
  ) {
    items.push({
      key: "order-export",
      label: "Экспорт заказов",
      detail: `Заказ ${lastOrderExport.orderId} ожидает отправку или выполняется.`,
      tone: "pending",
    });
  } else if (lastOrderExport.status === "SKIPPED") {
    items.push({
      key: "order-export",
      label: "Экспорт заказов",
      detail: lastOrderExport.lastError ?? "Последний экспорт был пропущен.",
      tone: "warning",
    });
  } else {
    items.push({
      key: "order-export",
      label: "Экспорт заказов",
      detail: `Последний заказ отправлен: ${lastOrderExport.orderId}.`,
      tone: "ok",
    });
  }

  if (!integration) {
    items.push({
      key: "webhook",
      label: "Вебхуки",
      detail: "Сначала сохраните интеграцию iiko.",
      tone: "pending",
    });
  } else if (integration.webhook.lastError) {
    items.push({
      key: "webhook",
      label: "Вебхуки",
      detail: integration.webhook.lastError,
      tone: "error",
    });
  } else if (integration.webhook.enabled && integration.webhook.hasSecret) {
    const lastReceivedAt = formatDate(integration.webhook.lastReceivedAt);
    const lastConfiguredAt = formatDate(integration.webhook.lastConfiguredAt);
    items.push({
      key: "webhook",
      label: "Вебхуки",
      detail: lastReceivedAt
        ? `Последнее событие: ${integration.webhook.lastEventType ?? "iiko"} (${lastReceivedAt}).`
        : lastConfiguredAt
          ? `Зарегистрированы в iiko: ${lastConfiguredAt}.`
          : "Зарегистрированы в iiko.",
      tone: "ok",
    });
  } else {
    items.push({
      key: "webhook",
      label: "Вебхуки",
      detail:
        "Не зарегистрированы: stop-list и обновления меню работают только вручную.",
      tone: "warning",
    });
  }

  const failedWebhookEvents = webhookEvents.filter(
    (event) => event.status === "FAILED",
  );
  const processingWebhookEvents = webhookEvents.filter(
    (event) => event.status === "PROCESSING" || event.status === "PENDING",
  );
  if (failedWebhookEvents.length > 0) {
    items.push({
      key: "webhook-events",
      label: "Журнал webhook",
      detail: `Ошибок: ${failedWebhookEvents.length}. Последняя: ${
        failedWebhookEvents[0]?.eventType ?? "iiko"
      }.`,
      tone: "error",
    });
  } else if (processingWebhookEvents.length > 0) {
    items.push({
      key: "webhook-events",
      label: "Журнал webhook",
      detail: `В обработке или очереди: ${processingWebhookEvents.length}.`,
      tone: "pending",
    });
  } else if (webhookEvents.length > 0) {
    items.push({
      key: "webhook-events",
      label: "Журнал webhook",
      detail: `Последние ${webhookEvents.length} событий обработаны без ошибок.`,
      tone: "ok",
    });
  }

  return items;
}

export function getIikoDiagnosticSummary(
  items: IikoDiagnosticItem[],
): IikoDiagnosticSummary {
  const errors = items.filter((item) => item.tone === "error").length;
  const warnings = items.filter((item) => item.tone === "warning").length;
  const pending = items.filter((item) => item.tone === "pending").length;

  if (errors > 0) {
    return {
      label: "Нужна настройка",
      tone: "error",
      badgeVariant: "destructive",
      errors,
      warnings,
      pending,
    };
  }

  if (warnings > 0) {
    return {
      label: "Есть предупреждения",
      tone: "warning",
      badgeVariant: "secondary",
      errors,
      warnings,
      pending,
    };
  }

  if (pending > 0 && items.every((item) => item.tone === "pending")) {
    return {
      label: "Ожидает данных",
      tone: "pending",
      badgeVariant: "outline",
      errors,
      warnings,
      pending,
    };
  }

  return {
    label: "Готово",
    tone: "ok",
    badgeVariant: "default",
    errors,
    warnings,
    pending,
  };
}
