import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  discoveryDimensionsByItemId,
  discoveryRelationships,
  discoverySynonymGroups,
  guidedDiscoveryPrompts,
} from "../data/discovery-curation";
import { discoveryIndex } from "../data/discovery-index";
import { adaptiveDiscoveryGroupLimit, createAdaptiveDiscoveryView, discoverItems, groupDiscoveryItems, normalizeDiscoveryText } from "../lib/discovery";
import type { ActiveDiscoveryDimension, DiscoveryItem, DiscoveryMatch } from "../types/discovery";

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

test("Sprint 4 curation is bounded, references real items, and keeps inactive dimensions empty", () => {
  const activeDimensions: ActiveDiscoveryDimension[] = ["intent", "goals", "problems", "useCases"];
  const discoveryIds = new Set(discoveryIndex.map(({ id }) => id));

  for (const [itemId, dimensions] of Object.entries(discoveryDimensionsByItemId)) {
    assert.equal(discoveryIds.has(itemId), true, itemId);
    assert.equal(dimensions.personality, undefined, itemId);
    assert.equal(dimensions.habitats, undefined, itemId);

    for (const dimension of activeDimensions) {
      const values = dimensions[dimension] ?? [];
      assert.ok(values.length <= 4, `${itemId}:${dimension}`);
      assert.equal(new Set(values.map(normalizeDiscoveryText)).size, values.length, `${itemId}:${dimension}`);
      assert.equal(values.every((value) => value.length > 0 && value.length <= 80), true, `${itemId}:${dimension}`);
    }
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
    reasons: [],
  }));
  const adaptiveView = createAdaptiveDiscoveryView(fixtureMatches);
  const [projects] = adaptiveView.groups;

  assert.equal(adaptiveView.topMatch?.item.id, "fixture-0");
  assert.equal(projects.group, "Projects");
  assert.equal(projects.matches.length, adaptiveDiscoveryGroupLimit);
  assert.equal(projects.remainingCount, 2);
});

test("only the four active semantic dimensions are searched", () => {
  const fixture: DiscoveryItem[] = [
    {
      id: "active",
      group: "Tools",
      title: "Compass",
      description: "Orientation",
      category: "Tool",
      tags: [],
      keywords: [],
      status: "Coming Soon",
      dimensions: { goals: ["findable-goal"] },
    },
    {
      id: "inactive",
      group: "Tools",
      title: "Atlas",
      description: "Navigation",
      category: "Tool",
      tags: [],
      keywords: [],
      status: "Coming Soon",
      dimensions: { personality: ["unfindable-personality"], habitats: ["unfindable-habitat"] },
    },
  ];

  assert.deepEqual(discoverItems(fixture, "findable-goal").map(({ item }) => item.id), ["active"]);
  assert.deepEqual(discoverItems(fixture, "unfindable-personality"), []);
  assert.deepEqual(discoverItems(fixture, "unfindable-habitat"), []);
});

test("contextual queries keep deterministic and relevant production rankings", () => {
  const idsFor = (query: string) => discoverItems(discoveryIndex, query).map(({ item }) => item.id);

  assert.equal(idsFor("rec")[0], "project-goatrecrutainer-area-recruiting-as-a-service");
  assert.equal(idsFor("Recruiting")[0], "project-goatrecrutainer-area-recruiting-as-a-service");
  assert.equal(idsFor("Recruiting").includes("project-ratecom"), true);
  assert.equal(idsFor("Recruiting").includes("project-goatrecrutainer-area-talking-cure"), false);
  assert.equal(idsFor("Job")[0], "project-goatrecrutainer-area-career-agent");
  assert.deepEqual(idsFor("Ich suche einen Job"), idsFor("Job"));
  assert.equal(idsFor("Karriere").includes("project-goatrecrutainer-area-career-agent"), true);
  assert.deepEqual(idsFor("Arbeitgeber wechseln"), ["project-goatrecrutainer-area-career-agent"]);
  assert.deepEqual(idsFor("Ich möchte den Arbeitgeber wechseln"), idsFor("Arbeitgeber wechseln"));
  assert.equal(idsFor("Ich brauche Unterstützung im Recruiting")[0], "project-goatrecrutainer-area-recruiting-as-a-service");
  assert.equal(idsFor("Gründen")[0], "project-byc");
  assert.equal(idsFor("Idee umsetzen")[0], "project-goatrecrutainer-area-konzepterstellung");
  assert.deepEqual(idsFor("Ich will eine Idee umsetzen"), idsFor("Idee umsetzen"));
  assert.equal(idsFor("Menschen und Geschichten").includes("interview-career-spotlight"), true);
  assert.equal(idsFor("Menschen und Geschichten").includes("person-evgeny-vinokurov"), true);
  assert.equal(idsFor("Ich möchte Menschen und ihre Geschichten kennenlernen").includes("interview-career-spotlight"), true);
  assert.equal(idsFor("Community und Feedback")[0], "tool-echowall");
  assert.deepEqual(idsFor("unbekannte Query"), []);
});

