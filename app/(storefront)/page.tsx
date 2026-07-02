import { HomeContent } from "@/core/views/home/home-content";
import { PlatformLoginContent } from "@/core/views/platform/platform-login-content";
import { PlatformRegisterContent } from "@/core/views/platform/platform-register-content";
import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import { getPlatformHostKind } from "@/shared/platform/platform-host";

export default async function Home() {
  const platformHost = getPlatformHostKind(await resolveServerForwardedHost());

  if (platformHost === "register") {
    return <PlatformRegisterContent />;
  }

  if (platformHost === "login") {
    return <PlatformLoginContent />;
  }

  return (
    <>
      <HomeContent />
    </>
  );
}
