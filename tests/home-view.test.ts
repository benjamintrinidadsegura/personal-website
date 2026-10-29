import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { createElement, type ReactNode } from "react";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

import * as homeView from "../lib/home-view";
import { homeViewsCopy } from "../data/i18n/home-views";
import { homeViewPreferencePrivacy, privacyReleaseCopy } from "../data/i18n/privacy-release";
import { locales } from "../lib/i18n/config";
import { loadSource } from "./helpers/load-source";

function fixture(saved: string | null = null, blocked = false) {
  const values = new Map<string, string>(saved === null ? [] : [[homeView.homeViewStorageKey, saved]]);
  const writes: string[][] = [];
  const events = new EventTarget();
  const root = new EventTarget() as EventTarget & {
    btsHomeRestored?: boolean;
    btsHomeRestorePreference?: () => void;
    closest: () => null;
    querySelector: (selector: string) => object | null;
    contains: (target: unknown) => boolean;
    ownerDocument: { getElementById: (id: string) => object | null };
  };
  let mode: homeView.HomeView = "discover";
  const input = (value: homeView.HomeView) => ({
    value,
    get checked() { return mode === value; },
    set checked(checked: boolean) { if (checked) mode = value; },
    choose() { this.checked = true; const event = new Event("change"); Object.defineProperty(event, "target", { value: this }); root.dispatchEvent(event); },
  });
  const discover = input("discover");
  const explore = input("explore");
  const target = { closest: () => ({ dataset: { homePanel: "explore" }, closest: () => root }) };
  root.closest = () => null;
  root.querySelector = (selector) => selector.includes('value="explore"') ? explore : selector.includes('value="discover"') ? discover : null;
  root.contains = (candidate) => candidate === target;
  root.ownerDocument = { getElementById: (id) => id === "building" || id === "now" ? target : null };
  let hash = "";
  const storage = () => {
    if (blocked) throw new Error("SecurityError");
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { writes.push([key, value]); values.set(key, value); },
    };
  };
  const browser = {
    location: { get hash() { return hash; } },
    get localStorage() { return storage(); },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
  };
  return {
    root, browser, writes, storage, discover, explore, target,
    get mode() { return mode; },
    connect: () => homeView.connectHomeViews(root as unknown as HTMLElement, browser as unknown as Window),
    navigate: (nextHash: string, event: string) => { hash = nextHash; events.dispatchEvent(new Event(event)); },
    bootstrap: () => runInNewContext(homeView.homeViewBootstrap, {
      document: { getElementById: () => root }, location: browser.location,
      get localStorage() { return storage(); },
    }),
  };
}

test("new visitors default to Discover without writing a preference; only the two versioned values are accepted", () => {
  for (const value of [null, "", "EXPLORE", "true", '{"mode":"explore"}', "explore-v0", "<script>"]) {
    const context = fixture(value);
    const disconnect = context.connect();
    assert.equal(context.mode, "discover");
    assert.equal(homeView.readHomeViewPreference(context.storage), null);
    assert.deepEqual(context.writes, []);
    disconnect();
  }
  assert.equal(homeView.isHomeView("discover"), true);
  assert.equal(homeView.isHomeView("explore"), true);
});

test("hard-load bootstrap and soft-navigation initialization restore either explicit mode without writing storage", () => {
  for (const mode of homeView.homeViews) {
    const hard = fixture(mode);
    hard.bootstrap();
    assert.equal(hard.mode, mode);
    assert.equal(hard.root.btsHomeRestored, true);
    const disconnect = hard.connect();
    assert.equal(hard.mode, mode);
    assert.deepEqual(hard.writes, []);
    disconnect();
    const soft = fixture(mode);
    const stop = soft.connect();
    assert.equal(soft.mode, mode);
    assert.deepEqual(soft.writes, []);
    stop();
  }
});

test("only explicit control changes persist; unavailable storage still permits both views", () => {
  for (const blocked of [false, true]) {
    const context = fixture(null, blocked);
    const disconnect = context.connect();
    context.explore.choose();
    assert.equal(context.mode, "explore");
    context.discover.choose();
    assert.equal(context.mode, "discover");
    assert.deepEqual(context.writes, blocked ? [] : [[homeView.homeViewStorageKey, "explore"], [homeView.homeViewStorageKey, "discover"]]);
    disconnect();
    context.explore.choose();
    assert.equal(context.writes.length, blocked ? 0 : 2, "unmounted controllers must remove persistence listeners");
  }
});

test("blocked storage also degrades safely in the pre-paint script", () => {
  const context = fixture(null, true);
  assert.doesNotThrow(() => context.bootstrap());
  assert.equal(context.mode, "discover");
  assert.deepEqual(context.writes, []);
});

