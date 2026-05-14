"use client";

import React from "react";

import { formatSubscriptionDaysText } from "@/shared/lib/subscription-status";

const SUBSCRIPTION_WARNING_DAYS_THRESHOLD = 10;

type UseSubscriptionWarningParams = {
  catalogId?: string | null;
  daysRemaining: number | null;
  isAdmin: boolean;
  subscriptionEndsAt: Date | null | undefined;
};

export function useSubscriptionWarning({
  catalogId,
  daysRemaining,
  isAdmin,
  subscriptionEndsAt,
}: UseSubscriptionWarningParams) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isAdmin || subscriptionEndsAt === undefined || daysRemaining === null) {
      return;
    }

    if (daysRemaining === 0) {
      setOpen(true);
      return;
    }

    if (!subscriptionEndsAt || daysRemaining >= SUBSCRIPTION_WARNING_DAYS_THRESHOLD) {
      return;
    }

    const today = new Date().toDateString();
    const storageKey = buildSubscriptionWarningStorageKey(catalogId, today);
    const hasShownToday =
      typeof window !== "undefined"
        ? window.localStorage.getItem(storageKey)
        : null;

    if (hasShownToday) {
      return;
    }

    setOpen(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, "true");
      cleanupOldWarnings();
    }
  }, [catalogId, daysRemaining, isAdmin, subscriptionEndsAt]);

  return {
    open,
    setOpen,
    message:
      daysRemaining === null ? null : formatSubscriptionDaysText(daysRemaining),
  };
}

function buildSubscriptionWarningStorageKey(
  catalogId: string | null | undefined,
  today: string,
) {
  return catalogId
    ? `subscription-warning-${catalogId}-${today}`
    : `subscription-warning-${today}`;
}

function cleanupOldWarnings() {
  try {
    if (typeof window === "undefined") {
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    Object.keys(window.localStorage)
      .filter((key) => key.startsWith("subscription-warning-"))
      .forEach((key) => {
        const warningDate = new Date(
          key.replace("subscription-warning-", ""),
        );

        if (warningDate < thirtyDaysAgo) {
          window.localStorage.removeItem(key);
        }
      });
  } catch (error) {
    console.warn("Failed to cleanup old subscription warnings:", error);
  }
}
