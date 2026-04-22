const DEFAULT_FORWARDED_HOST =
  process.env.NEXT_PUBLIC_FORWARDED_HOST ?? "hayr.myctlg.ru";

// itminot,steepstep,ajwa,memory,samine,samsung95,villari,hayr

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

export function getForwardedHost(): string | null {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development"
      ? DEFAULT_FORWARDED_HOST
      : null;
  }

  return normalizeForwardedHost(window.location.host);
}

export { DEFAULT_FORWARDED_HOST };
