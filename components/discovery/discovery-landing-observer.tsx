"use client";

import { useEffect } from "react";

import type { DiscoverySurfaceId } from "@/data/search-discovery";
import type { Locale } from "@/lib/i18n/config";
import { emitDiscoveryLandingEvent } from "@/lib/search-discovery-analytics";

export function DiscoveryLandingObserver({ locale, surface }: { locale: Locale; surface: DiscoverySurfaceId }) {
  useEffect(() => emitDiscoveryLandingEvent(surface, locale), [locale, surface]);
  return null;
}
