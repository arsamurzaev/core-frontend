import axios, { type AxiosRequestConfig } from "axios";

import {
  API_BASE_URL,
  applyForwardedHost,
  buildUrl,
  clearRememberedGlobalAdminCsrf,
  normalizeResponseData,
  rememberGlobalAdminCsrfFromResponse,
  type ApiHeaders,
  withAuthSessionScope,
  withCsrf,
  withJsonContentType,
} from "@/shared/api/client-request";
import { toApiClientError } from "@/shared/api/client-errors";

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

axiosClient.interceptors.request.use(async (config) => {
  config.headers = await applyForwardedHost(config.headers);
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    rememberGlobalAdminCsrfFromResponse(response.data);
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      clearRememberedGlobalAdminCsrf();
    }
    return Promise.reject(error);
  },
);

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axiosClient.request<T>(config);
    return normalizeResponseData(response);
  } catch (error) {
    throw toApiClientError(error);
  }
}

type ApiClientRequestOptions = {
  headers?: ApiHeaders;
};

function requestWithBody<T>(
  method: "POST" | "PUT" | "PATCH",
  endpoint: string,
  data: unknown,
  options: ApiClientRequestOptions = {},
): Promise<T> {
  const headers = withJsonContentType(withCsrf(options.headers ?? {}), data);

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
      headers: withAuthSessionScope(),
    });
  },

  async post<T>(
    endpoint: string,
    data: unknown,
    options?: ApiClientRequestOptions,
  ): Promise<T> {
    return requestWithBody("POST", endpoint, data, options);
  },

  async put<T>(
    endpoint: string,
    data: unknown,
    options?: ApiClientRequestOptions,
  ): Promise<T> {
    return requestWithBody("PUT", endpoint, data, options);
  },

  async patch<T>(
    endpoint: string,
    data: unknown,
    options?: ApiClientRequestOptions,
  ): Promise<T> {
    return requestWithBody("PATCH", endpoint, data, options);
  },

  async delete<T>(
    endpoint: string,
    options: ApiClientRequestOptions = {},
  ): Promise<T> {
    return request<T>({
      url: endpoint,
      method: "DELETE",
      headers: withCsrf(options.headers ?? {}),
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
  const baseHeaders = withAuthSessionScope(configHeaders ?? {});
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
