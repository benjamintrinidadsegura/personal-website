import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import * as d3 from "d3-geo";
import * as topojson from "topojson-client";
import countries from "world-atlas/countries-110m.json";
import { LocaleProvider } from "../components/i18n/locale-context";
import { ContextCard, WorldMapExperience } from "../components/world-map/world-map-experience";
import { getLocalizedPublishedSpotlights } from "../data/i18n/people";
import { livingWorldCopy } from "../data/i18n/living-world";
import { createWorldMapConnections } from "../data/world-map";
import { locales } from "../lib/i18n/config";
import { localizeHref } from "../lib/i18n/routing";
import { matchesWorldMapFilters } from "../lib/world-map";
import { summarizeEchoCountries } from "../lib/echowall/countries";
import type { WorldMapConnection, WorldMapGeometry, WorldMapRelationshipKind } from "../types/world-map";
import { loadSource } from "./helpers/load-source";

const { createWorldMapGeometry } = loadSource<{ createWorldMapGeometry: (connections: readonly WorldMapConnection[]) => WorldMapGeometry }>("lib/world-map-geometry.ts", {
  "server-only": {}, "d3-geo": d3, "topojson-client": topojson, "world-atlas/countries-110m.json": countries,
});

const source = (path: string) => readFileSync(path, "utf8");

test("combined relationship categories are a union, deduplicate connections and never change relevance", () => {
  const real = createWorldMapConnections(getLocalizedPublishedSpotlights("en"))[0];
  assert.ok(real);
  // Synthetic categories stay in this fixture, never in the production relationship adapter.
  const fixture = { ...real, relationships: ["interviewed", "partner"].map((kind) => ({
    id: `synthetic:${kind}`, kind: kind as WorldMapRelationshipKind, source: "isolated test", published: true as const, paid: false,
  })) };
  assert.equal(matchesWorldMapFilters(fixture, []), true);
  assert.equal(matchesWorldMapFilters(fixture, ["team-up"]), false);
  assert.equal(matchesWorldMapFilters(fixture, ["team-up", "partner"]), true);
  assert.equal([fixture].filter((entry) => matchesWorldMapFilters(entry, ["partner", "interviewed"])).length, 1);
  const html = renderToStaticMarkup(<LocaleProvider locale="en"><WorldMapExperience geometry={createWorldMapGeometry([fixture])} /></LocaleProvider>);
  assert.match(html, /<select[^>]*aria-describedby="map-filter-help"/u);
  assert.match(html, /Combine categories/u);
  assert.match(html, /value="partner"/u);
});

for (const locale of locales) {
  test(`map content, close control and canonical story links remain available in ${locale}`, () => {
    const connections = createWorldMapConnections(getLocalizedPublishedSpotlights(locale));
    assert.equal(connections.length, 5);
    assert.equal(connections.some(({ entity }) => entity.id === "person-amr-medhat"), false);
    const geometry = createWorldMapGeometry(connections);
    const html = renderToStaticMarkup(<LocaleProvider locale={locale}><WorldMapExperience geometry={geometry} /></LocaleProvider>);
    assert.match(html, /href="#map-list-title"/u);
    for (const connection of connections) assert.ok(html.includes(`href="${localizeHref(connection.entity.sourceHref, locale)}"`));
    const context = renderToStaticMarkup(<LocaleProvider locale={locale}><ContextCard compact connection={geometry.connections[0]} peers={[]} onSelect={() => {}} onClose={() => {}} /></LocaleProvider>);
    assert.ok(context.indexOf("world-map-context-header") < context.indexOf("aria-label="));
    assert.ok(context.indexOf("</button>") < context.indexOf("world-map-context-body"), "close is outside the scrolling content");
    assert.match(context, /id="context-card-title" tabindex="-1"/u);
    assert.match(context, /<img/u);
    for (const value of Object.values(livingWorldCopy[locale])) assert.ok(value.trim());
    assert.ok(source("app/echowall/page.tsx").includes('localizeHref("/world", locale)'));
  });
}

test("country counts deduplicate contribution IDs and disappear after moderation/deletion removes eligibility", () => {
  const rows = ["1", "2", "3"].map((id) => ({ id, displayName: "Synthetic", message: "Synthetic contribution", category: null,
    publishedAt: "2026-11-16T00:00:00Z", countryCode: "DE", includeInCommunityMap: true }));
  assert.deepEqual(summarizeEchoCountries([...rows, rows[0]]), [{ countryCode: "DE", contributions: 3 }]);
  assert.deepEqual(summarizeEchoCountries(rows.slice(1)), []);
  assert.deepEqual(summarizeEchoCountries(rows.map((row) => ({ ...row, includeInCommunityMap: false }))), []);
});

test("country capability defaults off, optional sources stay separate, and scoped styling cannot recolor the homepage", () => {
  assert.match(source(".env.example"), /ECHOWALL_COUNTRY_CONTEXT_ENABLED=false/u);
  assert.match(source("lib/echowall/country-configuration.ts"), /import "server-only"/u);
  const layers = source("components/world-map/world-map-layers.tsx");
  assert.match(layers, /isEchoCountryContextEnabled\(\) \? await getApprovedEchoes/u);
  assert.match(layers, /\/echowall#leave-an-echo/u);
  const css = source("app/living-world.css");
  assert.match(css, /\.world-map-context-body[^}]*overflow-y: auto/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(css, /\.home-views|grayscale|#59372f|#2b1d24|@keyframes/u);
  assert.doesNotMatch(source("lib/analytics/public-page-view.ts"), /fetch\(|sendBeacon\(|navigator\.|document\.|process\.env/u);
  assert.match(source("app/admin/echowall/actions.ts"), /updateTag\("approved-echoes"\)/u);
});
