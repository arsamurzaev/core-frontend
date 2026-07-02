import { PlatformLoginContent } from "@/core/views/platform";
import {
  getCurrentCatalogServer,
  resolveServerForwardedHost,
} from "@/shared/api/server/get-current-catalog";
import { getCurrentSessionServer } from "@/shared/api/server/get-current-session";
import { getPlatformHostKind } from "@/shared/platform/platform-host";
import { notFound, redirect } from "next/navigation";
import { LoginContent } from "./login-content";

export const LoginPageContent = async () => {
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
};
