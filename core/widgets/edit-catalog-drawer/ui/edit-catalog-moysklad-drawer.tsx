"use client";

import { useSession } from "@/shared/providers/session-provider";
import React from "react";

import { EditCatalogMoySkladDrawerAdmin } from "./edit-catalog-moysklad-drawer-admin";
import { EditCatalogMoySkladDrawerCatalog } from "./edit-catalog-moysklad-drawer-catalog";

export const EditCatalogMoySkladDrawer: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const { isLoading, user } = useSession();

  if (user?.role === "ADMIN") {
    return <EditCatalogMoySkladDrawerAdmin disabled={disabled} />;
  }

  if (user?.role === "CATALOG") {
    return <EditCatalogMoySkladDrawerCatalog disabled={disabled} />;
  }

  return <EditCatalogMoySkladDrawerCatalog disabled={disabled || isLoading} />;
};
