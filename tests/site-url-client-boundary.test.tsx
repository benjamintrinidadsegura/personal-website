import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import { LocaleProvider } from "../components/i18n/locale-context";
import { Hero } from "../components/sections/hero";
import { CanonicalSiteUrlProvider } from "../components/site/canonical-site-url-context";
import { getAiSummaryCopy } from "../data/i18n/ai-summary";

const LOCAL_ORIGIN = "http://localhost:3000";

function source(pathname: string): string {
  return readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8");
}

test("homepage and AI Summary render from an explicitly injected localhost origin", () => {
  const markup = renderToStaticMarkup(
    <LocaleProvider locale="de">
      <CanonicalSiteUrlProvider canonicalSiteUrl={LOCAL_ORIGIN}>
        <Hero />
      </CanonicalSiteUrlProvider>
    </LocaleProvider>,
  );

  assert.match(markup, /id="home"/u);
  assert.match(markup, /Lass dir btshq\.online von deiner AI zusammenfassen/u);
  assert.match(markup, /https:\/\/btshq\.online/u);
  assert.doesNotMatch(markup, /http:\/\/localhost:3000/u);
  assert.equal(getAiSummaryCopy("en").prompt.includes(LOCAL_ORIGIN), false);
});

test("the root server layout injects one validated origin for every route", () => {
  const layout = source("app/layout.tsx");
  const home = source("app/page.tsx");
  assert.match(layout, /const siteUrl = requireSiteUrl\(\)/u);
  assert.match(layout, /<CanonicalSiteUrlProvider canonicalSiteUrl=\{siteUrl\.origin\}>/u);
  assert.match(layout, /<main id="main-content">\{children\}<\/main>/u);
  assert.match(home, /<Hero \/>/u);
  assert.doesNotMatch(home, /SITE_URL|process\.env|requireSiteUrl|getSiteUrl/u);
});

test("client-reachable canonical helpers never read server SITE_URL configuration", () => {
  const clientReachableModules = [
    "components/sections/hero.tsx",
    "data/i18n/ai-summary.ts",
    "lib/sharing/destinations.ts",
    "lib/newsletter/preparation.ts",
  ];

  for (const pathname of clientReachableModules) {
    const contents = source(pathname);
    assert.doesNotMatch(contents, /process\.env(?:\.SITE_URL|\[\s*["']SITE_URL["']\s*\])/u, pathname);
    assert.doesNotMatch(contents, /from ["']@\/lib\/site-url["']/u, pathname);
    assert.doesNotMatch(contents, /\b(?:requireSiteUrl|getSiteUrl)\b/u, pathname);
  }

  const nextConfig = source("next.config.ts");
  assert.doesNotMatch(nextConfig, /NEXT_PUBLIC_SITE_URL/u);
});

test("all audited client share paths consume the server-injected origin explicitly", () => {
  const audited = [
    "components/sharing/share-file-actions.tsx",
    "components/writing/share/carousel-file-actions.tsx",
    "components/money-profile/money-profile-share-dialog.tsx",
    "components/personal-advantage/personal-advantage-share-dialog.tsx",
    "components/quotes/quote-share-dialog.tsx",
    "components/find-your-next-step/character-share-dialog.tsx",
  ];

  for (const pathname of audited) {
    const contents = source(pathname);
    assert.match(contents, /useCanonicalSiteUrl\(\)/u, pathname);
    assert.doesNotMatch(contents, /process\.env|NEXT_PUBLIC_SITE_URL|from ["']@\/lib\/site-url["']/u, pathname);
  }

  const destinations = source("lib/sharing/destinations.ts");
  assert.match(destinations, /configuredSiteUrl: string \| URL/u);
  assert.doesNotMatch(destinations, /configuredSiteUrl\?|getSiteUrl|requireSiteUrl/u);
});
