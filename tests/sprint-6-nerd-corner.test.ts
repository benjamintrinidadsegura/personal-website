import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { QuoteSocialPostCard } from "../components/quotes/quote-social-post-card";
import { WritingSocialPostCard } from "../components/writing/share/social-post-card";
import { nerdCornerDictionaries } from "../data/i18n/nerd-corner";
import { writingShareDictionaries } from "../data/i18n/writing-share";
import { legalOperator } from "../data/legal";
import {
  currentlyIntoArtists,
  currentlyIntoSeries,
  currentlyIntoSongs,
  currentlyPlaying,
  currentlyReading,
  favoriteArtists,
  favoriteBooks,
  favoriteMovies,
  favoriteSeries,
  getResolvedTasteArtwork,
  type TasteItem,
} from "../data/nerd-corner";
import { projects } from "../data/projects";
import { siteConfig } from "../data/site";
import { locales } from "../lib/i18n/config";
import type { SelectedQuote } from "../types/quote";
import { writingShareFormats, type WritingShareSource } from "../types/writing";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const allTasteItems: readonly TasteItem[] = [
  ...currentlyIntoSeries, ...favoriteMovies, ...favoriteSeries, ...favoriteArtists,
  ...currentlyIntoArtists, ...currentlyIntoSongs, ...favoriteBooks, currentlyReading, ...currentlyPlaying,
];

test("Sprint 6 represents the canonical curated taste content exactly", () => {
  assert.deepEqual(currentlyIntoSeries.map(({ title }) => title), ["Billions", "Shrinking", "After Life", "How I Met Your Mother", "Bleach", "Lanterns", "The Gentlemen", "Ted Lasso", "The Mentalist"]);
  assert.deepEqual(favoriteMovies.map(({ title }) => title), ["Harry Potter", "Grown Ups", "Grown Ups 2"]);
  assert.equal(favoriteMovies[0]?.format, "saga");
  assert.deepEqual(favoriteSeries.map(({ title }) => title), ["The Blacklist", "How I Met Your Mother", "Heroes", "Black Clover", "My Hero Academia", "Fairy Tail", "Solo Leveling"]);
  assert.deepEqual(favoriteArtists.map(({ title }) => title), ["RAF Camora", "Bazanji", "Metrickz", "Dardan", "Connor Price", "Lovixx", "Sierra Kidd"]);
  assert.deepEqual(currentlyIntoArtists.map(({ title }) => title), ["RAF Camora", "Metrickz", "Bazanji"]);
  assert.deepEqual(currentlyIntoSongs.map(({ creator, title }) => `${creator} — ${title}`), ["Romero — Irgendwas", "Rufuz — Was wenn nicht jetzt?", "Alex Cooper — F*CKED UP", "Itachi — Monolith"]);
  assert.deepEqual(favoriteBooks.map(({ creator, title }) => `${creator} — ${title}`), ["Paulo Coelho — Der Alchemist", "John Strelecky — The Big Five for Life", "John Strelecky — Das Café am Rande der Welt"]);
  assert.equal(`${currentlyReading.creator} — ${currentlyReading.title}`, "Leon Windscheid — Besser fühlen: Eine Reise zur Gelassenheit");
  assert.deepEqual(currentlyPlaying.map(({ title }) => title), ["Teamfight Tactics", "Deadzone Rogue", "Aniimo", "Tom Clancy's The Division 2"]);
});

test("Sprint 6 taste entries contain no invented ratings, reviews or personal commentary", () => {
  for (const item of allTasteItems) {
    assert.deepEqual(Object.keys(item).every((key) => ["id", "title", "creator", "format", "artwork"].includes(key)), true, item.id);
    for (const prohibited of ["rating", "score", "review", "meaning", "commentary", "rank", "completed", "date"]) assert.equal(prohibited in item, false, `${item.id}: ${prohibited}`);
  }
  assert.deepEqual(favoriteSeries.filter(({ format }) => format === "anime").map(({ title }) => title), ["Black Clover", "My Hero Academia", "Fairy Tail", "Solo Leveling"]);
});

