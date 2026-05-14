import { type MoySkladIntegrationStatusDto } from "@/shared/api/generated/react-query";
import {
  DEFAULT_SCHEDULE_TIMEZONE,
  parseSchedulePattern,
  type SchedulePreset,
} from "./moysklad-schedule";

export type MoySkladFormState = {
  token: string;
  priceTypeName: string;
  isActive: boolean;
  importImages: boolean;
  syncStock: boolean;
  exportOrders: boolean;
  orderExportOrganizationId: string;
  orderExportCounterpartyId: string;
  orderExportStoreId: string;
  scheduleEnabled: boolean;
  schedulePreset: SchedulePreset;
  scheduleHour: string;
  scheduleTimezone: string;
  legacySchedulePattern: string | null;
  scheduleTouched: boolean;
};

export type ValidationErrors = Partial<
  Record<
    | "token"
    | "orderExportOrganizationId"
    | "orderExportCounterpartyId"
    | "orderExportStoreId",
    string
  >
>;

export function resolveBrowserTimeZone(): string | null {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone?.trim();
    return timeZone || null;
  } catch {
    return null;
  }
}

export function normalizeTimeZone(value?: string | null): string {
  return value?.trim() || DEFAULT_SCHEDULE_TIMEZONE;
}

export function buildMoySkladFormState(
  status: MoySkladIntegrationStatusDto | undefined,
  preferredTimeZone: string,
): MoySkladFormState {
  const integration = status?.integration;
  const schedule = parseSchedulePattern(integration?.schedulePattern);

  return {
    token: "",
    priceTypeName: integration?.priceTypeName ?? "",
    isActive: integration?.isActive ?? true,
    importImages: integration?.importImages ?? true,
    syncStock: integration?.syncStock ?? true,
    exportOrders: integration?.exportOrders ?? false,
    orderExportOrganizationId: integration?.orderExportOrganizationId ?? "",
    orderExportCounterpartyId: integration?.orderExportCounterpartyId ?? "",
    orderExportStoreId: integration?.orderExportStoreId ?? "",
    scheduleEnabled: integration?.scheduleEnabled ?? true,
    schedulePreset: schedule.preset,
    scheduleHour: schedule.hour,
    scheduleTimezone: normalizeTimeZone(
      integration?.scheduleTimezone ?? preferredTimeZone,
    ),
    legacySchedulePattern: schedule.legacyPattern,
    scheduleTouched: false,
  };
}

export const EMPTY_MOYSKLAD_FORM_STATE: MoySkladFormState =
  buildMoySkladFormState(undefined, normalizeTimeZone(null));

export function resolveInitialFormState(): MoySkladFormState {
  return buildMoySkladFormState(
    undefined,
    normalizeTimeZone(resolveBrowserTimeZone()),
  );
}
