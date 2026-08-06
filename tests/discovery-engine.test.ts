import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { discoveryIndex } from "../data/discovery-index";
import { adaptiveDiscoveryGroupLimit, createAdaptiveDiscoveryView, discoverItems, groupDiscoveryItems, normalizeDiscoveryText } from "../lib/discovery";
import type { DiscoveryItem } from "../types/discovery";

const knownStaticRoutes = new Set([
  "/",
  "/echowall",
  "/goatrecrutainer/career-spotlight",
  "/goatrecrutainer/career-spotlight/evgeny-vinokurov",
  "/projects/goatrecrutainer",
  "/projects/ratecom",
  "/projects/hobbyswap",
  "/projects/streamory",
  "/projects/byc",
  "/projects/bts-online",
]);

const knownHomeAnchors = new Set(["home", "now", "pulse", "building", "writing", "interviews", "echowall", "about", "contact"]);

test("discovery index has unique, valid records", () => {
  assert.ok(discoveryIndex.length > 0);
  assert.equal(new Set(discoveryIndex.map(({ id }) => id)).size, discoveryIndex.length);

  for (const item of discoveryIndex) {
    assert.ok(item.id);
    assert.ok(item.title);
    assert.ok(item.description);
    assert.ok(item.category);
    assert.ok(["Projects", "Insights", "Tools", "People", "Pages"].includes(item.group));
    assert.ok(["Live", "Beta", "In Development", "Coming Soon"].includes(item.status));
    assert.equal(item.href?.startsWith("/admin") ?? false, false);
  }
});

test("every discovery destination is a verified route or home anchor", () => {
  for (const { href, title } of discoveryIndex) {
    if (!href) continue;
    if (href.startsWith("/#")) {
      assert.equal(knownHomeAnchors.has(href.slice(2)), true, `${title}: ${href}`);
    } else {
      assert.equal(knownStaticRoutes.has(href), true, `${title}: ${href}`);
    }
  }
});

test("unfinished content without a page remains discoverable but not navigable", () => {
  for (const title of ["Service Spotlight", "Career Agent", "Talking Cure", "Personal Conversations", "Leidenschaft"] as const) {
    const item = discoveryIndex.find((candidate) => candidate.title === title);
    assert.ok(item, title);
    assert.equal(item.href, undefined, title);
    assert.ok(item.status === "Coming Soon" || item.status === "In Development", title);
  }
});

test("matching starts at one character and ignores casing", () => {
  assert.ok(discoverItems(discoveryIndex, "r").length > 0);
  assert.deepEqual(
    discoverItems(discoveryIndex, "Rec").map(({ item }) => item.id),
    discoverItems(discoveryIndex, "rEC").map(({ item }) => item.id),
  );
  assert.equal(normalizeDiscoveryText("  ÜBER  "), "über");
});

test("matching covers title, description, category, tags, and keywords", () => {
  const fixture: DiscoveryItem[] = [
    { id: "title", group: "Pages", title: "Needle title", description: "x", category: "x", tags: [], keywords: [], status: "Live" },
    { id: "description", group: "Pages", title: "x", description: "Needle description", category: "x", tags: [], keywords: [], status: "Live" },
    { id: "category", group: "Pages", title: "x", description: "x", category: "Needle category", tags: [], keywords: [], status: "Live" },
    { id: "tag", group: "Pages", title: "x", description: "x", category: "x", tags: ["Needle tag"], keywords: [], status: "Live" },
    { id: "keyword", group: "Pages", title: "x", description: "x", category: "x", tags: [], keywords: ["Needle keyword"], status: "Live" },
  ];

  assert.deepEqual(new Set(discoverItems(fixture, "needle").map(({ item }) => item.id)), new Set(fixture.map(({ id }) => id)));
});

test("title matches rank ahead of category, tags, keywords, and description", () => {
  const results = discoverItems(discoveryIndex, "career");
  assert.ok(results.length > 1);
  assert.equal(results[0].item.title.toLocaleLowerCase("de-DE").startsWith("career"), true);
  assert.ok(results.every((result, index) => index === 0 || results[index - 1].score >= result.score));
});