test("Nerd Corner targets retain exact provider categories and unresolved books", () => {
  const tmdbItems = [...currentlyIntoSeries, ...favoriteMovies, ...favoriteSeries];
  const googleBooksItems = [...favoriteBooks, currentlyReading];
  const igdbItems = [...currentlyPlaying];

  assert.equal(tmdbItems.length, 19);
  assert.equal(googleBooksItems.length, 4);
  assert.equal(igdbItems.length, 4);

  for (const item of tmdbItems) {
    assert.equal(item.artwork?.provider, "tmdb", item.id);
    assert.equal(item.artwork?.mediaType, item.format === "saga" ? "collection" : item.format === "movie" ? "movie" : "tv", item.id);
  }
  for (const item of googleBooksItems) {
    assert.equal(item.artwork?.provider, "google-books", item.id);
    assert.equal(item.artwork?.mediaType, undefined, item.id);
  }
  for (const item of igdbItems) {
    assert.equal(item.artwork?.provider, "igdb", item.id);
    assert.equal(item.artwork?.mediaType, undefined, item.id);
  }
  for (const item of [...tmdbItems, ...igdbItems]) {
    assert.ok(item.artwork?.canonicalId, `${item.id}: canonical provider ID`);
    assert.ok(getResolvedTasteArtwork(item), `${item.id}: verified artwork`);
  }
  for (const item of googleBooksItems) {
    assert.equal(item.artwork?.canonicalId, undefined, `${item.id}: canonical provider ID remains unresolved`);
    assert.equal(item.artwork?.src, undefined, `${item.id}: artwork reference remains unresolved`);
    assert.equal(item.artwork?.alt, undefined, `${item.id}: artwork alternative text remains unresolved`);
    assert.equal(item.artwork?.attribution, undefined, `${item.id}: attribution remains unresolved`);
    assert.equal(getResolvedTasteArtwork(item), undefined, `${item.id}: unresolved metadata must use the fallback`);
  }
});

test("Nerd Corner music remains intentionally typographic", () => {
  for (const item of [...favoriteArtists, ...currentlyIntoArtists, ...currentlyIntoSongs]) {
    assert.equal(item.artwork, undefined, item.id);
    assert.equal(getResolvedTasteArtwork(item), undefined, item.id);
  }
});

