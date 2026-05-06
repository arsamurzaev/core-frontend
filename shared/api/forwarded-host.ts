const DEFAULT_FORWARDED_HOST =
  process.env.NEXT_PUBLIC_FORWARDED_HOST ?? "itmi.myctlg-update.ru";

function extractHostname(host: string): string {
  const normalizedHost = host.trim().toLowerCase();

  if (normalizedHost.startsWith("[")) {
    const bracketEndIndex = normalizedHost.indexOf("]");

    if (bracketEndIndex > 0) {
      return normalizedHost.slice(1, bracketEndIndex);
    }
  }

  return normalizedHost.split(":")[0] ?? normalizedHost;
}

export function isLocalRequestHost(host: string): boolean {
  const hostname = extractHostname(host);

  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

export function normalizeForwardedHost(host: string | null): string | null {
  if (!host) {
    return null;
  }

  const normalizedHost = host.trim();

  if (isLocalRequestHost(normalizedHost)) {
    return DEFAULT_FORWARDED_HOST;
  }

  return normalizedHost;
}

export async function getForwardedHost(): Promise<string | null> {
  if (typeof window === "undefined") {
    if (process.env.NODE_ENV === "development") {
      return DEFAULT_FORWARDED_HOST;
    }
    try {
      const { headers } = await import("next/headers");
      const host = (await headers()).get("host");
      return normalizeForwardedHost(host);
    } catch {
      return null;
    }
  }

  return normalizeForwardedHost(window.location.host);
}

export { DEFAULT_FORWARDED_HOST };
