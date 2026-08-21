import type { MetadataRoute } from "next";

import { siteConfig } from "@/data/site";
import { defaultLocale, locales } from "@/lib/i18n/config";

function getCanonicalProductionUrl(): URL | null {
  if (process.env.NODE_ENV !== "production" || !process.env.SITE_URL) return null;

  try {
    const url = new URL(process.env.SITE_URL);
    if (
      url.protocol !== "https:" ||
      url.hostname !== siteConfig.domain ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      return null;
    }

    return new URL(url.origin);
  } catch {
    return null;
  }
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalProductionUrl();

  // robots.txt ist kein Zugriffsschutz. Adminschutz erfolgt weiterhin über
  // Auth, Allowlist, Rolle, Aktivstatus und AAL2.
  if (!siteUrl) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const privateRoutes = [
    "/admin",
    "/account",
    "/api",
    "/newsletter/confirm",
    "/newsletter/unsubscribe",
    ...locales.filter((locale) => locale !== defaultLocale).flatMap((locale) => [
      `/${locale}/account`,
      `/${locale}/newsletter/confirm`,
      `/${locale}/newsletter/unsubscribe`,
    ]),
  ];

  return {
    rules: { userAgent: "*", allow: "/", disallow: privateRoutes },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
