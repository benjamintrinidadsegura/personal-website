import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ownerStories } from "../data/about";
import { discoveryIndex } from "../data/discovery-index";
import { createInterviewPulseCandidates } from "../data/hq-pulse";
import { getLocalizedPublishedSpotlights } from "../data/i18n/people";
import { filterPublishedSpotlights, getPublishedSpotlight, publishedSpotlights, spotlights } from "../data/spotlights";
import { locales } from "../lib/i18n/config";
import { getLocalizedPathname } from "../lib/i18n/routing";

const expectedGuests = [
  "evgeny-vinokurov",
  "kiki-radicke",
  "johanna-geisler",
  "kevin-schweisfurth",
  "amr-medhat",
  "melanie-kleinhenz",
];

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the V1 inventory contains exactly the six expected published guests", () => {
  assert.deepEqual(publishedSpotlights.map(({ slug }) => slug), expectedGuests);
  assert.equal(publishedSpotlights.length, 6);
  assert.equal(publishedSpotlights.every(({ status }) => status === "published"), true);
});

test("localized Spotlight editorial layers preserve every canonical source boundary", () => {
  for (const locale of locales) {
    const localized = getLocalizedPublishedSpotlights(locale);
    assert.equal(localized.length, 6);
    assert.deepEqual(localized.map(({ id }) => id), publishedSpotlights.map(({ id }) => id));
    assert.deepEqual(localized.map(({ slug }) => slug), publishedSpotlights.map(({ slug }) => slug));
    assert.deepEqual(localized.map(({ language }) => language), publishedSpotlights.map(({ language }) => language));
    assert.deepEqual(localized.map(({ video }) => video), publishedSpotlights.map(({ video }) => video));
    assert.deepEqual(
      localized.map(({ chapters }) => chapters.map(({ timestamp, seconds }) => ({ timestamp, seconds }))),
      publishedSpotlights.map(({ chapters }) => chapters.map(({ timestamp, seconds }) => ({ timestamp, seconds }))),
    );
  }
});

test("guest identities, slugs, publication timestamps, and videos are canonical and unique", () => {
  assert.equal(new Set(spotlights.map(({ id }) => id)).size, spotlights.length);
  assert.equal(new Set(spotlights.map(({ slug }) => slug)).size, spotlights.length);
  assert.equal(new Set(spotlights.map(({ fullName }) => fullName)).size, spotlights.length);
  assert.equal(new Set(spotlights.map(({ video }) => video?.youtubeId)).size, spotlights.length);

  for (const guest of spotlights) {
    assert.match(guest.id, /^person-[a-z0-9-]+$/u);
    assert.match(guest.slug, /^[a-z0-9-]+$/u);
    assert.ok(guest.publishedAt && !Number.isNaN(Date.parse(guest.publishedAt)));
    assert.ok(guest.video);
    assert.match(guest.video.youtubeId, /^[A-Za-z0-9_-]{11}$/u);
    assert.equal(guest.video.url, `https://www.youtube.com/watch?v=${guest.video.youtubeId}`);
    assert.ok(guest.chapters.length > 0);
    assert.ok(guest.takeaways.length > 0);
    assert.ok(guest.discovery.tags.length > 0);
  }
});

test("Kiki remains source-honest without a fabricated transcript or chapter timestamps", () => {
  const kiki = getPublishedSpotlight("kiki-radicke");
  assert.ok(kiki);
  assert.equal(kiki.fullName, "Kiki Radicke");
  assert.equal(kiki.video?.youtubeId, "NhfjBxcVo2E");
  assert.equal(kiki.chapters.every(({ timestamp, seconds }) => timestamp === undefined && seconds === undefined), true);
  assert.deepEqual(kiki.expertise, ["People & Culture", "Recruiting", "Employer Branding", "Leadership"]);
  assert.match(kiki.editorialIntroduction.join(" "), /Arbeitgeberattraktivität, Führung und Mitarbeiterbindung/u);
  assert.equal(JSON.stringify(kiki).toLocaleLowerCase("de-DE").includes("transkript"), false);
});

