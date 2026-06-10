import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for NextAuth
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'commercecontrol.vercel.app'],
    },
  },
  // Images configuration (if needed)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  // Build output
  output: 'standalone',
};

export default nextConfig;