test("short queries preserve title-prefix discovery without arbitrary field substrings", () => {
  const fixture: DiscoveryItem[] = [
    { id: "title-r", group: "Pages", title: "Recruiting", description: "x", category: "x", tags: [], keywords: [], status: "Live" },
    { id: "title-hr", group: "Pages", title: "HR Guide", description: "x", category: "x", tags: [], keywords: [], status: "Live" },
    { id: "substring", group: "Pages", title: "Compass", description: "Nachricht und mehr", category: "Digital", tags: ["Wahrheit"], keywords: [], status: "Live" },
  ];

  assert.deepEqual(discoverItems(fixture, "r").map(({ item }) => item.id), ["title-r"]);
  const hrIds = discoverItems(fixture, "hr").map(({ item }) => item.id);
  assert.equal(hrIds[0], "title-hr");
  assert.equal(hrIds.includes("title-r"), true);
  assert.deepEqual(discoverItems([fixture[2]], "it"), []);
});

test("HR is an exact alias and never a substring match", () => {
  const falsePositiveFixture: DiscoveryItem[] = [
    { id: "more", group: "Pages", title: "Mehr erfahren", description: "Nachricht", category: "Page", tags: ["Wahrheit"], keywords: [], status: "Live" },
  ];
  const productionIds = discoverItems(discoveryIndex, "HR").map(({ item }) => item.id);

  assert.ok(productionIds.length > 0);
  assert.equal(productionIds.includes("project-hobbyswap"), false);
  assert.equal(productionIds.includes("project-byc"), false);
  assert.equal(productionIds.includes("tool-echowall"), false);
  assert.deepEqual(discoverItems(falsePositiveFixture, "HR"), []);
  assert.equal(discoverItems(discoveryIndex, "HR").every(({ reasons }) => reasons.some(({ kind, displayValue }) => kind === "synonym" && displayValue === "Recruiting")), true);
});

test("synonyms are explicit, one-way, and never recursively expanded", () => {
  const fixture: DiscoveryItem[] = [
    { id: "canonical", group: "Pages", title: "Recruiting Guide", description: "x", category: "x", tags: [], keywords: [], status: "Live" },
    { id: "sibling-alias", group: "Pages", title: "Recruiter Guide", description: "x", category: "x", tags: [], keywords: [], status: "Live" },
  ];

  assert.equal(discoverySynonymGroups.some(({ canonical, aliases }) => canonical === "Recruiting" && aliases.some(({ value }) => value === "HR")), true);
  assert.deepEqual(discoverItems(fixture, "HR").map(({ item }) => item.id), ["canonical"]);
  assert.equal(discoveryRelationships.some(({ query }) => query === "Arbeitgeber wechseln"), true);
  assert.equal(discoveryRelationships.some(({ query }) => query === "Idee umsetzen"), true);
});

test("higher ranking tiers cannot be overtaken by dimension volume or coverage", () => {
  const fixture: DiscoveryItem[] = [
    {
      id: "category",
      group: "Pages",
      title: "Direct",
      description: "x",
      category: "Alpha",
      tags: [],
      keywords: [],
      status: "Live",
    },
    {
      id: "dimensions",
      group: "Pages",
      title: "Context",
      description: "x",
      category: "x",
      tags: [],
      keywords: [],
      status: "Live",
      dimensions: {
        intent: ["Alpha", "Beta", "Gamma", "Delta"],
        goals: ["Alpha Beta", "Beta Gamma", "Gamma Delta", "Delta Alpha"],
        problems: ["Alpha problem", "Beta problem", "Gamma problem", "Delta problem"],
        useCases: ["Alpha case", "Beta case", "Gamma case", "Delta case"],
      },
    },
  ];
  const results = discoverItems(fixture, "Alpha Beta Gamma Delta");

  assert.equal(results[0].item.id, "category");
  assert.ok(results[0].score > results[1].score);
  assert.ok(results[1].score < 300);
});

