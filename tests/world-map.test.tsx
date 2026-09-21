import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";

import { LocaleProvider } from "../components/i18n/locale-context";
import { ContextCard, WorldMapExperience } from "../components/world-map/world-map-experience";
import { getLocalizedPublishedSpotlights } from "../data/i18n/people";
import { getWorldMapDictionary, worldMapDictionaries } from "../data/i18n/world-map";
import {
  createWorldMapConnections,
  mapSpotlightRelationshipToWorldMapCategory,
  worldMapPublicLocationAdapters,
} from "../data/world-map";
import { locales } from "../lib/i18n/config";
import {
  aggregateWorldMapCountries,
  bindWorldMapWheelZoom,
  calculateWorldMapProgress,
  centerWorldMapPoint,
  clampWorldMapOffset,
  clampWorldMapZoom,
  filterWorldMapConnections,
  getWorldMapZoomLevel,
  groupWorldMapConnectionsByLocation,
  isSafeWorldMapHref,
  relationshipKinds,
  resolveWorldMapStage,
  validateWorldMapConnection,
  WORLD_MAP_MAX_ZOOM,
  zoomWorldMapAt,
} from "../lib/world-map";
import { publishedSpotlights } from "../data/spotlights";
import type {
  WorldMapConnection,
  WorldMapGeometry,
  WorldMapRelationshipKind,
} from "../types/world-map";

const here = dirname(fileURLToPath(import.meta.url));
const source = (path: string) => readFileSync(resolve(here, path), "utf8");

function fakeGeometry(connections: readonly WorldMapConnection[]): WorldMapGeometry {
  return {
    width: 1000,
    height: 510,
    spherePath: "M10,10H990V500H10Z",
    landPath: "M100,120L450,80L760,180L650,390L180,370Z",
    borderPath: "M450,80V390",
    countries: [
      { id: "DE", path: "M480,120L520,120L520,170L480,170Z", point: { x: 500, y: 145 } },
      { id: "EG", path: "M540,230L575,230L575,270L540,270Z", point: { x: 558, y: 250 } },
    ],
    connections: connections.map((connection, index) => ({
      ...connection,
      point: connection.currentLocation.countryId === "DE"
        ? { x: 490 + index * 8, y: 135 + index * 7 }
        : { x: 558, y: 250 },
    })),
  };
}

function withRelationships(base: WorldMapConnection, id: string, kinds: readonly WorldMapRelationshipKind[]): WorldMapConnection {
  return {
    ...base,
    id,
    entity: { ...base.entity, id: id + "-entity", name: id },
    relationships: kinds.map((kind) => ({
      id: id + ":" + kind,
      kind,
      source: "test fixture",
      published: true,
      paid: kind === "advertising-partner",
    })),
  };
}

