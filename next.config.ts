import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Disable static optimization to ensure fresh content on every request
  experimental: {
    // Force dynamic rendering for all routes
    isrMemoryCacheSize: 0,
  },
  // Disable build cache to ensure fresh builds
  onDemandEntries: {
    maxInactiveAge: 0,
    pagesBufferLength: 0,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
          {
            key: "X-Vercel-Cache",
            value: "MISS",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
