import type { SpotlightPerson } from "@/types/content";
import type {
  WorldMapConnection,
  WorldMapLocation,
  WorldMapRelationshipKind,
} from "@/types/world-map";

type PublicLocationAdapter = {
  currentLocation: WorldMapLocation;
  origin?: WorldMapLocation;
  verify: (spotlight: SpotlightPerson) => boolean;
};

/**
 * This is a deliberately thin presentation adapter over canonical Spotlight
 * truth plus the explicitly accepted World Map corrections. Coordinates are
 * representative at the least precise public level and never identify a home.
 */
export const worldMapPublicLocationAdapters: Readonly<Record<string, PublicLocationAdapter>> = {
  "person-evgeny-vinokurov": {
    verify: (spotlight) => spotlight.location?.country === "Russland" && spotlight.location.region === "Sibirien" && spotlight.location.context === "origin",
    currentLocation: {
      id: "city-bremen-de",
      role: "current",
      context: "public-context",
      provenance: "owner-confirmed",
      precision: "city",
      cityId: "bremen",
      countryId: "DE",
      continentId: "EU",
      coordinate: { longitude: 8.8017, latitude: 53.0793, precision: "city" },
      publicSource: "Human owner-confirmed World Map correction: Bremen current context",
    },
    origin: {
      id: "region-siberia-ru",
      role: "origin",
      context: "origin",
      provenance: "canonical-spotlight",
      precision: "region",
      regionId: "siberia",
      countryId: "RU",
      continentId: "AS",
      coordinate: { longitude: 90, latitude: 60, precision: "region-representative" },
      publicSource: "data/spotlights.ts#person-evgeny-vinokurov.location",
    },
  },
  "person-kiki-radicke": {
    verify: (spotlight) => spotlight.organization === "Adacor" && spotlight.professionalContext.includes("Adacor"),
    currentLocation: {
      id: "region-frankfurt-rhine-main-de",
      role: "current",
      context: "public-professional-context",
      provenance: "first-party-organization",
      precision: "region",
      regionId: "frankfurt-rhine-main",
      countryId: "DE",
      continentId: "EU",
      coordinate: { longitude: 8.6821, latitude: 50.1109, precision: "region-representative" },
      publicSource: "https://www.adacor.com — Adacor first-party professional context in Frankfurt; linked from the canonical Spotlight",
    },
  },
  "person-johanna-geisler": {
    verify: (spotlight) => spotlight.organization === "JOGE. / After Work Social Club",
    currentLocation: {
      id: "city-hamburg-de",
      role: "current",
      context: "public-context",
      provenance: "owner-confirmed",
      precision: "city",
      cityId: "hamburg",
      countryId: "DE",
      continentId: "EU",
      coordinate: { longitude: 9.9937, latitude: 53.5511, precision: "city" },
      publicSource: "Human owner-confirmed World Map correction: Hamburg current context",
    },
  },
  "person-kevin-schweisfurth": {
    verify: (spotlight) => spotlight.organization === "Kev the Cutter / TCOS" && spotlight.professionalContext.includes("TCOS"),
    currentLocation: {
      id: "city-blieskastel-de",
      role: "current",
      context: "business-context",
      provenance: "owner-confirmed",
      precision: "city",
      cityId: "blieskastel",
      countryId: "DE",
      continentId: "EU",
      coordinate: { longitude: 7.2562, latitude: 49.2372, precision: "city" },
      publicSource: "Human-authorized World Map acceptance fix: Blieskastel city-level business context; no residence, home, live-location, or street-address claim",
    },
  },
  "person-amr-medhat": {
    verify: (spotlight) => spotlight.location?.country === "Ägypten" && spotlight.location.context === "origin",
    currentLocation: {
      id: "country-eg",
      role: "current",
      context: "public-context",
      provenance: "canonical-spotlight",
      precision: "country",
      countryId: "EG",
      continentId: "AF",
      coordinate: { longitude: 30.8025, latitude: 26.8206, precision: "country-representative" },
      publicSource: "data/spotlights.ts#person-amr-medhat.location+professionalContext",
    },
  },
  "person-melanie-kleinhenz": {
    verify: (spotlight) => spotlight.organization === "FemaleForward" && spotlight.professionalContext.includes("FemaleForward"),
    currentLocation: {
      id: "region-wuerzburg-de",
      role: "current",
      context: "public-professional-context",
      provenance: "owner-confirmed",
      precision: "region",
      regionId: "wuerzburg-region",
      countryId: "DE",
      continentId: "EU",
      coordinate: { longitude: 9.9534, latitude: 49.7913, precision: "region-representative" },
      publicSource: "Human owner-supplied World Map correction: Würzburg-region public professional context",
    },
  },
};

function isSupportedRelationship(value: string): boolean {
  return value === "interviewed" || value === "team-up" || value === "partner" || value === "investor" || value === "advertising-partner";
}

export function createWorldMapConnections(spotlights: readonly SpotlightPerson[]): WorldMapConnection[] {
  return spotlights.flatMap((spotlight) => {
    const adapter = worldMapPublicLocationAdapters[spotlight.id];
    if (
      spotlight.status !== "published" ||
      !spotlight.worldMap.ready ||
      spotlight.worldMap.interviewStatus !== "published" ||
      !adapter ||
      !adapter.verify(spotlight)
    ) return [];

    const supportedKinds = [...new Set(spotlight.worldMap.relationshipTypes)]
      .flatMap((kind) => isSupportedRelationship(kind) ? [kind as WorldMapRelationshipKind] : []);
    const relationships = supportedKinds
      .map((kind) => ({
        id: `${spotlight.id}:${kind}`,
        kind,
        source: `data/spotlights.ts#${spotlight.id}.worldMap.relationshipTypes`,
        published: true as const,
        paid: kind === "advertising-partner",
      }));

    if (relationships.length === 0) return [];

    const contentLinks = [
      {
        id: `${spotlight.id}:people`,
        kind: "people" as const,
        label: spotlight.title,
        href: `/people/${spotlight.slug}`,
        external: false,
      },
      ...(spotlight.video ? [{
        id: `${spotlight.id}:video`,
        kind: "video" as const,
        label: spotlight.video.title,
        href: spotlight.video.url,
        external: true,
      }] : []),
    ];

    return [{
      id: `${spotlight.id}:${adapter.currentLocation.id}`,
      entity: {
        id: spotlight.id,
        kind: "person" as const,
        name: spotlight.fullName,
        description: spotlight.teaser,
        ...(spotlight.cover ? { image: spotlight.cover } : {}),
        sourceHref: `/people/${spotlight.slug}`,
        sourceKind: "people-spotlight" as const,
      },
      currentLocation: adapter.currentLocation,
      ...(adapter.origin ? { origin: adapter.origin } : {}),
      relationships,
      contentLinks,
      // Organisation links are sources/context, not automatically personal
      // contact channels. The privacy-preserving default remains empty.
      publicContacts: [],
    }];
  });
}
