import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

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
    https://mc.yandex.ru https://mc.yandex.com
    wss://mc.yandex.ru wss://mc.yandex.com
    https://s3.storage.myctlg.ru
    ${isDev ? "http://localhost:*" : ""}
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