test("MAP-01–MAP-04 and MAP-CORR-01 preserve thin People truth while separating current context from origin", () => {
  const connections = createWorldMapConnections(publishedSpotlights);
  assert.equal(connections.length, 6);
  assert.deepEqual(connections.map(({ entity }) => entity.id), [
    "person-evgeny-vinokurov",
    "person-kiki-radicke",
    "person-johanna-geisler",
    "person-kevin-schweisfurth",
    "person-amr-medhat",
    "person-melanie-kleinhenz",
  ]);
  for (const connection of connections) {
    assert.equal(connection.currentLocation.role, "current");
    assert.equal(connection.entity.publicationState, "published");
    assert.match(connection.entity.contentLocale, /^(?:de|en)$/u);
    assert.deepEqual(relationshipKinds(connection), ["interviewed"]);
    assert.match(connection.entity.sourceHref, /^\/people\//u);
  }
  assert.equal(Object.hasOwn(worldMapPublicLocationAdapters, "person-kevin-schweisfurth"), true);
});

test("MAP-CORR-01: Evgeny is Bremen current context and Siberia origin; origin never counts as progression", () => {
  const connections = createWorldMapConnections(publishedSpotlights);
  const evgeny = connections.find(({ entity }) => entity.id === "person-evgeny-vinokurov");
  assert.ok(evgeny);
  assert.equal(evgeny.currentLocation.cityId, "bremen");
  assert.equal(evgeny.currentLocation.countryId, "DE");
  assert.equal(evgeny.origin?.regionId, "siberia");
  assert.equal(evgeny.origin?.countryId, "RU");
  const progress = calculateWorldMapProgress([evgeny]);
  assert.deepEqual(progress.countries.map(({ id }) => id), ["DE"]);
  assert.deepEqual(progress.continents.map(({ id }) => id), ["EU"]);
});

test("MAP-03 source gates: Amr stays country-level while accepted public and professional contexts retain exact semantics", () => {
  const byId = new Map(createWorldMapConnections(publishedSpotlights).map((entry) => [entry.entity.id, entry]));
  assert.equal(byId.get("person-amr-medhat")?.currentLocation.id, "country-eg");
  assert.equal(byId.get("person-amr-medhat")?.currentLocation.cityId, undefined);
  assert.equal(byId.get("person-johanna-geisler")?.currentLocation.cityId, "hamburg");
  assert.equal(byId.get("person-kiki-radicke")?.currentLocation.regionId, "frankfurt-rhine-main");
  assert.equal(byId.get("person-kiki-radicke")?.currentLocation.context, "public-professional-context");
  assert.equal(byId.get("person-kiki-radicke")?.currentLocation.provenance, "first-party-organization");
  assert.match(byId.get("person-kiki-radicke")?.currentLocation.publicSource ?? "", /adacor\.com/u);
  assert.equal(byId.get("person-melanie-kleinhenz")?.currentLocation.regionId, "wuerzburg-region");
  assert.equal(byId.get("person-melanie-kleinhenz")?.currentLocation.context, "public-professional-context");
  const kevin = byId.get("person-kevin-schweisfurth");
  assert.ok(kevin);
  assert.equal(kevin.currentLocation.id, "city-blieskastel-de");
  assert.equal(kevin.currentLocation.cityId, "blieskastel");
  assert.equal(kevin.currentLocation.countryId, "DE");
  assert.equal(kevin.currentLocation.continentId, "EU");
  assert.equal(kevin.currentLocation.context, "business-context");
  assert.equal(kevin.currentLocation.provenance, "owner-confirmed");
  assert.deepEqual(relationshipKinds(kevin), ["interviewed"]);
  assert.match(kevin.currentLocation.publicSource, /business context/u);
  assert.doesNotMatch(kevin.currentLocation.publicSource, /street address:\s|residence:\s|home:\s/u);
  assert.deepEqual(filterWorldMapConnections([kevin], "interviewed").map(({ entity }) => entity.id), ["person-kevin-schweisfurth"]);
  for (const unsupported of ["team-up", "partner", "investor", "advertising-partner"] as const) {
    assert.deepEqual(filterWorldMapConnections([kevin], unsupported), [], unsupported);
  }
  assert.deepEqual(groupWorldMapConnectionsByLocation([kevin]).map(({ locationId }) => locationId), ["city-blieskastel-de"]);
});

test("MAP-CORR-02/03 and MAP-05–MAP-08 support strict, independent and multi-category relationship kinds", () => {
  const base = createWorldMapConnections(publishedSpotlights)[0];
  const multi = withRelationships(base, "multi", ["interviewed", "team-up", "partner", "investor", "advertising-partner", "other"]);
  assert.deepEqual(relationshipKinds(multi), ["interviewed", "team-up", "partner", "investor", "advertising-partner", "other"]);
  for (const kind of relationshipKinds(multi)) {
    assert.deepEqual(filterWorldMapConnections([multi], kind).map(({ id }) => id), ["multi"]);
  }
  assert.equal(multi.relationships.find(({ kind }) => kind === "investor")?.paid, false);
  assert.equal(multi.relationships.find(({ kind }) => kind === "advertising-partner")?.paid, true);
  assert.equal(mapSpotlightRelationshipToWorldMapCategory("worked-with"), "team-up");
  assert.equal(mapSpotlightRelationshipToWorldMapCategory("recommended"), null);
  assert.equal(mapSpotlightRelationshipToWorldMapCategory("other"), "other");
});

test("B8 validates publication state, coordinates and public-only safe links", () => {
  const base = createWorldMapConnections(publishedSpotlights)[0];
  assert.deepEqual(validateWorldMapConnection(base), []);
  assert.equal(isSafeWorldMapHref("/people/example", false), true);
  assert.equal(isSafeWorldMapHref("//tracker.example/person", false), false);
  assert.equal(isSafeWorldMapHref("https://example.com/profile", true), true);
  assert.equal(isSafeWorldMapHref("http://example.com/profile", true), false);
  assert.equal(isSafeWorldMapHref("javascript:alert(1)", true), false);

  const unsafe: WorldMapConnection = {
    ...base,
    contentLinks: [{ id: "unsafe", kind: "video", label: "Unsafe", href: "javascript:alert(1)", external: true }],
    publicContacts: [{ id: "private", label: "Private", href: "mailto:private@example.com" }],
  };
  assert.deepEqual(validateWorldMapConnection(unsafe), [
    "content link is unsafe: unsafe",
    "public contact link is unsafe: private",
  ]);
});

test("MAP-09/MAP-10 and MAP-CORR-04 retain semantic zoom while pins stay primary", () => {
  assert.equal(getWorldMapZoomLevel(1), "world");
  assert.equal(getWorldMapZoomLevel(1.59), "world");
  assert.equal(getWorldMapZoomLevel(1.6), "country");
  assert.equal(getWorldMapZoomLevel(2.99), "country");
  assert.equal(getWorldMapZoomLevel(3), "city");
  const component = source("../components/world-map/world-map-experience.tsx");
  assert.match(component, /bindWorldMapWheelZoom/u);
  assert.match(component, /onPointerMove=/u);
  assert.match(component, /ArrowLeft/u);
  assert.match(component, /world-map-pin-cluster/u);
  assert.match(component, /data-map-transform/u);
  assert.doesNotMatch(component, /focusCountry/u);
});

test("FOLLOW-UP map math keeps zoom bounded, pointer-centred and panning inside the canvas", () => {
  const viewport = { width: 1000, height: 500 };
  assert.equal(clampWorldMapZoom(0), 1);
  assert.equal(clampWorldMapZoom(99), WORLD_MAP_MAX_ZOOM);
  assert.deepEqual(clampWorldMapOffset({ x: 900, y: -900 }, viewport, 2), { x: 544, y: -280 });
  assert.deepEqual(zoomWorldMapAt({ x: 0, y: 0 }, 1, 2, { x: 25, y: 75 }, viewport), { x: 250, y: -125 });
  assert.deepEqual(centerWorldMapPoint({ x: 250, y: 127.5 }, { width: 1000, height: 510 }, viewport, 2), { x: 500, y: 250 });
});

test("FINAL FIX 2: a non-passive listener gives active-map wheel input exclusive, pointer-centred zoom ownership", () => {
  let wheelListener: ((event: WheelEvent) => void) | undefined;
  let listenerOptions: AddEventListenerOptions | boolean | undefined;
  let removed = false;
  const target = {
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) => {
      assert.equal(type, "wheel");
      wheelListener = listener as (event: WheelEvent) => void;
      listenerOptions = options;
    },
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      assert.equal(type, "wheel");
      assert.equal(listener, wheelListener);
      removed = true;
    },
    getBoundingClientRect: () => ({ left: 100, top: 200, width: 400, height: 200 }),
  } as unknown as HTMLElement;
  const received: Array<{ delta: number; origin: { x: number; y: number } }> = [];
  const unbind = bindWorldMapWheelZoom(target, (input) => { received.push(input); });

  assert.deepEqual(listenerOptions, { passive: false });
  assert.equal(received.length, 0, "outside-map wheel input has no path into the map-scoped listener");
  let prevented = false;
  wheelListener?.({
    deltaY: -24,
    clientX: 300,
    clientY: 250,
    preventDefault: () => { prevented = true; },
  } as WheelEvent);
  assert.equal(prevented, true);
  assert.deepEqual(received[0], { delta: 0.35, origin: { x: 50, y: 25 } });

  wheelListener?.({ deltaY: 18, clientX: 500, clientY: 400, preventDefault: () => undefined } as WheelEvent);
  assert.deepEqual(received[1], { delta: -0.35, origin: { x: 100, y: 100 } });
  unbind();
  assert.equal(removed, true);

  let passivePrevented = false;
  const passiveTarget = {
    ...target,
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      wheelListener = listener as (event: WheelEvent) => void;
    },
  } as unknown as HTMLElement;
  bindWorldMapWheelZoom(passiveTarget, () => false);
  wheelListener?.({
    deltaY: 12,
    clientX: 300,
    clientY: 250,
    preventDefault: () => { passivePrevented = true; },
  } as WheelEvent);
  assert.equal(passivePrevented, false, "a passive mobile map boundary leaves page scrolling untouched");

  const component = source("../components/world-map/world-map-experience.tsx");
  assert.doesNotMatch(component, /window\.addEventListener\(["']wheel/u);
  assert.match(component, /ArrowLeft/u);
  assert.match(component, /zoomIn/u);
  assert.match(component, /resetMap/u);
});

test("MAP-CORR-05 country aggregation is filter-aware, deduplicated and based only on current context", () => {
  const real = createWorldMapConnections(publishedSpotlights);
  const base = real[0];
  const teamUp = withRelationships({ ...base, currentLocation: real[1].currentLocation }, "team-up-fixture", ["team-up"]);
  const all = aggregateWorldMapCountries([...real, real[0], teamUp], "all");
  const interviews = aggregateWorldMapCountries([...real, real[0], teamUp], "interviewed");
  const teamUps = aggregateWorldMapCountries([...real, real[0], teamUp], "team-up");
  assert.equal(all.find(({ id }) => id === "DE")?.entityCount, 6);
  assert.equal(interviews.find(({ id }) => id === "DE")?.entityCount, 5);
  assert.equal(teamUps.find(({ id }) => id === "DE")?.entityCount, 1);
  assert.equal(all.some(({ id }) => id === "RU"), false);
});

test("MAP-CORR-06 and MAP-15–MAP-19 make Discovery, Presence and Growth spatially meaningful without paid weighting", () => {
  const real = createWorldMapConnections(publishedSpotlights);
  const progress = calculateWorldMapProgress([...real, real[0]]);
  assert.equal(progress.uniqueEntities, 6);
  assert.equal(progress.uniqueRelationships, 6);
  assert.equal(progress.discoveredCountries, 2);
  assert.equal(progress.discoveredCities, 5);
  assert.equal(progress.continentsWithPresence, 2);
  assert.equal(progress.countries.find(({ id }) => id === "DE")?.stage, "growing");
  assert.equal(progress.countries.find(({ id }) => id === "EG")?.stage, "discovered");
  assert.equal(resolveWorldMapStage(1, 1, 1), "discovered");
  assert.equal(resolveWorldMapStage(2, 1, 2), "presence");
  assert.equal(resolveWorldMapStage(3, 1, 3), "growing");

  const base = real[0];
  const investor = withRelationships(base, "investor-neutral", ["investor"]);
  const advertising = withRelationships(base, "advertising-neutral", ["advertising-partner"]);
  const neutralProgress = calculateWorldMapProgress([investor, advertising]);
  assert.equal(neutralProgress.uniqueRelationships, 2);
  assert.equal(neutralProgress.uniqueEntities, 2);
  assert.equal(neutralProgress.categoryCount, 2);
});

test("MAP-CORR-04/05 same-city grouping is stable and exposes every connection in a selected place", () => {
  const base = createWorldMapConnections(publishedSpotlights)[0];
  const peer = withRelationships(base, "bremen-peer", ["team-up"]);
  const groups = groupWorldMapConnectionsByLocation([base, peer]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].locationId, "city-bremen-de");
  assert.deepEqual(groups[0].entries.map(({ id }) => id), [base.id, "bremen-peer"]);
});

