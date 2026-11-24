import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { createDiscoveryItemsWithWriting } from "../data/discovery-index";
import { writingRecoveryCopy } from "../data/i18n/writing-recovery";
import { locales, type Locale } from "../lib/i18n/config";
import type { DiscoveryItem } from "../types/discovery";
import type { PublicWritingSummary } from "../types/writing";
import { hookHarness } from "./helpers/hook-harness";
import { loadSource } from "./helpers/load-source";

const article: PublicWritingSummary = { id: "authored-public", slug: "authored-public", title: "An authored public thought", deck: "An authored subtitle", excerpt: "A complete authored public introduction.", contentType: "essay", topics: ["Ideas"], publishedAt: "2026-11-01T00:00:00Z", readingMinutes: 2, language: "de", sourceLanguage: "de", availableLanguages: ["de"], translationStatus: "source" };

test("streamed publication updates preserve search, overlay and selection state; unavailability clears article records", () => {
  const h = hookHarness(); let locale: Locale = "de";
  const provider = loadSource<{ DiscoveryProvider: (props: object) => React.ReactElement<{value: Record<string, unknown>}> }>("components/discovery/discovery-context.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "react": { ...h.hooks, createContext: () => ({ Provider: "provider" }), useContext: () => null },
    "next/navigation": { usePathname: () => "/" },
    "@/components/i18n/locale-context": { useLocale: () => locale },
    "@/data/discovery-index": { discoveryIndex: [] },
    "@/data/i18n/discovery": { localizeDiscoveryItems: (items: DiscoveryItem[]) => items },
    "@/lib/discovery": { discoverItems: (items: DiscoveryItem[], query: string) => ({ items, query }), groupDiscoveryItems: () => new Map(), createAdaptiveDiscoveryView: () => ({}) },
    "@/lib/home-view": { revealHomeAnchor: () => {} },
  });
  const initial = createDiscoveryItemsWithWriting([]);
  const render = () => h.render(() => provider.DiscoveryProvider({ children: null, items: initial, writingStatus: "loading" })).props.value;
  let value = render();
  (value.setQuery as (q: string) => void)("KI");
  (value.selectMatch as (q: string) => void)("person-preserved");
  (value.setOverlayOpen as (open: boolean) => void)(true);
  value = render();
  const update = value.setWritingSnapshot as (snapshot: object) => void;
  update({ locale, items: createDiscoveryItemsWithWriting([article]), status: "data", latest: article });
  value = render();
  assert.equal(value.query, "KI"); assert.equal(value.selectedMatchId, "person-preserved"); assert.equal(value.overlayOpen, true);
  assert.equal(value.latestWriting, article);
  assert.ok((value.items as DiscoveryItem[]).some(item => item.href === "/writing/authored-public"));
  update({ locale, items: initial, status: "unavailable" }); value = render();
  assert.equal(value.latestWriting, undefined);
  assert.equal(value.writingStatus, "unavailable");
  assert.equal(value.query, "KI");
  assert.ok(!(value.items as DiscoveryItem[]).some(item => item.href === "/writing/authored-public"));
  locale = "en"; value = render();
  assert.equal(value.writingStatus, "loading", "a previous locale snapshot cannot leak into a new locale");
  h.unmount();
});

test("automatic retry is visible-only, transient-only, once per navigation and cleaned up on unmount", () => {
  const h = hookHarness(); let pathname = "/writing", visibilityState = "visible", refreshes = 0;
  const timers = new Map<number, () => void>(); let sequence = 0;
  const listeners = new Map<string, () => void>(); const snapshots: object[] = [];
  const router = { refresh: () => refreshes++ };
  let inTransition = false;
  const startTransition = (publish: () => void) => {
    inTransition = true;
    try { publish(); } finally { inTransition = false; }
  };
  const setWritingSnapshot = (data: object) => {
    assert.equal(inTransition, true, "optional publication cannot interrupt route hydration");
    snapshots.push(data);
  };
  const Snapshot = loadSource<{ WritingDiscoverySnapshot: (props: object) => null }>("components/writing/writing-discovery-snapshot.tsx", {
    "react": { ...h.hooks, startTransition }, "next/navigation": { usePathname: () => pathname, useRouter: () => router },
    "@/components/discovery/discovery-context": { useDiscovery: () => ({ setWritingSnapshot }) },
  }, { document: { get visibilityState() { return visibilityState; }, addEventListener: (key: string, callback: () => void) => listeners.set(key, callback), removeEventListener: (key: string) => listeners.delete(key) },
    setTimeout: (callback: () => void, duration: number) => { assert.equal(duration, 1000); timers.set(++sequence, callback); return sequence; }, clearTimeout: (key: number) => timers.delete(key) });
  const props = { locale: "de", items: [], status: "unavailable", retryable: true };
  const render = (extra: object = {}) => h.render(() => Snapshot.WritingDiscoverySnapshot({ ...props, ...extra }));
  render(); assert.equal(timers.size, 1);
  const run = () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(callback => callback()); };
  visibilityState = "hidden"; run(); assert.equal(refreshes, 0);
  visibilityState = "visible"; listeners.get("visibilitychange")!(); run(); assert.equal(refreshes, 1);
  render(); assert.equal(timers.size, 0, "same unavailable result cannot create a refresh loop");
  pathname = "/en/writing"; render({ retryable: false }); assert.equal(timers.size, 0, "configuration/auth/permission failure has no automatic retry");
  render(); assert.equal(timers.size, 1);
  h.unmount(); assert.equal(timers.size, 0); assert.equal(listeners.size, 0);
  assert.ok(snapshots.length > 0);
});

test("critical layout has one stable provider and isolates optional publication data behind Suspense", () => {
  const source = readFileSync("app/layout.tsx", "utf8");
  assert.equal((source.match(/<DiscoveryProvider /gu) ?? []).length, 1);
  assert.match(source, /<Suspense fallback=\{null\}><PublishedWritingDiscovery locale=\{locale\}/u);
  assert.doesNotMatch(source, /await getPublishedWriting|writingResult\.data/u);
  const home = readFileSync("app/page.tsx", "utf8");
  assert.match(home, /const writingRead = getPublishedWritingResult/u);
  assert.doesNotMatch(home, /await getPublishedWritingResult/u);
  assert.match(home, /<AdaptiveUniverse \/>/u);
  assert.match(home, /<DailyWelcome dateKey=\{dateKey\} \/>/u);
});

test("all seven recovery dictionaries are complete; private routes and paused flags are unchanged", () => {
  assert.deepEqual(Object.keys(writingRecoveryCopy).sort(), [...locales].sort());
  for (const locale of locales) for (const text of Object.values(writingRecoveryCopy[locale])) assert.ok(text.trim().length >= 5);
  assert.match(readFileSync(".env.example", "utf8"), /BTS_PUBLIC_ANALYTICS_ENABLED=false/u);
  assert.match(readFileSync(".env.example", "utf8"), /ECHOWALL_COUNTRY_CONTEXT_ENABLED=false/u);
  const error = readFileSync("app/writing/error.tsx", "utf8");
  assert.doesNotMatch(error, /console\.|error\.message|JSON\.stringify|localStorage/u);
});
