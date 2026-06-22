import { LoginContent } from "@/core/views/login/login-content";
import { PlatformLoginContent } from "@/core/views/platform/platform-login-content";
import { getCurrentCatalogServer } from "@/shared/api/server/get-current-catalog";
import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import { getCurrentSessionServer } from "@/shared/api/server/get-current-session";
import { getPlatformHostKind } from "@/shared/platform/platform-host";
import { notFound, redirect } from "next/navigation";

export default async function Login() {
  const platformHost = getPlatformHostKind(await resolveServerForwardedHost());
  if (platformHost === "login") {
    return <PlatformLoginContent />;
  }

  const catalog = await getCurrentCatalogServer();

  if (!catalog) {
    notFound();
  }

  const session = await getCurrentSessionServer(catalog.id);

  if (session.authData?.user) {
    redirect("/");
  }

  return <LoginContent />;
}
