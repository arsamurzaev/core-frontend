"use client";
import React, { PropsWithChildren } from "react";
import { type CatalogControllerGetCurrentQueryResult } from "@/shared/api/generated";
import ReactQueryProvider from "./react-query-provider";
import { SessionProvider } from "./session-provider";
import { CatalogProvider } from "./catalog-provider";

type AppProviderProps = PropsWithChildren<{
  initialCatalog?: CatalogControllerGetCurrentQueryResult | null;
}>;

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  initialCatalog,
}) => {
  return (
    <ReactQueryProvider>
      <SessionProvider>
        <CatalogProvider initialCatalog={initialCatalog}>
          {children}
        </CatalogProvider>
      </SessionProvider>
    </ReactQueryProvider>
  );
};
