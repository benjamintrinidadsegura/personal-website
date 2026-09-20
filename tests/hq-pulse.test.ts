import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { discoveryIndex } from "../data/discovery-index";
import {
  getHumanPulseContent,
  humanPulseEditorial,
  isSafeOpenLoopHref,
  selectActiveOpenLoops,
  validateOpenLoops,
} from "../data/human-pulse";
import {
  HQ_PULSE_LIMIT,
  createDiscoveryPulseCurrentStates,
  createHqPulseViewModel,
  createPeoplePulseCandidates,
  createProjectPulseCurrentStates,
  createWorldMapPulseCurrentStates,
  createWritingPulseCandidates,
  hqPulseItems,
  hqPulseSourceClassification,
  resolveHqPulseItems,
} from "../data/hq-pulse";
import {
  getHqPulseCopy,
  localizeHqPulseCurrentStates,
  localizeHqPulseItems,
} from "../data/i18n/hq-pulse";
import { getHomeCopy } from "../data/i18n/home";
import { projects } from "../data/projects";
import { publishedSpotlights, spotlights } from "../data/spotlights";
import { createWorldMapConnections } from "../data/world-map";
import { mapPublicWritingSummary } from "../lib/writing/domain";
import { isSafeLocalPathname } from "../lib/i18n/routing";
import { locales } from "../lib/i18n/config";
import type { DiscoveryItem } from "../types/discovery";
import { openLoopTypes, type HqPulseItem, type OpenLoop } from "../types/hq-pulse";
import type { PublicWritingSummary } from "../types/writing";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const publishedWritingRow = {
  id: "5f934b30-1db2-4d33-a78d-adb8dc8f555f",
  slug: "a-public-field-note",
  title: "A public Field Note",
  deck: "Context before conclusions.",
  excerpt: "A canonical public article with enough useful context for HQ Pulse.",
  body: "A canonical public article body with enough words to satisfy the existing public mapper.",
  body_json: null,
  content_type: "essay",
  topics: ["Building"],
  status: "published",
  published_at: "2026-08-16T10:30:00.000Z",
};

function publicWriting(overrides: Partial<PublicWritingSummary> = {}): PublicWritingSummary {
  const mapped = mapPublicWritingSummary(publishedWritingRow);
  assert.ok(mapped);
  return { ...mapped, ...overrides };
}

function event(overrides: Partial<HqPulseItem> = {}): HqPulseItem {
  return {
    id: "people-public-conversation",
    source: "people",
    type: "conversation",
    occurredAt: "2026-08-16T12:00:00.000Z",
    title: "A public conversation",
    summary: "Canonical public context.",
    href: "/people/public-conversation",
    provenance: { source: "people", entityId: "public-conversation", key: "people:public-conversation:published" },
    ...overrides,
  };
}

function loop(overrides: Partial<OpenLoop> = {}): OpenLoop {
  return {
    id: "feedback-on-hq",
    type: "feedback",
    status: "active",
    title: "Share useful feedback",
    context: "Tell me what helps this public Digital HQ make more sense.",
    order: 1,
    cta: { label: "Get in touch", href: "/#contact" },
    ...overrides,
  };
}

test("source classification is truthful before composition", () => {
  assert.deepEqual(hqPulseSourceClassification, {
    writing: "EVENT_CAPABLE",
    projects: "CURRENT_STATE_ONLY",
    people: "EVENT_CAPABLE",
    "world-map": "CURRENT_STATE_ONLY",
    discovery: "CURRENT_STATE_ONLY",
  });
});

test("Writing adapter accepts only canonical public summaries with trustworthy publication time", () => {
  const article = publicWriting();
  const [pulse] = createWritingPulseCandidates([article]);
  assert.equal(pulse.id, `writing-${article.id}`);
  assert.equal(pulse.provenance.key, `writing:${article.id}:published`);
  assert.equal(pulse.occurredAt, article.publishedAt);
  assert.equal(pulse.href, `/writing/${article.slug}`);
  assert.equal(mapPublicWritingSummary({ ...publishedWritingRow, status: "draft" }), null);
  assert.equal(mapPublicWritingSummary({ ...publishedWritingRow, published_at: null }), null);
  assert.deepEqual(createWritingPulseCandidates([publicWriting({ publishedAt: "invalid" })]), []);
});

