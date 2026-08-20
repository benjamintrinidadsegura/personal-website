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
import { getAboutContent, getAboutPageCopy } from "../data/i18n/about";
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
  assert.equal(getAboutPageCopy("de").title, "Benjamin Trinidad Segura — Über mich & Arbeit | bts.online");
  assert.equal(getAboutPageCopy("en").title, "Benjamin Trinidad Segura — About & Work | bts.online");
  assert.match(page, /createLocalizedMetadata\(\{ locale, pathname: "\/about"/u);
  assert.match(page, /const locale = await getLocale\(\)/u);
  assert.match(page, /type: "profile"/u);
  assert.equal((page.match(/<h1\b/gu) ?? []).length, 1);
});

test("ProfilePage and Person JSON-LD use verified relationships without unsupported employment claims", () => {
  const page = source("../app/about/page.tsx");
  assert.match(page, /"@type": "ProfilePage"/u);
  assert.match(page, /"@type": "Person"/u);
  assert.match(page, /"@type": "Brand"/u);
  assert.match(page, /sameAs: personProfiles\.map/u);
  assert.match(page, /sameAs: goatProfiles\.map/u);
  assert.match(page, /knowsAbout: \[\.\.\.positioning\.fields\]/u);
  assert.match(page, /inLanguage: story\.sourceLanguage/u);
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
  assert.match(page, /localizeHref\("\/people", locale\)/u);
  assert.match(page, /copy\.pathItems\.map/u);
  assert.deepEqual(getAboutPageCopy("en").pathItems.map(({ href }) => href), ["/#building", "/people", "/writing", "/find-your-next-step"]);
  assert.match(page, /localizeHref\("\/#contact", locale\)/u);
  assert.match(page, /now\.items\.map/u);
  assert.match(page, /PrivacyVideo/u);
});

test("English About translates editorial framing while preserving owner source identity and language", () => {
  const german = getAboutContent("de");
  const english = getAboutContent("en");

  assert.equal(english.ownerStories.length, german.ownerStories.length);
  assert.deepEqual(english.ownerStories.map(({ id }) => id), german.ownerStories.map(({ id }) => id));
  assert.deepEqual(english.ownerStories.map(({ video }) => video), german.ownerStories.map(({ video }) => video));
  assert.equal(english.ownerStories.every(({ sourceLanguage }) => sourceLanguage === "de"), true);
  assert.notEqual(english.positioning.explanation, german.positioning.explanation);
  assert.equal(german.positioning.primary, "Menschlichere Systeme entwickeln, indem fehlender Kontext sichtbar wird.");
  assert.deepEqual(german.values.map(({ title }) => title), [
    "Kontext vor Kategorien",
    "Veränderung vor Funktionen",
    "Verstehen, nicht vermessen",
    "Die Deutung bleibt beim Menschen",
  ]);
  assert.deepEqual(german.projectEvidence.slice(0, 2).map(({ status }) => status), ["Aktiv / im Wachstum", "Neuaufbau"]);
  assert.deepEqual(german.ownerStories.map(({ label }) => label), [
    "Benjamin spricht / Quelle aus erster Person",
    "KI-Perspektive / Sekundärquelle",
  ]);
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
