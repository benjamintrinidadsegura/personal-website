import type {
  WorldMapAreaProgress,
  WorldMapConnection,
  WorldMapFilter,
  WorldMapProgress,
  WorldMapRelationship,
  WorldMapRelationshipKind,
  WorldMapStage,
} from "@/types/world-map";

export type WorldMapZoomLevel = "world" | "country" | "city";

export type WorldMapWheelZoomInput = {
  delta: number;
  origin: { x: number; y: number };
};

const safeExternalProtocols = new Set(["https:"]);

export function isSafeWorldMapHref(href: string, external: boolean): boolean {
  if (!external) return href.startsWith("/") && !href.startsWith("//");
  try {
    return safeExternalProtocols.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

export function validateWorldMapConnection(connection: WorldMapConnection): readonly string[] {
  const errors: string[] = [];
  const { longitude, latitude } = connection.currentLocation.coordinate;

  if (connection.entity.publicationState !== "published") errors.push("entity must be published");
  if (!connection.entity.name.trim()) errors.push("entity name is required");
  if (!connection.entity.description.trim()) errors.push("entity story is required");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) errors.push("longitude is invalid");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) errors.push("latitude is invalid");
  if (connection.relationships.length === 0) errors.push("at least one public category is required");
  if (connection.relationships.some(({ published }) => published !== true)) errors.push("relationships must be published");
  if (!isSafeWorldMapHref(connection.entity.sourceHref, false)) errors.push("entity source link is unsafe");
  for (const link of connection.contentLinks) {
    if (!isSafeWorldMapHref(link.href, link.external)) errors.push(`content link is unsafe: ${link.id}`);
  }
  for (const contact of connection.publicContacts) {
    if (!isSafeWorldMapHref(contact.href, true)) errors.push(`public contact link is unsafe: ${contact.id}`);
  }

  return errors;
}

export function assertValidWorldMapConnection(connection: WorldMapConnection): WorldMapConnection {
  const errors = validateWorldMapConnection(connection);
  if (errors.length > 0) throw new Error(`Invalid World Map connection ${connection.id}: ${errors.join("; ")}`);
  return connection;
}

export function bindWorldMapWheelZoom(
  viewport: HTMLElement,
  onZoom: (input: WorldMapWheelZoomInput) => void,
): () => void {
  const handleWheel = (event: WheelEvent) => {
    if (event.deltaY === 0) return;
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / height) * 100));
    onZoom({ delta: event.deltaY < 0 ? 0.35 : -0.35, origin: { x, y } });
  };

  viewport.addEventListener("wheel", handleWheel, { passive: false });
  return () => viewport.removeEventListener("wheel", handleWheel);
}

export function relationshipKinds(connection: WorldMapConnection): WorldMapRelationshipKind[] {
  return [...new Set(connection.relationships.map(({ kind }) => kind))];
}

export function matchesWorldMapFilter(connection: WorldMapConnection, filter: WorldMapFilter): boolean {
  return filter === "all" || connection.relationships.some(({ kind }) => kind === filter);
}

export function filterWorldMapConnections(
  connections: readonly WorldMapConnection[],
  filter: WorldMapFilter,
): WorldMapConnection[] {
  return connections.filter((connection) => matchesWorldMapFilter(connection, filter));
}

function uniqueRelationships(connections: readonly WorldMapConnection[]): WorldMapRelationship[] {
  return [...new Map(
    connections.flatMap(({ relationships }) => relationships).map((relationship) => [relationship.id, relationship]),
  ).values()];
}

export function resolveWorldMapStage(
  entityCount: number,
  categoryCount: number,
  locationCount = entityCount,
): WorldMapStage {
  if (entityCount >= 3 && (categoryCount >= 2 || locationCount >= 3)) return "growing";
  if (entityCount >= 2) return "presence";
  return "discovered";
}

function aggregateAreas(
  connections: readonly WorldMapConnection[],
  kind: WorldMapAreaProgress["kind"],
  idFor: (connection: WorldMapConnection) => string | undefined,
): WorldMapAreaProgress[] {
  const groups = new Map<string, WorldMapConnection[]>();
  for (const connection of connections) {
    const id = idFor(connection);
    if (!id) continue;
    groups.set(id, [...(groups.get(id) ?? []), connection]);
  }

  return [...groups.entries()].map(([id, entries]) => {
    const relationships = uniqueRelationships(entries);
    const entityCount = new Set(entries.map(({ entity }) => entity.id)).size;
    const categoryCount = new Set(relationships.map(({ kind: relationshipKind }) => relationshipKind)).size;
    return {
      id,
      kind,
      relationshipCount: relationships.length,
      entityCount,
      categoryCount,
      stage: resolveWorldMapStage(
        entityCount,
        categoryCount,
        new Set(entries.map(({ currentLocation }) => currentLocation.id)).size,
      ),
    };
  }).sort((left, right) => left.id.localeCompare(right.id));
}

export function calculateWorldMapProgress(connections: readonly WorldMapConnection[]): WorldMapProgress {
  const deduplicated = [...new Map(connections.map((connection) => [connection.id, connection])).values()];
  const relationships = uniqueRelationships(deduplicated);
  const cities = aggregateAreas(deduplicated, "city", ({ currentLocation }) => currentLocation.cityId ?? currentLocation.regionId);
  const countries = aggregateAreas(deduplicated, "country", ({ currentLocation }) => currentLocation.countryId);
  const continents = aggregateAreas(deduplicated, "continent", ({ currentLocation }) => currentLocation.continentId);
  return {
    uniqueRelationships: relationships.length,
    uniqueEntities: new Set(deduplicated.map(({ entity }) => entity.id)).size,
    categoryCount: new Set(relationships.map(({ kind }) => kind)).size,
    discoveredCities: cities.length,
    discoveredCountries: countries.length,
    continentsWithPresence: continents.length,
    cities,
    countries,
    continents,
  };
}

export function groupWorldMapConnectionsByLocation(connections: readonly WorldMapConnection[]) {
  const groups = new Map<string, WorldMapConnection[]>();
  for (const connection of connections) {
    groups.set(connection.currentLocation.id, [...(groups.get(connection.currentLocation.id) ?? []), connection]);
  }
  return [...groups.entries()].map(([locationId, entries]) => ({ locationId, entries }));
}

export function getWorldMapZoomLevel(scale: number): WorldMapZoomLevel {
  if (scale < 1.6) return "world";
  if (scale < 3) return "country";
  return "city";
}

export function aggregateWorldMapCountries(
  connections: readonly WorldMapConnection[],
  filter: WorldMapFilter,
): readonly WorldMapAreaProgress[] {
  return calculateWorldMapProgress(filterWorldMapConnections(connections, filter)).countries;
}
