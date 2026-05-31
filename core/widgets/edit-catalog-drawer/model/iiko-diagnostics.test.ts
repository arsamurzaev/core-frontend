import type {
  IikoImportPreviewDto,
  IikoIntegrationDto,
  IikoOrderExportDto,
  IikoSyncRunDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  buildIikoDiagnostics,
  getIikoDiagnosticSummary,
  type IikoDiagnosticsFormState,
} from "./iiko-diagnostics";

const baseForm: IikoDiagnosticsFormState = {
  apiLogin: "",
  organizationId: "org-1",
  organizationName: "Demo Org",
  externalMenuId: "menu-1",
  externalMenuName: "Main menu",
  priceCategoryId: "price-1",
  priceCategoryName: "Base price",
  terminalGroupId: "terminal-1",
  terminalGroupName: "Main terminal",
  exportOrders: true,
  isActive: true,
};

function integration(
  overrides: Partial<IikoIntegrationDto> = {},
): IikoIntegrationDto {
  return {
    provider: "IIKO",
    capabilities: {} as IikoIntegrationDto["capabilities"],
    isActive: true,
    hasApiLogin: true,
    apiLoginPreview: "abc***123",
    organizationId: "org-1",
    organizationName: "Demo Org",
    externalMenuId: "menu-1",
    externalMenuName: "Main menu",
    priceCategoryId: "price-1",
    priceCategoryName: "Base price",
    terminalGroupId: "terminal-1",
    terminalGroupName: "Main terminal",
    menuVersion: 4,
    syncSource: "external-menu",
    importImages: false,
    exportOrders: true,
    webhook: {
      enabled: true,
      urlPreview:
        "https://api.example.test/integration/webhooks/iiko/integration-1/***",
      hasSecret: true,
      lastConfiguredAt: "2026-05-21T06:00:00.000Z",
      lastReceivedAt: "2026-05-21T06:15:00.000Z",
      lastEventType: "StopListUpdate",
      lastError: null,
    },
    orderExportServiceType: null,
    orderExportSourceKey: null,
    lastRevision: null,
    lastMenuSyncedAt: "2026-05-21T06:00:00.000Z",
    lastStopListSyncedAt: "2026-05-21T06:05:00.000Z",
    lastSyncStatus: "SUCCESS",
    syncStartedAt: null,
    lastSyncAt: "2026-05-21T06:00:00.000Z",
    lastSyncError: null,
    totalProducts: 12,
    createdProducts: 10,
    updatedProducts: 2,
    deletedProducts: 0,
    createdAt: "2026-05-21T05:00:00.000Z",
    updatedAt: "2026-05-21T06:05:00.000Z",
    ...overrides,
  };
}

function run(overrides: Partial<IikoSyncRunDto> = {}): IikoSyncRunDto {
  return {
    id: "run-1",
    provider: "IIKO",
    mode: "FULL",
    trigger: "MANUAL",
    status: "SUCCESS",
    snapshotCompleteness: "FULL_COMPLETE",
    jobId: null,
    productId: null,
    externalId: null,
    error: null,
    totalProducts: 12,
    createdProducts: 10,
    updatedProducts: 2,
    deletedProducts: 0,
    imagesImported: 0,
    products: {} as IikoSyncRunDto["products"],
    variants: {} as IikoSyncRunDto["variants"],
    stockRows: {} as IikoSyncRunDto["stockRows"],
    warnings: [],
    errors: [],
    progress: null,
    durationMs: 1200,
    requestedAt: "2026-05-21T06:00:00.000Z",
    startedAt: "2026-05-21T06:00:00.000Z",
    finishedAt: "2026-05-21T06:01:00.000Z",
    createdAt: "2026-05-21T06:00:00.000Z",
    updatedAt: "2026-05-21T06:01:00.000Z",
    ...overrides,
  };
}

function preview(
  overrides: Partial<IikoImportPreviewDto["stats"]> = {},
): IikoImportPreviewDto {
  return {
    ok: true,
    source: "external-menu",
    revision: null,
    externalMenuId: "menu-1",
    externalMenuName: "Main menu",
    stats: {
      categories: 2,
      items: 12,
      visibleItems: 10,
      hiddenItems: 1,
      itemsWithoutPrice: 1,
      itemsWithModifiers: 3,
      combos: 0,
      variants: 4,
      ...overrides,
    },
    diff: {
      newItems: 0,
      matchedItems: 0,
      changedItems: 0,
      priceChanges: 0,
      nameChanges: 0,
      unchangedItems: 0,
      missingLinkedItems: 0,
    },
    categories: [],
    items: [],
  };
}

