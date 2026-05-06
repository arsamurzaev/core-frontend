"use client";
import { useQueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/shared/api/client";
import {
  getAuthControllerMeQueryKey,
  useAuthControllerMe,
  type AuthUserDto,
} from "@/shared/api/generated/react-query";
import { clearCatalogSession } from "@/shared/api/client-request";
import { createStrictContext, useStrictContext } from "@/shared/lib/react";
import { type SessionBootstrapState } from "@/shared/providers/session-bootstrap";
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

const CSRF_COOKIE_NAME = "csrf";
const ADMIN_CSRF_COOKIE_NAME = "acrsf";
const COOKIE_CHECK_INTERVAL_MS = 30_000;
const AUTH_MUTATION_KEYS = new Set([
  "authControllerLogin",
  "catalogAuthControllerLogin",
  "authControllerLogout",
]);

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

function hasCsrfCookie(_currentCatalogId?: string | null): boolean {
  if (getCookie(CSRF_COOKIE_NAME) !== null) return true;
  if (getCookie(ADMIN_CSRF_COOKIE_NAME) !== null) return true;
  return false;
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

function readMutationKey(value: unknown): string | null {
  if (!Array.isArray(value) || typeof value[0] !== "string") return null;
  return value[0];
}

type SessionProviderProps = PropsWithChildren<{
  currentCatalogId?: string | null;
  initialSession?: SessionBootstrapState | null;
}>;

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  currentCatalogId,
  initialSession,
}) => {
  const queryClient = useQueryClient();
  const initialCsrfCookiePresent = initialSession?.csrfCookiePresent ?? null;
  const [deferInitialAuthQuery, setDeferInitialAuthQuery] = useState(false);
  const [csrfCookiePresent, setCsrfCookiePresent] = useState<boolean | null>(
    initialCsrfCookiePresent,
  );

  const updateCsrfCookie = useCallback(() => {
    const hasCookie = hasCsrfCookie(currentCatalogId);
    setCsrfCookiePresent((prev) => {
      if (hasCookie) return true;
      // Don't flip true→false based solely on document.cookie:
      // in production the csrf cookie may be scoped to the API domain
      // (cross-domain) or be HttpOnly, making it invisible to JS while
      // still valid. Rely on actual /me 401 responses to clear the session.
      if (prev === true) return true;
      return hasCookie;
    });
    return hasCookie;
  }, [currentCatalogId]);

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
  const shouldEnableAuthQuery = canRequest && !deferInitialAuthQuery;

  const query = useAuthControllerMe({
    query: {
      initialData: initialSession?.authData ?? undefined,
      enabled: shouldEnableAuthQuery,
      retry: (failureCount, error) => {
        if (isUnauthorized(error)) return false;
        return failureCount < 2;
      },
      staleTime: 60_000,
      refetchOnWindowFocus: shouldEnableAuthQuery,
      refetchOnReconnect: shouldEnableAuthQuery,
    },
  });

  const unauthorized = isUnauthorized(query.error);

  useEffect(() => {
    if (!unauthorized) {
      return;
    }

    clearCatalogSession();
    queueMicrotask(() => {
      setCsrfCookiePresent(false);
      setDeferInitialAuthQuery(false);
    });
  }, [unauthorized]);

  const user =
    unauthorized || deferInitialAuthQuery ? null : (query.data?.user ?? null);

  const status: SessionStatus =
    csrfCookiePresent === null
      ? "loading"
      : deferInitialAuthQuery
        ? "unauthenticated"
        : query.isLoading && !query.data
          ? "loading"
          : query.error && !unauthorized
            ? "error"
            : user
              ? "authenticated"
              : "unauthenticated";

  const syncSession = useCallback(async () => {
    updateCsrfCookie();
    setDeferInitialAuthQuery(false);
    await queryClient.invalidateQueries({
      queryKey: getAuthControllerMeQueryKey(),
    });
    return query.refetch();
  }, [query, queryClient, updateCsrfCookie]);

  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type !== "updated") return;

      const mutation = event.mutation;
      if (mutation.state.status !== "success") return;

      const mutationKey = readMutationKey(mutation.options.mutationKey);
      if (!mutationKey || !AUTH_MUTATION_KEYS.has(mutationKey)) return;

      void syncSession();
    });

    return unsubscribe;
  }, [queryClient, syncSession]);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      status,
      isLoading:
        csrfCookiePresent === null ||
        (!deferInitialAuthQuery && query.isLoading && !query.data),
      isAuthenticated: status === "authenticated",
      error: unauthorized || deferInitialAuthQuery ? null : query.error,
      refetch: syncSession,
    }),
    [
      user,
      status,
      csrfCookiePresent,
      deferInitialAuthQuery,
      query.isLoading,
      query.data,
      query.error,
      syncSession,
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
