import type { NextConfig } from "next";

function createRemotePattern(urlValue: string) {
  const url = new URL(urlValue);

  return {
    protocol: url.protocol.replace(":", "") as "http" | "https",
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
    pathname: "/**",
  };
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      createRemotePattern(
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
      ),
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
