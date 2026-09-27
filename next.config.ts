import type { NextConfig } from "next";
import path from "path";

function getClerkFrontendApiUrl() {
  try {
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
    const base64 = key.split('_')[2];
    if (base64) {
      const decoded = Buffer.from(base64, 'base64').toString();
      return `https://${decoded.replace('$', '')}`;
    }
  } catch (e) {
    return "";
  }
  return "";
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],

  async rewrites() {
    const clerkFrontendApi = getClerkFrontendApiUrl();
    if (clerkFrontendApi && process.env.NEXT_PUBLIC_CLERK_PROXY_URL) {
      return [
        {
          source: '/__clerk/:path*',
          destination: `${clerkFrontendApi}/:path*`,
        },
      ];
    }
    return [];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
