import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://backend:8000';
    console.log(`Configuring API rewrites to: ${backendUrl}`);
    
    return [
      // Exclude the health endpoint from rewrites since we have our own implementation
      {
        source: '/api/health',
        destination: '/api/health',
      },
      // All other API routes go to the backend
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
        basePath: false,
      },
    ];
  },
  // Make sure these environment variables are available both server and client side
  env: {
    NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://backend:8000',
  },
};

export default nextConfig;