test("Melanie keeps only verified published chapter markers and never claims transcript availability", () => {
  const melanie = getPublishedSpotlight("melanie-kleinhenz");
  assert.ok(melanie);
  assert.equal(melanie.fullName, "Melanie Kleinhenz");
  assert.equal(melanie.video?.youtubeId, "O4k7-_jccTo");
  assert.deepEqual(melanie.chapters.map(({ timestamp, seconds }) => ({ timestamp, seconds })), [
    { timestamp: "00:00", seconds: 0 },
    { timestamp: "05:18", seconds: 318 },
    { timestamp: "23:09", seconds: 1389 },
    { timestamp: "25:19", seconds: 1519 },
    { timestamp: "44:50", seconds: 2690 },
    { timestamp: "54:10", seconds: 3250 },
    { timestamp: "1:46:50", seconds: 6410 },
    { timestamp: "2:30:45", seconds: 9045 },
  ]);
  assert.deepEqual(melanie.discovery.tags, ["Female Recruiting", "Employer Branding", "Diversity", "FemaleForward"]);
  assert.match(melanie.editorialIntroduction.join(" "), /FemaleForward/u);
  assert.equal(JSON.stringify(melanie).toLocaleLowerCase("de-DE").includes("transkript"), false);
});

test("publication filtering and route lookup do not leak unpublished people", () => {
  const hidden = { ...spotlights[0], id: "person-hidden", slug: "hidden-person", status: "draft" as const };
  assert.equal(filterPublishedSpotlights([...spotlights, hidden]).some(({ id }) => id === hidden.id), false);
  assert.equal(getPublishedSpotlight("hidden-person"), undefined);
  assert.equal(getPublishedSpotlight("evgeny-vinokurov")?.fullName, "Evgeny Vinokurov");
});

test("People index, detail routes, and privacy-aware video surface are integrated", () => {
  const index = source("../app/people/page.tsx");
  const detail = source("../app/people/[slug]/page.tsx");
  const video = source("../components/spotlight/privacy-video.tsx");
  assert.match(index, /publishedSpotlights\.map/u);
  assert.match(detail, /generateStaticParams/u);
  assert.match(detail, /getPublishedSpotlight/u);
  assert.match(detail, /application\/ld\+json/u);
  assert.match(detail, /break-words/u);
  assert.match(detail, /grid min-w-0 grid-cols-1/u);
  assert.match(detail, /\[overflow-wrap:anywhere\]/u);
  assert.match(video, /youtube-nocookie\.com/u);
  assert.match(video, /privacyCopy: Record<Locale/u);
  assert.match(video, /const copy = privacyCopy\[useLocale\(\)\]/u);
  assert.match(video, /\{copy\.load\}/u);
  assert.match(video, /\{copy\.consent\}/u);
  assert.match(video, /aspect-video/u);
});

test("Discovery indexes meaningful published expertise and no unpublished fixture", () => {
  const people = discoveryIndex.filter(({ group }) => group === "People");
  assert.deepEqual(people.map(({ id }) => id), publishedSpotlights.map(({ id }) => id));
  assert.equal(people.find(({ id }) => id === "person-kevin-schweisfurth")?.tags.includes("Video Editing"), true);
  assert.equal(people.find(({ id }) => id === "person-amr-medhat")?.tags.includes("DevSecOps"), true);
  assert.equal(people.find(({ id }) => id === "person-johanna-geisler")?.tags.includes("Community"), true);
  assert.equal(people.some(({ id }) => id === "person-hidden"), false);
});

