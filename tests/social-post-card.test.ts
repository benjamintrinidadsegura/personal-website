import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { QuoteSocialPostCard } from "../components/quotes/quote-social-post-card";
import { QuoteShareCard } from "../components/quotes/quote-share-card";
import { ShareCard } from "../components/writing/share/share-card";
import { WritingSocialPostCard } from "../components/writing/share/social-post-card";
import { quoteDictionaries } from "../data/i18n/quotes";
import { writingShareDictionaries } from "../data/i18n/writing-share";
import { locales } from "../lib/i18n/config";
import { shareCardStyles } from "../types/sharing";
import type { SelectedQuote } from "../types/quote";
import { writingShareFormats, writingShareVariants, type WritingShareSource } from "../types/writing";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const writingSource: WritingShareSource = {
  articleId: "public-article",
  articleSlug: "a-public-story",
  articleTitle: "A public story about making context visible",
  authorName: "Benjamin Trinidad Segura",
  canonicalUrl: "https://bts.online/writing/a-public-story",
  domain: "bts.online",
  kind: "thought",
  language: "en",
  readingMinutes: 5,
  text: "Clarity becomes useful when it changes the next decision.",
};
const quote: SelectedQuote = {
  id: "btsq-social-post-test",
  text: "The next honest step is more useful than a perfect distant plan.",
  attribution: "bts.online",
  origin: "bts-original",
  themes: ["clarity"],
  semanticFamily: "next-step",
  shareEligible: true,
  fallbackLevel: "specific",
  eligibleCount: 1,
};

test("Social Post is an additional style while every accepted Editorial variant remains available", () => {
  assert.deepEqual(shareCardStyles, ["editorial", "socialPost"]);
  assert.deepEqual(writingShareVariants, ["editorial", "marginNote", "statement"]);
  const editorial = renderToStaticMarkup(createElement(ShareCard, { cardIndex: 0, cardTotal: 1, format: "story", source: writingSource, sourceLabel: "Writing", text: writingSource.text, variant: "editorial" }));
  assert.match(editorial, /data-variant="editorial"/u);
  assert.doesNotMatch(editorial, /data-style="social-post"/u);
  const quoteEditorial = renderToStaticMarkup(createElement(QuoteShareCard, { format: "story", quote, originalLabel: "BTS Original", surfaceLabel: "Daily Quote" }));
  assert.match(quoteEditorial, /data-variant="editorial"/u);
});

test("Writing Thought Social Post supports Story, Portrait and Square with truthful identity, source and reading time", () => {
  for (const format of writingShareFormats) {
    const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { cardIndex: 0, cardTotal: 1, copy: writingShareDictionaries.en, format, source: writingSource, text: writingSource.text }));
    assert.match(html, new RegExp(`data-format="${format}"`, "u"));
    assert.match(html, /data-post-kind="thought"/u);
    assert.match(html, /data-style="social-post"/u);
    assert.match(html, /social-post-canvas/u);
    assert.match(html, /<article class="social-post-surface">/u);
    assert.match(html, /social-post-canvas-footer/u);
    assert.match(html, /Benjamin Trinidad Segura/u);
    assert.match(html, /@bts\.online/u);
    assert.match(html, /Writing/u);
    assert.match(html, /From:/u);
    assert.match(html, /A public story about making context visible/u);
    assert.match(html, /5 min read/u);
  }
});

test("Writing Article Social Post uses the public title and short authored teaser", () => {
  const article = { ...writingSource, kind: "article" as const, text: "A short public teaser that creates curiosity without reproducing the article." };
  const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { cardIndex: 0, cardTotal: 1, copy: writingShareDictionaries.en, format: "portrait", source: article, text: article.text }));
  assert.match(html, /data-post-kind="article"/u);
  assert.match(html, /social-post-article-title/u);
  assert.match(html, /A short public teaser/u);
  assert.doesNotMatch(html, /From:/u);
});

test("Daily Quote Social Post preserves BTS-original and public-domain attribution truthfully", () => {
  for (const format of writingShareFormats) {
    const html = renderToStaticMarkup(createElement(QuoteSocialPostCard, { format, originalLabel: "BTS Original", quote, surfaceLabel: "Daily Quote" }));
    assert.match(html, /data-post-kind="quote"/u);
    assert.match(html, />BTS</u);
    assert.match(html, /@bts\.online/u);
    assert.match(html, /Daily Quote/u);
    assert.match(html, /BTS Original/u);
  }
  const attributed = { ...quote, id: "btsq-public-domain-test" as const, origin: "public-domain" as const, attribution: "Truthful Author", source: "Public source" };
  const html = renderToStaticMarkup(createElement(QuoteSocialPostCard, { format: "square", originalLabel: "BTS Original", quote: attributed, surfaceLabel: "Daily Quote" }));
  assert.match(html, /Truthful Author/u);
  assert.match(html, /Public source/u);
  assert.doesNotMatch(html, /BTS Original/u);
});

