import { FORWARDED_HOST_HEADER, mutator } from "@/shared/api/client";
import {
  SeoDtoEntityType,
  type SeoDto,
} from "@/shared/api/generated/react-query";
import { SeoControllerGetByEntityResponse } from "@/shared/api/generated/zod";
import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import { cookies } from "next/headers";

function normalizeSeoResponse(
  value: unknown,
): unknown {
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
  };
}

export async function getProductSeoByIdServer(
  productId: string,
): Promise<SeoDto | null> {
  try {
    const [cookieStore, forwardedHost] = await Promise.all([
      cookies(),
      resolveServerForwardedHost(),
    ]);
    const cookieHeader = cookieStore.toString();

    const response = await mutator<unknown>({
      url: `/seo/entity/${SeoDtoEntityType.PRODUCT}/${encodeURIComponent(productId)}`,
      method: "GET",
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        [FORWARDED_HOST_HEADER]: forwardedHost,
      },
    });

    const parsed = SeoControllerGetByEntityResponse.safeParse(
      normalizeSeoResponse(response),
    );
    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}
