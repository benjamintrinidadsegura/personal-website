import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { globalDictionaries } from "../data/i18n/global";
import { localizeDiscoveryItems } from "../data/i18n/discovery";
import { worldMapDictionaries } from "../data/i18n/world-map";
import { discoveryIndex } from "../data/discovery-index";
import { locales } from "../lib/i18n/config";

const here = dirname(fileURLToPath(import.meta.url));
const source = (path: string) => readFileSync(resolve(here, path), "utf8");

test("Experience Completion promotes Quote immediately after the hero with stable navigation and discovery", () => {
  const home = source("../app/page.tsx");
  const quote = source("../components/quotes/home-quote.tsx");
  const header = source("../components/layout/header.tsx");
  const discovery = source("../data/discovery-index.ts");
  assert.ok(home.indexOf("<Hero") < home.indexOf("<HomeQuote"));
  assert.ok(home.indexOf("<HomeQuote") < home.indexOf("<HqPulse"));
  assert.match(quote, /id="quote"/u);
  assert.match(header, /copy\.nav\.quote[\s\S]*\/#quote/u);
  assert.match(discovery, /id: "page-quote"[\s\S]*href: "\/#quote"/u);
});

test("all seven navigation and map-interaction labels have complete static locale coverage", () => {
  assert.deepEqual(Object.keys(globalDictionaries), locales);
  assert.deepEqual(Object.keys(worldMapDictionaries), locales);
  for (const locale of locales) {
    assert.ok(globalDictionaries[locale].nav.quote.trim().length > 3, locale);
    assert.equal(
      localizeDiscoveryItems(discoveryIndex, locale).find(({ id }) => id === "page-quote")?.title,
      globalDictionaries[locale].nav.quote,
      `${locale}: Quote navigation and Discovery title`,
    );
    assert.ok(worldMapDictionaries[locale].activateMap.trim().length > 3, locale);
    assert.ok(worldMapDictionaries[locale].releaseMap.trim().length > 8, locale);
    assert.ok(worldMapDictionaries[locale].selectedPin.trim().length > 3, locale);
  }
});

test("Writing Home and index expose varied editorial mosaics and the share-card format language", () => {
  const homeWriting = source("../components/sections/writing.tsx");
  const index = source("../app/writing/page.tsx");
  const article = source("../app/writing/[slug]/page.tsx");
  const formatSignal = source("../components/writing/share/share-format-signal.tsx");
  assert.match(homeWriting, /data-writing-home-mosaic/u);
  assert.match(homeWriting, /writing-home-card-featured/u);
  assert.match(homeWriting, /entry\.topics/u);
  assert.match(index, /data-writing-index-mosaic/u);
  assert.match(index, /ShareFormatSignal/u);
  assert.match(article, /writing-share-guide/u);
  for (const format of ["story", "portrait", "square"]) assert.match(formatSignal, new RegExp(`formats\\.${format}`, "u"));
  assert.match(formatSignal, /screenshotMode/u);
});

test("thought sharing is persistently discoverable without hover and remains keyboard/touch operable", () => {
  const trigger = source("../components/writing/share/share-thought-trigger.tsx");
  const css = source("../app/globals.css");
  assert.match(trigger, /aria-label=\{copy\.trigger\}/u);
  assert.match(trigger, /title=\{copy\.trigger\}/u);
  assert.match(css, /writing-thought:not\(\.writing-shareable-thought\)[\s\S]*opacity:\s*\.72/u);
  assert.match(css, /writing-share-trigger[\s\S]*min-height:\s*2\.75rem/u);
  assert.match(css, /writing-thought:focus-within/u);
});

test("Writing, Quote, and FYNS share surfaces use the same identity, icon, and composer frame", () => {
  const writing = source("../components/writing/share/share-composer.tsx");
  const quote = source("../components/quotes/quote-share-dialog.tsx");
  const fyns = source("../components/find-your-next-step/character-share-dialog.tsx");
  const heading = source("../components/sharing/share-composer-heading.tsx");
  const quoteExperience = source("../components/quotes/quote-experience.tsx");
  const fynsActions = source("../components/find-your-next-step/result-actions.tsx");
  for (const surface of [writing, quote, fyns]) assert.match(surface, /ShareComposerHeading/u);
  assert.match(heading, /BTS\.ONLINE/u);
  assert.match(heading, /ShareIcon/u);
  assert.match(quoteExperience, /bts-share-action/u);
  assert.match(fynsActions, /bts-share-action/u);
});

test("World Map starts unselected and exposes deliberate, non-trapping exploration controls", () => {
  const map = source("../components/world-map/world-map-experience.tsx");
  const contract = source("../lib/world-map.ts");
  assert.match(map, /useState<string \| null>\(null\)/u);
  assert.doesNotMatch(map, /matchingConnections\[0\]\s*\?\?/u);
  assert.match(map, /data-map-selection=\{selected \? "selected" : "empty"\}/u);
  assert.match(map, /data-map-interaction-toggle/u);
  assert.match(map, /touch-none/u);
  assert.match(map, /touch-pan-y/u);
  assert.match(map, /pinch\.current/u);
  assert.match(map, /Math\.hypot/u);
  assert.match(map, /prefers-reduced-motion: reduce/u);
  assert.match(map, /selected\?\.id === connection\.id \? "✓"/u);
  assert.match(contract, /handled !== false/u);
});

test("public readiness remains published-only, private, dependency-light, and backend-neutral", () => {
  const writingQueries = source("../lib/writing/queries.ts");
  const echoQueries = source("../lib/echowall/queries.ts");
  const commentDomain = source("../lib/comments/domain.ts");
  const map = source("../components/world-map/world-map-experience.tsx");
  const packageJson = JSON.parse(source("../package.json")) as { dependencies: Record<string, string> };
  assert.match(writingQueries, /\.eq\("status", "published"\)/u);
  assert.match(writingQueries, /isPublicWritingReady/u);
  assert.match(echoQueries, /\.eq\("status", "approved"\)/u);
  assert.match(echoQueries, /isPublicEchoReady/u);
  assert.match(commentDomain, /isPublicCommentReady/u);
  assert.doesNotMatch(map, /fetch\(|axios|mapbox|leaflet/iu);
  for (const dependency of ["mapbox-gl", "leaflet", "html2canvas"]) assert.equal(packageJson.dependencies[dependency], undefined);
});
