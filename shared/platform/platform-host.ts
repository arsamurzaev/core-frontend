export type PlatformHostKind = "register" | "login";

const PLATFORM_HOSTS = new Set<PlatformHostKind>(["register", "login"]);

function normalizeHostname(host: string | null | undefined): string {
  if (!host) return "";

  const firstHost = host.split(",")[0]?.trim().toLowerCase() ?? "";
  const withoutProtocol = firstHost.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] ?? withoutProtocol;

  if (withoutPath.startsWith("[")) {
    const bracketEndIndex = withoutPath.indexOf("]");
    return bracketEndIndex > 0
      ? withoutPath.slice(1, bracketEndIndex)
      : withoutPath;
  }

  return withoutPath.split(":")[0] ?? withoutPath;
}

export function getPlatformHostKind(
  host: string | null | undefined,
): PlatformHostKind | null {
  const hostname = normalizeHostname(host);
  const firstLabel = hostname.split(".")[0] ?? "";

  return PLATFORM_HOSTS.has(firstLabel as PlatformHostKind)
    ? (firstLabel as PlatformHostKind)
    : null;
}

export function isPlatformHost(host: string | null | undefined): boolean {
  return getPlatformHostKind(host) !== null;
}
