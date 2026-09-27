export type TasteFormat = "series" | "movie" | "saga" | "anime" | "artist" | "song" | "book" | "game";

export type ArtworkProvider = "tmdb" | "google-books" | "igdb";

export type ArtworkMediaType = "movie" | "tv" | "collection";

export type ArtworkAttribution = {
  label: string;
  href?: string;
};

export type TasteArtwork = {
  provider: ArtworkProvider;
  canonicalId?: string;
  mediaType?: ArtworkMediaType;
  src?: string;
  alt?: string;
  attribution?: ArtworkAttribution;
};

export type ResolvedTasteArtwork = TasteArtwork & {
  src: string;
  alt: string;
};

export type TasteItem = {
  id: string;
  title: string;
  creator?: string;
  format: TasteFormat;
  artwork?: TasteArtwork;
};

export function getResolvedTasteArtwork(item: TasteItem): ResolvedTasteArtwork | undefined {
  const artwork = item.artwork;
  return artwork?.src && artwork.alt ? { ...artwork, src: artwork.src, alt: artwork.alt } : undefined;
}

const tmdbAttribution: ArtworkAttribution = {
  label: "TMDB",
  href: "https://www.themoviedb.org",
};

function tmdbArtwork(canonicalId: string, mediaType: ArtworkMediaType, src: string, alt: string): TasteArtwork {
  return { provider: "tmdb", canonicalId, mediaType, src, alt, attribution: tmdbAttribution };
}

function igdbArtwork(canonicalId: string, src: string, alt: string, href: string): TasteArtwork {
  return { provider: "igdb", canonicalId, src, alt, attribution: { label: "IGDB", href } };
}