test("HQ Pulse receives published Spotlight metadata and trustworthy dates", () => {
  const candidates = createInterviewPulseCandidates(spotlights);
  assert.equal(candidates.length, 6);
  for (const candidate of candidates) {
    assert.match(candidate.identity, /^spotlight:/u);
    assert.match(candidate.href, /^\/people\//u);
    assert.ok(candidate.date && !Number.isNaN(Date.parse(candidate.date)));
  }
});

test("World Map readiness separates presence from recommendation and keeps location optional", () => {
  for (const guest of spotlights) {
    assert.equal(guest.worldMap.ready, true);
    assert.deepEqual(guest.worldMap.relationshipTypes, ["interviewed"]);
    assert.equal(guest.worldMap.relationshipTypes.includes("recommended"), false);
  }
  assert.equal(spotlights.some(({ location }) => location === undefined), true);
  assert.equal(getPublishedSpotlight("amr-medhat")?.location?.country, "Ägypten");
});

test("Benjamin owner content remains outside the guest model and AI reflection is bounded", () => {
  const guestNames = new Set(spotlights.map(({ fullName }) => fullName));
  assert.equal(guestNames.has("Benjamin Trinidad Segura"), false);
  assert.equal(ownerStories.length, 2);
  const reflection = ownerStories.find(({ id }) => id === "benjamin-ai-reflection");
  assert.ok(reflection && "disclaimer" in reflection);
  assert.match(reflection.disclaimer, /AI-generated perspective/u);
  assert.match(reflection.disclaimer, /keine psychologische Beurteilung/u);
  assert.match(reflection.context.join(" "), /entscheidet aber nicht, wer er ist/u);
});

test("sitemap and metadata use canonical People routes, with legacy routes redirecting", () => {
  const sitemap = source("../app/sitemap.ts");
  const legacyIndex = source("../app/goatrecrutainer/career-spotlight/page.tsx");
  const legacyDetail = source("../app/goatrecrutainer/career-spotlight/[slug]/page.tsx");
  assert.match(sitemap, /"\/people"/u);
  assert.match(sitemap, /publishedSpotlights/u);
  assert.doesNotMatch(sitemap, /"\/goatrecrutainer\/career-spotlight"/u);
  assert.match(legacyIndex, /permanentRedirect\(getLocalizedPathname\("\/people", await getLocale\(\)\)\)/u);
  assert.match(legacyDetail, /permanentRedirect\(getLocalizedPathname\(`\/people\//u);

  const detail = source("../app/people/[slug]/page.tsx");
  assert.match(detail, /getLocalizedPathname\(`\/people\/\$\{spotlight\.slug\}`, locale\)/u);
  assert.match(detail, /inLanguage: locale/u);
  assert.match(detail, /description: sourceSpotlight\?\.teaser \?\? spotlight\.teaser/u);
  assert.match(detail, /inLanguage: spotlight\.language/u);
});

test("sitemap pairs all seven People routes with complete locale alternates", async () => {
  const previousSiteUrl = process.env.SITE_URL;
  const previousNodeEnv = process.env.NODE_ENV;

  try {
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, enumerable: true, writable: true });
    process.env.SITE_URL = "https://bts.online";
    const { createSitemap } = await import("../app/sitemap");
    const peopleRoutes = ["/people", ...expectedGuests.map((slug) => `/people/${slug}`)];
    const entries = createSitemap([]);

    for (const route of peopleRoutes) {
      const deUrl = `https://bts.online${route}`;
      const localeUrls = Object.fromEntries(locales.map((locale) => [locale, `https://bts.online${getLocalizedPathname(route, locale)}`]));
      for (const url of Object.values(localeUrls)) {
        const entry = entries.find((candidate) => candidate.url === url);
        assert.ok(entry, url);
        assert.deepEqual(entry.alternates?.languages, { ...localeUrls, "x-default": deUrl });
      }
    }
  } finally {
    if (previousSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previousSiteUrl;
    Object.defineProperty(process.env, "NODE_ENV", { value: previousNodeEnv, configurable: true, enumerable: true, writable: true });
  }
});
