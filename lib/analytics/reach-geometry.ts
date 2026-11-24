import "server-only";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import fullWorld from "world-atlas/countries-50m.json";
import compactWorld from "world-atlas/countries-110m.json";
import { regionByNumericCode } from "@/data/reach-country-codes";

export type ReachShape = { id: string; countryCode?: string; path: string };

export const reachViewBox = "0 0 960 465";

const saved = new Map<boolean, ReachShape[]>();
export function getReachShapes(detailed = true): ReachShape[] {
  const cached = saved.get(detailed);
  if (cached) return cached;
  const topology = (detailed ? fullWorld : compactWorld) as unknown as Topology<{ countries: GeometryCollection }>;
  const countries = feature(topology, topology.objects.countries) as unknown as FeatureCollection<Geometry>;
  const projection = geoNaturalEarth1().fitExtent([[8, 8], [952, 457]], { type: "Sphere" });
  const path = geoPath(projection).digits(1);
  const shapes = countries.features.map((country, index) => {
    const numericCode = String(country.id ?? "").padStart(3, "0");
    return { id: String(index), countryCode: regionByNumericCode[numericCode]?.[0], path: path(country) ?? "" };
  }).filter((country) => country.path);
  saved.set(detailed, shapes);
  return shapes;
}