test("MAP-11–MAP-14 and MAP-CORR-08 render human Context Cards with current context, origin, provenance and content", () => {
  const connections = createWorldMapConnections(getLocalizedPublishedSpotlights("en"));
  const projected = fakeGeometry(connections).connections;
  const html = renderToStaticMarkup(
    <LocaleProvider locale="en"><ContextCard connection={projected[0]} peers={[projected[0]]} onSelect={() => undefined} /></LocaleProvider>,
  );
  assert.match(html, /Current context/u);
  assert.match(html, /Bremen, Germany/u);
  assert.match(html, /Origin/u);
  assert.match(html, /Siberia, Russia/u);
  assert.match(html, /Connected through/u);
  assert.match(html, /Related story \/ content/u);
  assert.match(html, /Career Spotlight/u);
  assert.doesNotMatch(html, />Public contact</u);
});

test("FINAL FIX 1: Kevin renders as Business context — Blieskastel, Germany without a residence or street-address claim", () => {
  const kevin = createWorldMapConnections(getLocalizedPublishedSpotlights("en"))
    .find(({ entity }) => entity.id === "person-kevin-schweisfurth");
  assert.ok(kevin);
  const projected = fakeGeometry([kevin]).connections[0];
  const html = renderToStaticMarkup(
    <LocaleProvider locale="en"><ContextCard connection={projected} peers={[projected]} onSelect={() => undefined} /></LocaleProvider>,
  );
  assert.match(html, /Business context/u);
  assert.match(html, /Blieskastel, Germany/u);
  assert.match(html, />Interview</u);
  assert.doesNotMatch(html, /Blieskastel[^<]*(?:residence|home|street)/iu);
});

