import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Nerd Corner is a top-level desktop and mobile navigation item in the accepted order", () => {
  const header = source("../components/layout/header.tsx");
  const partners = header.indexOf('{ id: "partners"');
  const contact = header.indexOf('{ id: "contact"');
  const nerdCorner = header.indexOf('{ id: "nerd-corner"');
  const feedback = header.indexOf('{ id: "feedback"');

  assert.ok(partners >= 0 && partners < contact && contact < nerdCorner && nerdCorner < feedback);
  assert.match(header, /label: copy\.nav\.nerdCorner, href: localizedHref\("\/about\/nerd-corner"\)/u);
  assert.match(header, /navigation\.filter\(\(item\) => item\.id !== "home"\)\.map/u);
  assert.match(header, /navigation\.map\(\(item, index\) =>/u);
});

test("all seven locales provide a concise Nerd Corner navigation label", () => {
  const global = source("../data/i18n/global.ts");
  for (const label of ["Nerd-Ecke", "Nerd Corner", "Rincón Nerd", "Nerd Köşesi", "Kącik Nerda"]) {
    assert.match(global, new RegExp(`nerdCorner: "${label}"`, "u"));
  }
  assert.equal((global.match(/nerdCorner:/gu) ?? []).length, 7);
});

test("Quote Social Post keeps two clear brand placements across all supported formats", () => {
  const shared = source("../components/sharing/social-post-card.tsx");
  const quote = source("../components/quotes/quote-social-post-card.tsx");
  const formats = source("../types/writing.ts");

  assert.match(shared, /src="\/icons\/bts-app-icon-192\.png"/u);
  assert.doesNotMatch(shared, /social-post-canvas-heading|social-post-canvas-footer|handle/u);
  assert.match(shared, /social-post-source/u);
  assert.match(quote, /identityName="BTS"/u);
  assert.match(quote, /source=\{surfaceLabel\}/u);
  assert.match(quote, /metadata=\{\[\]\}/u);
  assert.match(quote, /domain=\{siteConfig\.domain\}/u);
  assert.doesNotMatch([shared, quote].join("\n"), /@bts\.online|BTS\.ONLINE/u);
  assert.match(formats, /writingShareFormats = \["story", "portrait", "square"\] as const/u);
});

test("Writing Social Post removes only equivalent redundant branding", () => {
  const writing = source("../components/writing/share/social-post-card.tsx");
  assert.match(writing, /identityName=\{source\.authorName\}/u);
  assert.match(writing, /source=\{copy\.sourceLabel\}/u);
  assert.match(writing, /metadata=\{\[readingTime\]\.filter/u);
  assert.match(writing, /domain=\{source\.domain\}/u);
  assert.doesNotMatch(writing, /@bts\.online|handle=|metadata=\{\[copy\.sourceLabel/u);
});

test("Brain Manual keeps its wording and patterns while materially reducing the hero scale", () => {
  const component = source("../components/brain-manual/brain-manual-page.tsx");
  const locales = source("../data/brain-manual-locales.ts");
  const data = source("../data/brain-manual.ts");

  assert.match(component, /max-w-4xl text-\[clamp\(2\.8rem,5\.2vw,5\.15rem\)\]/u);
  assert.doesNotMatch(component, /clamp\(3\.5rem,8\.5vw,8\.4rem\)/u);
  assert.match(locales, /title: "Wie mein Gehirn arbeitet", subtitle: "Eigenheiten, Muster, Fähigkeiten"/u);
  assert.match(data, /export const brainPatterns/u);
});
