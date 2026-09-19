import type { NextConfig } from "next";

import { defaultLocale, locales } from "./lib/i18n/config";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none';" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
    : []),
] as const;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "192kb",
    },
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [...securityHeaders],
    },
    {
      source: "/newsletter/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    },
    {
      source: "/life-alignment/invite/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      ],
    },
    {
      source: "/life-alignment/session/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      ],
    },
    {
      source: "/life-alignment/sessions",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      ],
    },
    ...locales.filter((locale) => locale !== defaultLocale).flatMap((locale) => ["invite", "session", "sessions"].map((kind) => ({
      source: `/${locale}/life-alignment/${kind}/:path*`,
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      ],
    }))),
    ...locales.filter((locale) => locale !== defaultLocale).map((locale) => ({
      source: `/${locale}/newsletter/:path*`,
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    })),
  ],
};

export default nextConfig;
