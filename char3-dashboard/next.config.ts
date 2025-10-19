import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Fix for network interface error
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  }
};

export default nextConfig;
