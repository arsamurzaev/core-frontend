import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

function getOrigin(url: string | undefined): string {
  if (!url) {
    return "";
  }

  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

const apiOrigin = getOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);
const devConnectSources = isDev
  ? "http://localhost:* ws://localhost:* wss://localhost:* wss://*.myctlg-update.ru"
  : "";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : ""} https://cdn.jsdelivr.net https://mc.yandex.ru https://mc.yandex.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob:
    https://s3.storage.myctlg.ru
    https://s3.twcstorage.ru
    https://*.twcstorage.ru
    https://mc.yandex.ru https://mc.yandex.com
    https://*.moysklad.ru;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' blob:
    ${apiOrigin}
    https://mc.yandex.ru https://mc.yandex.com
    wss://mc.yandex.ru wss://mc.yandex.com
    https://s3.storage.myctlg.ru
    ${devConnectSources}
    https://s3.twcstorage.ru;
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  ${isDev ? "" : "upgrade-insecure-requests;"}
`;

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\s+/g, " ").trim(),
  },
];

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.storage.myctlg.ru",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3.twcstorage.ru",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.moysklad.ru",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "miniature-prod.moysklad.ru",
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
