import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
    images: {
      remotePatterns: [
          {
              hostname: 'fanm6rhj45.ufs.sh',
          }
      ]
    }
};

export default nextConfig;
