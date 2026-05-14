"use client";

import {
  getCatalogSubscriptionEndsAt,
  getDaysUntilSubscriptionEnd,
} from "@/shared/lib/subscription-status";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React from "react";

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

function SubscriptionForbiddenScreen() {
  return (
    <main className="z-[9999] bg-white">
      <Image
        src="/403.png"
        alt="Доступ ограничен"
        fill
        priority
        sizes="100vh"
        className="object-contain"
      />
    </main>
  );
}

export const SubscriptionAccessGate: React.FC<SubscriptionAccessGateProps> = ({
  children,
}) => {
  const pathname = usePathname();
  const { catalog } = useCatalogState();
  const { isLoading, user } = useSession();
  const isLoginPage =
    pathname === "/auth/login" || pathname === "/auth/sign-in";
  const isExpired = isSubscriptionExpired(catalog);

  if (!isExpired || isLoginPage || isCatalogManagerRole(user?.role)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return null;
  }

  return <SubscriptionForbiddenScreen />;
};
