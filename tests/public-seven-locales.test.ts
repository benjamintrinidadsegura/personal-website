import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { discoveryIndex } from "../data/discovery-index";
import { getAboutContent, getAboutPageCopy } from "../data/i18n/about";
import { getDiscoveryUiCopy, getGuidedDiscoveryPrompts, localizeDiscoveryItems } from "../data/i18n/discovery";
import { getHomeCopy } from "../data/i18n/home";
import { getHqPulseCopy, localizeHqPulseItems } from "../data/i18n/hq-pulse";
import { getPeopleCopy, getLocalizedPublishedSpotlights } from "../data/i18n/people";
import { getProjectPageCopy } from "../data/i18n/project-page";
import { getLocalizedProjects } from "../data/i18n/projects";
import { hqPulseItems } from "../data/hq-pulse";
import { publishedSpotlights } from "../data/spotlights";
import { discoverItems } from "../lib/discovery";
import { locales, type Locale } from "../lib/i18n/config";

const expectedLocales = ["de", "en", "es", "tr", "pl", "el", "ru"] as const;
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("public editorial dictionaries cover the authoritative seven-locale registry", () => {
  assert.deepEqual(locales, expectedLocales);
  for (const locale of expectedLocales) {
    const home = getHomeCopy(locale);
    const about = getAboutPageCopy(locale);
    const projects = getProjectPageCopy(locale);
    const people = getPeopleCopy(locale);
    const pulse = getHqPulseCopy(locale);
    const discovery = getDiscoveryUiCopy(locale);

    assert.ok(home.hero.claim.length > 30, locale);
    assert.ok(home.contact.bookingUnavailable.length > 20, locale);
    assert.equal(home.interviews.formats.length, 3, locale);
    assert.ok(about.description.length > 50, locale);
    assert.equal(about.pathItems.length, 4, locale);
    assert.equal(projects.detailLabels.length, 4, locale);
    assert.ok(people.videoPrivacy.length > 20, locale);
    assert.ok(pulse.description.length > 40, locale);
    assert.equal(getGuidedDiscoveryPrompts(locale).length, 7, locale);
    assert.ok(discovery.placeholder.length > 20, locale);
  }

  assert.match(getHomeCopy("es").hero.claim, /personas/u);
  assert.match(getHomeCopy("tr").hero.claim, /insanların/u);
  assert.match(getHomeCopy("pl").hero.claim, /ludzi/u);
  assert.match(getHomeCopy("el").hero.claim, /ανθρώπους/u);
  assert.match(getHomeCopy("ru").hero.claim, /людей/u);
});

test("About preserves seven natural positioning formulations and owner-source truth", () => {
  const expectedPositioning: Record<Locale, string> = {
    de: "Menschlichere Systeme entwickeln, indem fehlender Kontext sichtbar wird.",
    en: "Building more human systems by making missing context visible.",
    es: "Diseñar sistemas más humanos haciendo visible el contexto que falta.",
    tr: "Eksik bağlamı görünür kılarak daha insani sistemler geliştirmek.",
    pl: "Tworzyć bardziej ludzkie systemy, uwidaczniając brakujący kontekst.",
    el: "Να δημιουργούμε πιο ανθρώπινα συστήματα, κάνοντας ορατό το πλαίσιο που λείπει.",
    ru: "Создавать более человечные системы, делая видимым недостающий контекст.",
  };
  const german = getAboutContent("de");

  for (const locale of expectedLocales) {
    const localized = getAboutContent(locale);
    assert.equal(localized.positioning.primary, expectedPositioning[locale]);
    assert.equal(localized.values.length, 4, locale);
    assert.equal(localized.redThreadExamples.length, 4, locale);
    assert.equal(localized.projectEvidence.length, 5, locale);
    assert.deepEqual(localized.ownerStories.map(({ id }) => id), german.ownerStories.map(({ id }) => id), locale);
    assert.deepEqual(localized.ownerStories.map(({ video }) => video), german.ownerStories.map(({ video }) => video), locale);
    assert.equal(localized.ownerStories.every(({ sourceLanguage }) => sourceLanguage === "de"), true, locale);
  }
});

test("project localization preserves canonical identity and verified destinations in every locale", () => {
  const german = getLocalizedProjects("de");
  for (const locale of expectedLocales) {
    const localized = getLocalizedProjects(locale);
    assert.deepEqual(localized.map(({ slug }) => slug), german.map(({ slug }) => slug), locale);
    assert.deepEqual(localized.map(({ name }) => name), german.map(({ name }) => name), locale);
    assert.deepEqual(localized.map(({ externalUrl }) => externalUrl), german.map(({ externalUrl }) => externalUrl), locale);
    assert.equal(localized.length, 6, locale);
    assert.equal(localized.every(({ description, problem, goal, currentState }) => [description, problem, goal, currentState].every(Boolean)), true, locale);
  }
  for (const locale of expectedLocales.slice(1)) {
    assert.notEqual(getLocalizedProjects(locale)[5]?.description, german[5]?.description, locale);
  }
});

