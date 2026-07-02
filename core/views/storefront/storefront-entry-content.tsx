import { HomeContent } from "@/core/views/home";
import {
  PlatformLoginContent,
  PlatformRegisterContent,
} from "@/core/views/platform";
import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import { getPlatformHostKind } from "@/shared/platform/platform-host";

export const StorefrontEntryContent = async () => {
  const platformHost = getPlatformHostKind(await resolveServerForwardedHost());

  if (platformHost === "register") {
    return <PlatformRegisterContent />;
  }

  if (platformHost === "login") {
    return <PlatformLoginContent />;
  }

  return <HomeContent />;
};
