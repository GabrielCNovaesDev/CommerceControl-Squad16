import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper server-side rendering
  reactStrictMode: true,
  // Output configuration for Vercel
  output: 'standalone',
  // Image configuration
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;