test("empty and unknown queries return no groups", () => {
  assert.deepEqual(discoverItems(discoveryIndex, ""), []);
  assert.deepEqual(discoverItems(discoveryIndex, "   "), []);
  assert.equal(groupDiscoveryItems(discoverItems(discoveryIndex, "definitely-not-present")).size, 0);
});

test("adaptive discovery promotes the ranked first match without duplicating it", () => {
  const matches = discoverItems(discoveryIndex, "rec");
  const adaptiveView = createAdaptiveDiscoveryView(matches);

  assert.ok(matches.length > 0);
  assert.equal(adaptiveView.topMatch?.item.id, matches[0].item.id);
  assert.equal(
    adaptiveView.groups.flatMap(({ matches: groupMatches }) => groupMatches).some(({ item }) => item.id === matches[0].item.id),
    false,
  );
});

test("adaptive discovery promotes an explicit selection and falls back to ranking", () => {
  const matches = discoverItems(discoveryIndex, "rec");
  const selected = matches[3];
  assert.ok(selected);

  const selectedView = createAdaptiveDiscoveryView(matches, selected.item.id);
  const fallbackView = createAdaptiveDiscoveryView(matches, "missing-selection");

  assert.equal(selectedView.topMatch?.item.id, selected.item.id);
  assert.equal(
    selectedView.groups.flatMap(({ matches: groupMatches }) => groupMatches).some(({ item }) => item.id === selected.item.id),
    false,
  );
  assert.equal(fallbackView.topMatch?.item.id, matches[0].item.id);
});

test("adaptive discovery caps each group and reports hidden matches", () => {
  const fixtureMatches = Array.from({ length: adaptiveDiscoveryGroupLimit + 3 }, (_, index) => ({
    item: {
      id: `fixture-${index}`,
      group: "Projects" as const,
      title: `Fixture ${index}`,
      description: "Test item",
      category: "Test",
      tags: [],
      keywords: [],
      status: "Live" as const,
    },
    score: 500 - index,
  }));
  const adaptiveView = createAdaptiveDiscoveryView(fixtureMatches);
  const [projects] = adaptiveView.groups;

  assert.equal(adaptiveView.topMatch?.item.id, "fixture-0");
  assert.equal(projects.group, "Projects");
  assert.equal(projects.matches.length, adaptiveDiscoveryGroupLimit);
  assert.equal(projects.remainingCount, 2);
});

test("reserved semantic dimensions are not searched in v1", () => {
  const item: DiscoveryItem = {
    id: "future",
    group: "Tools",
    title: "Compass",
    description: "Orientation",
    category: "Tool",
    tags: [],
    keywords: [],
    status: "Coming Soon",
    dimensions: { goals: ["unfindable-dimension-value"] },
  };
  assert.deepEqual(discoverItems([item], "unfindable-dimension-value"), []);
});

test("header preserves navigation and exposes desktop and mobile discovery controls", () => {
  const header = readFileSync(new URL("../components/layout/header.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../components/discovery/discovery-engine.tsx", import.meta.url), "utf8");

  assert.equal(header.includes("<DiscoveryEngine"), true);
  assert.equal(header.includes("setOpenDropdown(null)"), true);
  assert.equal(engine.includes("Discover the HQ"), true);
  assert.equal(engine.includes('aria-label="Discovery öffnen"'), true);
  assert.equal(engine.includes("event.metaKey || event.ctrlKey"), true);
  assert.equal(engine.includes('event.key === "Escape"'), true);
  assert.equal(engine.includes('event.key !== "Tab"'), true);
  assert.equal(engine.includes("acquireScrollLock()"), true);
  assert.equal(engine.includes('"aria-haspopup": "listbox"'), true);
  assert.equal(engine.includes('event.key === "ArrowDown"'), true);
  assert.equal(engine.includes('event.key === "ArrowUp"'), true);
  assert.equal(engine.includes('event.key !== "Enter"'), true);
});

