"use client";

export interface CartPublicAccess {
  checkoutKey: string;
  publicKey: string;
  rawLink: string;
}

const CART_QUERY_PARAM_CANDIDATES = ["cart", "cartLink", "cartUrl"] as const;
const PUBLIC_KEY_QUERY_PARAM_CANDIDATES = [
  "cartPublicKey",
  "publicKey",
] as const;
const CHECKOUT_KEY_QUERY_PARAM_CANDIDATES = [
  "cartCheckoutKey",
  "checkoutKey",
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

function buildRawLink(publicKey: string, checkoutKey: string): string {
  const target = new URL(`/cart/public/${publicKey}`, getSafeBaseUrl());
  target.searchParams.set("checkoutKey", checkoutKey);
  return `${target.pathname}${target.search}`;
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

    const match = source.pathname.match(/\/cart\/public\/([^/?#]+)/i);
    const publicKey = normalizeValue(match?.[1]);
    const checkoutKey = normalizeValue(source.searchParams.get("checkoutKey"));

    if (!publicKey || !checkoutKey) {
      return null;
    }

    return {
      checkoutKey,
      publicKey,
      rawLink: buildRawLink(publicKey, checkoutKey),
    };
  } catch {
    return null;
  }
}

export function parseCartPublicAccessFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): CartPublicAccess | null {
  for (const key of CART_QUERY_PARAM_CANDIDATES) {
    const access = parseCartPublicAccessFromLink(searchParams.get(key));
    if (access) {
      return access;
    }
  }

  const publicKey = PUBLIC_KEY_QUERY_PARAM_CANDIDATES.map((key) =>
    normalizeValue(searchParams.get(key)),
  ).find(Boolean);
  const checkoutKey = CHECKOUT_KEY_QUERY_PARAM_CANDIDATES.map((key) =>
    normalizeValue(searchParams.get(key)),
  ).find(Boolean);

  if (!publicKey || !checkoutKey) {
    return null;
  }

  return {
    checkoutKey,
    publicKey,
    rawLink: buildRawLink(publicKey, checkoutKey),
  };
}

export function removeCartPublicAccessParams(
  searchParams: URLSearchParams,
): URLSearchParams {
  const nextParams = new URLSearchParams(searchParams.toString());

  for (const key of CART_QUERY_PARAM_CANDIDATES) {
    nextParams.delete(key);
  }

  for (const key of PUBLIC_KEY_QUERY_PARAM_CANDIDATES) {
    nextParams.delete(key);
  }

  for (const key of CHECKOUT_KEY_QUERY_PARAM_CANDIDATES) {
    nextParams.delete(key);
  }

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
    if (
      typeof parsed.publicKey !== "string" ||
      typeof parsed.checkoutKey !== "string"
    ) {
      return null;
    }

    return {
      publicKey: parsed.publicKey,
      checkoutKey: parsed.checkoutKey,
      rawLink:
        typeof parsed.rawLink === "string"
          ? parsed.rawLink
          : buildRawLink(parsed.publicKey, parsed.checkoutKey),
    };
  } catch {
    return parseCartPublicAccessFromLink(normalized);
  }
}

export function buildCartShareUrl(access: CartPublicAccess, baseUrl: string) {
  const target = new URL(baseUrl, getSafeBaseUrl());
  target.searchParams.set("cart", access.rawLink);
  return target.toString();
}
