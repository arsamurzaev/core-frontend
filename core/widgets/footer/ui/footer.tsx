"use client";

import {
  formatSubscriptionDaysText,
  getCatalogSubscriptionEndsAt,
  getDaysUntilSubscriptionEnd,
} from "@/core/widgets/footer/model/subscription-status";
import { useSubscriptionWarning } from "@/core/widgets/footer/model/use-subscription-warning";
import { SubscriptionReminderDrawer } from "@/core/widgets/footer/ui/subscription-reminder-drawer";
import { SupportDrawer } from "@/core/widgets/footer/ui/support-drawer";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import React from "react";
import { ShareDrawerBrand } from "../../share-drawer/ui/share-drawer-brand";

const PLATFORM_URL = "https://catalog.kreati.ru";

interface Props {
  className?: string;
}

const FooterBrand: React.FC = () => {
  return <ShareDrawerBrand />;
};

const SubscriptionStatusCard: React.FC<{
  daysRemaining: number;
  subscriptionEndsAt: Date | null;
}> = ({ daysRemaining, subscriptionEndsAt }) => {
  const isExpired = daysRemaining === 0;

  return (
    <div className="text-center">
      <p className="text-muted-foreground text-sm">
        {isExpired ? "Статус лицензии" : "До конца подписки"}
      </p>
      <div
        className={cn(
          "text-2xl font-medium",
          isExpired
            ? "text-red-500"
            : daysRemaining <= 3
              ? "text-red-500"
              : daysRemaining <= 7
                ? "text-orange-500"
                : "text-foreground",
        )}
      >
        {formatSubscriptionDaysText(daysRemaining)}
      </div>
      {subscriptionEndsAt ? (
        <div className="text-muted-foreground mt-1 text-xs">
          до {subscriptionEndsAt.toLocaleDateString("ru-RU")}
        </div>
      ) : null}
    </div>
  );
};

export const Footer: React.FC<Props> = ({ className }) => {
  const { user } = useSession();
  const { catalog } = useCatalogState();
  const [supportOpen, setSupportOpen] = React.useState(false);

  const canOpenSupport = user?.role === "CATALOG" || user?.role === "ADMIN";
  const subscriptionEndsAt = React.useMemo(
    () => getCatalogSubscriptionEndsAt(catalog),
    [catalog],
  );
  const hasSubscriptionStatus = subscriptionEndsAt !== undefined;
  const daysRemaining = React.useMemo(
    () =>
      subscriptionEndsAt === undefined
        ? null
        : getDaysUntilSubscriptionEnd(subscriptionEndsAt),
    [subscriptionEndsAt],
  );

  const {
    open: warningOpen,
    setOpen: setWarningOpen,
    message,
  } = useSubscriptionWarning({
    catalogId: catalog?.id,
    daysRemaining,
    isAdmin: canOpenSupport,
    subscriptionEndsAt,
  });

  const handleRenewClick = React.useCallback(() => {
    setWarningOpen(false);
    setSupportOpen(true);
  }, [setWarningOpen]);

  return (
    <footer className={cn("space-y-6 pb-28", className)}>
      <FooterBrand />

      {canOpenSupport ? (
        <div className="flex flex-col items-center space-y-10">
          <SupportDrawer open={supportOpen} onOpenChange={setSupportOpen} />

          {hasSubscriptionStatus && daysRemaining !== null ? (
            <SubscriptionStatusCard
              daysRemaining={daysRemaining}
              subscriptionEndsAt={subscriptionEndsAt}
            />
          ) : null}

          {message ? (
            <SubscriptionReminderDrawer
              open={warningOpen}
              onOpenChange={setWarningOpen}
              onRenewClick={handleRenewClick}
              message={message}
            />
          ) : null}
        </div>
      ) : null}
    </footer>
  );
};