test("selection keeps global discovery state and routes only subpages to the homepage", () => {
  const engine = readFileSync(new URL("../components/discovery/discovery-engine.tsx", import.meta.url), "utf8");
  const results = readFileSync(new URL("../components/discovery/discovery-results.tsx", import.meta.url), "utf8");
  const selectionStart = engine.indexOf("const selectForCanvas");
  const selectionEnd = engine.indexOf("\n\n  useEffect", selectionStart);

  assert.ok(selectionStart >= 0);
  assert.ok(selectionEnd > selectionStart);

  const selectionFlow = engine.slice(selectionStart, selectionEnd);
  const selectIndex = selectionFlow.indexOf("selectMatch(item.id)");
  const dismissIndex = selectionFlow.indexOf("dismissDiscovery(false)");
  const navigationIndex = selectionFlow.indexOf('router.push("/", { scroll: false })');
  assert.ok(selectIndex >= 0);
  assert.ok(dismissIndex > selectIndex);
  assert.ok(navigationIndex > dismissIndex);
  assert.equal(selectionFlow.includes("clearDiscovery"), false);
  assert.equal(selectionFlow.includes('if (!onHomepage) router.push("/", { scroll: false })'), true);
  assert.equal(engine.includes("router.push(item.href)"), false);
  assert.equal(engine.includes("allowUnavailableSelection"), false);
  assert.equal(results.includes("allowUnavailableSelection"), false);
  assert.equal(results.includes("aria-disabled"), false);
  assert.equal(results.includes("disabled={!selectable}"), false);
});

test("context canvas stays homepage-local while the root layout remains server-rendered", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const context = readFileSync(new URL("../components/discovery/discovery-context.tsx", import.meta.url), "utf8");
  const canvas = readFileSync(new URL("../components/discovery/context-canvas.tsx", import.meta.url), "utf8");
  const discoveryView = readFileSync(new URL("../components/discovery/context-discovery-view.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../components/discovery/discovery-engine.tsx", import.meta.url), "utf8");
  const results = readFileSync(new URL("../components/discovery/discovery-results.tsx", import.meta.url), "utf8");
  const header = readFileSync(new URL("../components/layout/header.tsx", import.meta.url), "utf8");
  const globals = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const scrollLock = readFileSync(new URL("../lib/scroll-lock.ts", import.meta.url), "utf8");

  assert.equal(layout.startsWith('"use client"'), false);
  assert.equal(layout.includes("<DiscoveryProvider>"), true);
  assert.equal(layout.includes("<ContextCanvas"), false);
  assert.ok(page.indexOf("<ContextCanvas>") < page.indexOf("<Hero />"));
  assert.ok(page.indexOf("<Hero />") < page.indexOf("<Now />"));
  assert.ok(page.indexOf("<Now />") < page.indexOf("</ContextCanvas>"));
  assert.equal(context.includes("discoverItems(discoveryIndex, query)"), true);
  assert.equal(context.includes("createAdaptiveDiscoveryView(matches, selectedMatchId)"), true);
  assert.equal(context.includes("selectedMatchId"), true);
  assert.equal(engine.includes("dismissDiscovery(false)"), true);
  assert.equal(engine.includes("resetDiscovery(true)"), true);
  assert.equal(engine.includes("handleCanvasEscape"), true);
  assert.equal(engine.includes('pathname === "/"'), true);
  assert.equal(engine.includes('router.push("/", { scroll: false })'), true);
  assert.equal(engine.includes("fixed inset-0"), false);
  assert.equal(engine.includes("selectForCanvas"), true);
  assert.equal(results.includes("<Link"), false);
  assert.equal(results.includes('role="option"'), true);
  assert.equal(canvas.includes("fixed inset-x-0 bottom-0 top-20"), true);
  assert.equal(canvas.includes("inert={discoveryActive}"), true);
  assert.equal(canvas.includes("aria-hidden={discoveryActive"), true);
  assert.equal(canvas.includes("aria-hidden={hiddenFromInteraction"), true);
  assert.equal(canvas.includes("useIsPresent"), true);
  assert.equal(canvas.includes("inert={hiddenFromInteraction}"), true);
  assert.equal(canvas.includes("overlayOpen || !isPresent"), true);
  assert.equal(canvas.includes("height: \"auto\""), false);
  assert.equal(canvas.includes("useReducedMotion"), true);
  assert.equal(canvas.includes("duration: reduceMotion ? 0 : 0.22"), true);
  assert.equal(canvas.includes("y: reduceMotion ? 0 : 4"), true);
  assert.equal(discoveryView.includes("adaptiveView.topMatch"), true);
  assert.equal(discoveryView.includes("remainingCount"), true);
  assert.equal(discoveryView.includes("preventScroll: true"), true);
  assert.equal(discoveryView.includes("data-top-match-id={item.id}"), true);
  assert.equal(discoveryView.includes("data-featured-result={featured || undefined}"), true);
  assert.equal(discoveryView.includes("groupMatches.length >= 3"), true);
  assert.equal(discoveryView.includes('groupMatches.length === 4 ? "xl:grid-cols-5" : "xl:grid-cols-4"'), true);
  assert.equal(discoveryView.includes("featured={hasFeaturedResult && index === 0}"), true);
  assert.equal(discoveryView.includes("Detailseite öffnen"), true);
  assert.equal(header.includes("acquireScrollLock()"), true);
  assert.equal(engine.includes("previousTarget?.isConnected"), true);
  assert.equal(engine.includes("previousTarget.getClientRects().length > 0"), true);
  assert.equal(engine.includes("mobileTrigger.current"), true);
  assert.equal(globals.includes("scrollbar-gutter: stable"), true);
  assert.equal(globals.includes('html[data-scroll-restoring="true"]'), true);
  assert.equal(scrollLock.includes("activeLocks"), true);
  assert.equal(scrollLock.includes("body.style.position"), false);
});

