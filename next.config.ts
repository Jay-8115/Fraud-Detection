import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@clerk/react/internal': path.resolve(__dirname, 'src/mockClerk.tsx'),
      '@clerk/react': path.resolve(__dirname, 'src/mockClerk.tsx'),
    };
    return config;
  },
};

export default nextConfig;