test("People adapter accepts published conversations and rejects draft or undated records", () => {
  const candidates = createPeoplePulseCandidates([
    ...publishedSpotlights,
    { ...spotlights[0], id: "person-hidden", slug: "hidden", status: "draft" },
    { ...spotlights[0], id: "person-undated", slug: "undated", publishedAt: undefined },
  ]);
  assert.equal(candidates.length, 6);
  assert.equal(candidates.every(({ source, type }) => source === "people" && type === "conversation"), true);
  assert.equal(candidates.every(({ occurredAt }) => !Number.isNaN(Date.parse(occurredAt))), true);
  assert.equal(candidates.some(({ href }) => href.includes("hidden") || href.includes("undated")), false);
});

test("Projects remain current state because the public registry has no event history", () => {
  const states = createProjectPulseCurrentStates(projects);
  assert.deepEqual(states.map(({ entityId }) => entityId), projects.filter(({ featured }) => featured).map(({ slug }) => slug));
  assert.equal(states.every(({ href }) => /^\/projects\/[a-z0-9-]+$/u.test(href)), true);
  assert.equal(JSON.stringify(states).includes("occurredAt"), false);
});

test("World Map reuses accepted public connections without inventing relationship dates", () => {
  const connections = createWorldMapConnections(publishedSpotlights);
  const states = createWorldMapPulseCurrentStates(connections);
  assert.ok(connections.length > 0);
  assert.equal(states.length, 1);
  assert.equal(states[0]?.href, "/world");
  assert.equal(states[0]?.template, "world-map-public-context");
  assert.equal(JSON.stringify(states).includes("occurredAt"), false);
  assert.deepEqual(createWorldMapPulseCurrentStates([]), []);
});

test("Discovery exposes current availability and never recycles Pulse as its own source", () => {
  const fixtures: DiscoveryItem[] = [
    { id: "page-public", group: "Pages", title: "Public", description: "Public", category: "Page", tags: [], keywords: [], status: "Live", href: "/public" },
    { id: "pulse-self", group: "Insights", title: "Pulse", description: "Pulse", category: "Publication", tags: [], keywords: [], status: "Live", href: "/#pulse" },
    { id: "page-pulse", group: "Pages", title: "Pulse", description: "Pulse", category: "Page", tags: [], keywords: [], status: "Live", href: "/#pulse" },
    { id: "future", group: "Tools", title: "Future", description: "Future", category: "Tool", tags: [], keywords: [], status: "Coming Soon" },
  ];
  assert.equal(createDiscoveryPulseCurrentStates(fixtures).length, 1);
  assert.equal(createDiscoveryPulseCurrentStates(fixtures)[0]?.entityId, "public-index");
  assert.deepEqual(createDiscoveryPulseCurrentStates(fixtures.slice(1)), []);
});

test("chronology is newest first with deterministic ties, invalid dates omitted, and provenance deduplicated", () => {
  const duplicate = event({ id: "duplicate", title: "Duplicate copy" });
  const sameTimeLaterKey = event({ id: "writing-same-time", source: "writing", type: "publication", provenance: { source: "writing", entityId: "same", key: "writing:same:published" }, href: "/writing/same" });
  const newest = event({ id: "newest", occurredAt: "2026-08-17T12:00:00.000Z", provenance: { source: "people", entityId: "newest", key: "people:newest:published" } });
  const invalid = event({ id: "invalid", occurredAt: "not-a-date", provenance: { source: "people", entityId: "invalid", key: "people:invalid:published" } });
  const resolved = resolveHqPulseItems([duplicate, sameTimeLaterKey, newest, invalid, event()]);
  assert.deepEqual(resolved.map(({ id }) => id), ["newest", "duplicate", "writing-same-time"]);
  assert.equal(resolved.some(({ id }) => id === "invalid"), false);
});

test("timeline selection is bounded by one domain constant and does not invent source quotas", () => {
  const many = Array.from({ length: HQ_PULSE_LIMIT + 3 }, (_, index) => event({
    id: `event-${index}`,
    occurredAt: new Date(Date.UTC(2026, 7, index + 1)).toISOString(),
    provenance: { source: "people", entityId: String(index), key: `people:${index}:published` },
  }));
  const view = createHqPulseViewModel({ people: [], publishedWriting: [], sourceProjects: [], worldMapConnections: [], discoveryItems: [], limit: HQ_PULSE_LIMIT });
  assert.equal(resolveHqPulseItems(many).length, HQ_PULSE_LIMIT);
  assert.equal(view.timelineLimit, HQ_PULSE_LIMIT);
  assert.equal(source("../data/hq-pulse.ts").includes("perSource"), false);
});

