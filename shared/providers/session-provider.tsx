"use client";
import { ApiClientError } from "@/shared/api/client";
import { useAuthControllerMe, type AuthUserDto } from "@/shared/api/generated";
import { createStrictContext, useStrictContext } from "@/shared/lib/react";
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

const CSRF_COOKIE_NAME = "csrf";
const COOKIE_CHECK_INTERVAL_MS = 30_000;

export type SessionValue = {
  user: AuthUserDto | null;
  status: SessionStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

const SessionContext = createStrictContext<SessionValue>();

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const safeName = name.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${safeName}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function hasCsrfCookie(): boolean {
  return getCookie(CSRF_COOKIE_NAME) !== null;
}

function isUnauthorized(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof ApiClientError) return error.status === 401;

  if (typeof error === "object" && error !== null) {
    const axiosLike = error as { response?: { status?: number } };
    if (axiosLike.response?.status === 401) return true;
  }

  return false;
}

export const SessionProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [csrfCookiePresent, setCsrfCookiePresent] = useState<boolean | null>(
    null,
  );

  const updateCsrfCookie = useCallback(() => {
    const hasCookie = hasCsrfCookie();
    setCsrfCookiePresent((prev) => (prev === hasCookie ? prev : hasCookie));
    return hasCookie;
  }, []);

  useEffect(() => {
    const update = () => {
      updateCsrfCookie();
    };
    const handleVisibility = () => {
      if (!document.hidden) update();
    };

    update();
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", handleVisibility);

    const intervalId = window.setInterval(update, COOKIE_CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [updateCsrfCookie]);

  const canRequest = csrfCookiePresent === true;

  const query = useAuthControllerMe({
    query: {
      enabled: canRequest,
      retry: (failureCount, error) => {
        if (isUnauthorized(error)) return false;
        return failureCount < 2;
      },
      staleTime: 60_000,
      refetchOnWindowFocus: canRequest,
      refetchOnReconnect: canRequest,
    },
  });

  const unauthorized = isUnauthorized(query.error);
  const user = !canRequest || unauthorized ? null : (query.data?.user ?? null);

  const status: SessionStatus =
    csrfCookiePresent === null
      ? "loading"
      : !canRequest
        ? "unauthenticated"
        : query.isLoading
          ? "loading"
          : query.error && !unauthorized
            ? "error"
            : user
              ? "authenticated"
              : "unauthenticated";

  const safeRefetch = useCallback(async () => {
    const hasCookie = updateCsrfCookie();

    if (!hasCookie) return Promise.resolve(null);

    return query.refetch();
  }, [query.refetch, updateCsrfCookie]);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      status,
      isLoading: csrfCookiePresent === null || (canRequest && query.isLoading),
      isAuthenticated: status === "authenticated",
      error: !canRequest || unauthorized ? null : query.error,
      refetch: safeRefetch,
    }),
    [
      user,
      status,
      csrfCookiePresent,
      canRequest,
      query.isLoading,
      query.error,
      safeRefetch,
      unauthorized,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export function useSession(): SessionValue {
  return useStrictContext(SessionContext);
}
