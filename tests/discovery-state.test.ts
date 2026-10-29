import assert from "node:assert/strict";
import { test } from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";

import * as index from "../data/discovery-index";
import * as localized from "../data/i18n/discovery";
import * as discovery from "../lib/discovery";
import * as homeView from "../lib/home-view";
import { locales, type Locale } from "../lib/i18n/config";
import type { DiscoveryProvider, useDiscovery } from "../components/discovery/discovery-context";
import type { DiscoveryEngine } from "../components/discovery/discovery-engine";
import { isUnmodifiedPrimaryClick } from "../components/discovery/discovery-results";
import { hookHarness } from "./helpers/hook-harness";
import { loadSource } from "./helpers/load-source";

function providerFixture(locale: Locale = "de") {
  const harness = hookHarness();
  const events = new EventTarget();
  let location = new URL("https://btshq.online/");
  let canvasPresent = false;
  let observer: (() => void) | undefined;
  const frames = new Map<number, () => void>();
  const scrolled: string[] = [];
  let sequence = 0;
  const window = {
    get location() { return location; },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    requestAnimationFrame: (callback: () => void) => { frames.set(++sequence, callback); return sequence; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  };
  const loadedProvider = loadSource<{ DiscoveryProvider: typeof DiscoveryProvider }>("components/discovery/discovery-context.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { ...React, ...harness.hooks },
    "next/navigation": { usePathname: () => location.pathname },
    "@/components/i18n/locale-context": { useLocale: () => locale },
    "@/data/discovery-index": index,
    "@/data/i18n/discovery": localized,
    "@/lib/discovery": discovery,
    "@/lib/home-view": homeView,
  }, {
    window, URL,
    document: { body: {}, querySelector: () => canvasPresent ? {} : null, getElementById: (id: string) => ({ closest: () => null, scrollIntoView: () => scrolled.push(id) }) },
    MutationObserver: class {
      constructor(callback: () => void) { observer = callback; }
      observe() {}
      disconnect() { observer = undefined; }
    },
  });
  const render = () => harness.render(() => loadedProvider.DiscoveryProvider({ children: null, items: index.discoveryIndex })).props.value as ReturnType<typeof useDiscovery>;
  return {
    render, scrolled, unmount: harness.unmount,
    navigate: (href: string, event?: "hashchange" | "popstate") => { location = new URL(href, location); if (event) events.dispatchEvent(new Event(event)); },
    canvas: (present: boolean) => { canvasPresent = present; observer?.(); },
    flushFrames: () => { const pending = [...frames.values()]; frames.clear(); for (const callback of pending) callback(); },
  };
}

test("the shared provider returns the existing localized ranking and preserves query/selection when only suggestions close", () => {
  for (const locale of locales) {
    const fixture = providerFixture(locale);
    try {
      fixture.render().setQuery("Recruiting");
      let state = fixture.render();
      const expected = discovery.discoverItems(localized.localizeDiscoveryItems(index.discoveryIndex, locale), "Recruiting");
      assert.ok(state.matches.length > 0, locale);
      assert.deepEqual(state.matches, expected, locale);
      state.selectMatch(state.matches[0].item.id);
      state.setOverlayOpen(true);
      state = fixture.render();
      state.setOverlayOpen(false);
      const dismissed = fixture.render();
      assert.equal(dismissed.query, "Recruiting");
      assert.equal(dismissed.selectedMatchId, state.selectedMatchId);
      assert.equal(dismissed.overlayOpen, false);
      dismissed.clearDiscovery();
      const reset = fixture.render();
      assert.equal(reset.query, "");
      assert.equal(reset.selectedMatchId, null);
      assert.deepEqual(reset.matches, []);
    } finally { fixture.unmount(); }
  }
});

test("stale navigation handoffs cannot clear a newer query or finish a newer target", () => {
  const fixture = providerFixture();
  try {
    fixture.render().setQuery("Recruiting");
    let state = fixture.render();
    const first = state.beginCanvasNavigation("/writing/first");
    state = fixture.render();
    const second = state.beginCanvasNavigation("/people/kiki-radicke");
    state = fixture.render();
    state.settleCanvasNavigation("/writing/first", first);
    state = fixture.render();
    assert.equal(state.navigationPending, true);
    assert.equal(state.query, "Recruiting");
    state.setQuery("Community");
    state = fixture.render();
    state.settleCanvasNavigation("/people/kiki-radicke", second);
    assert.equal(fixture.render().query, "Community");

    state = fixture.render();
    state.beginCanvasNavigation("/en/writing/current?view=public#writing-thought-one");
    fixture.render();
    fixture.navigate("/en/writing/current?view=other#writing-thought-one");
    state = fixture.render();
    assert.equal(state.query, "Community", "a different search string is not the target");
    assert.equal(state.navigationPending, false);
    state.beginCanvasNavigation("/en/writing/current?view=public#writing-thought-one");
    fixture.render();
    fixture.navigate("/en/writing/current?view=public#writing-thought-one", "popstate");
    state = fixture.render();
    assert.equal(state.query, "");
    assert.equal(state.navigationPending, false);
  } finally { fixture.unmount(); }
});

