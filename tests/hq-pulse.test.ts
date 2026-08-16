import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  HQ_PULSE_LIMIT,
  createHqPulseItems,
  createInterviewPulseCandidates,
  createWritingPulseCandidates,
  hqPulseItems,
  hqPulseUpdates,
  resolveHqPulseItems,
} from "../data/hq-pulse";
import { mapPublicWritingSummary } from "../lib/writing/domain";
import type { HqPulseCandidate, HqPulseUpdate, SpotlightPulseSource } from "../types/content";
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

function candidate(overrides: Partial<HqPulseCandidate> = {}): HqPulseCandidate {
  return {
    id: "public-update",
    identity: "editorial:public-update",
    origin: "editorial",
    sequence: 1,
    visibility: "public",
    kind: "ecosystem",
    type: "Digital HQ",
    title: "Public update",
    teaser: "Public context",
    href: "/#public",
    ctaLabel: "Public destination",
    ...overrides,
  };
}

function interview(overrides: Partial<SpotlightPulseSource> = {}): SpotlightPulseSource {
  return {
    slug: "public-interview",
    teaser: "A published interview with canonical public context.",
    status: "published",
    title: "A public Career Spotlight",
    format: "Career Spotlight",
    publishedAt: "2026-08-15T09:00:00.000Z",
    ...overrides,
  };
}

test("newly published canonical Writing becomes HQ Pulse eligible automatically", () => {
  const article = publicWriting();
  const [pulse] = createWritingPulseCandidates([article]);
  assert.equal(pulse.identity, `writing:${article.id}`);
  assert.equal(pulse.title, article.title);
  assert.equal(pulse.href, `/writing/${article.slug}`);
  assert.equal(pulse.date, article.publishedAt);
  assert.equal(pulse.origin, "canonical");
  assert.equal(createHqPulseItems({ publishedWriting: [article] })[0]?.id, `writing-${article.id}`);
});

test("draft and unpublished Writing cannot cross the existing public mapper boundary", () => {
  assert.equal(mapPublicWritingSummary({ ...publishedWritingRow, status: "draft" }), null);
  assert.equal(mapPublicWritingSummary({ ...publishedWritingRow, published_at: null }), null);
  assert.deepEqual(createWritingPulseCandidates([]), []);
});

test("published interviews are automatic while planned and draft interviews stay out", () => {
  const published = interview();
  const candidates = createInterviewPulseCandidates([
    published,
    interview({ slug: "planned", status: "planned", title: "Planned interview" }),
    interview({ slug: "draft", status: "draft", title: "Draft interview" }),
  ]);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.identity, `spotlight:${published.slug}`);
  assert.equal(candidates[0]?.href, `/people/${published.slug}`);
  assert.equal(candidates[0]?.date, published.publishedAt);
});

test("canonical content wins a manual duplicate while preserving its editorial fallback", () => {
  const article = publicWriting();
  const [canonical] = createWritingPulseCandidates([article]);
  const duplicate: HqPulseUpdate = {
    ...candidate({
      id: "manual-article-copy",
      identity: canonical.identity,
      sequence: 50,
      title: "Duplicated manual title",
      href: "/duplicated-manual-href",
    }),
    origin: "editorial",
    sequence: 50,
  };
  const resolved = resolveHqPulseItems([duplicate, canonical]);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0]?.title, article.title);
  assert.equal(resolved[0]?.href, `/writing/${article.slug}`);
});

test("ordering is deterministic across canonical dates and editorial fallback sequence", () => {
  const resolved = resolveHqPulseItems([
    candidate({ id: "manual-new", identity: "manual:new", sequence: 20 }),
    candidate({ id: "undated-interview", identity: "interview:undated", origin: "canonical", sequence: undefined }),
    candidate({ id: "dated-old", identity: "writing:old", origin: "canonical", sequence: undefined, date: "2026-08-01T12:00:00.000Z" }),
    candidate({ id: "dated-new", identity: "writing:new", origin: "canonical", sequence: undefined, date: "2026-08-16T12:00:00.000Z" }),
    candidate({ id: "manual-old", identity: "manual:old", sequence: 10 }),
  ]);
  assert.deepEqual(resolved.map(({ id }) => id), ["dated-new", "dated-old", "manual-new", "manual-old", "undated-interview"]);
  assert.equal(resolved[0]?.id, "dated-new");
});

