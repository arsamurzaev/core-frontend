import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import { API_BASE_URL } from "@/shared/api/client";

export function buildShareBaseUrl(): string {
  if (typeof window !== "undefined") {
    return new URL("/", window.location.origin).toString();
  }

  return new URL("/", API_BASE_URL).toString();
}

export function getPublicAccessKey(
  access: CartPublicAccess | null | undefined,
) {
  if (!access?.publicKey) {
    return null;
  }

  return access.publicKey;
}
