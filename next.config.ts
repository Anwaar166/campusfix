import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { distDir: "build" }),
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
