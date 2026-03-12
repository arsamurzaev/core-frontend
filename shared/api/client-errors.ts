import axios from "axios";

type ApiError = {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiClientError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function statusToCode(status: number): string {
  if (status === 401) {
    return "UNAUTHORIZED";
  }
  if (status === 403) {
    return "FORBIDDEN";
  }
  if (status === 404) {
    return "NOT_FOUND";
  }
  if (status === 400 || status === 422) {
    return "VALIDATION_ERROR";
  }
  if (status >= 500) {
    return "SERVER_ERROR";
  }
  return "UNKNOWN_ERROR";
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

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