test("context canvas cards navigate directly while preserving modified-link behavior", () => {
  const discoveryView = readFileSync(new URL("../components/discovery/context-discovery-view.tsx", import.meta.url), "utf8");
  const resultCardStart = discoveryView.indexOf("function ResultCard");
  const resultCardEnd = discoveryView.indexOf("\n\nexport function ContextDiscoveryView", resultCardStart);

  assert.ok(resultCardStart >= 0);
  assert.ok(resultCardEnd > resultCardStart);

  const resultCard = discoveryView.slice(resultCardStart, resultCardEnd);
  assert.equal(resultCard.includes("Als Top Match anzeigen"), false);
  assert.equal(resultCard.includes("Ergebnis öffnen →"), true);
  assert.equal(resultCard.includes("Noch nicht verfügbar"), true);
  assert.equal(resultCard.includes("<Link"), true);
  assert.equal(resultCard.includes("<article"), true);
  assert.equal(resultCard.includes("<button"), false);
  assert.equal(resultCard.includes("beginNavigation(item.href as string)"), true);
  assert.equal(resultCard.includes("onClick="), true);
  assert.equal(resultCard.includes("motion-safe:hover:-translate-y-0.5"), true);
  assert.equal(resultCard.includes("motion-safe:focus-visible:-translate-y-0.5"), true);
  assert.equal(resultCard.includes("motion-safe:duration-[180ms]"), true);
  assert.equal(resultCard.includes("motion-reduce:transition-none"), true);
  assert.equal(discoveryView.includes("selectForCanvas"), false);
  assert.equal(discoveryView.includes("onNavigate={clearDiscovery}"), false);
});

