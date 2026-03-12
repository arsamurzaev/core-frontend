import axios, { type AxiosRequestConfig } from "axios";

import {
  API_BASE_URL,
  applyForwardedHost,
  buildUrl,
  normalizeResponseData,
  type ApiHeaders,
  withCsrf,
  withJsonContentType,
} from "@/shared/api/client-request";
import {
  toApiClientError,
} from "@/shared/api/client-errors";

export {
  API_BASE_URL,
  FORWARDED_HOST_HEADER,
  getForwardedHost,
} from "@/shared/api/client-request";
export { ApiClientError } from "@/shared/api/client-errors";

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
    return normalizeResponseData(response);
  } catch (error) {
    throw toApiClientError(error);
  }
}

function requestWithBody<T>(
  method: "POST" | "PUT" | "PATCH",
  endpoint: string,
  data: unknown,
): Promise<T> {
  const headers = withJsonContentType(withCsrf(), data);

  return request<T>({
    url: endpoint,
    method,
    data,
    headers,
  });
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    return request<T>({
      url: endpoint,
      method: "GET",
    });
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return requestWithBody("POST", endpoint, data);
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return requestWithBody("PUT", endpoint, data);
  },

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return requestWithBody("PATCH", endpoint, data);
  },

  async delete<T>(endpoint: string): Promise<T> {
    return request<T>({
      url: endpoint,
      method: "DELETE",
      headers: withCsrf(),
    });
  },
};

export type OrvalMutatorConfig = Omit<
  AxiosRequestConfig,
  "url" | "method" | "data" | "params" | "headers"
> & {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: ApiHeaders;
};

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
    return normalizeResponseData(response);
  } catch (error) {
    throw toApiClientError(error);
  }
}
