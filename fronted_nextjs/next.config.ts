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
  // Asegurar que las rutas estén correctamente configuradas
  trailingSlash: false,
  poweredByHeader: false,
};

export default nextConfig;