test("context canvas navigation resets only after the latest target takes over", () => {
  const context = readFileSync(new URL("../components/discovery/discovery-context.tsx", import.meta.url), "utf8");
  const discoveryView = readFileSync(new URL("../components/discovery/context-discovery-view.tsx", import.meta.url), "utf8");

  assert.equal(context.includes("interface CanvasNavigationHandoff"), true);
  assert.equal(context.includes("usePathname()"), true);
  assert.equal(context.includes("beginCanvasNavigation"), true);
  assert.equal(context.includes("settleCanvasNavigation"), true);
  assert.equal(context.includes("navigationSequence.current + 1"), true);
  assert.equal(context.includes("navigation.id !== handoffId || navigation.targetHref !== targetHref"), true);
  assert.equal(context.includes("isCurrentLocation(targetHref)"), true);
  assert.equal(context.includes("target.pathname === window.location.pathname"), true);
  assert.equal(context.includes("target.search === window.location.search"), true);
  assert.equal(context.includes("target.hash === window.location.hash"), true);
  assert.equal(context.includes("pathname === navigation.sourcePathname"), true);
  assert.equal(context.includes("setNavigation(null)"), true);
  assert.equal(context.includes('window.addEventListener("hashchange"'), true);
  assert.equal(context.includes('window.addEventListener("popstate"'), true);
  assert.equal(context.includes("pendingAnchorId"), true);
  assert.equal(context.includes('document.querySelector("[data-context-discovery-view]")'), true);
  assert.equal(context.includes("scrollIntoView()"), true);
  assert.equal(context.includes("setTimeout"), false);
  assert.equal(discoveryView.includes("useLinkStatus"), true);
  assert.equal(discoveryView.includes("observedPending"), true);
  assert.equal(discoveryView.includes("CanvasNavigationStatus"), true);
  assert.equal(discoveryView.includes("data-navigation-pending"), true);
  assert.equal(discoveryView.includes("isUnmodifiedPrimaryClick"), true);
  assert.equal(discoveryView.includes("event.button === 0"), true);
  assert.equal(discoveryView.includes("!event.metaKey"), true);
  assert.equal(discoveryView.includes("!event.ctrlKey"), true);
  assert.equal(discoveryView.includes("!event.shiftKey"), true);
  assert.equal(discoveryView.includes("!event.altKey"), true);
  assert.equal(discoveryView.includes("onNavigate={clearDiscovery}"), false);
});

test("discovery results own compact scrolling and keep keyboard movement local", () => {
  const engine = readFileSync(new URL("../components/discovery/discovery-engine.tsx", import.meta.url), "utf8");
  const results = readFileSync(new URL("../components/discovery/discovery-results.tsx", import.meta.url), "utf8");

  assert.equal(engine.includes("max-h-[calc(100svh-7rem)]"), true);
  assert.equal(engine.includes("flex-col"), true);
  assert.equal(engine.includes("min-h-0 flex-1 overflow-hidden"), true);
  assert.equal(engine.includes("shrink-0"), true);
  assert.equal(engine.includes("↑↓ Auswahl · Enter Übernehmen · Esc Schließen"), true);
  assert.equal(results.includes("max-h-[min(52svh,22rem)]"), true);
  assert.equal(results.includes("lg:max-h-[min(58svh,26rem)]"), true);
  assert.equal(results.includes("overflow-y-scroll"), true);
  assert.equal(results.includes("[scrollbar-gutter:stable]"), true);
  assert.equal(results.includes("Weitere Ergebnisse – scrollen"), true);
  assert.equal(results.includes("data-has-more-results"), true);
  assert.equal(results.includes("pb-12"), true);
  assert.equal(results.includes("line-clamp-1"), true);
  assert.equal(results.includes("sm:line-clamp-2"), true);
  assert.equal(results.includes("getBoundingClientRect"), true);
  assert.equal(results.includes("scrollAffordanceHeight = 48"), true);
  assert.equal(results.includes("optionRect.bottom > visibleBottom"), true);
  assert.equal(results.includes("element.scrollTop +="), true);
  assert.equal(results.includes("element.scrollTop = 0"), true);
  assert.equal(results.includes("ResizeObserver"), true);
  assert.equal(results.includes("scrollIntoView"), false);
  assert.equal(results.includes('behavior: "smooth"'), false);
});

test("context canvas uses typed status accents for top, featured, and standard cards", () => {
  const discoveryView = readFileSync(new URL("../components/discovery/context-discovery-view.tsx", import.meta.url), "utf8");

  assert.equal(discoveryView.includes("Record<DiscoveryStatus, StatusStyles>"), true);
  assert.equal(discoveryView.includes("border-emerald-300/20"), true);
  assert.equal(discoveryView.includes("border-cyan-300/25"), true);
  assert.equal(discoveryView.includes("border-amber-300/20"), true);
  assert.equal(discoveryView.includes("border-violet-300/15"), true);
  assert.equal(discoveryView.includes("styles.topMatch"), true);
  assert.equal(discoveryView.includes("styles.card"), true);
  assert.equal(discoveryView.includes("styles.interactive"), true);
  assert.equal(discoveryView.includes("<StatusBadge status={item.status} />"), true);
  assert.equal(discoveryView.includes('featured={hasFeaturedResult && index === 0}'), true);
});
