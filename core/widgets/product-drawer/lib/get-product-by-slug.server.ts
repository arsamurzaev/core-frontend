import { FORWARDED_HOST_HEADER, mutator } from "@/shared/api/client";
import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { ProductControllerGetBySlugResponse } from "@/shared/api/generated/zod";
import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import { cookies } from "next/headers";

function normalizeSeoSitemapPriority<T>(value: T): T {
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const rawPriority = record.sitemapPriority;

  if (typeof rawPriority !== "string") {
    return value;
  }

  const parsedPriority = Number(rawPriority);

  return {
    ...record,
    sitemapPriority: Number.isFinite(parsedPriority) ? parsedPriority : null,
  } as T;
}

function normalizeProductResponse(
  value: unknown,
): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;

  if (!("seo" in record)) {
    return value;
  }

  return {
    ...record,
    seo: normalizeSeoSitemapPriority(record.seo),
  };
}

export async function getProductBySlugServer(
  slug: string,
): Promise<ProductWithDetailsDto | null> {
  try {
    const [cookieStore, forwardedHost] = await Promise.all([
      cookies(),
      resolveServerForwardedHost(),
    ]);
    const cookieHeader = cookieStore.toString();

    const response = await mutator<unknown>({
      url: `/product/slug/${encodeURIComponent(slug)}`,
      method: "GET",
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        [FORWARDED_HOST_HEADER]: forwardedHost,
      },
    });

    const parsed = ProductControllerGetBySlugResponse.safeParse(
      normalizeProductResponse(response),
    );
    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}
