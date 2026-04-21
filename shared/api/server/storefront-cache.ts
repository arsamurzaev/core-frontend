import { revalidateTag } from "next/cache";

function normalizeStorefrontHost(forwardedHost: string): string {
  return forwardedHost.trim().toLowerCase() || "default";
}

export function buildStorefrontCatalogCacheTag(forwardedHost: string): string {
  return `storefront:catalog:${normalizeStorefrontHost(forwardedHost)}`;
}

export function buildStorefrontHomeDataCacheTag(forwardedHost: string): string {
  return `storefront:home:${normalizeStorefrontHost(forwardedHost)}`;
}

export function getStorefrontCacheTags(forwardedHost: string): string[] {
  return [
    buildStorefrontCatalogCacheTag(forwardedHost),
    buildStorefrontHomeDataCacheTag(forwardedHost),
  ];
}

export function revalidateStorefrontCacheByHost(forwardedHost: string): void {
  for (const tag of getStorefrontCacheTags(forwardedHost)) {
    revalidateTag(tag);
  }
}