function getReasonSourceValues(match: DiscoveryMatch): string[] {
  const { item } = match;
  return match.reasons.map((reason) => {
    if (reason.source === "title" || reason.source === "category" || reason.source === "description") return item[reason.source];
    if (reason.source === "tag") return item.tags.find((value) => value === reason.value) ?? "";
    if (reason.source === "keyword") return item.keywords.find((value) => value === reason.value) ?? "";
    return item.dimensions?.[reason.source]?.find((value) => value === reason.value) ?? "";
  });
}

test("explainability is engine-owned, deduplicated, bounded, and grounded in matched fields", () => {
  const matches = discoverItems(discoveryIndex, "Community und Feedback");
  const echoWall = matches.find(({ item }) => item.id === "tool-echowall");
  assert.ok(echoWall);
  assert.ok(echoWall.reasons.length > 0 && echoWall.reasons.length <= 2);
  assert.equal(new Set(echoWall.reasons.map(({ displayValue }) => normalizeDiscoveryText(displayValue))).size, echoWall.reasons.length);
  assert.deepEqual(getReasonSourceValues(echoWall), echoWall.reasons.map(({ value }) => value));

  for (const reason of echoWall.reasons) {
    assert.ok(["direct", "synonym", "relationship"].includes(reason.kind));
    assert.ok(["Passt zu", "Gefunden über", "Relevant für"].includes(reason.label));
    assert.ok(normalizeDiscoveryText(reason.value).includes(normalizeDiscoveryText(reason.matchedTerm)));
  }

  const titleOnly: DiscoveryItem = { id: "title-only", group: "Pages", title: "Needle", description: "x", category: "x", tags: [], keywords: [], status: "Live" };
  const descriptionOnly: DiscoveryItem = { id: "description-only", group: "Pages", title: "x", description: "Needle", category: "x", tags: [], keywords: [], status: "Live" };
  assert.deepEqual(discoverItems([titleOnly], "Needle")[0].reasons, []);
  assert.deepEqual(discoverItems([descriptionOnly], "Needle")[0].reasons, []);
});

test("one item and one normalized reason can appear only once", () => {
  const results = discoverItems(discoveryIndex, "Community und Feedback");
  assert.equal(new Set(results.map(({ item }) => item.id)).size, results.length);

  for (const { reasons } of results) {
    assert.equal(new Set(reasons.map(({ displayValue }) => normalizeDiscoveryText(displayValue))).size, reasons.length);
  }
});

test("all guided prompts are route-free and produce curated results", () => {
  const expectedItems = new Map([
    ["recruiting", "project-goatrecrutainer-area-recruiting-as-a-service"],
    ["career", "project-goatrecrutainer-area-career-agent"],
    ["stories", "interview-career-spotlight"],
    ["ideas", "project-goatrecrutainer-area-konzepterstellung"],
    ["orientation", "tool-echowall"],
    ["community", "tool-echowall"],
  ]);

  assert.equal(guidedDiscoveryPrompts.length, 6);
  assert.equal(new Set(guidedDiscoveryPrompts.map(({ id }) => id)).size, guidedDiscoveryPrompts.length);

  for (const prompt of guidedDiscoveryPrompts) {
    assert.equal(prompt.query.startsWith("/"), false, prompt.id);
    const results = discoverItems(discoveryIndex, prompt.query);
    assert.ok(results.length > 0, prompt.id);
    assert.equal(results.some(({ item }) => item.id === expectedItems.get(prompt.id)), true, prompt.id);
  }
});

test("GOATRECRUTAINER areas no longer inherit every project service as a keyword", () => {
  const areaItems = discoveryIndex.filter(({ id }) => id.startsWith("project-goatrecrutainer-area-"));
  assert.ok(areaItems.length > 0);
  assert.equal(areaItems.every(({ keywords }) => keywords.length === 0), true);
});