test("Social Post activation is scoped to Writing and Daily Quote, with style independent from format", () => {
  const writingComposer = source("../components/writing/share/share-composer.tsx");
  const quoteDialog = source("../components/quotes/quote-share-dialog.tsx");
  const quoteExperience = source("../components/quotes/quote-experience.tsx");
  assert.match(writingComposer, /ShareStyleSelector/u);
  assert.match(writingComposer, /style === "socialPost"/u);
  assert.match(writingComposer, /writingShareFormats\.map/u);
  assert.match(writingComposer, /style === "editorial" \? <fieldset>/u);
  assert.match(quoteDialog, /socialPostEnabled \? <ShareStyleSelector/u);
  assert.match(quoteExperience, /socialPostEnabled=\{variant === "daily"\}/u);
  assert.doesNotMatch(source("../components/find-your-next-step/character-share-dialog.tsx"), /SocialPost/u);
  assert.doesNotMatch(source("../components/personal-advantage/personal-advantage-share-dialog.tsx"), /SocialPost/u);
  assert.doesNotMatch(source("../components/money-profile/money-profile-share-dialog.tsx"), /SocialPost/u);
});

test("all seven locales expose complete Card style labels", () => {
  for (const locale of locales) {
    for (const dictionary of [writingShareDictionaries[locale], quoteDictionaries[locale]]) {
      assert.ok(dictionary.style.trim().length > 3, locale);
      assert.deepEqual(Object.keys(dictionary.styles), [...shareCardStyles]);
      assert.ok(Object.values(dictionary.styles).every((label) => label.trim().length > 3), locale);
    }
    assert.match(writingShareDictionaries[locale].readingTime, /\{minutes\}/u);
    assert.ok(writingShareDictionaries[locale].fromArticle.trim().length > 1, locale);
  }
});

test("Social Post contains no fake engagement, platform imitation, private data path or new renderer", () => {
  const socialSources = [
    source("../components/sharing/social-post-card.tsx"),
    source("../components/writing/share/social-post-card.tsx"),
    source("../components/quotes/quote-social-post-card.tsx"),
  ].join("\n");
  for (const prohibited of ["twitter", "x logo", "verified", "follower", "like count", "heart count", "repost", "retweet", "comment count", "view count", "bookmark", "impression", "sessionId", "inviteToken", "private result", "rawAnswers", "window.location"]) {
    assert.equal(socialSources.toLowerCase().includes(prohibited.toLowerCase()), false, prohibited);
  }
  const writingComposer = source("../components/writing/share/share-composer.tsx");
  const quoteDialog = source("../components/quotes/quote-share-dialog.tsx");
  for (const composer of [writingComposer, quoteDialog]) {
    assert.match(composer, /ShareFileActions/u);
    assert.match(composer, /screenshotMode/u);
    assert.doesNotMatch(composer, /fetch\(/u);
  }
  assert.match(source("../components/sharing/share-file-actions.tsx"), /renderShareCardFile/u);
  const packageJson = JSON.parse(source("../package.json"));
  for (const dependency of ["html-to-image", "dom-to-image", "html2canvas"]) assert.equal(packageJson.dependencies?.[dependency], undefined);
});

test("Social Post uses a framed post surface with deliberate format-specific proportions", () => {
  const component = source("../components/sharing/social-post-card.tsx");
  const css = source("../app/globals.css");
  assert.match(component, /social-post-canvas-heading/u);
  assert.match(component, /social-post-surface/u);
  assert.match(component, /social-post-avatar"><span>/u);
  assert.match(css, /data-format="story"\] \.social-post-surface \{ min-height: 58%; max-height: 74%/u);
  assert.match(css, /data-format="portrait"\] \.social-post-surface \{ min-height: 76%; max-height: 88%/u);
  assert.match(css, /data-format="square"\] \.social-post-surface \{ height: 88%/u);
  assert.doesNotMatch(component, /social-post-safe-area/u);
});
