import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Social Post presents a larger approved icon without a surrounding container treatment", () => {
  const component = source("../components/sharing/social-post-card.tsx");
  const quote = source("../components/quotes/quote-social-post-card.tsx");
  const writing = source("../components/writing/share/social-post-card.tsx");
  const css = source("../app/globals.css");
  const avatarRule = css.match(/\.social-post-avatar \{([^}]+)\}/u)?.[1] ?? "";

  assert.match(component, /social-post-avatar"><Image/u);
  assert.match(component, /src="\/icons\/bts-app-icon-192\.png"/u);
  assert.match(component, /sizes="112px"/u);
  assert.match(avatarRule, /13\.5cqw/u);
  assert.doesNotMatch(avatarRule, /border|background|box-shadow/u);
  assert.doesNotMatch(css, /\.social-post-avatar > span/u);
  assert.match(quote, /<SocialPostCard/u);
  assert.match(writing, /<SocialPostCard/u);
  assert.doesNotMatch(writing, /textFit=/u);
});

test("Quote fitting is continuous, format-aware and progressively denser for realistic longer text", async () => {
  const fitModule = await import(new URL("../lib/sharing/quote-social-post-fit.ts", import.meta.url).href) as {
    quoteSocialPostTextFit: (text: string, format: "story" | "portrait" | "square") => { density: string; fontSize: string; preferredCqw: number; weightedLength: number };
  };
  const shortQuote = "Clarity changes the next honest step.";
  const mediumQuote = "Clarity becomes useful when it changes the next honest decision, protects what matters, and leaves enough room to notice what the situation is actually asking of you.";
  const longQuote = "A meaningful direction rarely arrives as a complete map. It becomes visible through a sequence of honest decisions: noticing what gives energy, naming what creates friction, testing one bounded next step, learning from what actually happens, and allowing that evidence to refine the direction without pretending that uncertainty has disappeared.";

  for (const format of ["story", "portrait", "square"] as const) {
    const shortFit = fitModule.quoteSocialPostTextFit(shortQuote, format);
    const mediumFit = fitModule.quoteSocialPostTextFit(mediumQuote, format);
    const longFit = fitModule.quoteSocialPostTextFit(longQuote, format);
    assert.ok(shortFit.weightedLength < mediumFit.weightedLength && mediumFit.weightedLength < longFit.weightedLength, format);
    assert.ok(shortFit.preferredCqw >= mediumFit.preferredCqw && mediumFit.preferredCqw > longFit.preferredCqw, format);
    assert.match(longFit.fontSize, /^clamp\(0\.82rem,/u);
    assert.ok(["long", "extended"].includes(longFit.density), format);
  }
});

test("Quote Social Post removes line clamps and hidden text overflow while retaining safe attribution and domain areas", () => {
  const css = source("../app/globals.css");
  const component = source("../components/quotes/quote-social-post-card.tsx");
  const formats = source("../types/writing.ts");

  assert.match(component, /quoteSocialPostTextFit\(quote\.text, format\)/u);
  assert.match(component, /textFit=\{textFit\}/u);
  assert.match(css, /data-post-kind="quote"\] \.social-post-text \{[^}]*overflow: visible[^}]*-webkit-line-clamp: unset/u);
  assert.match(css, /data-post-kind="quote"\] \.social-post-attribution/u);
  assert.match(css, /data-post-kind="quote"\]\[data-format="square"\] \.social-post-surface \{ height: 90%/u);
  assert.doesNotMatch(component, /slice\(|substring\(|text-overflow|ellipsis/u);
  assert.match(formats, /writingShareFormats = \["story", "portrait", "square"\] as const/u);
});

test("Nerd Corner hero is controlled and every locale now means currently watching", () => {
  const page = source("../app/about/nerd-corner/page.tsx");
  const copy = source("../data/i18n/nerd-corner.ts");
  const descriptions = [
    "Serien, die ich gerade schaue.",
    "Series I'm currently watching.",
    "Series que estoy viendo actualmente.",
    "Şu anda izlediğim diziler.",
    "Seriale, które teraz oglądam.",
    "Σειρές που παρακολουθώ αυτή την περίοδο.",
    "Сериалы, которые я сейчас смотрю.",
  ];

  assert.match(page, /text-\[clamp\(3rem,5\.8vw,5\.8rem\)\]/u);
  assert.doesNotMatch(page, /clamp\(4rem,11vw,10rem\)/u);
  for (const description of descriptions) assert.ok(copy.includes(`currentlyIntoDescription: "${description}"`), description);
  assert.doesNotMatch(copy, /currentlyIntoDescription: "[^"]*(?:zurückkehre|returning|radar|wracam|επιστρέφω|возвращаюсь)/iu);
});

test("verified local-preview artwork preserves the accepted fallback", () => {
  const page = source("../app/about/nerd-corner/page.tsx");
  assert.match(page, /getResolvedTasteArtwork\(item\)/u);
  assert.doesNotMatch(page, /process\.env\.NODE_ENV/u);
  assert.match(page, /data-artwork=\{artwork \? "resolved" : "fallback"\}/u);
  assert.match(page, /fallbackLabel=\{copy\.artworkFallback\}/u);
  assert.match(page, /<ResolvedArtworkImage/u);
});