test("MAP-CORR-07/09/10 and MAP-20–MAP-24 render human editorial framing, five paths and a clear boundary", () => {
  const html = renderToStaticMarkup(
    <LocaleProvider locale="en"><WorldMapExperience geometry={fakeGeometry(createWorldMapConnections(getLocalizedPublishedSpotlights("en")))} /></LocaleProvider>,
  );
  assert.match(html, /A world made of encounters/u);
  assert.match(html, /intentionally unfinished/u);
  assert.match(html, /Tell your story/u);
  assert.match(html, /Collaborate/u);
  assert.match(html, /Build together/u);
  assert.match(html, />Partner</u);
  assert.match(html, /Something else\?/u);
  assert.match(html, /does not guarantee inclusion/u);
  assert.match(html, /Paid relationships buy neither visibility nor progress/u);
  assert.doesNotMatch(source("../components/world-map/world-map-experience.tsx"), /fetch\(|axios|POST|mutation/u);
});

test("MAP-25 supplies focused World Map copy for exactly seven locales including all correction concepts", () => {
  assert.deepEqual(Object.keys(worldMapDictionaries), locales);
  for (const locale of locales) {
    const copy = getWorldMapDictionary(locale);
    assert.equal(copy.categories["team-up"].description.length > 20, true, locale);
    assert.equal(copy.categories.investor.description.length > 20, true, locale);
    assert.equal(copy.categories.other.description.length > 20, true, locale);
    assert.equal(copy.locations.countries.DE.length > 3, true, locale);
    assert.equal(copy.locations.cities.hamburg.length > 3, true, locale);
    assert.equal(copy.locations.cities.blieskastel, "Blieskastel", locale);
    assert.equal(copy.context.businessContext.length > 3, true, locale);
    assert.equal(copy.context.current.length > 3, true, locale);
    assert.equal(copy.context.origin.length > 3, true, locale);
    assert.equal(copy.cta.somethingElseHint.length > 20, true, locale);
    assert.equal(copy.activateMap.length > 3, true, locale);
    assert.equal(copy.releaseMap.length > 8, true, locale);
    assert.equal(copy.selectedPin.length > 3, true, locale);
  }
  assert.notEqual(getWorldMapDictionary("es").cta.somethingElse, getWorldMapDictionary("en").cta.somethingElse);
  assert.notEqual(getWorldMapDictionary("el").context.current, getWorldMapDictionary("en").context.current);
  assert.notEqual(getWorldMapDictionary("ru").categories.investor.description, getWorldMapDictionary("en").categories.investor.description);
});

test("MAP-02/MAP-09/MAP-12/MAP-26/MAP-27 render geography, real filters and text equivalent accessibly", () => {
  const connections = createWorldMapConnections(getLocalizedPublishedSpotlights("en"));
  const html = renderToStaticMarkup(
    <LocaleProvider locale="en"><WorldMapExperience geometry={fakeGeometry(connections)} /></LocaleProvider>,
  );
  assert.match(html, /<svg[^>]*role="img"/u);
  assert.match(html, /Current map level/u);
  assert.match(html, /World/u);
  assert.match(html, /Germany/u);
  assert.match(html, /Accessible map list/u);
  assert.match(html, /data-map-selection="empty"/u);
  assert.match(html, /data-map-interaction="passive"/u);
  assert.match(html, /data-map-interaction-toggle/u);
  assert.match(html, /aria-pressed="true"/u);
  assert.doesNotMatch(html, /<select/u, "one real category does not need a duplicate dropdown");
  assert.doesNotMatch(html, /Team-Ups|Investors|Advertising partners|Other connections/u, "empty production categories stay hidden");
  assert.match(source("../components/world-map/world-map-experience.tsx"), /aria-pressed=\{selected\?\.id === connection\.id\}/u);
  assert.match(html, /motion-reduce/u);
});

test("MAP-28–MAP-30 keep local build-side geometry, no vendor/runtime generation and an extensible normalized model", () => {
  const geometry = source("../lib/world-map-geometry.ts");
  const component = source("../components/world-map/world-map-experience.tsx");
  const types = source("../types/world-map.ts");
  assert.match(geometry, /world-atlas\/countries-110m\.json/u);
  assert.match(geometry, /geoNaturalEarth1/u);
  assert.doesNotMatch(component, /google|mapbox|leaflet|remote image service/iu);
  for (const concept of ["WorldMapEntity", "WorldMapLocation", "WorldMapRelationship", "WorldMapContentLink", "WorldMapPublicContact"]) {
    assert.match(types, new RegExp(concept, "u"));
  }
  assert.match(types, /currentLocation/u);
  assert.match(types, /origin\?/u);
});
