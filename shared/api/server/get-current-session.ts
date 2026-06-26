import {
  ApiClientError,
  FORWARDED_HOST_HEADER,
  mutator,
} from "@/shared/api/client";
import type { AuthControllerMeQueryResult } from "@/shared/api/generated/react-query";
import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import type { SessionBootstrapState } from "@/shared/providers/session-bootstrap";
import { cookies } from "next/headers";
import { cache } from "react";

const CSRF_COOKIE_NAME = "csrf";
const SID_COOKIE_NAME = "sid";
const ADMIN_CSRF_COOKIE_NAME = "acrsf";
const ADMIN_SID_COOKIE_NAME = "asid";

async function loadCurrentSessionServer(
  _currentCatalogId?: string | null,
): Promise<SessionBootstrapState> {
  void _currentCatalogId;

  const cookieStore = await cookies();
  const catalogSessionCookiePresent =
    cookieStore.has(SID_COOKIE_NAME) && cookieStore.has(CSRF_COOKIE_NAME);
  const adminSessionCookiePresent =
    cookieStore.has(ADMIN_SID_COOKIE_NAME) &&
    cookieStore.has(ADMIN_CSRF_COOKIE_NAME);
  const csrfCookiePresent =
    catalogSessionCookiePresent || adminSessionCookiePresent;
  const cookieHeader = cookieStore.toString();

  if (!catalogSessionCookiePresent || !cookieHeader) {
    return {
      authData: null,
      csrfCookiePresent,
      catalogSessionCookiePresent,
      adminSessionCookiePresent,
      resolved: true,
    };
  }

  const forwardedHost = await resolveServerForwardedHost();

  try {
    const authData = await mutator<AuthControllerMeQueryResult>({
      url: "/auth/me",
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        [FORWARDED_HOST_HEADER]: forwardedHost,
      },
    });

    return {
      authData,
      csrfCookiePresent: true,
      catalogSessionCookiePresent,
      adminSessionCookiePresent,
      resolved: true,
    };
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return {
        authData: null,
        csrfCookiePresent: true,
        catalogSessionCookiePresent,
        adminSessionCookiePresent,
        resolved: true,
      };
    }

    return {
      authData: null,
      csrfCookiePresent: true,
      catalogSessionCookiePresent,
      adminSessionCookiePresent,
      resolved: false,
    };
  }
}

export async function getCurrentSessionServerUncached(
  currentCatalogId?: string | null,
): Promise<SessionBootstrapState> {
  return loadCurrentSessionServer(currentCatalogId);
}

export const getCurrentSessionServer = cache(
  async (currentCatalogId?: string | null): Promise<SessionBootstrapState> => {
    return loadCurrentSessionServer(currentCatalogId);
  },
);
