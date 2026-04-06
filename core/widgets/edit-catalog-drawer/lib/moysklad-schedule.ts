export const DEFAULT_SCHEDULE_TIMEZONE = "Europe/Moscow";
export const DEFAULT_DAILY_SYNC_HOUR = "0";

export const SCHEDULE_PRESET_OPTIONS = [
  {
    value: "hourly",
    label: "Каждый час",
    description: "Синхронизация запускается в начале каждого часа.",
  },
  {
    value: "six_hours",
    label: "Каждые 6 часов",
    description: "Подходит, если не нужен слишком частый импорт.",
  },
  {
    value: "daily",
    label: "Раз в день",
    description: "Один запуск каждый день в выбранное время.",
  },
] as const;

export const SCHEDULE_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: `${String(hour).padStart(2, "0")}:00`,
}));

export type SchedulePreset = (typeof SCHEDULE_PRESET_OPTIONS)[number]["value"];

export function parseSchedulePattern(pattern?: string | null): {
  preset: SchedulePreset;
  hour: string;
  legacyPattern: string | null;
} {
  const normalized = pattern?.trim();

  if (!normalized) {
    return { preset: "daily", hour: DEFAULT_DAILY_SYNC_HOUR, legacyPattern: null };
  }

  if (normalized === "0 * * * *") {
    return { preset: "hourly", hour: DEFAULT_DAILY_SYNC_HOUR, legacyPattern: null };
  }

  if (normalized === "0 */6 * * *") {
    return { preset: "six_hours", hour: DEFAULT_DAILY_SYNC_HOUR, legacyPattern: null };
  }

  const dailyMatch = /^0\s+([01]?\d|2[0-3])\s+\*\s+\*\s+\*$/.exec(normalized);
  if (dailyMatch) {
    return { preset: "daily", hour: String(Number(dailyMatch[1])), legacyPattern: null };
  }

  return { preset: "daily", hour: DEFAULT_DAILY_SYNC_HOUR, legacyPattern: normalized };
}

export function buildSchedulePattern(preset: SchedulePreset, hour: string): string {
  if (preset === "hourly") return "0 * * * *";
  if (preset === "six_hours") return "0 */6 * * *";

  const normalizedHour = Number(hour);
  const safeHour =
    Number.isInteger(normalizedHour) && normalizedHour >= 0 && normalizedHour <= 23
      ? normalizedHour
      : Number(DEFAULT_DAILY_SYNC_HOUR);

  return `0 ${safeHour} * * *`;
}

export function getSchedulePresetDescription(preset: SchedulePreset): string {
  return SCHEDULE_PRESET_OPTIONS.find((o) => o.value === preset)?.description ?? "";
}
