"use client";
import React, { PropsWithChildren } from "react";
import { type CatalogControllerGetCurrentQueryResult } from "@/shared/api/generated/react-query";
import { type SessionBootstrapState } from "@/shared/providers/session-bootstrap";
import { useIOSScrollFix } from "@/shared/lib/use-ios-scroll-fix";
import ReactQueryProvider from "./react-query-provider";
import { SessionProvider } from "./session-provider";
import { CatalogProvider } from "./catalog-provider";
import { SubscriptionAccessGate } from "./subscription-access-gate";

type AppProviderProps = PropsWithChildren<{
  initialCatalog?: CatalogControllerGetCurrentQueryResult | null;
  initialSession?: SessionBootstrapState | null;
}>;

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  initialCatalog,
  initialSession,
}) => {
  useIOSScrollFix();
  return (
    <ReactQueryProvider>
      <SessionProvider
        currentCatalogId={initialCatalog?.id ?? null}
        initialSession={initialSession}
      >
        <CatalogProvider initialCatalog={initialCatalog}>
          <SubscriptionAccessGate>{children}</SubscriptionAccessGate>
        </CatalogProvider>
      </SessionProvider>
    </ReactQueryProvider>
  );
};
