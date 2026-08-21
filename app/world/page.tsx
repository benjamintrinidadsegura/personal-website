import type { Metadata } from "next";

import { WorldMapExperience } from "@/components/world-map/world-map-experience";
import { getLocalizedPublishedSpotlights } from "@/data/i18n/people";
import { getWorldMapDictionary } from "@/data/i18n/world-map";
import { createWorldMapConnections } from "@/data/world-map";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";
import { createWorldMapGeometry } from "@/lib/world-map-geometry";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getWorldMapDictionary(locale);
  return createLocalizedMetadata({
    locale,
    pathname: "/world",
    title: copy.metadata.title,
    description: copy.metadata.description,
  });
}

export default async function WorldMapPage() {
  const locale = await getLocale();
  const connections = createWorldMapConnections(getLocalizedPublishedSpotlights(locale));
  const geometry = createWorldMapGeometry(connections);
  return <WorldMapExperience geometry={geometry} />;
}
