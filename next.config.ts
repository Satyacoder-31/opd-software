import type { NextConfig } from "next";

const appOrigin =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

// All allowed server action origins: primary domain + all Vercel deployment aliases
const allowedServerActionOrigins = [
  appOrigin.replace(/^https?:\/\//, ""),
  // Vercel deployment aliases (preview, staging, git-branch URLs)
  "dr-orthos-alpha.vercel.app",
  "dr-orthos-satya-9d16.vercel.app",
  "dr-orthos-git-main-satya-9d16.vercel.app",
  // localhost for development
  "localhost:3000",
];

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    serverActions: {
      allowedOrigins: [...new Set(allowedServerActionOrigins)],
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
