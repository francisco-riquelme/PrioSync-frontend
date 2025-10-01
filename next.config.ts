import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      resolveExtensions: [
        ".mdx",
        ".tsx",
        ".ts",
        ".jsx",
        ".js",
        ".mjs",
        ".json",
      ],
    },
  },
  // Temporarily disable font optimization in dev
  optimizeFonts: process.env.NODE_ENV === "production",
};

export default nextConfig;
