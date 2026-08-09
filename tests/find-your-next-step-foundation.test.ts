import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { findYourNextStep, getNextStepJourney, nextStepJourneys } from "../data/find-your-next-step";

const expectedSlugs = ["self", "career", "problem", "idea"] as const;
const expectedRoutes = expectedSlugs.map((slug) => `/find-your-next-step/${slug}`);

test("FYNS defines exactly four complete and uniquely addressable journeys", () => {
  assert.equal(nextStepJourneys.length, 4);
  assert.deepEqual(nextStepJourneys.map(({ slug }) => slug), expectedSlugs);
  assert.deepEqual(nextStepJourneys.map(({ href }) => href), expectedRoutes);
  assert.equal(new Set(nextStepJourneys.map(({ id }) => id)).size, 4);
  assert.equal(new Set(nextStepJourneys.map(({ slug }) => slug)).size, 4);
  assert.equal(new Set(nextStepJourneys.map(({ href }) => href)).size, 4);

  for (const journey of nextStepJourneys) {
    assert.equal(journey.status, journey.slug === "self" ? "Beta" : "In Development", journey.slug);
    assert.ok(journey.title.length > 0, journey.slug);
    assert.ok(journey.description.length > 0, journey.slug);
    assert.ok(journey.expectations.length >= 3, journey.slug);
    assert.ok(journey.analysisAreas.length >= 4, journey.slug);
    assert.ok(journey.discovery.category.length > 0, journey.slug);
    assert.ok(journey.discovery.tags.length > 0, journey.slug);
    assert.ok(journey.discovery.keywords.length > 0, journey.slug);
    assert.equal(getNextStepJourney(journey.slug), journey);
  }

  assert.equal(findYourNextStep.status, "Beta");
  assert.equal(findYourNextStep.href, "/find-your-next-step");
  assert.equal(getNextStepJourney("unknown"), undefined);
});

test("the problem journey owns the only professional-help boundary", () => {
  const problemJourney = getNextStepJourney("problem");
  assert.ok(problemJourney?.professionalBoundary);
  assert.equal(problemJourney.professionalBoundary.includes("medizinische"), true);
  assert.equal(problemJourney.professionalBoundary.includes("psychologische"), true);
  assert.equal(problemJourney.professionalBoundary.includes("rechtliche"), true);

  for (const journey of nextStepJourneys.filter(({ slug }) => slug !== "problem")) {
    assert.equal("professionalBoundary" in journey, false, journey.slug);
  }
});

test("FYNS overview and unfinished journey shell stay semantic, server-rendered, and storage-free", () => {
  const overview = readFileSync(new URL("../components/find-your-next-step/find-your-next-step-overview.tsx", import.meta.url), "utf8");
  const journey = readFileSync(new URL("../components/find-your-next-step/find-your-next-step-journey.tsx", import.meta.url), "utf8");
  const overviewPage = readFileSync(new URL("../app/find-your-next-step/page.tsx", import.meta.url), "utf8");
  const journeyPage = readFileSync(new URL("../app/find-your-next-step/[slug]/page.tsx", import.meta.url), "utf8");
  const implementation = [overview, journey, overviewPage, journeyPage].join("\n");

  assert.equal(overview.match(/<h1\b/gu)?.length, 1);
  assert.equal(journey.match(/<h1\b/gu)?.length, 1);
  assert.equal(overview.includes('<nav aria-label="Breadcrumb"'), true);
  assert.equal(journey.includes('<nav aria-label="Breadcrumb"'), true);
  assert.equal(overview.includes("<ol"), true);
  assert.equal(overview.includes("nextStepJourneys.map"), true);
  assert.equal(journey.includes("journey.expectations.map"), true);
  assert.equal(journey.includes("journey.analysisAreas.map"), true);
  assert.equal(journey.includes("journey.professionalBoundary"), true);
  assert.equal(implementation.includes('"use client"'), false);

  for (const prohibited of [
    "<form",
    "<input",
    "<textarea",
    "<select",
    "localStorage",
    "sessionStorage",
    "document.cookie",
    "@/lib/supabase",
    "fetch(",
  ]) {
    assert.equal(implementation.includes(prohibited), false, prohibited);
  }
});

test("the dynamic journey route owns static params, metadata, canonicals, and unknown-slug handling", () => {
  const route = readFileSync(new URL("../app/find-your-next-step/[slug]/page.tsx", import.meta.url), "utf8");

  assert.equal(route.includes("generateStaticParams"), true);
  assert.equal(route.includes("generateMetadata"), true);
  assert.equal(route.includes("alternates: { canonical: journey.href }"), true);
  assert.equal(route.includes("if (!journey) notFound()"), true);
  assert.equal(route.includes("nextStepJourneys.map"), true);
  assert.equal(route.includes('if (journey.slug === "self")'), true);
  assert.equal(route.includes("<FindYourNextStepSelf journey={journey} />"), true);
});
