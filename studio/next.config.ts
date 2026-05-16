import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/dashboard',
  // Disable eslint during build for faster deployment iteration
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
