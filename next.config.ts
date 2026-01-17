import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d1q70pf5vjeyhc.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
