"use client";

export interface CartPublicAccess {
  publicKey: string;
  rawLink: string;
}

const CART_ACCESS_QUERY_PARAM = "c";
const LEGACY_CART_QUERY_PARAM_CANDIDATES = [
  "cart",
  "cartLink",
  "cartUrl",
] as const;
const LEGACY_PUBLIC_KEY_QUERY_PARAM_CANDIDATES = [
  "cartPublicKey",
  "publicKey",
] as const;

function getSafeBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "https://example.com";
}

function normalizeValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildRawLink(publicKey: string): string {
  return `/?${CART_ACCESS_QUERY_PARAM}=${encodeURIComponent(publicKey)}`;
}

function createAccess(publicKey: string): CartPublicAccess {
  return {
    publicKey,
    rawLink: buildRawLink(publicKey),
  };
}

function parseNestedCartValue(value: string): CartPublicAccess | null {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return null;
  }

  const source = new URL(normalized, getSafeBaseUrl());
  const nestedCartLink = normalizeValue(source.searchParams.get("cart"));
  if (!nestedCartLink) {
    return null;
  }

  return parseCartPublicAccessFromLink(nestedCartLink);
}

export function parseCartPublicAccessFromLink(
  value: string | null | undefined,
): CartPublicAccess | null {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return null;
  }

  try {
    const source = new URL(normalized, getSafeBaseUrl());
    const nestedAccess = parseNestedCartValue(normalized);
    if (nestedAccess) {
      return nestedAccess;
    }

    const shortKey = normalizeValue(
      source.searchParams.get(CART_ACCESS_QUERY_PARAM),
    );
    if (shortKey) {
      return createAccess(shortKey);
    }

    const match = source.pathname.match(/\/cart\/public\/([^/?#]+)/i);
    const publicKey = normalizeValue(match?.[1]);
    return publicKey ? createAccess(publicKey) : null;
  } catch {
    return null;
  }
}

export function parseCartPublicAccessFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): CartPublicAccess | null {
  const shortKey = normalizeValue(searchParams.get(CART_ACCESS_QUERY_PARAM));
  if (shortKey) {
    return createAccess(shortKey);
  }

  for (const key of LEGACY_CART_QUERY_PARAM_CANDIDATES) {
    const access = parseCartPublicAccessFromLink(searchParams.get(key));
    if (access) {
      return access;
    }
  }

  const publicKey = LEGACY_PUBLIC_KEY_QUERY_PARAM_CANDIDATES.map((key) =>
    normalizeValue(searchParams.get(key)),
  ).find(Boolean);

  return publicKey ? createAccess(publicKey) : null;
}

export function removeCartPublicAccessParams(
  searchParams: URLSearchParams,
): URLSearchParams {
  const nextParams = new URLSearchParams(searchParams.toString());

  nextParams.delete(CART_ACCESS_QUERY_PARAM);

  for (const key of LEGACY_CART_QUERY_PARAM_CANDIDATES) {
    nextParams.delete(key);
  }

  for (const key of LEGACY_PUBLIC_KEY_QUERY_PARAM_CANDIDATES) {
    nextParams.delete(key);
  }

  nextParams.delete("cartCheckoutKey");
  nextParams.delete("checkoutKey");

  return nextParams;
}

export function buildCartPublicStorageKey(catalogId: string): string {
  return `catalog-public-cart:${catalogId}`;
}

export function serializeCartPublicAccess(access: CartPublicAccess): string {
  return JSON.stringify(access);
}

export function deserializeCartPublicAccess(
  value: string | null | undefined,
): CartPublicAccess | null {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalized) as Partial<CartPublicAccess>;
    if (typeof parsed.publicKey !== "string") {
      return null;
    }

    return {
      publicKey: parsed.publicKey,
      rawLink:
        typeof parsed.rawLink === "string"
          ? parsed.rawLink
          : buildRawLink(parsed.publicKey),
    };
  } catch {
    return parseCartPublicAccessFromLink(normalized);
  }
}

export function buildCartShareUrl(access: CartPublicAccess, baseUrl: string) {
  const target = new URL(baseUrl, getSafeBaseUrl());
  target.searchParams.set(CART_ACCESS_QUERY_PARAM, access.publicKey);
  return target.toString();
}
