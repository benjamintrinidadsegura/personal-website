import type { MetadataRoute } from "next";

import {
  getCanonicalProductionUrl,
  getLocalizedPrivateRoutePrefixes,
  modelTrainingCrawlers,
  searchRetrievalCrawlers,
} from "@/lib/search-discovery";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getCanonicalProductionUrl();

  // robots.txt ist kein Zugriffsschutz. Adminschutz erfolgt weiterhin über
  // Auth, Allowlist, Rolle, Aktivstatus und AAL2.
  if (!siteUrl) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const privateRoutes = getLocalizedPrivateRoutePrefixes();

  return {
    rules: [
      { userAgent: [...searchRetrievalCrawlers], allow: "/", disallow: privateRoutes },
      { userAgent: [...modelTrainingCrawlers], disallow: "/" },
      { userAgent: "*", allow: "/", disallow: privateRoutes },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