function orderExport(
  overrides: Partial<IikoOrderExportDto> = {},
): IikoOrderExportDto {
  return {
    id: "export-1",
    provider: "IIKO",
    orderId: "order-1",
    idempotencyKey: "order-1:done",
    externalId: "iiko-order-1",
    status: "SUCCESS",
    attempts: 1,
    lastError: null,
    requestedAt: "2026-05-21T06:10:00.000Z",
    startedAt: "2026-05-21T06:10:00.000Z",
    exportedAt: "2026-05-21T06:11:00.000Z",
    createdAt: "2026-05-21T06:10:00.000Z",
    updatedAt: "2026-05-21T06:11:00.000Z",
    ...overrides,
  };
}

describe("iiko diagnostics", () => {
  it("marks a fully configured integration as ready", () => {
    const items = buildIikoDiagnostics({
      integration: integration(),
      formState: baseForm,
      priceCategories: [{ id: "price-1", name: "Base price" }],
      terminalGroups: [
        {
          id: "terminal-1",
          name: "Main terminal",
          organizationId: "org-1",
          isActive: true,
          isAlive: true,
        },
      ],
      runs: [run(), run({ id: "stock-run", mode: "STOCK" })],
      preview: preview(),
      orderExports: [orderExport()],
      formatDate: (value) => value?.slice(0, 10) ?? null,
    });

    expect(getIikoDiagnosticSummary(items)).toMatchObject({
      label: "Готово",
      errors: 0,
      warnings: 0,
    });
  });

  it("flags required price category and inactive terminal", () => {
    const items = buildIikoDiagnostics({
      integration: integration({
        priceCategoryId: null,
        priceCategoryName: null,
      }),
      formState: {
        ...baseForm,
        priceCategoryId: "",
        priceCategoryName: null,
      },
      priceCategories: [{ id: "price-1", name: "Base price" }],
      terminalGroups: [
        {
          id: "terminal-1",
          name: "Main terminal",
          organizationId: "org-1",
          isActive: false,
          isAlive: true,
        },
      ],
      runs: [],
      preview: preview(),
      orderExports: [],
    });

    expect(items.find((item) => item.key === "price-category")?.tone).toBe(
      "error",
    );
    expect(items.find((item) => item.key === "terminal-group")?.tone).toBe(
      "error",
    );
    expect(getIikoDiagnosticSummary(items).badgeVariant).toBe("destructive");
  });

  it("warns when preview returns no importable products", () => {
    const items = buildIikoDiagnostics({
      integration: integration(),
      formState: baseForm,
      priceCategories: [{ id: "price-1", name: "Base price" }],
      terminalGroups: [
        {
          id: "terminal-1",
          name: "Main terminal",
          organizationId: "org-1",
          isActive: true,
          isAlive: true,
        },
      ],
      runs: [],
      preview: preview({ visibleItems: 0, variants: 0 }),
      orderExports: [orderExport()],
    });

    expect(items.find((item) => item.key === "preview")?.tone).toBe("warning");
    expect(getIikoDiagnosticSummary(items).label).toBe("Есть предупреждения");
  });

  it("does not treat disabled order export as a blocking warning", () => {
    const items = buildIikoDiagnostics({
      integration: integration({ exportOrders: false }),
      formState: { ...baseForm, exportOrders: false },
      priceCategories: [{ id: "price-1", name: "Base price" }],
      terminalGroups: [
        {
          id: "terminal-1",
          name: "Main terminal",
          organizationId: "org-1",
          isActive: true,
          isAlive: true,
        },
      ],
      runs: [],
      preview: null,
      orderExports: [],
    });

    expect(items.find((item) => item.key === "order-export")?.tone).toBe(
      "pending",
    );
    expect(getIikoDiagnosticSummary(items).label).toBe("Готово");
  });

  it("warns when iiko webhooks are not registered", () => {
    const items = buildIikoDiagnostics({
      integration: integration({
        webhook: {
          enabled: false,
          urlPreview: null,
          hasSecret: false,
          lastConfiguredAt: null,
          lastReceivedAt: null,
          lastEventType: null,
          lastError: null,
        },
      }),
      formState: baseForm,
      priceCategories: [{ id: "price-1", name: "Base price" }],
      terminalGroups: [
        {
          id: "terminal-1",
          name: "Main terminal",
          organizationId: "org-1",
          isActive: true,
          isAlive: true,
        },
      ],
      runs: [run(), run({ id: "stock-run", mode: "STOCK" })],
      preview: preview(),
      orderExports: [orderExport()],
    });

    expect(items.find((item) => item.key === "webhook")?.tone).toBe("warning");
    expect(getIikoDiagnosticSummary(items).label).toBe("Есть предупреждения");
  });
});
