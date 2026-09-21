import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { shareDestinationsDictionaries } from "../data/i18n/share-destinations";
import { locales } from "../lib/i18n/config";
import { canonicalBtsShareUrl, webShareDestinations } from "../lib/sharing/destinations";
import { supportsNativeFileShare } from "../lib/sharing/native-card-share";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("FINAL SHARING public BTS source URLs are canonical, locale-aware, anchored only for Writing, and query-free", () => {
  for (const [input, expected] of [
    ["/", "https://bts.online/"],
    ["/de/writing/story", "https://bts.online/writing/story"],
    ["/en/writing/story", "https://bts.online/en/writing/story"],
    ["https://bts.online/writing/story#writing-thought-1234", "https://bts.online/writing/story#writing-thought-1234"],
    ["/writing/story#writing-thought-block_1", "https://bts.online/writing/story#writing-thought-block_1"],
    ["/find-your-next-step/self", "https://bts.online/find-your-next-step/self"],
    ["/life-alignment/partner", "https://bts.online/life-alignment/partner"],
  ] as const) assert.equal(canonicalBtsShareUrl(input), expected, input);
  for (const rejected of [null, "", "//evil.example/writing/story", "https://bts.online.evil.example/writing/story", "http://bts.online/writing/story", "/admin/writing/id", "/api/private", "/account", "/invite/token", "/writing/story?session=secret", "/writing/story?utm_source=share", "/writing/%2e%2e/admin", "/writing/story#token", "/find-your-next-step/self#private", "/writing/../../admin"]) {
    assert.equal(canonicalBtsShareUrl(rejected), null, String(rejected));
  }
});

test("FINAL SHARING WhatsApp sends concise public context and canonical URL, never a PNG claim or tracking", () => {
  const destinations = webShareDestinations({ text: " An authored thought. ", url: "https://bts.online/en/writing/story#writing-thought-1234" });
  assert.ok(destinations);
  const whatsapp = new URL(destinations.whatsapp);
  assert.equal(whatsapp.origin, "https://wa.me");
  assert.equal(whatsapp.pathname, "/");
  assert.deepEqual([...whatsapp.searchParams.keys()], ["text"]);
  assert.equal(whatsapp.searchParams.get("text"), "An authored thought.\nhttps://bts.online/en/writing/story#writing-thought-1234");
  assert.equal(destinations.whatsapp.includes("files"), false);
  const long = webShareDestinations({ text: "A".repeat(500), url: "/writing/story" });
  assert.ok(long);
  const message = new URL(long.whatsapp).searchParams.get("text") ?? "";
  assert.equal(message.startsWith(`${"A".repeat(217)}…\n`), true);
  assert.equal(message.endsWith("https://bts.online/writing/story"), true);
});

test("FINAL SHARING LinkedIn receives only canonical source URL, not PNG or prefilled result data", () => {
  const destinations = webShareDestinations({ text: "Private-looking test should not enter LinkedIn URL", url: "/find-your-next-step/self" });
  assert.ok(destinations);
  const linkedin = new URL(destinations.linkedin);
  assert.equal(linkedin.origin, "https://www.linkedin.com");
  assert.equal(linkedin.pathname, "/sharing/share-offsite/");
  assert.deepEqual([...linkedin.searchParams.keys()], ["url"]);
  assert.equal(linkedin.searchParams.get("url"), "https://bts.online/find-your-next-step/self");
  assert.equal(linkedin.href.includes("Private-looking"), false);
  assert.equal(webShareDestinations({ text: "Draft", url: null }), null);
  assert.equal(webShareDestinations({ text: "Secret", url: "/admin/writing/id" }), null);
});

