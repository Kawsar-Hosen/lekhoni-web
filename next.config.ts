import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.workers.dev" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    return [
      {
        // Same-origin proxy → bypasses browser CORS (backend only allows admin origin).
        source: "/backend/:path*",
        destination: "https://lekhoni-admin-api.smdkawsar2.workers.dev/:path*",
      },
    ];
  },
};

export default nextConfig;