test("header preserves navigation and exposes desktop and mobile discovery controls", () => {
  const header = readFileSync(new URL("../components/layout/header.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../components/discovery/discovery-engine.tsx", import.meta.url), "utf8");

  assert.equal(header.includes("<DiscoveryEngine"), true);
  assert.equal(header.includes("setOpenDropdown(null)"), true);
  assert.equal(engine.includes("Projekte, Karriere, Menschen und Tools entdecken"), true);
  assert.equal(engine.includes("guidedDiscoveryPrompts.map"), true);
  assert.equal(engine.includes("data-guided-discovery-prompt"), true);
  assert.equal(engine.includes("applyGuidedPrompt(prompt.query)"), true);
  assert.equal(engine.includes('event.key !== "Enter" && event.key !== " "'), true);
  assert.equal(engine.includes("event.preventDefault()"), true);
  assert.equal(engine.includes("setActiveId(null)"), true);
  assert.equal(engine.includes("[input, ...promptButtons, ...options]"), true);
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

test("overlay results navigate directly without selecting a canvas top match", () => {
  const engine = readFileSync(new URL("../components/discovery/discovery-engine.tsx", import.meta.url), "utf8");
  const results = readFileSync(new URL("../components/discovery/discovery-results.tsx", import.meta.url), "utf8");
  const context = readFileSync(new URL("../components/discovery/discovery-context.tsx", import.meta.url), "utf8");

  assert.equal(engine.includes("selectForCanvas"), false);
  assert.equal(engine.includes("selectMatch"), false);
  assert.equal(engine.includes("router.push"), false);
  assert.equal(engine.includes("Boolean(item.href)"), true);
  assert.equal(engine.includes("document.getElementById(`discovery-option-${selected.id}`)?.click()"), true);
  assert.equal(engine.includes("onBeginNavigation={beginOverlayNavigation}"), true);
  assert.equal(engine.includes("onSettleNavigation={settleOverlayNavigation}"), true);
  assert.equal(engine.includes("mit Enter öffnen"), true);
  assert.equal(engine.includes("Enter Öffnen"), true);
  assert.equal(results.includes('import Link, { useLinkStatus } from "next/link"'), true);
  assert.equal(results.includes('role="option"'), true);
  assert.equal(results.includes('aria-disabled="true"'), true);
  assert.equal(results.includes("Noch nicht verfügbar"), true);
  assert.equal(results.includes("<button"), false);
  assert.equal(results.includes("onSelect"), false);
  assert.equal(results.includes("onBeginNavigation(item.href as string)"), true);
  assert.equal(results.includes("event.preventDefault()"), false);
  assert.equal(context.includes("selectedMatchId"), true);
  assert.equal(context.includes("selectMatch"), true);
  assert.equal(results.includes("selectMatch"), false);
});

test("context canvas stays homepage-local while the root layout remains server-rendered", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const context = readFileSync(new URL("../components/discovery/discovery-context.tsx", import.meta.url), "utf8");
  const canvas = readFileSync(new URL("../components/discovery/context-canvas.tsx", import.meta.url), "utf8");
  const discoveryView = readFileSync(new URL("../components/discovery/context-discovery-view.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../components/discovery/discovery-engine.tsx", import.meta.url), "utf8");
  const results = readFileSync(new URL("../components/discovery/discovery-results.tsx", import.meta.url), "utf8");
  const explanation = readFileSync(new URL("../components/discovery/discovery-explanation.tsx", import.meta.url), "utf8");
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
  assert.equal(engine.includes('router.push("/", { scroll: false })'), false);
  assert.equal(engine.includes("fixed inset-0"), false);
  assert.equal(engine.includes("selectForCanvas"), false);
  assert.equal(results.includes("<Link"), true);
  assert.equal(results.includes('role="option"'), true);
  assert.equal(results.includes("reasons={match.reasons}"), true);
  assert.equal(results.includes("maxReasons={1}"), true);
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
  assert.equal(discoveryView.includes("match={adaptiveView.topMatch}"), true);
  assert.equal(discoveryView.includes("reasons={match.reasons}"), true);
  assert.equal(discoveryView.includes("maxReasons={2}"), true);
  assert.equal(discoveryView.includes("remainingCount"), true);
  assert.equal(discoveryView.includes("preventScroll: true"), false);
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
  assert.equal(explanation.includes("reasons.slice(0, maxReasons)"), true);
  assert.equal(explanation.includes("aria-live"), false);
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

test("top match is one full-card link or a non-interactive article", () => {
  const discoveryView = readFileSync(new URL("../components/discovery/context-discovery-view.tsx", import.meta.url), "utf8");
  const topMatchStart = discoveryView.indexOf("function TopMatch");
  const topMatchEnd = discoveryView.indexOf("\n\nfunction ResultCard", topMatchStart);

  assert.ok(topMatchStart >= 0);
  assert.ok(topMatchEnd > topMatchStart);

  const topMatch = discoveryView.slice(topMatchStart, topMatchEnd);
  assert.equal(topMatch.includes("if (item.href)"), true);
  assert.equal(topMatch.match(/<Link/g)?.length, 1);
  assert.equal(topMatch.includes("<button"), false);
  assert.equal(topMatch.includes("tabIndex"), false);
  assert.equal(topMatch.includes("data-top-match-id={item.id}"), true);
  assert.equal(topMatch.includes("group block"), true);
  assert.equal(topMatch.includes("focus-visible:ring-2"), true);
  assert.equal(topMatch.includes("Detailseite öffnen →"), true);
  assert.equal(topMatch.includes("Noch nicht verfügbar"), true);
  assert.equal(topMatch.includes("<article"), true);
  assert.equal(topMatch.includes("beginNavigation(item.href as string)"), true);
  assert.equal(topMatch.includes("isUnmodifiedPrimaryClick(event)"), true);
  assert.equal(topMatch.includes("DiscoveryNavigationStatus"), true);
});

test("context canvas navigation resets only after the latest target takes over", () => {
  const context = readFileSync(new URL("../components/discovery/discovery-context.tsx", import.meta.url), "utf8");
  const discoveryView = readFileSync(new URL("../components/discovery/context-discovery-view.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../components/discovery/discovery-engine.tsx", import.meta.url), "utf8");
  const results = readFileSync(new URL("../components/discovery/discovery-results.tsx", import.meta.url), "utf8");

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
  assert.equal(results.includes("useLinkStatus"), true);
  assert.equal(results.includes("observedPending"), true);
  assert.equal(results.includes("DiscoveryNavigationStatus"), true);
  assert.equal(engine.includes("useLayoutEffect"), true);
  assert.equal(engine.includes("overlayNavigation"), true);
  assert.equal(engine.includes("settleOverlayNavigation"), true);
  assert.equal(engine.includes("settleCanvasNavigation(navigation.targetHref, navigation.id)"), true);
  assert.equal(engine.includes("if (!navigationPending) overlayNavigation.current = null"), true);
  assert.equal(engine.includes("dismissDiscovery(false)"), true);
  assert.equal(discoveryView.includes("DiscoveryNavigationStatus"), true);
  assert.equal(discoveryView.includes("data-navigation-pending"), true);
  assert.equal(results.includes("isUnmodifiedPrimaryClick"), true);
  assert.equal(results.includes("event.button === 0"), true);
  assert.equal(results.includes("!event.metaKey"), true);
  assert.equal(results.includes("!event.ctrlKey"), true);
  assert.equal(results.includes("!event.shiftKey"), true);
  assert.equal(results.includes("!event.altKey"), true);
  assert.equal(discoveryView.includes("onNavigate={clearDiscovery}"), false);
});

test("discovery results own compact scrolling and keep keyboard movement local", () => {
  const engine = readFileSync(new URL("../components/discovery/discovery-engine.tsx", import.meta.url), "utf8");
  const results = readFileSync(new URL("../components/discovery/discovery-results.tsx", import.meta.url), "utf8");

  assert.equal(engine.includes("max-h-[calc(100svh-7rem)]"), true);
  assert.equal(engine.includes("flex-col"), true);
  assert.equal(engine.includes("min-h-0 flex-1 overflow-hidden"), true);
  assert.equal(engine.includes("shrink-0"), true);
  assert.equal(engine.includes("↑↓ Auswahl · Enter Öffnen · Esc Schließen"), true);
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