test("all seven People editorial layers preserve exactly six canonical source records", () => {
  for (const locale of expectedLocales) {
    const localized = getLocalizedPublishedSpotlights(locale);
    assert.equal(localized.length, 6, locale);
    assert.deepEqual(localized.map(({ id }) => id), publishedSpotlights.map(({ id }) => id), locale);
    assert.deepEqual(localized.map(({ slug }) => slug), publishedSpotlights.map(({ slug }) => slug), locale);
    assert.deepEqual(localized.map(({ language }) => language), publishedSpotlights.map(({ language }) => language), locale);
    assert.deepEqual(localized.map(({ video }) => video), publishedSpotlights.map(({ video }) => video), locale);
    assert.deepEqual(localized.map(({ chapters }) => chapters), publishedSpotlights.map(({ chapters }) => chapters), locale);
    assert.equal(localized.every(({ shortIntroduction, editorialIntroduction, sections, takeaways, expertise }) => shortIntroduction.length > 20 && editorialIntroduction.length > 0 && sections.length > 0 && takeaways.length > 0 && expertise.length > 0), true, locale);
  }
});

test("HQ Pulse localization changes presentation only and never duplicates releases", () => {
  for (const locale of expectedLocales) {
    const localized = localizeHqPulseItems(hqPulseItems, locale);
    assert.deepEqual(localized.map(({ id }) => id), hqPulseItems.map(({ id }) => id), locale);
    assert.deepEqual(localized.map(({ href }) => href), hqPulseItems.map(({ href }) => href), locale);
    assert.deepEqual(localized.map(({ date }) => date), hqPulseItems.map(({ date }) => date), locale);
    assert.equal(new Set(localized.map(({ id }) => id)).size, localized.length, locale);
  }
});

test("one Discovery index resolves representative native vocabulary into locale-aware routes", () => {
  const representative = {
    de: ["Beziehungen", "Lebensrichtung", "Schreiben", "Projekte", "Interviews", "Recruiting", "Karriere", "Idee", "Problem", "Tools"],
    en: ["relationships", "life direction", "writing", "projects", "interviews", "recruiting", "career", "idea", "problem", "tools"],
    es: ["relaciones", "dirección vital", "escritura", "proyectos", "entrevistas", "reclutamiento", "carrera", "ideas", "problema", "herramientas"],
    tr: ["ilişkiler", "yaşam yönü", "yazı", "projeler", "röportajlar", "işe alım", "kariyer", "fikirler", "sorun", "araçlar"],
    pl: ["relacje", "kierunek życia", "pisanie", "projekty", "wywiady", "rekrutacja", "kariera", "pomysły", "problem", "narzędzia"],
    el: ["σχέσεις", "κατεύθυνση ζωής", "γραφή", "έργα", "συνεντεύξεις", "προσλήψεις", "σταδιοδρομία", "ιδέες", "πρόβλημα", "εργαλεία"],
    ru: ["отношения", "направление жизни", "тексты", "проекты", "интервью", "найм", "карьера", "идеи", "проблема", "инструменты"],
  } satisfies Record<Locale, readonly string[]>;

  for (const locale of expectedLocales) {
    const items = localizeDiscoveryItems(discoveryIndex, locale);
    assert.deepEqual(items.map(({ id }) => id), discoveryIndex.map(({ id }) => id), locale);
    for (const query of representative[locale]) {
      assert.ok(discoverItems(items, query).length > 0, `${locale}: ${query}`);
    }
    const prefix = locale === "de" ? "" : `/${locale}`;
    assert.equal(items.every(({ href }) => !href || href.startsWith(prefix || "/")), true, locale);
  }
});

test("owned public surfaces contain no German-versus-everything-else locale branches", () => {
  const files = [
    "../data/i18n/about.ts", "../data/i18n/home.ts", "../data/i18n/projects.ts", "../data/i18n/project-page.ts",
    "../data/i18n/people.ts", "../data/i18n/hq-pulse.ts", "../data/i18n/discovery.ts",
    "../app/about/page.tsx", "../app/people/page.tsx", "../app/people/[slug]/page.tsx",
    "../components/sections/contact.tsx", "../components/sections/hero.tsx", "../components/sections/hq-pulse.tsx",
    "../components/sections/interviews.tsx", "../components/sections/writing.tsx", "../components/discovery/discovery-engine.tsx",
    "../components/spotlight/privacy-video.tsx",
  ];
  const combined = files.map(source).join("\n");
  assert.doesNotMatch(combined, /locale\s*={2,3}\s*["'](?:de|en)["']/u);
  assert.doesNotMatch(combined, /is(?:English|German)/u);
  assert.doesNotMatch(combined, /["']\/en(?:\/|["'])/u);
});
