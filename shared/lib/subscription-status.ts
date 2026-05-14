const DAY_IN_MS = 1000 * 60 * 60 * 24;

type CatalogWithSubscriptionMeta = {
  subscriptionEndsAt?: string | Date | null;
};

export function getCatalogSubscriptionEndsAt(
  catalog: unknown,
): Date | null | undefined {
  if (!catalog || typeof catalog !== "object") {
    return undefined;
  }

  if (!("subscriptionEndsAt" in catalog)) {
    return undefined;
  }

  const value = (catalog as CatalogWithSubscriptionMeta).subscriptionEndsAt;

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDaysUntilSubscriptionEnd(endDate: Date | null): number {
  if (!endDate) {
    return 0;
  }

  const today = new Date();
  const normalizedToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const normalizedEnd = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );
  const diffDays = Math.ceil(
    (normalizedEnd.getTime() - normalizedToday.getTime()) / DAY_IN_MS,
  );

  return Math.max(0, diffDays);
}

export function formatSubscriptionDaysText(days: number): string {
  if (days === 0) {
    return "Лицензия истекла";
  }

  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${days} дней`;
  }

  if (lastDigit === 1) {
    return `${days} день`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${days} дня`;
  }

  return `${days} дней`;
}
