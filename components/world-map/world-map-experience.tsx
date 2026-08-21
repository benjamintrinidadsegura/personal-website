"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocale, useLocalizedHref } from "@/components/i18n/locale-context";
import { getWorldMapDictionary } from "@/data/i18n/world-map";
import {
  aggregateWorldMapCountries,
  bindWorldMapWheelZoom,
  calculateWorldMapProgress,
  getWorldMapZoomLevel,
  matchesWorldMapFilter,
  relationshipKinds,
} from "@/lib/world-map";
import type {
  ProjectedWorldMapConnection,
  WorldMapFilter,
  WorldMapGeometry,
  WorldMapLocation,
  WorldMapRelationshipKind,
  WorldMapStage,
} from "@/types/world-map";

const relationshipFilters: readonly WorldMapRelationshipKind[] = ["interviewed", "team-up", "partner", "investor", "advertising-partner"];
const quickFilters: readonly WorldMapFilter[] = ["all", ...relationshipFilters];
const categoryTone: Record<WorldMapRelationshipKind, string> = {
  interviewed: "border-[#35d0e5] bg-[#35d0e5] text-[#041018]",
  "team-up": "border-emerald-300 bg-emerald-300 text-[#04140d]",
  partner: "border-[#ff9a3d] bg-[#ff9a3d] text-[#041018]",
  investor: "border-blue-200 bg-[#1d4ed8] text-white",
  "advertising-partner": "border-fuchsia-300 bg-fuchsia-300 text-[#17061c]",
};
const categoryOutline: Record<WorldMapRelationshipKind, string> = {
  interviewed: "border-[#35d0e5]/50 text-[#8eeaf5]",
  "team-up": "border-emerald-300/50 text-emerald-200",
  partner: "border-[#ff9a3d]/50 text-[#ffc17c]",
  investor: "border-blue-300/60 text-blue-200",
  "advertising-partner": "border-fuchsia-300/50 text-fuchsia-200",
};
const categoryGlyph: Record<WorldMapRelationshipKind, string> = {
  interviewed: "I",
  "team-up": "T",
  partner: "P",
  investor: "V",
  "advertising-partner": "A",
};

function locationLabel(location: WorldMapLocation, copy: ReturnType<typeof getWorldMapDictionary>) {
  const country = copy.locations.countries[location.countryId];
  const city = location.cityId === "bremen"
    ? copy.locations.cities.bremen
    : location.cityId === "hamburg"
      ? copy.locations.cities.hamburg
      : location.cityId === "blieskastel"
        ? copy.locations.cities.blieskastel
      : null;
  const region = location.regionId === "siberia"
    ? copy.locations.regions.siberia
    : location.regionId === "frankfurt-rhine-main"
      ? copy.locations.regions["frankfurt-rhine-main"]
      : location.regionId === "wuerzburg-region"
        ? copy.locations.regions["wuerzburg-region"]
        : null;
  return city || region ? `${city ?? region}, ${country}` : country;
}

function placeLabel(location: WorldMapLocation, copy: ReturnType<typeof getWorldMapDictionary>) {
  if (location.cityId === "bremen") return copy.locations.cities.bremen;
  if (location.cityId === "hamburg") return copy.locations.cities.hamburg;
  if (location.cityId === "blieskastel") return copy.locations.cities.blieskastel;
  if (location.regionId === "frankfurt-rhine-main") return copy.locations.regions["frankfurt-rhine-main"];
  if (location.regionId === "wuerzburg-region") return copy.locations.regions["wuerzburg-region"];
  return copy.locations.countries[location.countryId];
}

const placeCalloutOffset: Record<string, { x: number; y: number }> = {
  "city-bremen-de": { x: -80, y: -38 },
  "city-hamburg-de": { x: 84, y: -48 },
  "city-blieskastel-de": { x: 120, y: 18 },
  "region-frankfurt-rhine-main-de": { x: -112, y: 45 },
  "region-wuerzburg-de": { x: 94, y: 56 },
};

