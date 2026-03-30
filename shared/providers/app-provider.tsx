"use client";
import React, { PropsWithChildren } from "react";
import { type CatalogControllerGetCurrentQueryResult } from "@/shared/api/generated/react-query";
import { type SessionBootstrapState } from "@/shared/providers/session-bootstrap";
import ReactQueryProvider from "./react-query-provider";
import { SessionProvider } from "./session-provider";
import { CatalogProvider } from "./catalog-provider";

type AppProviderProps = PropsWithChildren<{
  initialCatalog?: CatalogControllerGetCurrentQueryResult | null;
  initialSession?: SessionBootstrapState | null;
}>;

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  initialCatalog,
  initialSession,
}) => {
  return (
    <ReactQueryProvider>
      <SessionProvider initialSession={initialSession}>
        <CatalogProvider initialCatalog={initialCatalog}>{children}</CatalogProvider>
      </SessionProvider>
    </ReactQueryProvider>
  );
};
