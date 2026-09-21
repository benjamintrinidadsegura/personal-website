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

export const WORLD_MAP_MIN_ZOOM = 1;
export const WORLD_MAP_MAX_ZOOM = 4.4;

export type WorldMapOffset = { x: number; y: number };

export function clampWorldMapZoom(value: number): number {
  return Math.max(WORLD_MAP_MIN_ZOOM, Math.min(WORLD_MAP_MAX_ZOOM, value));
}

export function clampWorldMapOffset(offset: WorldMapOffset, viewport: { width: number; height: number }, zoom: number): WorldMapOffset {
  const boundedZoom = clampWorldMapZoom(zoom);
  const xLimit = Math.max(44, ((boundedZoom - 1) * viewport.width) / 2 + 44);
  const yLimit = Math.max(30, ((boundedZoom - 1) * viewport.height) / 2 + 30);
  return {
    x: Math.max(-xLimit, Math.min(xLimit, offset.x)),
    y: Math.max(-yLimit, Math.min(yLimit, offset.y)),
  };
}

export function zoomWorldMapAt(
  offset: WorldMapOffset,
  currentZoom: number,
  nextZoom: number,
  origin: { x: number; y: number },
  viewport: { width: number; height: number },
): WorldMapOffset {
  const boundedCurrent = clampWorldMapZoom(currentZoom);
  const boundedNext = clampWorldMapZoom(nextZoom);
  const ratio = boundedNext / boundedCurrent;
  const pointer = {
    x: (Math.max(0, Math.min(100, origin.x)) / 100 - 0.5) * viewport.width,
    y: (Math.max(0, Math.min(100, origin.y)) / 100 - 0.5) * viewport.height,
  };
  return clampWorldMapOffset({
    x: pointer.x - (pointer.x - offset.x) * ratio,
    y: pointer.y - (pointer.y - offset.y) * ratio,
  }, viewport, boundedNext);
}

export function centerWorldMapPoint(
  point: { x: number; y: number },
  geometry: { width: number; height: number },
  viewport: { width: number; height: number },
  zoom: number,
): WorldMapOffset {
  const boundedZoom = clampWorldMapZoom(zoom);
  return clampWorldMapOffset({
    x: -(point.x / geometry.width - 0.5) * viewport.width * boundedZoom,
    y: -(point.y / geometry.height - 0.5) * viewport.height * boundedZoom,
  }, viewport, boundedZoom);
}

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
  onZoom: (input: WorldMapWheelZoomInput) => boolean | void,
): () => void {
  const handleWheel = (event: WheelEvent) => {
    const primaryDelta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
    if (primaryDelta === 0) return;
    const rect = viewport.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / height) * 100));
    const handled = onZoom({ delta: primaryDelta < 0 ? 0.35 : -0.35, origin: { x, y } });
    if (handled !== false) event.preventDefault();
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
