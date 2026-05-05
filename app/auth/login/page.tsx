import { LoginContent } from "@/core/views/login/login-content";
import { getCurrentCatalogServer } from "@/shared/api/server/get-current-catalog";
import { getCurrentSessionServer } from "@/shared/api/server/get-current-session";
import { redirect } from "next/navigation";

export default async function Login() {
  const catalog = await getCurrentCatalogServer();
  const session = await getCurrentSessionServer(catalog.id);

  if (session.authData?.user) {
    redirect("/");
  }

  return <LoginContent />;
}
