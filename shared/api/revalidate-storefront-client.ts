"use client";

import {
  withCsrf,
  withJsonContentType,
} from "@/shared/api/client-request";

const REVALIDATE_STOREFRONT_ENDPOINT = "/api/revalidate-storefront";

class StorefrontRevalidateError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "StorefrontRevalidateError";
  }
}

export async function revalidateStorefrontCache(): Promise<void> {
  const response = await fetch(REVALIDATE_STOREFRONT_ENDPOINT, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: withJsonContentType(withCsrf(), {}),
    body: "{}",
  });

  if (response.ok) {
    return;
  }

  let message = "Не удалось переиндексировать storefront cache.";

  try {
    const payload = (await response.json()) as { message?: string };
    if (typeof payload.message === "string" && payload.message.trim()) {
      message = payload.message.trim();
    }
  } catch {
    // Ignore invalid JSON and keep the fallback message.
  }

  throw new StorefrontRevalidateError(response.status, message);
}

export async function revalidateStorefrontCacheBestEffort(): Promise<void> {
  try {
    await revalidateStorefrontCache();
  } catch (error) {
    if (
      error instanceof StorefrontRevalidateError &&
      (error.status === 401 || error.status === 403)
    ) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("[storefront-revalidate]", error);
    }
  }
}
