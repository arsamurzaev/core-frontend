/* eslint-disable @typescript-eslint/no-explicit-any */
// shared/api/client.ts

import axios, {
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

const API_BASE_URL = "http://localhost:4000"; // local http is typical for dev

const CSRF_COOKIE_NAME = "csrf"; // replace with the real cookie name from DevTools
const CSRF_HEADER_NAME = "X-CSRF-Token";
const FORWARDED_HOST_HEADER = "x-forwarded-host";
const DEV_FORWARDED_HOST =
  process.env.NEXT_PUBLIC_FORWARDED_HOST ?? "cloth-catalog.myctlg.ru";

interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = "ApiClientError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const safeName = name.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${safeName}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

type ApiHeaders = Record<string, string>;

function withCsrf(headers: ApiHeaders = {}): ApiHeaders {
  const csrf = getCookie(CSRF_COOKIE_NAME);

  // Cookie must not be HttpOnly, otherwise document.cookie will not see it.
  if (!csrf) return { ...headers };

  return { ...headers, [CSRF_HEADER_NAME]: csrf };
}

function withJsonContentType(headers: ApiHeaders, data: unknown): ApiHeaders {
  if (data === undefined || data === null) return { ...headers };
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    return { ...headers };
  }
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    return { ...headers };
  }
  const hasContentType = Object.keys(headers).some(
    (key) => key.toLowerCase() === "content-type",
  );
  if (hasContentType) return { ...headers };

  return { ...headers, "Content-Type": "application/json" };
}

function statusToCode(status: number): string {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 400 || status === 422) return "VALIDATION_ERROR";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const data = (error.response.data ?? {}) as Partial<ApiError>;
      const status = data.status ?? error.response.status ?? 0;
      const code = data.code ?? statusToCode(status);
      const message = data.message ?? error.message ?? "Request failed";

      return new ApiClientError(status, code, message, data.details);
    }

    return new ApiClientError(0, "NETWORK_ERROR", "Network error");
  }

  if (error instanceof Error) {
    return new ApiClientError(0, "UNKNOWN_ERROR", error.message);
  }

  return new ApiClientError(0, "UNKNOWN_ERROR", "Unknown error");
}

function normalizeData<T>(response: AxiosResponse<T>): T {
  if (response.status === 204) return undefined as T;
  return response.data as T;
}

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}

function getForwardedHost(): string | null {
  const isDev = process.env.NODE_ENV === "development";

  if (typeof window !== "undefined") {
    const { hostname, host } = window.location;
    if (isDev || isLocalhost(hostname)) return DEV_FORWARDED_HOST;
    return host;
  }

  if (isDev) return DEV_FORWARDED_HOST;

  return null;
}

function applyForwardedHost(headers: AxiosHeaders | undefined): AxiosHeaders {
  const forwardedHost = getForwardedHost();
  const normalized = AxiosHeaders.from(headers);

  if (forwardedHost && !normalized.has(FORWARDED_HOST_HEADER)) {
    normalized.set(FORWARDED_HOST_HEADER, forwardedHost);
  }

  return normalized;
}

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  config.headers = applyForwardedHost(config.headers);
  return config;
});

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axiosClient.request<T>(config);
    return normalizeData(response);
  } catch (error) {
    throw toApiClientError(error);
  }
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    return request<T>({
      url: endpoint,
      method: "GET",
    });
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const headers = withJsonContentType(withCsrf(), data);
    return request<T>({
      url: endpoint,
      method: "POST",
      data,
      headers,
    });
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const headers = withJsonContentType(withCsrf(), data);
    return request<T>({
      url: endpoint,
      method: "PUT",
      data,
      headers,
    });
  },

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const headers = withJsonContentType(withCsrf(), data);
    return request<T>({
      url: endpoint,
      method: "PATCH",
      data,
      headers,
    });
  },

  async delete<T>(endpoint: string): Promise<T> {
    return request<T>({
      url: endpoint,
      method: "DELETE",
      headers: withCsrf(),
    });
  },
};

/**
 * Mutator for orval (react-query)
 * Orval will call this and return data.
 */
export type OrvalMutatorConfig = Omit<
  AxiosRequestConfig,
  "url" | "method" | "data" | "params" | "headers"
> & {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, any>;
  data?: unknown;
  headers?: ApiHeaders;
};

function buildUrl(url: string, params?: Record<string, any>) {
  if (!params || Object.keys(params).length === 0) return url;
  const u = new URL(url, API_BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

export async function mutator<T>(config: OrvalMutatorConfig): Promise<T> {
  const { url, method, params, data, headers: configHeaders, ...rest } = config;
  const fullUrl = buildUrl(url, params);
  const baseHeaders = configHeaders ?? {};
  const csrfHeaders = method === "GET" ? baseHeaders : withCsrf(baseHeaders);
  const headers = withJsonContentType(csrfHeaders, data);

  try {
    const response = await axiosClient.request<T>({
      ...rest,
      url: fullUrl,
      method,
      data,
      headers,
    });
    return normalizeData(response);
  } catch (error) {
    throw toApiClientError(error);
  }
}
