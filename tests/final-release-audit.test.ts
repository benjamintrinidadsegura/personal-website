import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { privacyReleaseCopy } from "../data/i18n/privacy-release";
import { locales } from "../lib/i18n/config";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("release privacy disclosure is complete and explicit in all seven locales", () => {
  assert.deepEqual(Object.keys(privacyReleaseCopy), locales);
  const expectedSections = ["hosting", "account", "contributions", "publicContent", "media", "contact", "storage", "rights"];
  for (const locale of locales) {
    const copy = privacyReleaseCopy[locale];
    assert.ok(copy.statusTitle.length > 5, `${locale}: controller status title`);
    assert.ok(copy.statusBody.length > 150, `${locale}: controller status detail`);
    assert.deepEqual(Object.keys(copy.sections), expectedSections, `${locale}: privacy section inventory`);
    for (const [id, section] of Object.entries(copy.sections)) {
      assert.ok(section.title.length > 4, `${locale}:${id}: title`);
      assert.ok(section.body.length > 0, `${locale}:${id}: paragraphs`);
      assert.ok(section.body.every((paragraph) => paragraph.length > 40), `${locale}:${id}: substantive disclosure`);
    }
  }

  assert.match(privacyReleaseCopy.de.sections.account.body.join(" "), /eu-central-1/u);
  assert.match(privacyReleaseCopy.de.sections.storage.body.join(" "), /keine Webanalyse/u);
  assert.match(privacyReleaseCopy.de.sections.media.body.join(" "), /youtube-nocookie\.com/u);
  assert.match(privacyReleaseCopy.de.sections.contributions.body.join(" "), /keine rohe IP-Adresse/u);
});

test("privacy page renders actual V1 processing surfaces without inventing legal particulars", () => {
  const page = source("app/privacy/page.tsx");
  for (const required of [
    "privacyReleaseCopy",
    "configuredNewsletterControllerAddress",
    "legalOperator",
    "copy.life.local",
    "copy.newsletter.storage",
    "PrivacySections",
  ]) assert.match(page, new RegExp(required.replaceAll(".", "\\."), "u"));
  assert.doesNotMatch(page, /legally compliant|GDPR certified|fully compliant/iu);
});

test("site, person and content schema use a small stable public entity graph", () => {
  const layout = source("app/layout.tsx");
  const about = source("app/about/page.tsx");
  const people = source("app/people/[slug]/page.tsx");
  const writing = source("app/writing/[slug]/page.tsx");

  assert.match(layout, /"@type": "WebSite"/u);
  assert.match(layout, /https:\/\/bts\.online\/#website/u);
  assert.match(layout, /https:\/\/bts\.online\/about#benjamin/u);
  assert.match(about, /const personEntityId = "https:\/\/bts\.online\/about#benjamin"/u);
  assert.match(about, /"@type": "BreadcrumbList"/u);
  assert.match(people, /"@type": "ProfilePage"/u);
  assert.match(people, /"@type": "Person"/u);
  assert.match(people, /"@type": "VideoObject"/u);
  assert.match(people, /"@type": "BreadcrumbList"/u);
  assert.match(writing, /"@type": "Article"/u);
  assert.match(writing, /author: \{ "@id": "https:\/\/bts\.online\/about#benjamin" \}/u);
  assert.match(writing, /"@type": "BreadcrumbList"/u);
});

test("crawler, transport and public-error boundaries are explicit", () => {
  const robots = source("app/robots.ts");
  const config = source("next.config.ts");
  const errorPage = source("app/error.tsx");

  for (const route of ["/admin", "/account", "/api", "/newsletter/confirm", "/newsletter/unsubscribe"]) {
    assert.ok(robots.includes(`"${route}"`), route);
  }
  assert.match(config, /Strict-Transport-Security/u);
  assert.match(config, /max-age=31536000/u);
  assert.doesNotMatch(errorPage, /console\.error/u);
});

test("request locale lookup remains request-scoped for production locale rewrites", () => {
  const localeServer = source("lib/i18n/server.ts");
  const proxy = source("proxy.ts");
  assert.match(localeServer, /await headers\(\)/u);
  assert.doesNotMatch(localeServer, /cache\(/u);
  assert.match(proxy, /createResponse\(request, localeRouting, shouldRewrite\)/u);
  assert.match(proxy, /x-bts-internal-rewrite-locale/u);
  assert.match(proxy, /isInternalLocaleRewrite/u);
  assert.match(proxy, /const securityPathname = localeRouting\.internalPathname/u);
  assert.doesNotMatch(proxy, /request\.nextUrl\.pathname\.startsWith\("\/admin"\)/u);
});
