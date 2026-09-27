import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { nerdCornerDictionaries } from "../data/i18n/nerd-corner";
import { locales } from "../lib/i18n/config";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Nerd Corner shows exact TMDB and IGDB credits with safe external links", () => {
  const page = source("../app/about/nerd-corner/page.tsx");
  const requiredNotice = "This product uses the TMDB API but is not endorsed or certified by TMDB.";

  assert.equal((page.match(new RegExp(requiredNotice.replaceAll(".", "\\."), "gu")) ?? []).length, 1);
  assert.match(page, /href="https:\/\/www\.themoviedb\.org" target="_blank" rel="noopener noreferrer"/u);
  assert.match(page, />TMDB \/ The Movie Database /u);
  assert.match(page, /href="https:\/\/www\.igdb\.com" target="_blank" rel="noopener noreferrer"/u);
  assert.match(page, />IGDB /u);
  assert.match(page, /\{copy\.igdbCredit\}/u);
  assert.doesNotMatch(page, /https:\/\/(?:www\.)?(?:themoviedb|igdb)\.(?:org|com)[^"\s]*\?/u);

  for (const locale of locales) {
    assert.ok(nerdCornerDictionaries[locale].mediaCreditsTitle.length > 4, `${locale}: media credits title`);
    assert.match(nerdCornerDictionaries[locale].igdbCredit, /IGDB/u, `${locale}: IGDB credit`);
  }
});

test("the exact approved TMDB logo is integrated and the provider-asset release gate is cleared", () => {
  const page = source("../app/about/nerd-corner/page.tsx");
  const release = source("../docs/nerd-corner-artwork-release.md");
  const publicAssets = readdirSync(new URL("../public/", import.meta.url), { recursive: true, encoding: "utf8" });
  const tmdbAsset = readFileSync(new URL("../public/brand/providers/tmdb-alt-short-blue.svg", import.meta.url));
  const releaseGate = ["TMDB", "APPROVED", "LOGO", "ASSET", "REQUIRED"].join("_");

  assert.deepEqual(
    publicAssets.map((path) => path.replaceAll("\\", "/")).filter((path) => /tmdb|themoviedb|the[-_ ]movie[-_ ]database/iu.test(path)),
    ["brand/providers/tmdb-alt-short-blue.svg"],
  );
  assert.equal(tmdbAsset.byteLength, 2065);
  assert.equal(createHash("sha256").update(tmdbAsset).digest("hex"), "8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c");
  assert.match(page, /src="\/brand\/providers\/tmdb-alt-short-blue\.svg" alt=""/u);
  assert.match(page, /aspect-\[273\.42\/35\.52\]/u);
  assert.doesNotMatch(release, new RegExp(releaseGate, "u"));
  assert.match(release, /Alt short \(blue\) - SVG/u);
  assert.match(release, /blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c\.svg/u);
  assert.match(release, /provider-asset release gate is cleared/u);
  assert.match(release, /primary purpose later becomes revenue generation/u);
  assert.match(release, /TMDB commercial licensing and IGDB commercial partnership requirements/u);
});

test("Privacy names only the actual artwork requests and ordinary connection metadata", () => {
  const privacy = source("../app/privacy/page.tsx");

  assert.equal((privacy.match(/media\.themoviedb\.org/gu) ?? []).length, locales.length);
  assert.equal((privacy.match(/images\.igdb\.com/gu) ?? []).length, locales.length);
  assert.match(privacy, /IP address and request headers/u);
  assert.match(privacy, /does not set additional cookies, add provider tracking or make runtime provider API calls for this artwork/u);
  assert.doesNotMatch(privacy, /(?:TMDB|IGDB)[^"\n]{0,180}(?:sets|installs|uses) (?:cookies|analytics|tracking)/iu);
  assert.doesNotMatch(privacy, /provider API (?:sends|shares|uploads|stores)/iu);
});

test("credits add no runtime provider client, credentials or secret configuration", () => {
  const implementation = [
    source("../app/about/nerd-corner/page.tsx"),
    source("../app/privacy/page.tsx"),
    source("../data/i18n/nerd-corner.ts"),
  ].join("\n");

  assert.doesNotMatch(implementation, /\bfetch\s*\(|axios|XMLHttpRequest|Authorization:\s*Bearer/iu);
  assert.doesNotMatch(implementation, /process\.env\.(?:TMDB|IGDB|TWITCH)|(?:TMDB|IGDB|TWITCH)[_-]?(?:API[_-]?)?(?:KEY|TOKEN|SECRET)/iu);
});
