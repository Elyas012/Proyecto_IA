import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@radix-ui"],
  },
};

