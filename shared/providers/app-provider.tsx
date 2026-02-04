"use client";
import React, { PropsWithChildren } from "react";
import { ComposeChildren } from "../lib/react";
import { type CatalogDto } from "@/shared/api/generated";
import ReactQueryProvider from "./react-query-provider";
import { SessionProvider } from "./session-provider";
import { CatalogProvider } from "./catalog-provider";

type AppProviderProps = PropsWithChildren<{
  initialCatalog?: CatalogDto | null;
}>;

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  initialCatalog,
}) => {
  return (
    <ComposeChildren>
      <ReactQueryProvider />
      <SessionProvider />
      <CatalogProvider initialCatalog={initialCatalog} />
      {children}
    </ComposeChildren>
  );
};
