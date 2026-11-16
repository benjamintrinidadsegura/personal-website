import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createPublishedWritingDiscoveryItems, discoveryIndex } from "../data/discovery-index";
import { getDiscoveryUiCopy, localizeDiscoveryItems } from "../data/i18n/discovery";
import { createAdditionalLifeAlignmentDiscoveryItems } from "../data/i18n/discovery-life-alignment";
import { getLifeAlignmentHubContent } from "../data/i18n/life-alignment-modules";
import { availableLifeAlignmentModules, type LifeAlignmentModule } from "../data/life-alignment-modules";
import { discoverItems } from "../lib/discovery";
import { publicUniverse, universeItem, universeMatches } from "../lib/discovery-universe/content";
import { locales } from "../lib/i18n/config";
import { getLocalizedPathname } from "../lib/i18n/routing";

const ids = ["family", "friendship", "career", "team", "founder"] as const;
const moduleId = (id: string) => `tool-life-alignment-${id}`;

test("every available public module has exactly one existing canonical Discovery destination", () => {
  for (const definition of availableLifeAlignmentModules) {
    const entries = discoveryIndex.filter((item) => item.href === definition.href);
    assert.equal(entries.length, 1, definition.id);
    assert.ok(["Live", "Beta"].includes(entries[0].status));
  }
  assert.deepEqual(createAdditionalLifeAlignmentDiscoveryItems().map((item) => item.id), ids.map(moduleId));
  assert.equal(new Set(discoveryIndex.map((item) => item.id)).size, discoveryIndex.length);
  for (const id of ids) {
    const route = readFileSync(new URL(`../app/life-alignment/${id}/page.tsx`, import.meta.url), "utf8");
    assert.ok(route.includes(`/life-alignment/${id}`));
  }
});

for (const locale of locales) test(`public module copy, literal queries, ranking and counts remain grounded: ${locale}`, () => {
  const items = localizeDiscoveryItems(discoveryIndex, locale);
  const catalog = publicUniverse(items, locale);
  const source = getLifeAlignmentHubContent(locale).available;
  const records = createAdditionalLifeAlignmentDiscoveryItems(locale);
  const ui = getDiscoveryUiCopy(locale);
  for (const id of ids) {
    const record = records.find((item) => item.id === moduleId(id))!;
    const definition = source.find((item) => item.id === id)!;
    const indexed = items.find((item) => item.id === record.id)!;
    assert.equal(record.title, definition.title);
    assert.equal(record.description, definition.purpose);
    assert.equal(indexed.title, definition.title);
    assert.equal(indexed.description, definition.purpose);
    assert.equal(indexed.href, getLocalizedPathname(definition.href, locale));
    assert.equal(indexed.status, "Beta");
    for (const query of [record.title, ...record.keywords, `Life Alignment ${id}`]) {
      const ranked = discoverItems(items, query);
      const visible = universeMatches(catalog, ranked, query);
      assert.ok(visible.some((match) => match.item.id === record.id), `${id}: ${query}`);
      assert.equal(new Set(visible.map((match) => match.item.href)).size, visible.length);
      assert.ok(ranked.every((match, i) => i === 0 || ranked[i - 1].score >= match.score));
    }
    assert.equal(discoverItems(items, record.title)[0]?.item.id, record.id, record.title);
  }
  for (const query of ["Familie", "Family", "Freundschaft", "Friendship", "Karriere", "Career", "Team", "Founder", "Life Alignment", "Recruiting"]) {
    const ranked = discoverItems(items, query);
    assert.ok(ranked.length, query);
    assert.equal(ui.resultSummary(ranked), (["match", "suggestion", "related"] as const).flatMap((kind) => {
      const count = ranked.filter((match) => match.presentation === kind).length;
      return count ? [kind === "match" ? ui.count(count) : `${ui.presentationLabels[kind]} · ${count}`] : [];
    }).join(" / "));
  }
  for (const query of ["KI", "AI"]) {
    const results = universeMatches(catalog, discoverItems(items, query), query);
    assert.deepEqual(results.map((match) => match.item.id), ["page-about"]);
  }
  assert.deepEqual(discoverItems(items, ""), []);
  assert.deepEqual(discoverItems(items, "zzqxv999"), []);
  const partial = discoverItems(items, "Friend");
  assert.ok(partial.some((match) => match.item.id === moduleId("friendship")));
  assert.ok(partial.every((match) => match.presentation === "suggestion"));
});

test("unavailable registry entries and private destinations cannot become public module search entries", () => {
  const active = availableLifeAlignmentModules.find((module) => module.id === "family")!;
  const future = { ...active, status: "coming-later", href: null } as unknown as LifeAlignmentModule;
  const privateReference = { ...active, href: "/life-alignment/invite/not-a-real-token" } as unknown as LifeAlignmentModule;
  assert.deepEqual(createAdditionalLifeAlignmentDiscoveryItems("de", [future, privateReference]), []);
  const record = createAdditionalLifeAlignmentDiscoveryItems()[0];
  const [localizedUnavailable] = localizeDiscoveryItems([{ ...record, status: "Coming Soon" }], "en");
  assert.equal(localizedUnavailable.status, "Coming Soon");
  assert.equal(universeItem(localizedUnavailable, "en"), null);
  for (const href of ["/account", "/admin", "/life-alignment/invite/not-a-real-token", "/life-alignment/session/not-a-real-id"]) {
    const [localized] = localizeDiscoveryItems([{ ...record, href }], "en");
    assert.equal(universeItem(localized, "en"), null);
  }
  const implementation = readFileSync(new URL("../data/i18n/discovery-life-alignment.ts", import.meta.url), "utf8");
  for (const forbidden of ["getRelationshipModule", "careerModule", "fetch(", "sendBeacon", "localStorage", "supabase", "questions:", "answers:"]) assert.equal(implementation.includes(forbidden), false, forbidden);
});

test("published Writing and existing Projects, People and Tools retain retrieval and destination deduplication", () => {
  const writing = createPublishedWritingDiscoveryItems([{ id: "synthetic-test-only", slug: "controlled-public-writing", title: "Verified published Writing fixture", deck: "Test only published summary", excerpt: "Controlled fixture, never a live article.", contentType: "essay", topics: ["Ideas"], publishedAt: "2026-01-01T00:00:00Z", readingMinutes: 1, language: "en", sourceLanguage: "en", availableLanguages: ["en"], translationStatus: "source" }]);
  const items = localizeDiscoveryItems([...discoveryIndex, ...writing, { ...writing[0], id: "pulse-test-only" }], "de");
  const catalog = publicUniverse(items, "de");
  for (const [query, target] of [["Writing fixture", "/en/writing/controlled-public-writing"], ["GOATRECRUTAINER", "/projects/goatrecrutainer"], ["Evgeny", "/people/evgeny-vinokurov"], ["Life Alignment", "/life-alignment"], ["World Map", "/world"], ["EchoWall", "/echowall"]]) {
    const ranked = discoverItems(items, query);
    const visible = universeMatches(catalog, ranked, query);
    assert.ok(visible.some((match) => match.item.href === target), query);
    assert.equal(new Set(visible.map((match) => match.item.href)).size, visible.length);
  }
});
