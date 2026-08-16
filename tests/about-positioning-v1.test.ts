import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  aboutPositioning,
  aboutProjectEvidence,
  ownerStories,
  redThreadExamples,
  values,
} from "../data/about";
import { discoveryIndex } from "../data/discovery-index";
import { getProject } from "../data/projects";
import { siteConfig } from "../data/site";
import { publishedSpotlights } from "../data/spotlights";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("About establishes the canonical Benjamin identity and evidence-backed positioning", () => {
  assert.equal(aboutPositioning.name, "Benjamin Trinidad Segura");
  assert.equal(aboutPositioning.primary, "Building more human systems by making missing context visible.");
  assert.match(aboutPositioning.explanation, /Lebensläufe, Labels, Rankings/iu);
  assert.deepEqual(aboutPositioning.fields, [
    "Recruiting",
    "Talent Acquisition",
    "Product Thinking",
    "AI-assisted reflection",
    "Community",
    "Storytelling",
    "Discovery",
    "Human Context",
  ]);
  assert.equal(values.length, 4);
  assert.equal(redThreadExamples.length, 4);
});

test("About metadata is canonical and supplies complete social preview metadata", () => {
  const page = source("../app/about/page.tsx");
  assert.match(page, /Benjamin Trinidad Segura — About & Work \| bts\.online/u);
  assert.match(page, /alternates: \{ canonical: "\/about" \}/u);
  assert.match(page, /openGraph:/u);
  assert.match(page, /twitter:/u);
  assert.match(page, /type: "profile"/u);
  assert.equal((page.match(/<h1\b/gu) ?? []).length, 1);
});

test("ProfilePage and Person JSON-LD use verified relationships without unsupported employment claims", () => {
  const page = source("../app/about/page.tsx");
  assert.match(page, /"@type": "ProfilePage"/u);
  assert.match(page, /"@type": "Person"/u);
  assert.match(page, /"@type": "Brand"/u);
  assert.match(page, /sameAs: personProfiles/u);
  assert.match(page, /sameAs: goatProfiles/u);
  assert.match(page, /knowsAbout: \[\.\.\.aboutPositioning\.fields\]/u);
  assert.match(page, /JSON\.stringify\(profileJsonLd\)\.replace/u);
  assert.doesNotMatch(page, /worksFor|affiliation|award|alumniOf|hasCredential/u);

  assert.deepEqual(siteConfig.socialLinks.filter(({ context }) => context === siteConfig.name).map(({ label }) => label), ["LinkedIn"]);
  assert.deepEqual(siteConfig.socialLinks.filter(({ context }) => context === "GOATRECRUTAINER").map(({ label }) => label), ["TikTok", "Instagram", "YouTube"]);
});

test("project evidence resolves from canonical public project and tool destinations", () => {
  assert.deepEqual(aboutProjectEvidence.map(({ name }) => name), [
    "GOATRECRUTAINER",
    "RateCom",
    "bts.online",
    "Find Your Next Step",
    "Life Alignment",
  ]);
  assert.equal(aboutProjectEvidence.find(({ name }) => name === "GOATRECRUTAINER")?.externalUrl, getProject("goatrecrutainer")?.externalUrl);
  assert.equal(aboutProjectEvidence.find(({ name }) => name === "RateCom")?.status, getProject("ratecom")?.status);
  for (const project of aboutProjectEvidence) assert.match(project.href, /^\//u);
});

test("owner sources remain separate from guests and preserve their required authority boundaries", () => {
  assert.equal(publishedSpotlights.some(({ fullName }) => fullName === aboutPositioning.name), false);
  assert.equal(ownerStories.length, 2);
  const introduction = ownerStories.find(({ id }) => id === "benjamin-goatrecrutainer-introduction");
  const reflection = ownerStories.find(({ id }) => id === "benjamin-ai-reflection");
  assert.ok(introduction);
  assert.match(introduction.label, /Benjamin says|First-person/u);
  assert.match(introduction.context.join(" "), /eigene öffentliche Beschreibung/u);
  assert.ok(reflection && "disclaimer" in reflection);
  assert.match(reflection.disclaimer, /AI-generated perspective/u);
  assert.match(reflection.disclaimer, /keine objektive Wahrheit/u);
  assert.match(reflection.disclaimer, /keine psychologische Beurteilung oder Diagnose/u);
  assert.match(reflection.disclaimer, /Deutungshoheit vollständig bei Benjamin/u);
});

test("About integrates People, projects, writing, tools, contact, and the canonical Now source", () => {
  const page = source("../app/about/page.tsx");
  assert.match(page, /publishedSpotlights\.length/u);
  assert.match(page, /href="\/people"/u);
  assert.match(page, /href: "\/writing"/u);
  assert.match(page, /href: "\/find-your-next-step"/u);
  assert.match(page, /href="\/#contact"/u);
  assert.match(page, /nowItems\.map/u);
  assert.match(page, /PrivacyVideo/u);
});

test("About is discoverable and remains present in the production sitemap model", () => {
  const about = discoveryIndex.find(({ id }) => id === "page-about");
  assert.equal(about?.href, "/about");
  assert.equal(about?.title, "Benjamin Trinidad Segura — About & Work");
  assert.equal(about?.keywords.includes("Recruiting"), true);
  assert.equal(about?.keywords.includes("Talent Acquisition"), true);
  assert.equal(about?.keywords.includes("Product Thinking"), true);
  assert.match(source("../app/sitemap.ts"), /"\/about"/u);
});

test("no internal Calendly destination or unverified proof claim leaks into About", () => {
  const combined = [source("../app/about/page.tsx"), source("../data/about.ts")].join("\n");
  assert.doesNotMatch(combined, /calendly\.com|meeting_types|user\/me/iu);
  assert.doesNotMatch(combined, /\b(?:Umsatz|Revenue|Placements?|Hires?|Awards?|Zertifikat|Certificate)\b/iu);
  assert.equal(siteConfig.booking.url, null);
});

test("About content structures keep long strings wrapping inside responsive layouts", () => {
  const page = source("../app/about/page.tsx");
  assert.match(page, /overflow-hidden/u);
  assert.match(page, /flex-wrap/u);
  assert.match(page, /\[overflow-wrap:anywhere\]|break-words|text-\[clamp\(/u);
  assert.doesNotMatch(page, /min-w-\[[4-9][0-9]{2}px\]/u);
});
