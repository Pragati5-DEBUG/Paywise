import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Channel3 offers pull images from many merchant CDNs; allow any https host.
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
    ],
  },
};

export default nextConfig;
