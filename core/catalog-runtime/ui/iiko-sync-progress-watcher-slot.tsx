"use client";

import { startIikoSyncProgressToast } from "@/core/modules/integration";
import {
  invalidateIikoIntegrationQueries,
  invalidateProductQueries,
} from "@/core/modules/product";
import {
  getCatalogAdvancedSettingsControllerGetIikoQueryKey,
  getCatalogAdvancedSettingsControllerGetIikoRunsQueryKey,
  getCatalogAdvancedSettingsControllerGetIikoStatusQueryKey,
  useCatalogAdvancedSettingsControllerGetIikoStatus,
} from "@/shared/api/generated/react-query";
import { useCatalogCapabilities } from "@/shared/capabilities";
import { useSession } from "@/shared/providers/session-provider";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import React from "react";

async function invalidateAdvancedIikoQueries(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetIikoStatusQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetIikoQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetIikoRunsQueryKey(),
    }),
  ]);
}

async function refreshIikoSyncQueries(queryClient: QueryClient) {
  await Promise.allSettled([
    invalidateAdvancedIikoQueries(queryClient),
    invalidateIikoIntegrationQueries(queryClient),
    invalidateProductQueries(queryClient),
  ]);
}

export const IikoSyncProgressWatcherSlot: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSession();
  const features = useCatalogCapabilities();
  const canWatchIikoSync = isAuthenticated && features.canUseIikoIntegration;

  const statusQuery = useCatalogAdvancedSettingsControllerGetIikoStatus({
    query: {
      enabled: canWatchIikoSync,
      refetchOnWindowFocus: canWatchIikoSync,
      retry: false,
      staleTime: 5_000,
    },
  });

  const activeRun = statusQuery.data?.activeRun ?? null;
  const activeRunId = activeRun?.id ?? null;

  React.useEffect(() => {
    if (!activeRunId) return;

    startIikoSyncProgressToast({
      runId: activeRunId,
      initialProgress: activeRun?.progress,
      title: "Синхронизация меню iiko",
      onSettled: () => refreshIikoSyncQueries(queryClient),
    });
  }, [activeRun?.progress, activeRunId, queryClient]);

  return null;
};