test("Nerd Corner has complete seven-locale UI and deterministic repository-only artwork fallbacks", () => {
  assert.deepEqual(Object.keys(nerdCornerDictionaries).sort(), [...locales].sort());
  const fields = Object.keys(nerdCornerDictionaries.en).sort();
  for (const locale of locales) {
    const copy = nerdCornerDictionaries[locale];
    assert.deepEqual(Object.keys(copy).sort(), fields, locale);
    assert.deepEqual(Object.keys(copy.formats).sort(), ["anime", "artist", "book", "game", "movie", "saga", "series", "song"], locale);
    assert.ok(copy.heroDescription.length > 45, locale);
    assert.match(copy.lobbifyEyebrow, /Lobbify/u, locale);
    assert.match(copy.lobbifyTitle, /Lobbify/u, locale);
    assert.match(copy.lobbifyDescription, /Lobbify/u, locale);
    assert.match(copy.lobbifyPrinciple, /\S/u, locale);
    assert.match(copy.streamoryStatus, /./u, locale);
  }
  const page = source("../app/about/nerd-corner/page.tsx");
  assert.match(page, /getResolvedTasteArtwork\(item\)/u);
  assert.doesNotMatch(page, /process\.env\.NODE_ENV/u);
  assert.match(page, /data-artwork=\{artwork \? "resolved" : "fallback"\}/u);
  assert.match(page, /<h1/u);
  assert.match(page, /aria-labelledby="currently-into-title"/u);
  assert.match(page, /sm:grid-cols-2/u);
  assert.deepEqual(page.match(/https?:\/\/[^"\s]+/gu), ["https://www.themoviedb.org", "https://www.igdb.com"]);
  assert.doesNotMatch([page, source("../data/nerd-corner.ts")].join("\n"), /spotify|open\.spotify|imdb/iu);
});

test("Lobbify handoff belongs to Gaming and withholds a link while no canonical project route exists", () => {
  const page = source("../app/about/nerd-corner/page.tsx");
  const gamingStart = page.indexOf('aria-labelledby="playing-title"');
  const handoff = page.indexOf('aria-labelledby="lobbify-title"');
  const gamingEnd = page.indexOf('aria-labelledby="music-title"');

  assert.ok(gamingStart >= 0 && handoff > gamingStart && gamingEnd > handoff);
  assert.equal(projects.some(({ slug }) => slug === "lobbify"), false);
  assert.doesNotMatch(page, /localizeHref\("\/projects\/lobbify"|href=["'{][^\n}]*lobbify/iu);
  assert.doesNotMatch(page, /lobbify\.(?:com|app|io)|(?:profile|users?)\/[^\s"']*lobbify/iu);
  assert.match(page, /<aside aria-labelledby="lobbify-title"/u);
  assert.match(page, /<h3 id="lobbify-title"/u);
});

test("Streamory handoff is visible, honest and never invents a public profile URL", () => {
  const page = source("../app/about/nerd-corner/page.tsx");
  assert.match(nerdCornerDictionaries.en.streamoryTitle, /full taste profile on Streamory/u);
  assert.match(page, /aria-disabled="true"/u);
  assert.match(page, /localizeHref\("\/projects\/streamory", locale\)/u);
  assert.doesNotMatch(page, /streamory\.(?:com|app|io)|taste-profile|profile\/benjamin/iu);
  assert.match(source("../app/about/page.tsx"), /localizeHref\("\/about\/nerd-corner", locale\)/u);
  assert.match(`${source("../app/sitemap.ts")}\n${source("../lib/search-discovery.ts")}`, /"\/about\/nerd-corner"/u);
  assert.match(source("../data/discovery-index.ts"), /id: "page-nerd-corner"/u);
});

test("public contact is canonical while service and test email identities remain classified", () => {
  assert.equal(siteConfig.email, "goatrecrutainer@gmail.com");
  assert.equal(legalOperator.email, "goatrecrutainer@gmail.com");
  const publicContact = [source("../components/sections/contact.tsx"), source("../app/privacy/page.tsx"), source("../app/impressum/page.tsx")].join("\n");
  assert.match(publicContact, /mailto:\$\{(?:siteConfig|legalOperator)\.email\}/u);
  assert.match(source("../components/sections/contact.tsx"), /\{siteConfig\.email\}/u);
  const newsletter = source("../lib/newsletter/config.ts");
  assert.match(newsletter, /configuredEmail\(environment\.NEWSLETTER_FROM_EMAIL\)/u);
  assert.match(newsletter, /configuredEmail\(environment\.NEWSLETTER_REPLY_TO_EMAIL\)/u);
  assert.doesNotMatch(newsletter, /@btshq\.online/u);
});

test("privacy disclosure describes only the implemented public content and internal handoff", () => {
  const privacy = source("../app/privacy/page.tsx");
  assert.match(privacy, /Nerd Corner is publicly visible, editorially selected personal content/u);
  assert.match(privacy, /media\.themoviedb\.org \(TMDB\)/u);
  assert.match(privacy, /images\.igdb\.com \(IGDB\)/u);
  assert.match(privacy, /IP address and request headers/u);
  assert.match(privacy, /does not set additional cookies, add provider tracking or make runtime provider API calls/u);
  assert.match(privacy, /links only to the internal project page/u);
  assert.doesNotMatch(privacy, /Spotify (?:receives|collects)|Streamory (?:receives|collects)/u);
});

test("Writing and Daily Quote Social Post exports keep the approved BTS icon without redundant handle branding", () => {
  const writing: WritingShareSource = {
    articleId: "article", articleSlug: "article", articleTitle: "A truthful article title", authorName: "Benjamin Trinidad Segura",
    canonicalUrl: "https://btshq.online/writing/article", domain: "btshq.online", kind: "thought", language: "en", readingMinutes: 4,
    text: "A bounded authored thought.",
  };
  const quote: SelectedQuote = { id: "btsq-sprint-6", text: "A truthful daily quote.", attribution: "btshq.online", origin: "bts-original", themes: ["clarity"], semanticFamily: "clarity", shareEligible: true, fallbackLevel: "specific", eligibleCount: 1 };
  for (const format of writingShareFormats) {
    const writingHtml = renderToStaticMarkup(createElement(WritingSocialPostCard, { cardIndex: 0, cardTotal: 1, copy: writingShareDictionaries.en, format, source: writing, text: writing.text }));
    const quoteHtml = renderToStaticMarkup(createElement(QuoteSocialPostCard, { format, originalLabel: "BTS Original", quote, surfaceLabel: "Daily Quote" }));
    for (const html of [writingHtml, quoteHtml]) {
      assert.match(html, /data-style="social-post"/u);
      assert.match(html, /src="\/icons\/bts-app-icon-192\.png"/u);
      assert.doesNotMatch(html, /@btshq\.online/u);
      assert.equal((html.match(/btshq\.online/gu) ?? []).length, 1);
      assert.doesNotMatch(html, /like count|follower|verified|repost|view count/iu);
    }
  }
  assert.match(source("../components/sharing/social-post-card.tsx"), /<Image aria-hidden="true" alt=""/u);
  const renderer = source("../lib/sharing/native-card-share.ts");
  assert.match(renderer, /waitForShareCardImages\(exportCard\.card\)/u);
  assert.match(renderer, /context\.drawImage\(element/u);
});
