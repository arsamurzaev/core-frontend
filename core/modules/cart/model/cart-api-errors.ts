import { ApiClientError } from "@/shared/api/client";
import { CartSseConnectionError } from "@/shared/api/generated/cart-sse";

export function isCartNotFoundError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.status === 404;
  }

  if (typeof error === "object" && error !== null) {
    const axiosLike = error as { response?: { status?: number } };
    return axiosLike.response?.status === 404;
  }

  return false;
}

export function isCartUnauthorizedError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.status === 401;
  }

  if (error instanceof CartSseConnectionError) {
    return error.status === 401;
  }

  if (typeof error === "object" && error !== null) {
    const axiosLike = error as { response?: { status?: number } };
    return axiosLike.response?.status === 401;
  }

  return false;
}
