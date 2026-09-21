import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { shareFileDictionaries } from "../data/i18n/share-file";
import { locales } from "../lib/i18n/config";
import { shareCardFallbackOrder, shareCardPixelSize, supportsNativeFileShare } from "../lib/sharing/native-card-share";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("FOLLOW-UP native image sharing is capability-based and keeps truthful fallbacks", () => {
  const file = { name: "bts-card.png", type: "image/png" } as File;
  let offered: ShareData | undefined;
  const capable = {
    share: async () => undefined,
    canShare: (data?: ShareData) => { offered = data; return true; },
  };
  assert.equal(supportsNativeFileShare(capable, file), true);
  assert.deepEqual(offered?.files, [file]);
  assert.equal(supportsNativeFileShare({ share: async () => undefined }, file), false);
  assert.equal(supportsNativeFileShare({ share: async () => undefined, canShare: () => { throw new Error("blocked"); } }, file), false);
  assert.deepEqual(shareCardFallbackOrder(true), ["download", "copy-image", "screenshot"]);
  assert.deepEqual(shareCardFallbackOrder(false), ["download", "screenshot"]);
  assert.deepEqual(shareCardPixelSize, {
    story: { width: 1080, height: 1920 },
    portrait: { width: 1080, height: 1350 },
    square: { width: 1080, height: 1080 },
  });
});

test("FOLLOW-UP native sharing language is complete in all seven locales", () => {
  assert.deepEqual(Object.keys(shareFileDictionaries), locales);
  const expectedKeys = Object.keys(shareFileDictionaries.en).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(shareFileDictionaries[locale]).sort(), expectedKeys, locale);
    assert.equal(Object.values(shareFileDictionaries[locale]).every((value) => value.trim().length > 3), true, locale);
  }
});

test("FOLLOW-UP Writing, Quote and FYNS share real generated files while preserving existing escape hatches", () => {
  const action = source("../components/sharing/share-file-actions.tsx");
  const native = source("../lib/sharing/native-card-share.ts");
  for (const path of [
    "../components/writing/share/share-composer.tsx",
    "../components/quotes/quote-share-dialog.tsx",
    "../components/find-your-next-step/character-share-dialog.tsx",
  ]) {
    const surface = source(path);
    assert.match(surface, /ShareFileActions/u, path);
    assert.match(surface, /screenshotMode/u, path);
  }
  assert.match(action, /supportsNativeFileShare/u);
  assert.match(action, /downloadShareCardFile/u);
  assert.match(action, /copyShareCardFile/u);
  assert.match(native, /navigator\.share\(\{ files: \[file\]/u);
  assert.match(native, /paintShareCard/u);
  assert.match(native, /canvas\.toBlob/u);
  assert.doesNotMatch(native, /foreignObject/u);
  assert.doesNotMatch(native, /instagram|tiktok|whatsapp/iu);

  const home = source("../app/page.tsx");
  assert.ok(home.indexOf("<Hero") < home.indexOf("<HomeQuote"));
  assert.ok(home.indexOf("<HomeQuote") < home.indexOf("<HqPulse"));
});

test("FOLLOW-UP Writing preserves draft acceptance and makes publication requirements actionable", () => {
  const validation = source("../lib/writing/validation.ts");
  const form = source("../components/admin/writing-form.tsx");
  assert.match(validation, /mode === "publish" && topics\.length < 1/u);
  assert.match(validation, /Choose at least one topic before publishing/u);
  assert.match(form, /Fix these fields before continuing:/u);
  assert.match(form, /writingFieldLabels/u);
  assert.match(form, /if \(hasSettingsErrors\)[\s\S]*writing-article-settings/u);
  assert.match(form, /setMode\(view\)/u);
  assert.match(form, /publishWritingAction/u);
  assert.match(form, /runDraftSave/u);
});

test("FOLLOW-UP World Map is a pin-first canvas with immediate replaceable and dismissible detail", () => {
  const map = source("../components/world-map/world-map-experience.tsx");
  const css = source("../app/globals.css");
  assert.match(map, /world-map-viewport/u);
  assert.match(map, /data-map-transform/u);
  assert.match(map, /translate3d\(/u);
  assert.match(map, /bindWorldMapWheelZoom/u);
  assert.match(map, /clampWorldMapOffset/u);
  assert.match(map, /WORLD_MAP_MAX_ZOOM/u);
  assert.match(map, /setZoom\(1\)[\s\S]*setOffset\(\{ x: 0, y: 0 \}\)/u);
  assert.match(map, /world-map-pin-cluster/u);
  assert.match(map, /aria-pressed=\{selected\?\.id === connection\.id\}/u);
  assert.match(map, /setSelectedId\(connection\.id\)/u);
  assert.match(map, /world-map-detail/u);
  assert.match(map, /onClose=\{closeDetail\}/u);
  assert.match(map, /if \(connection\) selectConnection\(connection\)/u);
  assert.doesNotMatch(map, /focusCountry|lg:sticky lg:top-24/u);
  assert.match(css, /\.world-map-viewport[\s\S]*66svh/u);
  assert.match(css, /\.world-map-detail[\s\S]*max-height:\s*min\(62%, 26rem\)/u);
});

test("FOLLOW-UP World Map keeps mobile scrolling, filters, keyboard, fallback, motion and privacy contracts", () => {
  const map = source("../components/world-map/world-map-experience.tsx");
  const css = source("../app/globals.css");
  const dictionary = source("../data/i18n/world-map.ts");
  assert.match(map, /data-map-interaction-toggle/u);
  assert.match(map, /touch-none/u);
  assert.match(map, /touch-pan-y/u);
  assert.match(map, /pointer: coarse/u);
  assert.match(map, /ArrowLeft/u);
  assert.match(map, /event\.key === "Escape"/u);
  assert.match(map, /event\.key === "Home"/u);
  assert.match(map, /quickFilters\.map/u);
  assert.match(map, /matchesWorldMapFilter/u);
  assert.match(map, /map-list-title/u);
  assert.match(map, /focus-visible/u);
  assert.match(map, /min-h-11/u);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/u);
  assert.match(dictionary, /not a precise person location/u);
  assert.match(dictionary, /kein exakter Personenstandort/u);
});

test("FOLLOW-UP public-content hygiene remains an explicit public-read boundary", () => {
  const hygiene = source("../lib/public-content-hygiene.ts");
  const writingQueries = source("../lib/writing/queries.ts");
  assert.match(hygiene, /placeholder|fixture|test/iu);
  assert.match(writingQueries, /isPublicWritingReady/u);
  assert.match(writingQueries, /\.eq\("status", "published"\)/u);
});
