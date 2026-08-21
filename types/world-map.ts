export const worldMapRelationshipKinds = [
  "interviewed",
  "team-up",
  "partner",
  "investor",
  "advertising-partner",
] as const;

export type WorldMapRelationshipKind = (typeof worldMapRelationshipKinds)[number];
export type WorldMapFilter = "all" | WorldMapRelationshipKind;
export type WorldMapContinentId = "AF" | "AS" | "EU" | "NA" | "SA" | "OC";
export type WorldMapCountryId = "DE" | "EG" | "RU";
export type WorldMapLocationRole = "current" | "origin";
export type WorldMapLocationContext = "public-context" | "public-professional-context" | "business-context" | "origin";
export type WorldMapLocationProvenance = "canonical-spotlight" | "owner-confirmed" | "first-party-organization";

export type WorldMapCoordinate = {
  longitude: number;
  latitude: number;
  precision: "city" | "region-representative" | "country-representative";
};

export type WorldMapLocation = {
  id: string;
  role: WorldMapLocationRole;
  context: WorldMapLocationContext;
  provenance: WorldMapLocationProvenance;
  precision: "city" | "region" | "country";
  cityId?: string;
  regionId?: string;
  countryId: WorldMapCountryId;
  continentId: WorldMapContinentId;
  coordinate: WorldMapCoordinate;
  publicSource: string;
};

export type WorldMapEntity = {
  id: string;
  kind: "person" | "organization";
  name: string;
  description: string;
  image?: { src: string; alt: string };
  sourceHref: string;
  sourceKind: "people-spotlight" | "project" | "public-partner";
};

export type WorldMapRelationship = {
  id: string;
  kind: WorldMapRelationshipKind;
  source: string;
  published: true;
  paid: boolean;
};

export type WorldMapContentLink = {
  id: string;
  kind: "people" | "project" | "writing" | "video";
  label: string;
  href: string;
  external: boolean;
};

export type WorldMapPublicContact = {
  id: string;
  label: string;
  href: string;
};

export type WorldMapConnection = {
  id: string;
  entity: WorldMapEntity;
  currentLocation: WorldMapLocation;
  origin?: WorldMapLocation;
  relationships: readonly WorldMapRelationship[];
  contentLinks: readonly WorldMapContentLink[];
  publicContacts: readonly WorldMapPublicContact[];
};

export type WorldMapStage = "discovered" | "presence" | "growing";

export type WorldMapAreaProgress = {
  id: string;
  kind: "city" | "country" | "continent";
  relationshipCount: number;
  entityCount: number;
  categoryCount: number;
  stage: WorldMapStage;
};

export type WorldMapProgress = {
  uniqueRelationships: number;
  uniqueEntities: number;
  categoryCount: number;
  discoveredCities: number;
  discoveredCountries: number;
  continentsWithPresence: number;
  cities: readonly WorldMapAreaProgress[];
  countries: readonly WorldMapAreaProgress[];
  continents: readonly WorldMapAreaProgress[];
};

export type ProjectedWorldMapConnection = WorldMapConnection & {
  point: { x: number; y: number };
};

export type WorldMapCountryGeometry = {
  id: WorldMapCountryId;
  path: string;
  point: { x: number; y: number };
};

export type WorldMapGeometry = {
  width: number;
  height: number;
  spherePath: string;
  landPath: string;
  borderPath: string;
  countries: readonly WorldMapCountryGeometry[];
  connections: readonly ProjectedWorldMapConnection[];
};
