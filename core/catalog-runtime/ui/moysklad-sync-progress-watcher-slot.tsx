"use client";

import { startMoySkladSyncProgressToast } from "@/core/modules/integration";
import {
  invalidateMoySkladIntegrationQueries,
  invalidateProductQueries,
} from "@/core/modules/product";
import {
  getCatalogAdvancedSettingsControllerGetMoySkladQueryKey,
  getCatalogAdvancedSettingsControllerGetMoySkladRunsQueryKey,
  getCatalogAdvancedSettingsControllerGetMoySkladStatusQueryKey,
  type MoySkladSyncRunDto,
  useCatalogAdvancedSettingsControllerGetMoySkladStatus,
} from "@/shared/api/generated/react-query";
import { useCatalogCapabilities } from "@/shared/capabilities";
import { useSession } from "@/shared/providers/session-provider";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import React from "react";

const SYNC_TOAST_TITLES: Record<MoySkladSyncRunDto["mode"], string> = {
  FULL: "Синхронизация каталога MoySklad",
  PRODUCT: "Синхронизация товара MoySklad",
  STOCK: "Синхронизация остатков MoySklad",
};

async function invalidateAdvancedMoySkladQueries(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetMoySkladStatusQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetMoySkladQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetMoySkladRunsQueryKey(),
    }),
  ]);
}

async function refreshMoySkladSyncQueries(queryClient: QueryClient) {
  await Promise.allSettled([
    invalidateAdvancedMoySkladQueries(queryClient),
    invalidateMoySkladIntegrationQueries(queryClient),
    invalidateProductQueries(queryClient),
  ]);
}

export const MoySkladSyncProgressWatcherSlot: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSession();
  const features = useCatalogCapabilities();
  const canWatchMoySkladSync =
    isAuthenticated && features.canUseMoySkladIntegration;

  const statusQuery = useCatalogAdvancedSettingsControllerGetMoySkladStatus({
    query: {
      enabled: canWatchMoySkladSync,
      refetchOnWindowFocus: canWatchMoySkladSync,
      retry: false,
      staleTime: 5_000,
    },
  });

  const activeRun = statusQuery.data?.activeRun ?? null;
  const activeRunId = activeRun?.id ?? null;
  const title = activeRun
    ? SYNC_TOAST_TITLES[activeRun.mode]
    : "Синхронизация MoySklad";

  React.useEffect(() => {
    if (!activeRunId) return;

    startMoySkladSyncProgressToast({
      runId: activeRunId,
      initialProgress: activeRun?.progress,
      title,
      onSettled: () => refreshMoySkladSyncQueries(queryClient),
    });
  }, [activeRun?.progress, activeRunId, queryClient, title]);

  return null;
};
