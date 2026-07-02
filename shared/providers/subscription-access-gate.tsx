"use client";

import {
  getCatalogSubscriptionEndsAt,
  getDaysUntilSubscriptionEnd,
} from "@/shared/lib/subscription-status";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import { Button } from "@/shared/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React from "react";
import { toast } from "sonner";

type SubscriptionAccessGateProps = {
  children: React.ReactNode;
};

function isSubscriptionExpired(catalog: unknown): boolean {
  const subscriptionEndsAt = getCatalogSubscriptionEndsAt(catalog);

  if (subscriptionEndsAt === undefined) {
    return false;
  }

  return getDaysUntilSubscriptionEnd(subscriptionEndsAt) <= 0;
}

type SubscriptionForbiddenScreenProps = {
  canEnterAdminMode: boolean;
  onEnterAdminMode: () => void;
};

function SubscriptionForbiddenScreen({
  canEnterAdminMode,
  onEnterAdminMode,
}: SubscriptionForbiddenScreenProps) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-surface-base">
      <Image
        src="/403.png"
        alt="Доступ ограничен"
        fill
        priority
        sizes="100vh"
        className="object-contain"
      />
      {canEnterAdminMode ? (
        <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center px-5">
          <Button
            type="button"
            size="sm"
            className="shadow-surface"
            onClick={onEnterAdminMode}
          >
            Войти как администратор
            <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </main>
  );
}

export const SubscriptionAccessGate: React.FC<SubscriptionAccessGateProps> = ({
  children,
}) => {
  const pathname = usePathname();
  const { catalog } = useCatalogState();
  const {
    enterGlobalAdminMode,
    hasGlobalAdminSession,
    isGlobalAdminMode,
    isLoading,
    user,
  } = useSession();
  const isLoginPage =
    pathname === "/auth/login" || pathname === "/auth/sign-in";
  const isExpired = isSubscriptionExpired(catalog);

  if (!isExpired || isLoginPage || isCatalogManagerRole(user?.role)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return null;
  }

  const canEnterAdminMode = hasGlobalAdminSession && !isGlobalAdminMode;

  return (
    <SubscriptionForbiddenScreen
      canEnterAdminMode={canEnterAdminMode}
      onEnterAdminMode={() => {
        toast.promise(enterGlobalAdminMode(), {
          loading: "Вход...",
          success: "Режим администратора включен",
          error: (error) =>
            error instanceof Error ? error.message : "Ошибка входа",
        });
      }}
    />
  );
};
