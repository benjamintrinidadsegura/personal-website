import "server-only";

import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import countries from "world-atlas/countries-110m.json";
import type { GeometryCollection, Topology } from "topojson-specification";

import type { Feature, FeatureCollection, Geometry } from "geojson";

import type { WorldMapConnection, WorldMapCountryId, WorldMapGeometry } from "@/types/world-map";

const WIDTH = 1000;
const HEIGHT = 510;
const topology = countries as unknown as Topology<{ countries: GeometryCollection }>;
const countryFeatureIds: Record<WorldMapCountryId, string> = {
  DE: "276",
  EG: "818",
  RU: "643",
};

export function createWorldMapGeometry(connections: readonly WorldMapConnection[]): WorldMapGeometry {
  const sphere = { type: "Sphere" } as const;
  const projection = geoNaturalEarth1().fitExtent([[14, 14], [WIDTH - 14, HEIGHT - 14]], sphere);
  const path = geoPath(projection);
  const land = feature(topology, topology.objects.countries) as unknown as FeatureCollection<Geometry>;
  const borders = mesh(topology, topology.objects.countries, (left, right) => left !== right);
  const supportedCountries = (Object.entries(countryFeatureIds) as [WorldMapCountryId, string][]).flatMap(([id, featureId]) => {
    const country = land.features.find((entry) => String(entry.id) === featureId);
    if (!country) return [];
    const centroid = path.centroid(country as Feature<Geometry>);
    if (!centroid.every(Number.isFinite)) return [];
    return [{ id, path: path(country as Feature<Geometry>) ?? "", point: { x: centroid[0], y: centroid[1] } }];
  });

  return {
    width: WIDTH,
    height: HEIGHT,
    spherePath: path(sphere) ?? "",
    landPath: path(land) ?? "",
    borderPath: path(borders) ?? "",
    countries: supportedCountries,
    connections: connections.map((connection) => {
      const projected = projection([
        connection.currentLocation.coordinate.longitude,
        connection.currentLocation.coordinate.latitude,
      ]);
      if (!projected) throw new Error(`World Map coordinate could not be projected: ${connection.currentLocation.id}`);
      return { ...connection, point: { x: projected[0], y: projected[1] } };
    }),
  };
}
