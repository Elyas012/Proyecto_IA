import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@radix-ui"],
  },
  // Configuración de redirecciones
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;