test("direct anchors and Back/Forward reveal Explore without replacing Discover preference", () => {
  const context = fixture("discover");
  context.navigate("#now", "hashchange");
  context.bootstrap();
  assert.equal(context.mode, "explore");
  const disconnect = context.connect();
  assert.equal(context.mode, "explore");
  context.navigate("", "popstate");
  assert.equal(context.mode, "discover");
  context.navigate("#building", "popstate");
  assert.equal(context.mode, "explore");
  context.navigate("#home", "hashchange");
  assert.equal(context.mode, "discover");
  assert.deepEqual(context.writes, []);
  disconnect();
});

test("saved Explore survives history navigation and malformed or unrelated anchors cannot write preferences", () => {
  const context = fixture("explore");
  const disconnect = context.connect();
  for (const hash of ["#building", "", "#home", "#%E0%A4%A", "#does-not-exist"]) {
    context.navigate(hash, "popstate");
    assert.equal(context.mode, "explore");
  }
  assert.deepEqual(context.writes, []);
  disconnect();
});

test("same-document Home handoff restores the latest explicit preference without a hash event or storage access", () => {
  for (const blocked of [false, true]) for (const preference of homeView.homeViews) {
    const context = fixture(null, blocked);
    const disconnect = context.connect();
    context[preference].choose();
    const writes = [...context.writes];
    const temporary = preference === "discover" ? "explore" : "discover";
    const target = { closest: () => ({ dataset: { homePanel: temporary }, closest: () => context.root }) };
    homeView.revealHomeAnchor(target as unknown as HTMLElement);
    assert.equal(context.mode, temporary);
    // The navigation capture handler calls this after pushState, which emits no hashchange.
    homeView.revealHomeAnchor(context.root as unknown as HTMLElement);
    assert.equal(context.mode, preference);
    assert.deepEqual(context.writes, writes, "an anchor must never save a preference");
    disconnect();
    assert.equal(context.root.btsHomeRestorePreference, undefined);
  }
});

test("anchor reveal happens synchronously before a caller scrolls or focuses and never persists", () => {
  const context = fixture();
  homeView.revealHomeAnchor(context.target as unknown as HTMLElement);
  assert.equal(context.mode, "explore");
  assert.deepEqual(context.writes, []);
});

test("seven-locale markup is deterministic, uses a native named radio group, and renders each panel and ID once", () => {
  for (const locale of locales) {
    const { HomeViews } = loadSource<{ HomeViews: (props: { discover: ReactNode; explore: ReactNode; bootstrap: ReactNode }) => React.ReactElement }>("components/home/home-views.tsx", {
      "react/jsx-runtime": jsxRuntime, react: React,
      "@/components/discovery/context-canvas": { ContextCanvas: ({ children }: { children: ReactNode }) => children },
      "@/components/i18n/locale-context": { useLocale: () => locale },
      "@/data/i18n/home-views": { homeViewsCopy }, "@/lib/home-view": homeView,
    });
    const props = { discover: createElement("section", { id: "discover-title" }, "Editorial Discover"), explore: createElement("section", { id: "explore-home" }, "Existing Explore"), bootstrap: null };
    const html = renderToStaticMarkup(createElement(HomeViews, props));
    assert.equal(renderToStaticMarkup(createElement(HomeViews, props)), html, "SSR must not read browser storage");
    assert.ok(html.includes(homeViewsCopy[locale].label));
    assert.equal((html.match(/type="radio"/gu) ?? []).length, 2);
    assert.equal((html.match(/name="home-view"/gu) ?? []).length, 2);
    assert.match(html.match(/<input[^>]+id="home-view-discover"[^>]*>/u)?.[0] ?? "", /checked=""/u);
    assert.doesNotMatch(html.match(/<input[^>]+id="home-view-explore"[^>]*>/u)?.[0] ?? "", /checked=/u);
    const ids = [...html.matchAll(/\sid="([^"]+)"/gu)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const target of [...html.matchAll(/aria-(?:controls|describedby)="([^"]+)"/gu)].map((match) => match[1])) assert.ok(ids.includes(target), target);
    assert.equal((html.match(/Existing Explore/gu) ?? []).length, 1);
    assert.equal((html.match(/Editorial Discover/gu) ?? []).length, 1);
    assert.equal((html.match(/data-home-panel=/gu) ?? []).length, 2);
    assert.ok(privacyReleaseCopy[locale].sections.storage.body.includes(homeViewPreferencePrivacy[locale]));
  }
});

test("mode changes cannot remount or clear global search, and bootstrap changes no SSR attributes or text", () => {
  const views = readFileSync("components/home/home-views.tsx", "utf8");
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.equal((layout.match(/<DiscoveryProvider /gu) ?? []).length, 1);
  assert.doesNotMatch(views, /DiscoveryProvider|setQuery|clearDiscovery|key=|suppressHydrationWarning/u);
  assert.equal((views.match(/\{explore\}/gu) ?? []).length, 1);
  assert.doesNotMatch(homeView.homeViewBootstrap, /setItem|removeItem|setAttribute|innerHTML|textContent/u);
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /input:focus-visible \+ span/u);
  assert.match(css, /input:checked \+ span/u);
  assert.match(css, /\[data-home-panel="explore"\] \{ display: none; \}/u);
});
