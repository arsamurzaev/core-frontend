"use client";
import { useQueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/shared/api/client";
import {
  getAuthControllerMeQueryKey,
  useAuthControllerMe,
  type AuthUserDto,
} from "@/shared/api/generated/react-query";
import {
  clearCatalogSession,
  hasReadableAdminCsrfCookie,
  hasReadableCatalogCsrfCookie,
  isGlobalAdminModeEnabled,
  setGlobalAdminMode,
} from "@/shared/api/client-request";
import { isGlobalAdminRole } from "@/shared/lib/catalog-role";
import { createStrictContext, useStrictContext } from "@/shared/lib/react";
import { type SessionBootstrapState } from "@/shared/providers/session-bootstrap";
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

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
  hasGlobalAdminSession: boolean;
  isGlobalAdminMode: boolean;
  enterGlobalAdminMode: () => Promise<unknown>;
  leaveGlobalAdminMode: () => Promise<unknown>;
  refetch: () => Promise<unknown>;
};

const SessionContext = createStrictContext<SessionValue>();

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

function shouldExposeUser(
  user: AuthUserDto | null,
  isGlobalAdminMode: boolean,
): boolean {
  if (!user) return false;
  const userIsGlobalAdmin = isGlobalAdminRole(user.role);
  return isGlobalAdminMode ? userIsGlobalAdmin : !userIsGlobalAdmin;
}

type SessionProviderProps = PropsWithChildren<{
  currentCatalogId?: string | null;
  initialSession?: SessionBootstrapState | null;
}>;

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  initialSession,
}) => {
  const queryClient = useQueryClient();
  const didRestoreGlobalAdminMode = useRef(false);
  const [deferInitialAuthQuery, setDeferInitialAuthQuery] = useState(false);
  const [isGlobalAdminMode, setIsGlobalAdminModeState] = useState(false);
  const [catalogSessionCookiePresent, setCatalogSessionCookiePresent] =
    useState<boolean | null>(
      initialSession?.catalogSessionCookiePresent ??
        initialSession?.csrfCookiePresent ??
        null,
    );
  const [adminSessionCookiePresent, setAdminSessionCookiePresent] =
    useState<boolean>(initialSession?.adminSessionCookiePresent ?? false);

  const updateSessionCookies = useCallback(() => {
    const catalogCookiePresent = hasReadableCatalogCsrfCookie();
    const adminCookiePresent = hasReadableAdminCsrfCookie();

    setCatalogSessionCookiePresent((prev) => {
      if (catalogCookiePresent) return true;
      // Production cookies may be scoped to the API domain and stay invisible
      // to JS while still valid. Clear true only after an actual /me 401.
      if (prev === true) return true;
      return false;
    });
    setAdminSessionCookiePresent((prev) => adminCookiePresent || prev);

    return { catalogCookiePresent, adminCookiePresent };
  }, []);

  useEffect(() => {
    const update = () => {
      updateSessionCookies();
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
  }, [updateSessionCookies]);

  const activeSessionCookiePresent = isGlobalAdminMode
    ? adminSessionCookiePresent
    : catalogSessionCookiePresent;
  const canRequest = activeSessionCookiePresent === true;
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

  useEffect(() => {
    if (didRestoreGlobalAdminMode.current) return;
    didRestoreGlobalAdminMode.current = true;

    const storedGlobalAdminMode = isGlobalAdminModeEnabled();
    queueMicrotask(() => {
      setIsGlobalAdminModeState(storedGlobalAdminMode);
      if (!storedGlobalAdminMode) return;

      setDeferInitialAuthQuery(false);
      void queryClient
        .invalidateQueries({
          queryKey: getAuthControllerMeQueryKey(),
        })
        .then(() => {
          void query.refetch();
        });
    });
  }, [query, queryClient]);

  const unauthorized = isUnauthorized(query.error);

  useEffect(() => {
    if (!unauthorized) {
      return;
    }

    clearCatalogSession({ includeAdmin: isGlobalAdminMode });
    queueMicrotask(() => {
      if (isGlobalAdminMode) {
        setAdminSessionCookiePresent(false);
        setIsGlobalAdminModeState(false);
      } else {
        setCatalogSessionCookiePresent(false);
      }
      setDeferInitialAuthQuery(false);
    });
  }, [isGlobalAdminMode, unauthorized]);

  const rawUser =
    unauthorized || deferInitialAuthQuery ? null : (query.data?.user ?? null);
  const user = shouldExposeUser(rawUser, isGlobalAdminMode) ? rawUser : null;

  const status: SessionStatus =
    activeSessionCookiePresent === null
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
    updateSessionCookies();
    setDeferInitialAuthQuery(false);
    await queryClient.invalidateQueries({
      queryKey: getAuthControllerMeQueryKey(),
    });
    return query.refetch();
  }, [query, queryClient, updateSessionCookies]);

  const enterGlobalAdminMode = useCallback(async () => {
    setGlobalAdminMode(true);
    setIsGlobalAdminModeState(true);
    setAdminSessionCookiePresent(true);
    setDeferInitialAuthQuery(false);
    await queryClient.invalidateQueries({
      queryKey: getAuthControllerMeQueryKey(),
    });
    return query.refetch();
  }, [query, queryClient]);

  const leaveGlobalAdminMode = useCallback(async () => {
    setGlobalAdminMode(false);
    setIsGlobalAdminModeState(false);
    setDeferInitialAuthQuery(false);
    await queryClient.invalidateQueries({
      queryKey: getAuthControllerMeQueryKey(),
    });
    if (catalogSessionCookiePresent !== true) {
      return null;
    }
    return query.refetch();
  }, [catalogSessionCookiePresent, query, queryClient]);

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
        activeSessionCookiePresent === null ||
        (!deferInitialAuthQuery && query.isLoading && !query.data),
      isAuthenticated: status === "authenticated",
      error: unauthorized || deferInitialAuthQuery ? null : query.error,
      hasGlobalAdminSession: adminSessionCookiePresent,
      isGlobalAdminMode,
      enterGlobalAdminMode,
      leaveGlobalAdminMode,
      refetch: syncSession,
    }),
    [
      user,
      status,
      activeSessionCookiePresent,
      deferInitialAuthQuery,
      query.isLoading,
      query.data,
      query.error,
      adminSessionCookiePresent,
      isGlobalAdminMode,
      enterGlobalAdminMode,
      leaveGlobalAdminMode,
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
