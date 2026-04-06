"use client";

import { Browser } from "@/core/views/home/_ui/browser";
import { useSession } from "@/shared/providers/session-provider";
import type { CategoryDto } from "@/shared/api/generated/react-query";
import React from "react";
import { useCatalogPlugin } from "../core/use-catalog-plugin";

interface CatalogBrowserProps {
  className?: string;
  initialCategories?: CategoryDto[];
}

export const CatalogBrowser: React.FC<CatalogBrowserProps> = (props) => {
  const plugin = useCatalogPlugin();
  const { user } = useSession();
  const canManage = user?.role === "ADMIN" || user?.role === "CATALOG";

  if (plugin.Browser && !canManage) {
    return <plugin.Browser {...props} />;
  }

  return <Browser {...props} />;
};