test("Human Pulse preserves accepted Right Now and On My Mind while completing every locale", () => {
  const activeTypes = ["team-up", "interview", "feedback", "expertise-help"];
  for (const locale of locales) {
    const now = getHomeCopy(locale).now;
    const human = getHumanPulseContent(locale);
    assert.deepEqual(human.rightNow.map(({ label, text }) => ({ label, text })), now.items.slice(0, 3).map((text, index) => ({ label: now.labels[index], text })), locale);
    assert.deepEqual(human.onMyMind, { id: "on-my-mind", label: now.labels[3], text: now.items[3] }, locale);
    assert.ok(human.next?.text, locale);
    assert.equal(human.openLoops.length, 4, locale);
    assert.deepEqual(human.openLoops.map(({ type }) => type), activeTypes, locale);
    assert.equal(human.openLoops.every(({ status }) => status === "active"), true, locale);
    assert.equal(new Set(human.openLoops.map(({ id }) => id)).size, 4, locale);
    assert.equal(human.openLoops.every(({ cta }) => cta?.href === "/#contact" && isSafeOpenLoopHref(cta.href)), true, locale);
    assert.equal(human.openLoops.every(({ publishedAt }) => publishedAt === undefined), true, locale);
    assert.equal(human.updatedAt, undefined, locale);
  }
  assert.deepEqual(openLoopTypes.filter((type) => !activeTypes.includes(type)), ["idea", "collaboration"]);
});

test("approved English Next and Open Loop source copy is preserved exactly", () => {
  assert.deepEqual(humanPulseEditorial.next.en, {
    id: "next",
    label: "Next",
    text: "Keep building the things I wish existed, write down what I learn along the way, and meet more of the people I wouldn't have met otherwise.",
  });
  assert.deepEqual(humanPulseEditorial.openLoops.en, [
    {
      id: "team-up-build-together",
      type: "team-up",
      status: "active",
      title: "Build something together",
      context: "I'm always interested in meeting people who like building unusual things, challenging assumptions and turning ideas into something real.",
      order: 1,
      cta: { label: "Let's talk", href: "/#contact" },
    },
    {
      id: "interview-tell-story",
      type: "interview",
      status: "active",
      title: "Tell me your story",
      context: "I'm looking for people with interesting paths, perspectives and experiences for conversations and interviews on bts.online.",
      order: 2,
      cta: { label: "Reach out", href: "/#contact" },
    },
    {
      id: "feedback-challenge-idea",
      type: "feedback",
      status: "active",
      title: "Challenge an idea",
      context: "See something on bts.online that could be better, stranger, clearer or more useful? I genuinely want to hear it.",
      order: 3,
      cta: { label: "Share your perspective", href: "/#contact" },
    },
    {
      id: "expertise-help-teach-me",
      type: "expertise-help",
      status: "active",
      title: "Know something I don't?",
      context: "Some of the best things I've built started with someone showing me a perspective, skill or piece of knowledge I didn't have yet.",
      order: 4,
      cta: { label: "Teach me something", href: "/#contact" },
    },
  ]);
});

test("Open Loop lifecycle, intentional ordering, type validation, and CTA safety fail closed", () => {
  const active = loop();
  const earlier = loop({ id: "idea", type: "idea", order: 0, cta: { label: "Share an idea", href: "https://www.linkedin.com/in/example" } });
  const closed = loop({ id: "closed", status: "closed", order: 2, cta: undefined });
  const archived = loop({ id: "archived", status: "archived", order: 3, cta: undefined });
  assert.deepEqual(selectActiveOpenLoops([active, closed, archived, earlier]).map(({ id }) => id), ["idea", "feedback-on-hq"]);
  assert.equal(isSafeOpenLoopHref("/#contact"), true);
  assert.equal(isSafeOpenLoopHref("https://example.com/context"), true);
  assert.equal(isSafeOpenLoopHref("javascript:alert(1)"), false);
  assert.equal(isSafeOpenLoopHref("http://example.com"), false);
  assert.throws(() => validateOpenLoops([loop({ cta: { label: "Unsafe", href: "javascript:alert(1)" } })]), /unsafe CTA/u);
  assert.throws(() => validateOpenLoops([loop(), loop()]), /duplicate Open Loop id/u);
});

