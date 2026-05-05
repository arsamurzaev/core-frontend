import type { NextConfig } from "next";

const BACKEND_INTERNAL_URL = (
  process.env.API_BASE_URL ?? "http://127.0.0.1:4000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/_svc_api/:path*",
        destination: `${BACKEND_INTERNAL_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
