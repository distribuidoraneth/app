import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['osodreamer-sri-xml-signer', 'node-forge'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./facturacion/**/*'],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
