import { AxiosHeaders, type AxiosResponse } from "axios";
import { getForwardedHost } from "@/shared/api/forwarded-host";

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function isAbsoluteUrl(url: string): boolean {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(url);
}

export const API_BASE_URL = normalizeBaseUrl(
  typeof window === "undefined"
    ? (process.env.API_BASE_URL ??
        process.env.NEXT_PUBLIC_API_BASE_URL ??
        "http://localhost:4000")
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"),
);
export const FORWARDED_HOST_HEADER = "x-forwarded-host";

const CSRF_COOKIE_NAME = "csrf";
const ADMIN_CSRF_COOKIE_NAME = "acrsf";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const SESSION_SCOPE_HEADER_NAME = "X-Auth-Session-Scope";
const GLOBAL_SESSION_SCOPE = "global";

export type ApiHeaders = Record<string, string>;

let rememberedGlobalAdminCsrf: string | null = null;

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

const CATALOG_ID_STORAGE_KEY = "catalog_id";
const GLOBAL_ADMIN_MODE_STORAGE_KEY = "catalog_global_admin_mode";

function getCatalogIdStorageKeyForCurrentHost(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return `${CATALOG_ID_STORAGE_KEY}:${window.location.host}`;
}

function getGlobalAdminModeStorageKeyForCurrentHost(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return `${GLOBAL_ADMIN_MODE_STORAGE_KEY}:${window.location.host}`;
}

export function setCatalogId(catalogId: string): void {
  if (typeof window !== "undefined") {
    const hostStorageKey = getCatalogIdStorageKeyForCurrentHost();
    if (hostStorageKey) {
      localStorage.setItem(hostStorageKey, catalogId);
    }
    localStorage.setItem(CATALOG_ID_STORAGE_KEY, catalogId);
  }
}

export function getStoredCatalogId(): string | null {
  if (typeof window === "undefined") return null;
  const hostStorageKey = getCatalogIdStorageKeyForCurrentHost();
  if (hostStorageKey) {
    const hostCatalogId = localStorage.getItem(hostStorageKey);
    if (hostCatalogId) return hostCatalogId;
  }
  return localStorage.getItem(CATALOG_ID_STORAGE_KEY);
}

export function isGlobalAdminModeEnabled(): boolean {
  return getStoredGlobalAdminModePreference() === true;
}

export function getStoredGlobalAdminModePreference(): boolean | null {
  if (typeof window === "undefined") return null;

  const hostStorageKey = getGlobalAdminModeStorageKeyForCurrentHost();
  if (hostStorageKey) {
    const hostValue = localStorage.getItem(hostStorageKey);
    if (hostValue !== null) return hostValue === "true";
  }

  const globalValue = localStorage.getItem(GLOBAL_ADMIN_MODE_STORAGE_KEY);
  return globalValue === null ? null : globalValue === "true";
}

export function setGlobalAdminMode(enabled: boolean): void {
  if (typeof window === "undefined") return;

  const hostStorageKey = getGlobalAdminModeStorageKeyForCurrentHost();
  if (hostStorageKey) {
    localStorage.setItem(hostStorageKey, String(enabled));
  }
  localStorage.setItem(GLOBAL_ADMIN_MODE_STORAGE_KEY, String(enabled));
}

function expireCookie(name: string): void {
  const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const base = `${name}=; path=/; ${expires}; samesite=lax; secure`;
  document.cookie = base;
  const parts = window.location.hostname.split(".");
  if (parts.length >= 2) {
    const domain = "." + parts.slice(-2).join(".");
    document.cookie = `${base}; domain=${domain}`;
  }
}

export function clearCatalogSession(
  options: { includeAdmin?: boolean } = {},
): void {
  if (typeof window === "undefined") return;
  expireCookie(CSRF_COOKIE_NAME);
  if (options.includeAdmin) {
    expireCookie(ADMIN_CSRF_COOKIE_NAME);
    rememberedGlobalAdminCsrf = null;
    setGlobalAdminMode(false);
  }
  const hostStorageKey = getCatalogIdStorageKeyForCurrentHost();
  if (hostStorageKey) {
    localStorage.removeItem(hostStorageKey);
  }
  localStorage.removeItem(CATALOG_ID_STORAGE_KEY);
}

export function hasReadableCatalogCsrfCookie(): boolean {
  return getCookie(CSRF_COOKIE_NAME) !== null;
}

export function hasReadableAdminCsrfCookie(): boolean {
  return getCookie(ADMIN_CSRF_COOKIE_NAME) !== null;
}

function findCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  if (isGlobalAdminModeEnabled()) {
    return (
      getCookie(ADMIN_CSRF_COOKIE_NAME) ??
      rememberedGlobalAdminCsrf ??
      getCookie(CSRF_COOKIE_NAME)
    );
  }
  return getCookie(CSRF_COOKIE_NAME);
}

export function rememberGlobalAdminCsrfFromResponse(data: unknown): void {
  if (!isGlobalAdminModeEnabled()) return;
  if (!data || typeof data !== "object") return;

  const csrf = (data as { csrf?: unknown }).csrf;
  if (typeof csrf === "string" && csrf.length > 0) {
    rememberedGlobalAdminCsrf = csrf;
  }
}

export function clearRememberedGlobalAdminCsrf(): void {
  rememberedGlobalAdminCsrf = null;
}

export function withAuthSessionScope(headers: ApiHeaders = {}): ApiHeaders {
  if (!isGlobalAdminModeEnabled()) {
    return { ...headers };
  }

  return { ...headers, [SESSION_SCOPE_HEADER_NAME]: GLOBAL_SESSION_SCOPE };
}

export function withCsrf(headers: ApiHeaders = {}): ApiHeaders {
  const scopedHeaders = withAuthSessionScope(headers);
  const csrf = findCsrfToken();
  if (!csrf) {
    return scopedHeaders;
  }

  return { ...scopedHeaders, [CSRF_HEADER_NAME]: csrf };
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

export async function applyForwardedHost(
  headers: AxiosHeaders | undefined,
): Promise<AxiosHeaders> {
  const forwardedHost = await getForwardedHost();
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
  const target = new URL(url, "http://catalog.local");

  if (params && Object.keys(params).length > 0) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      target.searchParams.set(key, String(value));
    }
  }

  if (isAbsoluteUrl(url)) {
    return target.toString();
  }

  return `${target.pathname}${target.search}`;
}

export function buildAbsoluteApiUrl(
  url: string,
  params?: Record<string, unknown>,
): string {
  if (isAbsoluteUrl(url)) {
    return buildUrl(url, params);
  }

  const path = buildUrl(url, params);

  if (isAbsoluteUrl(API_BASE_URL)) {
    return `${API_BASE_URL}${path}`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}${path}`;
}

export function normalizeResponseData<T>(response: AxiosResponse<T>): T {
  if (response.status === 204) {
    return undefined as T;
  }

  return response.data as T;
}

export { getForwardedHost };