test("selection returns at most five, handles fewer, and never leaks private material", () => {
  const many = Array.from({ length: 7 }, (_, index) => candidate({ id: `update-${index}`, identity: `update:${index}`, sequence: index + 1 }));
  assert.equal(resolveHqPulseItems(many).length, HQ_PULSE_LIMIT);
  assert.equal(resolveHqPulseItems(many)[0]?.id, "update-6");

  const sparse = resolveHqPulseItems([
    candidate({ id: "private", identity: "private", sequence: 30, visibility: "internal", title: "Private activity" }),
    candidate({ id: "draft", identity: "draft", sequence: 20, visibility: "unpublished", title: "Unpublished activity" }),
    candidate({ id: "public", identity: "public", sequence: 10 }),
  ]);
  assert.deepEqual(sparse.map(({ id }) => id), ["public"]);
  assert.equal(JSON.stringify(sparse).includes("Private activity"), false);
  assert.equal(JSON.stringify(sparse).includes("Unpublished activity"), false);
  assert.deepEqual(resolveHqPulseItems([], 5), []);
  assert.deepEqual(resolveHqPulseItems([candidate()], 0), []);
});

test("published edits retain canonical identity and original publication chronology", () => {
  const original = publicWriting();
  const edited = publicWriting({ title: "Updated public title" });
  const [before] = createWritingPulseCandidates([original]);
  const [after] = createWritingPulseCandidates([edited]);
  assert.equal(after.identity, before.identity);
  assert.equal(after.date, before.date);
  assert.equal(after.title, "Updated public title");
});

test("current editorial releases remain available while dated Spotlights enter the resolved pulse", () => {
  assert.deepEqual(hqPulseUpdates.map(({ id }) => id), [
    "ecosystem-contact-social-v1",
    "goatrecrutainer-ecosystem-v1",
    "ratecom-ecosystem-v1",
    "life-alignment-modular-v1",
    "find-your-next-step-v1",
  ]);
  assert.deepEqual(hqPulseItems.map(({ href }) => href), [
    "/people/evgeny-vinokurov",
    "/people/kiki-radicke",
    "/people/johanna-geisler",
    "/people/melanie-kleinhenz",
    "/people/kevin-schweisfurth",
  ]);
  assert.equal(hqPulseUpdates.every(({ visibility }) => visibility === "public"), true);
});

test("HQ Pulse and Discovery consume the same resolved public model", () => {
  const component = source("../components/sections/hq-pulse.tsx");
  const discovery = source("../data/discovery-index.ts");
  const layout = source("../app/layout.tsx");
  const home = source("../app/page.tsx");
  const writing = source("../components/sections/writing.tsx");

  assert.equal(component.includes("createHqPulseItems({ publishedWriting })"), true);
  assert.equal(component.includes('String(items.length).padStart(2, "0")'), true);
  assert.equal(component.includes("Newest"), true);
  assert.equal(discovery.includes("createHqPulseDiscoveryItems"), true);
  assert.equal(layout.includes("createHqPulseItems({ publishedWriting })"), true);
  assert.equal(layout.includes("createHqPulseDiscoveryItems(resolvedPulseItems)"), true);
  assert.equal(home.includes("<HqPulse publishedWriting={publishedWriting} />"), true);
  assert.equal(home.includes("<Writing publishedWriting={publishedWriting} />"), true);
  assert.equal(writing.includes("publishedWriting ?? await getPublishedWriting()"), true);
});

test("aggregation reads only canonical public summaries and static interview metadata", () => {
  const aggregation = source("../data/hq-pulse.ts");
  const writingQueries = source("../lib/writing/queries.ts");
  assert.equal(aggregation.includes("AdminWritingArticle"), false);
  assert.equal(aggregation.includes("writing_articles"), false);
  assert.equal(aggregation.includes('from "node:child_process"'), false);
  assert.equal(aggregation.includes("git log"), false);
  assert.equal(writingQueries.includes('.eq("status", "published")'), true);
  assert.equal(writingQueries.includes('.not("published_at", "is", null)'), true);
});
