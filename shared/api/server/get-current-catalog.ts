import { type CatalogControllerGetCurrentQueryResult } from "@/shared/api/generated/react-query";
import { FORWARDED_HOST_HEADER, mutator } from "@/shared/api/client";
import {
  DEFAULT_FORWARDED_HOST,
  normalizeForwardedHost,
} from "@/shared/api/forwarded-host";
import { buildStorefrontCatalogCacheTag } from "@/shared/api/server/storefront-cache";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";

const STOREFRONT_SERVER_REVALIDATE_SECONDS = 15;

export async function resolveServerForwardedHost(): Promise<string> {
  try {
    const requestHeaders = await headers();
    const forwardedHost = normalizeForwardedHost(
      requestHeaders.get(FORWARDED_HOST_HEADER),
    );

    if (forwardedHost) {
      return forwardedHost;
    }

    const requestHost = normalizeForwardedHost(requestHeaders.get("host"));

    if (requestHost) {
      return requestHost;
    }
  } catch {
    // Build-time renders can run without an active request context.
  }

  return DEFAULT_FORWARDED_HOST;
}

export async function getCurrentCatalogServer(): Promise<CatalogControllerGetCurrentQueryResult> {
  const forwardedHost = await resolveServerForwardedHost();

  const getCachedCurrentCatalogByHost = unstable_cache(
    async (): Promise<CatalogControllerGetCurrentQueryResult> => {
      return mutator<CatalogControllerGetCurrentQueryResult>({
        url: "/catalog/current",
        method: "GET",
        headers: {
          [FORWARDED_HOST_HEADER]: forwardedHost,
        },
      });
    },
    ["catalog-current-by-host", forwardedHost],
    {
      revalidate: STOREFRONT_SERVER_REVALIDATE_SECONDS,
      tags: [buildStorefrontCatalogCacheTag(forwardedHost)],
    },
  );

  return getCachedCurrentCatalogByHost();
}
