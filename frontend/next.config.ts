import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper server-side rendering
  reactStrictMode: true,
  // Image configuration
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  // Pin Turbopack root so Next stops warning about multiple lockfiles in monorepo
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;