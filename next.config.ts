import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s.wordpress.com",
        pathname: "/mshots/v1/**"
      }
    ]
  }
};

nextConfig.turbopack = {
  root: process.cwd()
};

export default nextConfig;
