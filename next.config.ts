import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.workers.dev" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
