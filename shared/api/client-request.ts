import { AxiosHeaders, type AxiosResponse } from "axios";

export const API_BASE_URL = "http://localhost:4000";
export const FORWARDED_HOST_HEADER = "x-forwarded-host";

const CSRF_COOKIE_NAME = "csrf";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const DEV_FORWARDED_HOST =
  process.env.NEXT_PUBLIC_FORWARDED_HOST ?? "urban-style.myctlg.ru";

export type ApiHeaders = Record<string, string>;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const safeName = name.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${safeName}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : null;
}

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}

export function getForwardedHost(): string | null {
  const isDev = process.env.NODE_ENV === "development";

  if (typeof window !== "undefined") {
    const { hostname, host } = window.location;
    if (isDev || isLocalhost(hostname)) {
      return DEV_FORWARDED_HOST;
    }

    return host;
  }

  if (isDev) {
    return DEV_FORWARDED_HOST;
  }

  return null;
}

export function withCsrf(headers: ApiHeaders = {}): ApiHeaders {
  const csrf = getCookie(CSRF_COOKIE_NAME);
  if (!csrf) {
    return { ...headers };
  }

  return { ...headers, [CSRF_HEADER_NAME]: csrf };
}

export function withJsonContentType(
  headers: ApiHeaders,
  data: unknown,
): ApiHeaders {
  if (data === undefined || data === null) {
    return { ...headers };
  }
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    return { ...headers };
  }
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    return { ...headers };
  }

  const hasContentType = Object.keys(headers).some(
    (key) => key.toLowerCase() === "content-type",
  );
  if (hasContentType) {
    return { ...headers };
  }

  return { ...headers, "Content-Type": "application/json" };
}

export function applyForwardedHost(
  headers: AxiosHeaders | undefined,
): AxiosHeaders {
  const forwardedHost = getForwardedHost();
  const normalized = AxiosHeaders.from(headers);

  if (forwardedHost && !normalized.has(FORWARDED_HOST_HEADER)) {
    normalized.set(FORWARDED_HOST_HEADER, forwardedHost);
  }

  return normalized;
}

export function buildUrl(
  url: string,
  params?: Record<string, unknown>,
): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const target = new URL(url, API_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    target.searchParams.set(key, String(value));
  }

  return target.toString();
}

export function normalizeResponseData<T>(response: AxiosResponse<T>): T {
  if (response.status === 204) {
    return undefined as T;
  }

  return response.data as T;
}
