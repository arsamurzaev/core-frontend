"use client";

import {
  getIntegrationControllerGetMoySkladQueryKey,
  getIntegrationControllerGetMoySkladRunsQueryKey,
  getIntegrationControllerGetMoySkladStatusQueryKey,
} from "@/shared/api/generated/react-query";
import { type QueryClient } from "@tanstack/react-query";

export async function invalidateMoySkladIntegrationQueries(
  queryClient: QueryClient,
) {
  await Promise.allSettled([
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetMoySkladStatusQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetMoySkladQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetMoySkladRunsQueryKey(),
    }),
  ]);
}