function stageLabel(stage: WorldMapStage, copy: ReturnType<typeof getWorldMapDictionary>) {
  return copy.progress[stage];
}

function stageFill(stage: WorldMapStage | undefined) {
  if (stage === "growing") return "rgba(255,154,61,.48)";
  if (stage === "presence") return "rgba(53,208,229,.38)";
  if (stage === "discovered") return "rgba(53,208,229,.22)";
  return "#0c2a35";
}

function FilterIcon({ kind }: { kind: WorldMapRelationshipKind }) {
  const shape = kind === "interviewed"
    ? "rounded-full"
    : kind === "partner"
      ? "rotate-45 rounded-[0.2rem]"
      : kind === "team-up"
        ? "[clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]"
        : kind === "advertising-partner"
          ? "rounded-full px-1"
          : "rounded-[0.1rem] ring-1 ring-inset ring-white/40";
  return (
    <span aria-hidden="true" className={`grid h-5 min-w-5 shrink-0 place-items-center border text-[9px] font-black ${categoryTone[kind]} ${shape}`}>
      <span className={kind === "partner" ? "-rotate-45" : ""}>{categoryGlyph[kind]}</span>
    </span>
  );
}

function ContextCard({
  connection,
  onSelect,
  peers,
}: {
  connection: ProjectedWorldMapConnection | null;
  onSelect: (id: string) => void;
  peers: readonly ProjectedWorldMapConnection[];
}) {
  const locale = useLocale();
  const href = useLocalizedHref();
  const copy = getWorldMapDictionary(locale);

  if (!connection) {
    return (
      <aside aria-live="polite" aria-labelledby="context-card-title" className="min-h-80 rounded-[1.75rem] border border-white/10 bg-[#071824]/88 p-6 sm:p-8">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#35d0e5]">{copy.context.eyebrow}</p>
        <h2 id="context-card-title" className="mt-5 text-3xl font-black text-white">{copy.context.emptyTitle}</h2>
        <p className="mt-4 leading-7 text-slate-400">{copy.context.emptyBody}</p>
      </aside>
    );
  }

  const kinds = relationshipKinds(connection);
  return (
    <aside aria-live="polite" aria-labelledby="context-card-title" className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#071824]/95 shadow-2xl shadow-black/20">
      {connection.entity.image ? (
        <div className="relative h-36 overflow-hidden border-b border-white/10 sm:h-44 lg:h-36">
          <Image src={connection.entity.image.src} alt={connection.entity.image.alt} fill sizes="(max-width: 1024px) 100vw, 30vw" className="object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#071824] via-transparent to-transparent" />
        </div>
      ) : (
        <div aria-hidden="true" className="grid h-24 place-items-center border-b border-white/10 bg-[radial-gradient(circle_at_center,rgba(53,208,229,0.18),transparent_65%)] font-mono text-4xl font-black text-[#35d0e5]/35">
          {connection.entity.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
        </div>
      )}
      <div className="p-6 sm:p-8">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#35d0e5]">{copy.context.eyebrow}</p>
        <h2 id="context-card-title" className="mt-4 text-3xl font-black leading-tight text-white">{connection.entity.name}</h2>
        {connection.currentLocation.context === "public-professional-context" || connection.currentLocation.context === "business-context" ? (
          <p className="mt-3 inline-flex min-h-8 items-center rounded-full border border-amber-300/40 bg-amber-300/[0.06] px-3 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-amber-200">
            {connection.currentLocation.context === "business-context" ? copy.context.businessContext : copy.context.publicProfessionalContext}
          </p>
        ) : null}

        {peers.length > 1 ? (
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">{copy.entriesAtLocation}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {peers.map((peer) => (
                <button key={peer.id} type="button" onClick={() => onSelect(peer.id)} aria-pressed={peer.id === connection.id} className="min-h-11 rounded-full border border-white/15 px-4 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-[#35d0e5] aria-pressed:border-[#35d0e5]">
                  {peer.entity.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <dl className="mt-7 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">{connection.currentLocation.context === "business-context" ? copy.context.businessContext : copy.context.current}</dt>
            <dd className="mt-2 font-black text-white">{locationLabel(connection.currentLocation, copy)}</dd>
            <dd className="mt-2 text-xs leading-5 text-slate-500">{copy.context.provenance[connection.currentLocation.provenance]}</dd>
            <dd className="mt-1 text-xs leading-5 text-slate-500">{copy.context.representativePoint}</dd>
          </div>
          {connection.origin ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">{copy.context.origin}</dt>
              <dd className="mt-2 font-black text-white">{locationLabel(connection.origin, copy)}</dd>
              <dd className="mt-2 text-xs leading-5 text-slate-500">{copy.context.provenance[connection.origin.provenance]}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2 lg:col-span-1">
            <dt className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">{copy.context.connectedThrough}</dt>
            <dd className="mt-3 grid gap-3">
              {kinds.map((kind) => (
                <span key={kind} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                  <FilterIcon kind={kind} />
                  <span><strong className="text-white">{copy.categories[kind].short}</strong> — {copy.categories[kind].description}</span>
                </span>
              ))}
            </dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <dt className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">{copy.context.why}</dt>
            <dd className="mt-2 leading-7 text-slate-300">{connection.entity.description}</dd>
          </div>
        </dl>

        <div className="mt-7 border-t border-white/10 pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">{copy.context.related}</p>
          <div className="mt-3 grid gap-2">
            {connection.contentLinks.map((link) => link.external ? (
              <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`${copy.context.openExternal}: ${link.label}`} className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 hover:border-[#35d0e5]/50 focus-visible:outline-2 focus-visible:outline-[#35d0e5]">
                <span>{link.label}</span><span aria-hidden="true" className="text-[#35d0e5]">↗</span>
              </a>
            ) : (
              <Link key={link.id} href={href(link.href)} aria-label={`${copy.context.openStory}: ${link.label}`} className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 hover:border-[#35d0e5]/50 focus-visible:outline-2 focus-visible:outline-[#35d0e5]">
                <span>{link.label}</span><span aria-hidden="true" className="text-[#35d0e5]">→</span>
              </Link>
            ))}
          </div>
        </div>

        {connection.publicContacts.length > 0 ? (
          <div className="mt-7 border-t border-white/10 pt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">{copy.context.contact}</p>
            <div className="mt-3 flex flex-wrap gap-2">{connection.publicContacts.map((contact) => <a key={contact.id} href={contact.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 font-bold text-white">{contact.label} ↗</a>)}</div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function WorldMapExperience({ geometry }: { geometry: WorldMapGeometry }) {
  const locale = useLocale();
  const href = useLocalizedHref();
  const copy = getWorldMapDictionary(locale);
  const [filter, setFilter] = useState<WorldMapFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(geometry.connections[0]?.id ?? null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [focusedCountry, setFocusedCountry] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointerId: number; x: number; y: number; ox: number; oy: number } | null>(null);
  const mapViewport = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(1);

  const matchingConnections = useMemo(() => geometry.connections.filter((connection) => matchesWorldMapFilter(connection, filter)), [filter, geometry.connections]);
  const progress = useMemo(() => calculateWorldMapProgress(matchingConnections), [matchingConnections]);
  const countryProgress = useMemo(() => aggregateWorldMapCountries(geometry.connections, filter), [filter, geometry.connections]);
  const zoomLevel = getWorldMapZoomLevel(zoom);
  const selected = geometry.connections.find(({ id }) => id === selectedId && matchingConnections.some((entry) => entry.id === id)) ?? matchingConnections[0] ?? null;
  const selectedPeers = selected ? geometry.connections.filter(({ currentLocation }) => currentLocation.id === selected.currentLocation.id) : [];

  const locationGroups = useMemo(() => {
    const groups = new Map<string, ProjectedWorldMapConnection[]>();
    for (const connection of geometry.connections) {
      groups.set(connection.currentLocation.id, [...(groups.get(connection.currentLocation.id) ?? []), connection]);
    }
    return [...groups.values()];
  }, [geometry.connections]);

  const setMapZoom = useCallback((next: number) => {
    const bounded = Math.max(1, Math.min(4.6, next));
    zoomRef.current = bounded;
    setZoom(bounded);
    if (bounded === 1) {
      setOffset({ x: 0, y: 0 });
      setOrigin({ x: 50, y: 50 });
      setFocusedCountry(null);
    }
  }, []);

  useEffect(() => {
    const viewport = mapViewport.current;
    if (!viewport) return;
    return bindWorldMapWheelZoom(viewport, ({ delta, origin: nextOrigin }) => {
      setOrigin(nextOrigin);
      setMapZoom(zoomRef.current + delta);
    });
  }, [setMapZoom]);

  const focusCountry = (countryId: string, point: { x: number; y: number }) => {
    setFocusedCountry(countryId);
    setOrigin({ x: (point.x / geometry.width) * 100, y: (point.y / geometry.height) * 100 });
    setOffset({ x: 0, y: 0 });
    setMapZoom(2.25);
  };

  const progressStats = [
    [progress.uniqueRelationships, copy.progress.relationships],
    [progress.uniqueEntities, copy.progress.people],
    [progress.discoveredCities, copy.progress.cities],
    [progress.discoveredCountries, copy.progress.countries],
    [progress.continentsWithPresence, copy.progress.continents],
    [progress.categoryCount, copy.progress.diversity],
  ] as const;

  const semanticTrail = [
    copy.semantic.world,
    ...(zoomLevel !== "world" ? [copy.semantic.country] : []),
    ...(zoomLevel === "city" ? [copy.semantic.city] : []),
  ].join(" → ");

  return (
    <div className="section-lines relative overflow-hidden px-4 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[62rem] bg-[radial-gradient(circle_at_72%_12%,rgba(53,208,229,0.15),transparent_34rem),radial-gradient(circle_at_12%_38%,rgba(255,122,0,0.09),transparent_25rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label={copy.breadcrumb} className="font-mono text-xs text-slate-400"><ol className="flex items-center gap-2"><li><Link href={href("/")} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="text-[#35d0e5]">{copy.breadcrumb}</li></ol></nav>

        <header className="grid min-w-0 grid-cols-1 gap-10 border-b border-white/15 py-14 lg:grid-cols-[1.08fr_0.72fr] lg:items-end lg:py-20">
          <div><p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-[#35d0e5]">{copy.eyebrow}</p><h1 className="mt-6 max-w-5xl text-[clamp(3rem,8vw,7.8rem)] font-black leading-[0.86] tracking-[-0.065em] text-white">{copy.title}</h1></div>
          <div className="border-l-2 border-[#ff7a00] pl-6 sm:pl-8"><p className="text-xl font-black leading-8 text-white sm:text-2xl">{copy.subtitle}</p><p className="mt-5 leading-7 text-slate-400">{copy.introduction}</p><p className="mt-6 text-sm leading-6 text-slate-500">{copy.privacyNote}</p></div>
        </header>

        <section aria-labelledby="map-title" className="py-14 sm:py-20">
          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.58fr)] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-col gap-6 border-b border-white/10 pb-7 xl:flex-row xl:items-end xl:justify-between">
                <div><p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#ff9a3d]">01 / Map</p><h2 id="map-title" className="mt-3 text-3xl font-black text-white sm:text-5xl">{copy.mapTitle}</h2><p id="map-instructions" className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{copy.mapInstructions}</p><p role="status" className="mt-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#35d0e5]">{copy.semantic.view}: {semanticTrail}</p></div>
                <div className="flex gap-2" aria-label={copy.mapTitle}>
                  <button type="button" onClick={() => setMapZoom(zoom + 0.5)} disabled={zoom >= 4.6} aria-label={copy.zoomIn} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 text-xl font-black text-white hover:border-[#35d0e5] focus-visible:outline-2 focus-visible:outline-[#35d0e5] disabled:opacity-30">+</button>
                  <button type="button" onClick={() => setMapZoom(zoom - 0.5)} disabled={zoom <= 1} aria-label={copy.zoomOut} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 text-xl font-black text-white hover:border-[#35d0e5] focus-visible:outline-2 focus-visible:outline-[#35d0e5] disabled:opacity-30">−</button>
                  <button type="button" onClick={() => setMapZoom(1)} className="min-h-11 rounded-full border border-white/15 px-4 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-slate-300 hover:border-[#35d0e5] focus-visible:outline-2 focus-visible:outline-[#35d0e5]">{copy.resetMap}</button>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-[#031019] p-3 sm:p-5">
                <div
                  ref={mapViewport}
                  role="group"
                  tabIndex={0}
                  aria-label={copy.mapAria}
                  aria-describedby="map-instructions"
                  className={`relative aspect-[1000/510] min-h-[15rem] w-full overflow-hidden rounded-[1rem] border border-white/10 bg-[radial-gradient(circle_at_50%_45%,rgba(53,208,229,0.07),transparent_60%)] cursor-grab focus-visible:outline-2 focus-visible:outline-[#35d0e5] active:cursor-grabbing ${zoom > 1 ? "touch-none" : "touch-pan-y"}`}
                  onKeyDown={(event) => {
                    const step = 28;
                    if (event.key === "+" || event.key === "=") setMapZoom(zoom + 0.5);
                    else if (event.key === "-") setMapZoom(zoom - 0.5);
                    else if (event.key === "ArrowLeft") setOffset((value) => ({ ...value, x: value.x + step }));
                    else if (event.key === "ArrowRight") setOffset((value) => ({ ...value, x: value.x - step }));
                    else if (event.key === "ArrowUp") setOffset((value) => ({ ...value, y: value.y + step }));
                    else if (event.key === "ArrowDown") setOffset((value) => ({ ...value, y: value.y - step }));
                    else return;
                    event.preventDefault();
                  }}
                  onPointerDown={(event) => {
                    if (zoom <= 1 || (event.target as HTMLElement).closest("button")) return;
                    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
                    setDragging(true);
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
                    const limit = 230 * zoom;
                    setOffset({ x: Math.max(-limit, Math.min(limit, drag.current.ox + event.clientX - drag.current.x)), y: Math.max(-limit * 0.55, Math.min(limit * 0.55, drag.current.oy + event.clientY - drag.current.y)) });
                  }}
                  onPointerUp={(event) => { if (drag.current?.pointerId === event.pointerId) drag.current = null; setDragging(false); }}
                  onPointerCancel={() => { drag.current = null; setDragging(false); }}
                >
                  <div className="absolute inset-0 motion-reduce:transition-none" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%`, transition: dragging ? "none" : "transform 220ms ease" }}>
                    <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label={copy.mapAria} className="absolute inset-0 h-full w-full">
                      <path d={geometry.spherePath} fill="#061923" stroke="rgba(148,163,184,.16)" strokeWidth="1" />
                      <path d={geometry.landPath} fill="#0c2a35" stroke="rgba(53,208,229,.16)" strokeWidth="1" />
                      {geometry.countries.map((country) => {
                        const summary = countryProgress.find(({ id }) => id === country.id);
                        return <path key={country.id} d={country.path} fill={stageFill(summary?.stage)} stroke={summary ? "rgba(142,234,245,.9)" : "rgba(148,163,184,.18)"} strokeWidth={summary ? 1.8 : 0.8} vectorEffect="non-scaling-stroke" className="transition-colors motion-reduce:transition-none" />;
                      })}
                      <path d={geometry.borderPath} fill="none" stroke="rgba(148,163,184,.18)" strokeWidth=".65" vectorEffect="non-scaling-stroke" />
                    </svg>

                    {zoomLevel === "world" ? geometry.countries.map((country) => {
                      const summary = countryProgress.find(({ id }) => id === country.id);
                      if (!summary) return null;
                      const continent = geometry.connections.find(({ currentLocation }) => currentLocation.countryId === country.id)?.currentLocation.continentId;
                      return (
                        <button key={country.id} type="button" onClick={(event) => { event.stopPropagation(); focusCountry(country.id, country.point); }} aria-label={`${copy.locations.countries[country.id]}: ${summary.entityCount} ${copy.semantic.aggregate}; ${stageLabel(summary.stage, copy)}`} className="absolute z-10 min-h-11 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#8eeaf5]/70 bg-[#04141f]/95 px-3 py-2 text-left shadow-[0_0_28px_rgba(53,208,229,.38)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" style={{ left: `${(country.point.x / geometry.width) * 100}%`, top: `${(country.point.y / geometry.height) * 100}%` }}>
                          <span className="block font-mono text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">{continent ? copy.locations.continents[continent] : copy.semantic.world} · {stageLabel(summary.stage, copy)}</span>
                          <span className="mt-1 block whitespace-nowrap font-mono text-[10px] font-black uppercase tracking-[0.1em] text-white">{copy.locations.countries[country.id]} <strong className="text-[#35d0e5]">{summary.entityCount}</strong></span>
                        </button>
                      );
                    }) : null}

                    {zoomLevel === "country" ? locationGroups.map((group) => {
                      const point = group[0].point;
                      const matching = group.filter((connection) => matchesWorldMapFilter(connection, filter));
                      if (matching.length === 0 || (focusedCountry && group[0].currentLocation.countryId !== focusedCountry)) return null;
                      const label = locationLabel(group[0].currentLocation, copy);
                      const shortLabel = placeLabel(group[0].currentLocation, copy);
                      const callout = placeCalloutOffset[group[0].currentLocation.id] ?? { x: 0, y: 0 };
                      return (
                        <div key={group[0].currentLocation.id}>
                          <span aria-hidden="true" className="absolute h-2.5 w-2.5 rounded-full border border-white bg-[#35d0e5] shadow-[0_0_18px_rgba(53,208,229,.9)]" style={{ left: `${(point.x / geometry.width) * 100}%`, top: `${(point.y / geometry.height) * 100}%`, transform: `scale(${1 / zoom}) translate(-50%, -50%)` }} />
                          <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(matching[0].id); setOrigin({ x: (point.x / geometry.width) * 100, y: (point.y / geometry.height) * 100 }); setMapZoom(3.4); }} aria-label={`${label}; ${matching.length} ${copy.entriesAtLocation}`} className="absolute z-10 min-h-11 whitespace-nowrap rounded-full border border-[#35d0e5] bg-[#061923]/95 px-3 py-2 font-mono text-[9px] font-black uppercase tracking-[0.08em] text-white shadow-[0_0_24px_rgba(53,208,229,.42)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" style={{ left: `calc(${(point.x / geometry.width) * 100}% + ${callout.x / zoom}px)`, top: `calc(${(point.y / geometry.height) * 100}% + ${callout.y / zoom}px)`, transform: `scale(${1 / zoom}) translate(-50%, -50%)` }}>
                            {shortLabel} <span className="text-[#35d0e5]">{matching.length}</span>
                          </button>
                        </div>
                      );
                    }) : null}

                    {zoomLevel === "city" ? locationGroups.flatMap((group) => {
                      if (selected && group[0].currentLocation.id !== selected.currentLocation.id) return [];
                      const matching = group.filter((connection) => matchesWorldMapFilter(connection, filter));
                      return matching.map((connection, index) => {
                        const kinds = relationshipKinds(connection);
                        const primary = kinds[0];
                        const angle = (index / Math.max(matching.length, 1)) * Math.PI * 2;
                        const spread = matching.length > 1 ? 18 : 0;
                        return (
                          <button key={connection.id} type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(connection.id); }} aria-label={`${copy.pinFor} ${connection.entity.name}, ${locationLabel(connection.currentLocation, copy)}; ${kinds.map((kind) => copy.categories[kind].label).join(", ")}`} className={`absolute z-10 grid h-11 w-11 place-items-center border-2 font-mono text-[9px] font-black shadow-[0_0_0_4px_rgba(3,16,25,.72),0_0_24px_rgba(53,208,229,.42)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${categoryTone[primary]} ${primary === "interviewed" ? "rounded-full" : primary === "partner" ? "rotate-45 rounded-[0.3rem]" : primary === "team-up" ? "[clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]" : primary === "advertising-partner" ? "rounded-full" : "rounded-[0.1rem]"}`} style={{ left: `calc(${(connection.point.x / geometry.width) * 100}% + ${Math.cos(angle) * spread}px)`, top: `calc(${(connection.point.y / geometry.height) * 100}% + ${Math.sin(angle) * spread}px)`, transform: `scale(${1 / zoom}) translate(-50%, -50%)` }}>
                            <span className={primary === "partner" ? "-rotate-45" : ""}>{categoryGlyph[primary]}</span>
                          </button>
                        );
                      });
                    }) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label={copy.filtersTitle}>
                  {relationshipFilters.map((kind) => <div key={kind} className="flex gap-3 rounded-xl border border-white/10 p-3"><FilterIcon kind={kind} /><div><p className="text-xs font-black text-white">{copy.categories[kind].label}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{copy.categories[kind].description}</p></div></div>)}
                </div>
              </div>

              <section aria-labelledby="filter-title" className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                  <div><h3 id="filter-title" className="text-xl font-black text-white">{copy.filtersTitle}</h3><p className="mt-2 text-sm text-slate-400">{copy.filtersDescription}</p><div className="mt-4 flex flex-wrap gap-2">{quickFilters.map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-black text-slate-200 hover:border-[#35d0e5] focus-visible:outline-2 focus-visible:outline-[#35d0e5] aria-pressed:border-[#35d0e5] aria-pressed:bg-[#35d0e5] aria-pressed:text-[#041018]">{item === "all" ? null : <FilterIcon kind={item} />}{item === "all" ? copy.all : copy.categories[item].label}</button>)}</div></div>
                  <label className="grid gap-2 font-mono text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{copy.categorySelect}<select value={filter} onChange={(event) => setFilter(event.target.value as WorldMapFilter)} className="min-h-12 min-w-56 rounded-xl border border-white/15 bg-[#071824] px-4 text-sm font-bold normal-case tracking-normal text-white focus-visible:outline-2 focus-visible:outline-[#35d0e5]"><option value="all">{copy.all}</option>{relationshipFilters.map((kind) => <option key={kind} value={kind}>{copy.categories[kind].label}</option>)}</select></label>
                </div>
                <p role="status" className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{matchingConnections.length} / {geometry.connections.length} {copy.progress.relationships}</p>
              </section>
            </div>

            <div className="lg:sticky lg:top-24"><ContextCard connection={selected} peers={selectedPeers} onSelect={setSelectedId} /></div>
          </div>
        </section>

        <section aria-labelledby="progress-title" className="border-y border-white/15 py-16 sm:py-20">
          <div className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#ff9a3d]">{copy.progress.eyebrow}</p><h2 id="progress-title" className="mt-5 text-4xl font-black leading-none text-white sm:text-6xl">{copy.progress.title}</h2><p className="mt-6 leading-7 text-slate-400">{copy.progress.description}</p><p className="mt-5 border-l-2 border-[#35d0e5] pl-4 text-sm leading-6 text-slate-300">{copy.progress.legend}</p></div>
            <div><dl className="grid grid-cols-2 border-l border-t border-white/10 sm:grid-cols-3">{progressStats.map(([value, label]) => <div key={label} className="min-h-36 border-b border-r border-white/10 p-5 sm:p-6"><dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</dt><dd className="mt-6 text-4xl font-black text-white">{value}</dd></div>)}</dl><p className="mt-5 text-sm leading-6 text-slate-500">{copy.progress.sparse}</p></div>
          </div>
        </section>

        <section aria-labelledby="map-list-title" className="py-16 sm:py-20">
          <div className="grid min-w-0 grid-cols-1 gap-9 lg:grid-cols-[0.42fr_1fr]">
            <div><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#35d0e5]">02 / Text view</p><h2 id="map-list-title" className="mt-5 text-4xl font-black text-white sm:text-5xl">{copy.list.title}</h2><p className="mt-5 leading-7 text-slate-400">{copy.list.description}</p></div>
            <div>
              {matchingConnections.length === 0 ? <p role="status" className="mb-5 rounded-xl border border-[#ff9a3d]/30 bg-[#ff9a3d]/[0.04] p-5 text-sm font-bold text-slate-200">{copy.list.empty}</p> : null}
              <ul className="border-t border-white/15">{geometry.connections.map((connection) => { const active = matchesWorldMapFilter(connection, filter); const kinds = relationshipKinds(connection); return <li key={connection.id} className={`grid gap-4 border-b border-white/10 py-5 transition sm:grid-cols-[1fr_auto] sm:items-center motion-reduce:transition-none ${active ? "opacity-100" : "opacity-30"}`}><div><p className="text-xl font-black text-white">{connection.entity.name}</p><p className="mt-1 text-sm text-slate-400">{locationLabel(connection.currentLocation, copy)}</p>{connection.origin ? <p className="mt-1 text-xs text-slate-500">{copy.context.origin}: {locationLabel(connection.origin, copy)}</p> : null}<div className="mt-3 flex flex-wrap gap-2">{kinds.map((kind) => <span key={kind} className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.12em] ${categoryOutline[kind]}`}><FilterIcon kind={kind} />{copy.categories[kind].short}</span>)}</div></div><button type="button" disabled={!active} onClick={() => { setSelectedId(connection.id); document.getElementById("context-card-title")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="min-h-11 rounded-full border border-white/15 px-5 text-sm font-black text-white hover:border-[#35d0e5] focus-visible:outline-2 focus-visible:outline-[#35d0e5] disabled:cursor-not-allowed">{active ? copy.list.open : copy.list.receded}</button></li>; })}</ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="map-cta-title" className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_82%_20%,rgba(53,208,229,0.15),transparent_24rem),#071824] p-7 sm:p-12 lg:p-16">
          <div className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-end">
            <div><p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.cta.eyebrow}</p><h2 id="map-cta-title" className="mt-5 max-w-4xl text-4xl font-black leading-none text-white sm:text-6xl">{copy.cta.title}</h2><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{copy.cta.description}</p><p className="mt-5 max-w-3xl text-sm leading-6 text-slate-500">{copy.cta.boundary}</p></div>
            <div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">{copy.cta.pathwaysLabel}</p><div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">{[copy.cta.interview, copy.cta.collaborate, copy.cta.build, copy.cta.partner].map((label) => <Link key={label} href={href("/#contact")} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-white/10 px-4 text-sm font-black text-slate-200 hover:border-[#35d0e5] focus-visible:outline-2 focus-visible:outline-[#35d0e5]"><span>{label}</span><span aria-hidden="true" className="text-[#35d0e5]">→</span></Link>)}<Link href={href("/#contact")} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[#ff9a3d]/50 bg-[#ff9a3d]/[0.05] px-4 text-sm font-black text-white hover:border-[#ff9a3d] focus-visible:outline-2 focus-visible:outline-[#ff9a3d] min-[420px]:col-span-2"><span><strong>{copy.cta.somethingElse}</strong><small className="mt-1 block font-normal leading-5 text-slate-400">{copy.cta.somethingElseHint}</small></span><span aria-hidden="true" className="text-[#ff9a3d]">→</span></Link></div><Link href={href("/#contact")} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] hover:bg-[#73e3f1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]">{copy.cta.action} →</Link></div>
          </div>
        </section>
      </div>
    </div>
  );
}