test("FINAL SHARING native PNG remains capability-gated for mobile and desktop while web links remain available", () => {
  const file = new File(["png"], "bts-card.png", { type: "image/png" });
  const mobile = { canShare: (data?: ShareData) => data?.files?.[0] === file, share: async () => undefined };
  const desktop = { canShare: () => false, share: async () => undefined };
  assert.equal(supportsNativeFileShare(mobile, file), true);
  assert.equal(supportsNativeFileShare(desktop, file), false);
  assert.equal(supportsNativeFileShare({}, file), false);
  assert.ok(webShareDestinations({ text: "Article", url: "/writing/story" }));
  const actions = source("../components/sharing/share-file-actions.tsx");
  const primitive = source("../lib/sharing/native-card-share.ts");
  assert.match(actions, /supportsNativeFileShare\(navigator, file\)/u);
  assert.match(actions, /webShareDestinations\(\{ text, url \}\)/u);
  assert.match(actions, /canShareFile \? <button/u);
  assert.match(primitive, /navigator\.share\(\{ files: \[file\]/u);
  assert.match(actions, /downloadShareCardFile/u);
  assert.match(actions, /copyShareCardFile/u);
});

test("FINAL SHARING one shared destination row serves Writing, Quote, FYNS without false Instagram/TikTok buttons", () => {
  const actions = source("../components/sharing/share-file-actions.tsx");
  for (const path of ["../components/writing/share/share-composer.tsx", "../components/quotes/quote-share-dialog.tsx", "../components/find-your-next-step/character-share-dialog.tsx"]) {
    assert.match(source(path), /ShareFileActions/u, path);
  }
  assert.match(actions, /data-share-destination="whatsapp"/u);
  assert.match(actions, /data-share-destination="linkedin"/u);
  assert.match(actions, /destinationsCopy\.moreApps/u);
  assert.doesNotMatch(actions, /data-share-destination="(?:instagram|tiktok)"/iu);
  assert.match(actions, /rel="noopener noreferrer"/u);
  assert.match(actions, /referrerPolicy="no-referrer"/u);
  assert.match(source("../components/quotes/quote-share-dialog.tsx"), /canonicalBtsShareUrl\(safeSharePath\)/u);
  assert.match(source("../components/find-your-next-step/character-share-dialog.tsx"), /canonicalBtsShareUrl\(safeSharePath\)/u);
  assert.doesNotMatch(source("../components/find-your-next-step/character-share-dialog.tsx"), /supportingNames\.join\(/u);
});

test("FINAL SHARING seven locales explain source-only web links, conditional native apps, and accessible controls", () => {
  assert.deepEqual(Object.keys(shareDestinationsDictionaries).sort(), [...locales].sort());
  const fields = Object.keys(shareDestinationsDictionaries.en).sort();
  for (const locale of locales) {
    const dictionary = shareDestinationsDictionaries[locale];
    assert.deepEqual(Object.keys(dictionary).sort(), fields, locale);
    assert.ok(Object.values(dictionary).every((value) => value.trim().length > 3), locale);
    assert.match(dictionary.whatsappLink, /WhatsApp/u);
    assert.match(dictionary.linkedinLink, /LinkedIn/u);
    assert.match(dictionary.nativeHint, /Instagram/u);
    assert.match(dictionary.nativeHint, /TikTok/u);
  }
  const css = source("../app/globals.css");
  const actions = source("../components/sharing/share-file-actions.tsx");
  assert.match(css, /\.bts-share-destinations a\.writing-share-secondary \{ min-height: 44px/u);
  assert.match(css, /\.bts-share-destinations a\.writing-share-secondary \{ display: inline-flex/u);
  assert.match(css, /:focus-visible/u);
  assert.match(actions, /role="group" aria-label=\{destinationsCopy\.destinations\}/u);
});

test("FINAL SHARING direct source routes already have truthful OpenGraph title, description, and preview metadata", () => {
  const writing = source("../app/writing/[slug]/page.tsx");
  const fyns = source("../app/find-your-next-step/[slug]/page.tsx");
  const home = source("../app/layout.tsx");
  const metadata = source("../lib/i18n/metadata.ts");
  assert.match(writing, /openGraph: \{ type: "article"/u);
  assert.match(writing, /description: article\.excerpt/u);
  assert.match(fyns, /openGraph: \{ \.\.\.metadata\.openGraph, images:/u);
  assert.match(home, /createLocalizedMetadata\(\{ locale, pathname: "\/", title, description \}\)/u);
  assert.match(metadata, /openGraph: \{/u);
});
