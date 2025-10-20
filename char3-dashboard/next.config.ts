import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Fix for network interface error
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
