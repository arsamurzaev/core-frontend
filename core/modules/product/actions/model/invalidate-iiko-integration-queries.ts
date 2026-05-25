"use client";

import {
  getIntegrationControllerGetIikoQueryKey,
  getIntegrationControllerGetIikoRunsQueryKey,
  getIntegrationControllerGetIikoStatusQueryKey,
} from "@/shared/api/generated/react-query";
import { type QueryClient } from "@tanstack/react-query";

export async function invalidateIikoIntegrationQueries(queryClient: QueryClient) {
  await Promise.allSettled([
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetIikoStatusQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetIikoQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getIntegrationControllerGetIikoRunsQueryKey(),
    }),
  ]);
}
