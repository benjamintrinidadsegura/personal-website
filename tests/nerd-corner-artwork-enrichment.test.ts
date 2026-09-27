import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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
  type ArtworkMediaType,
  type TasteItem,
} from "../data/nerd-corner";
import nextConfig from "../next.config";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

type ExpectedTmdbArtwork = {
  canonicalId: string;
  mediaType: ArtworkMediaType;
  src: string;
  alt: string;
};

const expectedTmdbByLocalId: Readonly<Record<string, ExpectedTmdbArtwork>> = {
  "harry-potter": { canonicalId: "1241", mediaType: "collection", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/eVPs2Y0LyvTLZn6AP5Z6O2rtiGB.jpg", alt: "Poster der Harry-Potter-Filmreihe" },
  "grown-ups": { canonicalId: "38365", mediaType: "movie", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/cQGM5k1NtU85n4TUlrOrwijSCcm.jpg", alt: "Filmplakat zu Grown Ups" },
  "grown-ups-2": { canonicalId: "109418", mediaType: "movie", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/hT6ijOtjtYrnyDhN7VA2QWyGFAm.jpg", alt: "Filmplakat zu Grown Ups 2" },
  billions: { canonicalId: "62852", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/edwYPQdZE998d748AdwWLsfy0rl.jpg", alt: "Serienposter zu Billions" },
  shrinking: { canonicalId: "136311", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/zEFKMNPBKq6JG7uuDkzTQ9WwErn.jpg", alt: "Serienposter zu Shrinking" },
  "after-life": { canonicalId: "79410", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/6eJf4h9XcvqK64vbx27EFlLVURm.jpg", alt: "Serienposter zu After Life" },
  "how-i-met-your-mother-current": { canonicalId: "1100", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/b34jPzmB0wZy7EjUZoleXOl2RRI.jpg", alt: "Serienposter zu How I Met Your Mother" },
  bleach: { canonicalId: "30984", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg", alt: "Serienposter zum Anime Bleach" },
  lanterns: { canonicalId: "95350", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/gpC7h43xPMEV3goYMQShfJbTtLq.jpg", alt: "Serienposter zu Lanterns" },
  "the-gentlemen": { canonicalId: "236235", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/tw3tzfXaSpmUZIB8ZNqNEGzMBCy.jpg", alt: "Serienposter zu The Gentlemen" },
  "ted-lasso": { canonicalId: "97546", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/uRHsiw1wLxPHFXkkv4Ix1s0O6f4.jpg", alt: "Serienposter zu Ted Lasso" },
  "the-mentalist": { canonicalId: "5920", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/acYXu4KaDj1NIkMgObnhe4C4a0T.jpg", alt: "Serienposter zu The Mentalist" },
  "the-blacklist": { canonicalId: "46952", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/4HTfd1PhgFUenJxVuBDNdLmdr0c.jpg", alt: "Serienposter zu The Blacklist" },
  "how-i-met-your-mother-favorite": { canonicalId: "1100", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/b34jPzmB0wZy7EjUZoleXOl2RRI.jpg", alt: "Serienposter zu How I Met Your Mother" },
  heroes: { canonicalId: "1639", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/lf0TcOkheYUZKpeh7c8lqJHNk5O.jpg", alt: "Serienposter zu Heroes" },
  "black-clover": { canonicalId: "73223", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/kaMisKeOoTBPxPkbC3OW7Wgt6ON.jpg", alt: "Serienposter zum Anime Black Clover" },
  "my-hero-academia": { canonicalId: "65930", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/phuYuzqWW9ru8EA3HVjE9W2Rr3M.jpg", alt: "Serienposter zum Anime My Hero Academia" },
  "fairy-tail": { canonicalId: "46261", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/AsfCVSHnFnUnbepLucvIB1N30Il.jpg", alt: "Serienposter zum Anime Fairy Tail" },
  "solo-leveling": { canonicalId: "127532", mediaType: "tv", src: "https://media.themoviedb.org/t/p/w300_and_h450_face/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg", alt: "Serienposter zum Anime Solo Leveling" },
};

const expectedIgdbByLocalId = {
  "teamfight-tactics": { canonicalId: "120176", src: "https://images.igdb.com/igdb/image/upload/t_cover_big/cocsmb.webp", alt: "Spielcover zu Teamfight Tactics", href: "https://www.igdb.com/games/teamfight-tactics" },
  "deadzone-rogue": { canonicalId: "316979", src: "https://images.igdb.com/igdb/image/upload/t_cover_big/co9rsi.webp", alt: "Spielcover zu Deadzone: Rogue", href: "https://www.igdb.com/games/deadzone-rogue" },
  aniimo: { canonicalId: "348202", src: "https://images.igdb.com/igdb/image/upload/t_cover_big/cocce2.webp", alt: "Spielcover zu Aniimo", href: "https://www.igdb.com/games/aniimo" },
  "the-division-2": { canonicalId: "90099", src: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1xrm.webp", alt: "Spielcover zu Tom Clancy's The Division 2", href: "https://www.igdb.com/games/tom-clancys-the-division-2" },
} as const;

test("verified TMDB manifest data is exact for 18 works and 19 local records", () => {
  const items = [...currentlyIntoSeries, ...favoriteMovies, ...favoriteSeries];
  assert.equal(items.length, 19);
  assert.deepEqual(items.map(({ id }) => id).sort(), Object.keys(expectedTmdbByLocalId).sort());

  for (const item of items) {
    const expected = expectedTmdbByLocalId[item.id];
    assert.ok(expected, item.id);
    assert.deepEqual(item.artwork, {
      provider: "tmdb",
      ...expected,
      attribution: { label: "TMDB", href: "https://www.themoviedb.org" },
    }, item.id);
    assert.ok(getResolvedTasteArtwork(item), item.id);
  }

  assert.equal(new Set(items.map((item) => item.artwork?.canonicalId)).size, 18);
  assert.deepEqual(
    currentlyIntoSeries.find(({ id }) => id === "how-i-met-your-mother-current")?.artwork,
    favoriteSeries.find(({ id }) => id === "how-i-met-your-mother-favorite")?.artwork,
  );
});

test("verified IGDB manifest data is exact while accepted BTS display titles remain unchanged", () => {
  assert.deepEqual(currentlyPlaying.map(({ id }) => id).sort(), Object.keys(expectedIgdbByLocalId).sort());
  for (const item of currentlyPlaying) {
    const expected = expectedIgdbByLocalId[item.id as keyof typeof expectedIgdbByLocalId];
    assert.ok(expected, item.id);
    assert.deepEqual(item.artwork, {
      provider: "igdb",
      canonicalId: expected.canonicalId,
      src: expected.src,
      alt: expected.alt,
      attribution: { label: "IGDB", href: expected.href },
    }, item.id);
    assert.ok(getResolvedTasteArtwork(item), item.id);
  }
  assert.equal(currentlyPlaying.find(({ id }) => id === "deadzone-rogue")?.title, "Deadzone Rogue");
});

test("books and music remain unresolved and renderable only through the accepted fallback", () => {
  for (const item of [...favoriteBooks, currentlyReading]) {
    assert.deepEqual(item.artwork, { provider: "google-books" }, item.id);
    assert.equal(getResolvedTasteArtwork(item), undefined, item.id);
  }
  for (const item of [...favoriteArtists, ...currentlyIntoArtists, ...currentlyIntoSongs]) {
    assert.equal(item.artwork, undefined, item.id);
    assert.equal(getResolvedTasteArtwork(item), undefined, item.id);
  }
});

test("only exact verified image hosts are enabled and used", () => {
  assert.deepEqual(nextConfig.images?.remotePatterns, [
    { protocol: "https", hostname: "media.themoviedb.org", pathname: "/t/p/w300_and_h450_face/**", search: "" },
    { protocol: "https", hostname: "images.igdb.com", pathname: "/igdb/image/upload/t_cover_big/**", search: "" },
  ]);

  const activeItems: readonly TasteItem[] = [
    ...currentlyIntoSeries, ...favoriteMovies, ...favoriteSeries, ...currentlyPlaying,
  ];
  assert.deepEqual(
    [...new Set(activeItems.map((item) => new URL(item.artwork?.src ?? "").hostname))].sort(),
    ["images.igdb.com", "media.themoviedb.org"],
  );
  for (const item of activeItems) {
    assert.ok(item.artwork?.alt, `${item.id}: alt`);
    assert.ok(item.artwork?.attribution?.label, `${item.id}: attribution label`);
    assert.ok(item.artwork?.attribution?.href, `${item.id}: attribution link`);
  }
});

test("artwork activation has graceful fallback and adds no provider API client", () => {
  const page = source("../app/about/nerd-corner/page.tsx");
  const image = source("../components/nerd-corner/resolved-artwork-image.tsx");
  const implementation = [page, image, source("../data/nerd-corner.ts")].join("\n");

  assert.doesNotMatch(page, /process\.env\.NODE_ENV/u);
  assert.match(page, /getResolvedTasteArtwork\(item\)/u);
  assert.match(page, /className="bg-\[#06141e\] object-contain"/u);
  assert.match(image, /onError=\{\(\) => setFailed\(true\)\}/u);
  assert.match(image, /if \(failed\) return children;/u);
  assert.match(image, /unoptimized/u);
  assert.doesNotMatch(implementation, /\bfetch\s*\(|axios|XMLHttpRequest|Authorization:\s*Bearer/iu);
  assert.doesNotMatch(implementation, /process\.env\.(?:TMDB|IGDB|TWITCH|GOOGLE_BOOKS)|(?:TMDB|IGDB|TWITCH|GOOGLE_BOOKS)[_-]?(?:API[_-]?)?(?:KEY|TOKEN|SECRET)/iu);
});

test("human acceptance cover scaling enlarges only watching, favorite-series and game artwork", () => {
  const page = source("../app/about/nerd-corner/page.tsx");

  assert.match(page, /watching: \{ className: "h-20 w-14 sm:h-24 sm:w-16", sizes: "\(min-width: 640px\) 64px, 56px" \}/u);
  assert.match(page, /favoriteSeries: \{ className: "h-20 w-\[3\.25rem\] sm:w-14", sizes: "\(min-width: 640px\) 56px, 52px" \}/u);
  assert.match(page, /game: \{ className: "h-24 w-16 sm:h-28 sm:w-\[4\.75rem\]", sizes: "\(min-width: 640px\) 76px, 64px" \}/u);
  assert.match(page, /<ArtworkMark item=\{item\} variant="watching" \/>/u);
  assert.match(page, /<ArtworkMark item=\{item\} variant="favoriteSeries" \/>/u);
  assert.match(page, /absolute right-7 top-7"><ArtworkMark item=\{game\} variant="game" \/>/u);
  assert.match(page, /<EditorialCover item=\{item\} fallbackLabel=\{copy\.artworkFallback\}/u);
  assert.match(page, /relative aspect-\[4\/5\] overflow-hidden/u);
  assert.match(page, /sizes="\(max-width: 640px\) 70vw, 22vw"/u);
  assert.match(page, /grid-cols-\[auto_auto_minmax\(0,1fr\)\]/u);
  assert.match(page, /relative min-h-64 overflow-hidden/u);
  assert.match(page, /default: \{ className: "size-12", sizes: "48px" \}/u);
});
