import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import {
  getCurrentSessionServerUncached,
} from "@/shared/api/server/get-current-session";
import {
  revalidateStorefrontCacheByHost,
} from "@/shared/api/server/storefront-cache";
import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

export async function POST(request: NextRequest) {
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value ?? null;
  const csrfHeader = request.headers.get(CSRF_HEADER_NAME);

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return NextResponse.json(
      { message: "Недостаточно прав для инвалидации storefront cache." },
      { status: 403 },
    );
  }

  const session = await getCurrentSessionServerUncached();
  const role = session.authData?.user.role;

  if (!isCatalogManagerRole(role)) {
    return NextResponse.json(
      { message: "Storefront cache может инвалидировать только администратор." },
      { status: 403 },
    );
  }

  const forwardedHost = await resolveServerForwardedHost();
  revalidateStorefrontCacheByHost(forwardedHost);

  return NextResponse.json({ ok: true });
}