export const currentlyIntoSeries: readonly TasteItem[] = [
  { id: "billions", title: "Billions", format: "series", artwork: tmdbArtwork("62852", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/edwYPQdZE998d748AdwWLsfy0rl.jpg", "Serienposter zu Billions") },
  { id: "shrinking", title: "Shrinking", format: "series", artwork: tmdbArtwork("136311", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/zEFKMNPBKq6JG7uuDkzTQ9WwErn.jpg", "Serienposter zu Shrinking") },
  { id: "after-life", title: "After Life", format: "series", artwork: tmdbArtwork("79410", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/6eJf4h9XcvqK64vbx27EFlLVURm.jpg", "Serienposter zu After Life") },
  { id: "how-i-met-your-mother-current", title: "How I Met Your Mother", format: "series", artwork: tmdbArtwork("1100", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/b34jPzmB0wZy7EjUZoleXOl2RRI.jpg", "Serienposter zu How I Met Your Mother") },
  { id: "bleach", title: "Bleach", format: "anime", artwork: tmdbArtwork("30984", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg", "Serienposter zum Anime Bleach") },
  { id: "lanterns", title: "Lanterns", format: "series", artwork: tmdbArtwork("95350", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/gpC7h43xPMEV3goYMQShfJbTtLq.jpg", "Serienposter zu Lanterns") },
  { id: "the-gentlemen", title: "The Gentlemen", format: "series", artwork: tmdbArtwork("236235", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/tw3tzfXaSpmUZIB8ZNqNEGzMBCy.jpg", "Serienposter zu The Gentlemen") },
  { id: "ted-lasso", title: "Ted Lasso", format: "series", artwork: tmdbArtwork("97546", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/uRHsiw1wLxPHFXkkv4Ix1s0O6f4.jpg", "Serienposter zu Ted Lasso") },
  { id: "the-mentalist", title: "The Mentalist", format: "series", artwork: tmdbArtwork("5920", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/acYXu4KaDj1NIkMgObnhe4C4a0T.jpg", "Serienposter zu The Mentalist") },
];

export const favoriteMovies: readonly TasteItem[] = [
  { id: "harry-potter", title: "Harry Potter", format: "saga", artwork: tmdbArtwork("1241", "collection", "https://media.themoviedb.org/t/p/w300_and_h450_face/eVPs2Y0LyvTLZn6AP5Z6O2rtiGB.jpg", "Poster der Harry-Potter-Filmreihe") },
  { id: "grown-ups", title: "Grown Ups", format: "movie", artwork: tmdbArtwork("38365", "movie", "https://media.themoviedb.org/t/p/w300_and_h450_face/cQGM5k1NtU85n4TUlrOrwijSCcm.jpg", "Filmplakat zu Grown Ups") },
  { id: "grown-ups-2", title: "Grown Ups 2", format: "movie", artwork: tmdbArtwork("109418", "movie", "https://media.themoviedb.org/t/p/w300_and_h450_face/hT6ijOtjtYrnyDhN7VA2QWyGFAm.jpg", "Filmplakat zu Grown Ups 2") },
];

export const favoriteSeries: readonly TasteItem[] = [
  { id: "the-blacklist", title: "The Blacklist", format: "series", artwork: tmdbArtwork("46952", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/4HTfd1PhgFUenJxVuBDNdLmdr0c.jpg", "Serienposter zu The Blacklist") },
  { id: "how-i-met-your-mother-favorite", title: "How I Met Your Mother", format: "series", artwork: tmdbArtwork("1100", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/b34jPzmB0wZy7EjUZoleXOl2RRI.jpg", "Serienposter zu How I Met Your Mother") },
  { id: "heroes", title: "Heroes", format: "series", artwork: tmdbArtwork("1639", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/lf0TcOkheYUZKpeh7c8lqJHNk5O.jpg", "Serienposter zu Heroes") },
  { id: "black-clover", title: "Black Clover", format: "anime", artwork: tmdbArtwork("73223", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/kaMisKeOoTBPxPkbC3OW7Wgt6ON.jpg", "Serienposter zum Anime Black Clover") },
  { id: "my-hero-academia", title: "My Hero Academia", format: "anime", artwork: tmdbArtwork("65930", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/phuYuzqWW9ru8EA3HVjE9W2Rr3M.jpg", "Serienposter zum Anime My Hero Academia") },
  { id: "fairy-tail", title: "Fairy Tail", format: "anime", artwork: tmdbArtwork("46261", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/AsfCVSHnFnUnbepLucvIB1N30Il.jpg", "Serienposter zum Anime Fairy Tail") },
  { id: "solo-leveling", title: "Solo Leveling", format: "anime", artwork: tmdbArtwork("127532", "tv", "https://media.themoviedb.org/t/p/w300_and_h450_face/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg", "Serienposter zum Anime Solo Leveling") },
];

export const favoriteArtists: readonly TasteItem[] = [
  { id: "raf-camora-favorite", title: "RAF Camora", format: "artist" },
  { id: "bazanji-favorite", title: "Bazanji", format: "artist" },
  { id: "metrickz-favorite", title: "Metrickz", format: "artist" },
  { id: "dardan", title: "Dardan", format: "artist" },
  { id: "connor-price", title: "Connor Price", format: "artist" },
  { id: "lovixx", title: "Lovixx", format: "artist" },
  { id: "sierra-kidd", title: "Sierra Kidd", format: "artist" },
];

export const currentlyIntoArtists: readonly TasteItem[] = [
  { id: "raf-camora-current", title: "RAF Camora", format: "artist" },
  { id: "metrickz-current", title: "Metrickz", format: "artist" },
  { id: "bazanji-current", title: "Bazanji", format: "artist" },
];

export const currentlyIntoSongs: readonly TasteItem[] = [
  { id: "irgendwas", title: "Irgendwas", creator: "Romero", format: "song" },
  { id: "was-wenn-nicht-jetzt", title: "Was wenn nicht jetzt?", creator: "Rufuz", format: "song" },
  { id: "fcked-up", title: "F*CKED UP", creator: "Alex Cooper", format: "song" },
  { id: "monolith", title: "Monolith", creator: "Itachi", format: "song" },
];

export const favoriteBooks: readonly TasteItem[] = [
  { id: "der-alchemist", title: "Der Alchemist", creator: "Paulo Coelho", format: "book", artwork: { provider: "google-books" } },
  { id: "the-big-five-for-life", title: "The Big Five for Life", creator: "John Strelecky", format: "book", artwork: { provider: "google-books" } },
  { id: "das-cafe-am-rande-der-welt", title: "Das Café am Rande der Welt", creator: "John Strelecky", format: "book", artwork: { provider: "google-books" } },
];

export const currentlyReading: TasteItem = {
  id: "besser-fuehlen",
  title: "Besser fühlen: Eine Reise zur Gelassenheit",
  creator: "Leon Windscheid",
  format: "book",
  artwork: { provider: "google-books" },
};

export const currentlyPlaying: readonly TasteItem[] = [
  { id: "teamfight-tactics", title: "Teamfight Tactics", format: "game", artwork: igdbArtwork("120176", "https://images.igdb.com/igdb/image/upload/t_cover_big/cocsmb.webp", "Spielcover zu Teamfight Tactics", "https://www.igdb.com/games/teamfight-tactics") },
  { id: "deadzone-rogue", title: "Deadzone Rogue", format: "game", artwork: igdbArtwork("316979", "https://images.igdb.com/igdb/image/upload/t_cover_big/co9rsi.webp", "Spielcover zu Deadzone: Rogue", "https://www.igdb.com/games/deadzone-rogue") },
  { id: "aniimo", title: "Aniimo", format: "game", artwork: igdbArtwork("348202", "https://images.igdb.com/igdb/image/upload/t_cover_big/cocce2.webp", "Spielcover zu Aniimo", "https://www.igdb.com/games/aniimo") },
  { id: "the-division-2", title: "Tom Clancy's The Division 2", format: "game", artwork: igdbArtwork("90099", "https://images.igdb.com/igdb/image/upload/t_cover_big/co1xrm.webp", "Spielcover zu Tom Clancy's The Division 2", "https://www.igdb.com/games/tom-clancys-the-division-2") },
];