test("same-document hash navigation clears only on arrival and restores the anchor after the discovery canvas exits", () => {
  const fixture = providerFixture();
  try {
    fixture.canvas(true);
    fixture.render().setQuery("Projects");
    fixture.render().beginCanvasNavigation("/#building");
    assert.equal(fixture.render().query, "Projects");
    fixture.navigate("/#building", "hashchange");
    assert.equal(fixture.render().query, "");
    fixture.flushFrames();
    assert.deepEqual(fixture.scrolled, []);
    fixture.canvas(false);
    fixture.flushFrames();
    fixture.render();
    assert.deepEqual(fixture.scrolled, ["building"]);
  } finally { fixture.unmount(); }
});

test("result navigation starts a handoff only for an unmodified, uncancelled primary click", () => {
  const ordinary = { button: 0, defaultPrevented: false, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
  const click = (changes: Partial<typeof ordinary> = {}) => isUnmodifiedPrimaryClick({ ...ordinary, ...changes } as React.MouseEvent<HTMLAnchorElement>);
  assert.equal(click(), true);
  for (const changes of [{ button: 1 }, { button: 2 }, { defaultPrevented: true }, { metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }]) assert.equal(click(changes), false);
});

test("search shortcuts, arrow wrapping and Enter keep native results while Escape clears and outside dismissal preserves the query", () => {
  const harness = hookHarness();
  const events = new EventTarget();
  const clicked: string[] = [];
  let query = "Recruiting";
  let overlayOpen = false;
  let activeLocks = 0;
  const loadedEngine = loadSource<{ DiscoveryEngine: typeof DiscoveryEngine }>("components/discovery/discovery-engine.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { ...React, ...harness.hooks, useLayoutEffect: harness.hooks.useEffect, useId: () => "test-search" },
    "next/navigation": { usePathname: () => "/" },
    "@/components/i18n/locale-context": { useLocale: () => "de" },
    "@/data/i18n/discovery": localized,
    "@/lib/scroll-lock": { acquireScrollLock: () => { activeLocks++; return () => { activeLocks--; }; } },
    "@/components/discovery/discovery-results": { DiscoveryResults: () => null },
    "@/components/discovery/discovery-context": { useDiscovery: () => {
      const matches = discovery.discoverItems(index.discoveryIndex, query);
      return {
        query, setQuery: (next: string) => { query = next; }, matches, groups: discovery.groupDiscoveryItems(matches),
        overlayOpen, setOverlayOpen: (open: boolean) => { overlayOpen = open; }, navigationPending: false,
        beginCanvasNavigation: () => 1, settleCanvasNavigation: () => undefined,
        clearDiscovery: () => { query = ""; },
      };
    } },
  }, {
    window: { matchMedia: () => ({ matches: true }), requestAnimationFrame: (callback: () => void) => { callback(); return 1; } },
    document: {
      activeElement: null,
      addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
      getElementById: (id: string) => ({ click: () => clicked.push(id) }),
    },
  });
  const render = () => harness.render(() => loadedEngine.DiscoveryEngine({}));
  const descendants = (node: React.ReactNode): React.ReactElement<Record<string, unknown>>[] => {
    if (Array.isArray(node)) return node.flatMap(descendants);
    if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return [];
    return [node as React.ReactElement<Record<string, unknown>>, ...descendants(node.props.children)];
  };
  const input = () => descendants(render()).find((element) => element.type === "input")!;
  const key = (value: string) => (input().props.onKeyDown as (event: object) => void)({ key: value, preventDefault() {} });
  const documentEvent = (type: string, props: object) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, props);
    events.dispatchEvent(event);
    return event;
  };
  try {
    render();
    assert.equal(documentEvent("keydown", { key: "k", ctrlKey: true }).defaultPrevented, true);
    assert.equal(input().props["aria-expanded"], true);
    assert.equal(activeLocks, 1);
    const available = discovery.discoverItems(index.discoveryIndex, query).filter(({ item }) => item.href);
    assert.ok(available.length > 1);
    key("ArrowUp");
    assert.equal(input().props["aria-activedescendant"], `discovery-option-${available.at(-1)!.item.id}`);
    key("ArrowDown");
    key("Enter");
    assert.deepEqual(clicked, [`discovery-option-${available[0].item.id}`]);
    documentEvent("pointerdown", {});
    assert.equal(input().props["aria-expanded"], false);
    assert.equal(query, "Recruiting");
    assert.equal(activeLocks, 0);
    documentEvent("keydown", { key: "k", metaKey: true });
    render();
    documentEvent("keydown", { key: "Escape" });
    assert.equal(input().props["aria-expanded"], false);
    assert.equal(query, "");
    assert.equal(activeLocks, 0);
  } finally { harness.unmount(); }
});