test("composition keeps Human Pulse immutable while combining automatic events and current states", () => {
  const human = getHumanPulseContent("en");
  const view = createHqPulseViewModel({
    human,
    publishedWriting: [publicWriting()],
    discoveryItems: discoveryIndex,
  });
  assert.deepEqual(view.human, human);
  assert.equal(view.timeline.some(({ source }) => source === "writing"), true);
  assert.equal(view.timeline.some(({ source }) => source === "people"), true);
  assert.equal(view.currentStates.some(({ source }) => source === "projects"), true);
  assert.equal(view.currentStates.some(({ source }) => source === "world-map"), true);
  assert.equal(view.currentStates.some(({ source }) => source === "discovery"), true);
  assert.equal(JSON.stringify(view.timeline).includes("rightNow"), false);
});

test("localization changes presentation only and covers all seven UI locales", () => {
  const states = createHqPulseViewModel({ discoveryItems: discoveryIndex }).currentStates;
  for (const locale of locales) {
    const localized = localizeHqPulseItems(hqPulseItems, locale);
    const localizedStates = localizeHqPulseCurrentStates(states, locale);
    const pulseCopy = getHqPulseCopy(locale);
    assert.deepEqual(localized.map(({ id }) => id), hqPulseItems.map(({ id }) => id), locale);
    assert.deepEqual(localized.map(({ href }) => href), hqPulseItems.map(({ href }) => href), locale);
    assert.deepEqual(localized.map(({ occurredAt }) => occurredAt), hqPulseItems.map(({ occurredAt }) => occurredAt), locale);
    assert.deepEqual(localizedStates.map(({ id }) => id), states.map(({ id }) => id), locale);
    assert.equal(Object.keys(pulseCopy.sourceLabels).length, 5, locale);
    assert.equal(Object.keys(pulseCopy.openLoopTypeLabels).length, 6, locale);
    assert.ok(pulseCopy.description.length > 40, locale);
  }
});

test("every automatic destination is a safe canonical local route", () => {
  const view = createHqPulseViewModel({ publishedWriting: [publicWriting()], discoveryItems: discoveryIndex });
  for (const item of [...view.timeline, ...view.currentStates]) assert.equal(isSafeLocalPathname(item.href), true, item.href);
  assert.equal(view.timeline.every(({ href }) => href.startsWith("/writing/") || href.startsWith("/people/")), true);
});

test("privacy boundary excludes private product domains and activity-surveillance inputs", () => {
  const aggregation = source("../data/hq-pulse.ts");
  const writingQueries = source("../lib/writing/queries.ts");
  assert.equal(aggregation.includes("life-alignment"), false);
  assert.equal(aggregation.includes("find-your-next-step"), false);
  assert.equal(aggregation.includes("newsletter"), false);
  assert.equal(aggregation.includes("subscriber"), false);
  assert.equal(aggregation.includes("admin"), false);
  assert.equal(aggregation.includes("analytics"), false);
  assert.equal(aggregation.includes("git log"), false);
  assert.equal(aggregation.includes("Date.now"), false);
  assert.equal(writingQueries.includes('.eq("status", "published")'), true);
  assert.equal(writingQueries.includes('.not("published_at", "is", null)'), true);
});

test("presentation remains server-first, semantic, mobile-safe, and free of live polling", () => {
  const component = source("../components/sections/hq-pulse.tsx");
  const home = source("../app/page.tsx");
  assert.equal(component.includes('"use client"'), false);
  assert.equal(component.includes("setInterval"), false);
  assert.equal(component.includes("WebSocket"), false);
  assert.equal(component.includes("<ol"), true);
  assert.equal(component.includes("<time"), true);
  assert.equal(component.includes("grid grid-cols-1"), true);
  assert.equal(component.includes("min-w-0 border-b"), true);
  assert.equal(component.includes("min-h-11"), true);
  assert.equal(home.includes("<Now />"), false);
  assert.equal(home.includes("<HqPulse publishedWriting={publishedWriting} />"), true);
});

test("default source density needs neither filters nor Show More", () => {
  const view = createHqPulseViewModel({ discoveryItems: discoveryIndex });
  const component = source("../components/sections/hq-pulse.tsx");
  assert.equal(view.timelineEligibleCount, 6);
  assert.equal(view.timelineEligibleCount <= view.timelineLimit, true);
  assert.equal(component.includes("Show more"), false);
  assert.equal(component.includes("source filter"), false);
});
