import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import { getCurrentSessionServerUncached } from "@/shared/api/server/get-current-session";
import { revalidateStorefrontCacheByHost } from "@/shared/api/server/storefront-cache";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf";
const CATALOG_CSRF_COOKIE_PREFIX = "catalog_csrf_";
const CSRF_HEADER_NAME = "x-csrf-token";

function csrfTokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: NextRequest) {
  const csrfCookie =
    request.cookies.get(CSRF_COOKIE_NAME)?.value ??
    request.cookies
      .getAll()
      .find((cookie) => cookie.name.startsWith(CATALOG_CSRF_COOKIE_PREFIX))
      ?.value ??
    null;
  const csrfHeader = request.headers.get(CSRF_HEADER_NAME);

  if (!csrfCookie || !csrfHeader || !csrfTokensMatch(csrfCookie, csrfHeader)) {
    return NextResponse.json(
      { message: "Недостаточно прав для инвалидации storefront cache." },
      { status: 403 },
    );
  }

  const session = await getCurrentSessionServerUncached();
  const role = session.authData?.user.role;

  if (!isCatalogManagerRole(role)) {
    return NextResponse.json(
      {
        message: "Storefront cache может инвалидировать только администратор.",
      },
      { status: 403 },
    );
  }

  const forwardedHost = await resolveServerForwardedHost();
  revalidateStorefrontCacheByHost(forwardedHost);

  return NextResponse.json({ ok: true });
}
