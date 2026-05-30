"use client";

export type CartPublicAccessKind = "hallTable" | "shared";

export interface CartPublicAccess {
  guestName?: string | null;
  guestSessionId?: string | null;
  kind?: CartPublicAccessKind;
  publicKey: string;
  rawLink: string;
  tableCode?: string | null;
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

export function createCartPublicAccess(
  publicKey: string,
  options: Partial<Omit<CartPublicAccess, "publicKey">> = {},
): CartPublicAccess {
  return {
    ...(options.kind ? { kind: options.kind } : {}),
    ...(options.tableCode ? { tableCode: options.tableCode } : {}),
    ...(options.guestSessionId
      ? { guestSessionId: options.guestSessionId }
      : {}),
    ...(options.guestName ? { guestName: options.guestName } : {}),
    publicKey,
    rawLink: options.rawLink ?? buildRawLink(publicKey),
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
      return createCartPublicAccess(shortKey);
    }

    const match = source.pathname.match(/\/cart\/public\/([^/?#]+)/i);
    const publicKey = normalizeValue(match?.[1]);
    return publicKey ? createCartPublicAccess(publicKey) : null;
  } catch {
    return null;
  }
}

export function parseCartPublicAccessFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): CartPublicAccess | null {
  const shortKey = normalizeValue(searchParams.get(CART_ACCESS_QUERY_PARAM));
  if (shortKey) {
    return createCartPublicAccess(shortKey);
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

  return publicKey ? createCartPublicAccess(publicKey) : null;
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

    return createCartPublicAccess(parsed.publicKey, {
      guestName:
        typeof parsed.guestName === "string" ? parsed.guestName : undefined,
      guestSessionId:
        typeof parsed.guestSessionId === "string"
          ? parsed.guestSessionId
          : undefined,
      kind:
        parsed.kind === "hallTable" || parsed.kind === "shared"
          ? parsed.kind
          : undefined,
      rawLink: typeof parsed.rawLink === "string" ? parsed.rawLink : undefined,
      tableCode:
        typeof parsed.tableCode === "string" ? parsed.tableCode : undefined,
    });
  } catch {
    return parseCartPublicAccessFromLink(normalized);
  }
}

export function buildCartShareUrl(access: CartPublicAccess, baseUrl: string) {
  const target = new URL(baseUrl, getSafeBaseUrl());
  target.searchParams.set(CART_ACCESS_QUERY_PARAM, access.publicKey);
  return target.toString();
}
