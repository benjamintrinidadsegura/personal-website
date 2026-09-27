export type TasteFormat = "series" | "movie" | "saga" | "anime" | "artist" | "song" | "book" | "game";

export type TasteItem = {
  id: string;
  title: string;
  creator?: string;
  format: TasteFormat;
  artwork?: {
    src: string;
    alt: string;
  };
};

export const currentlyIntoSeries: readonly TasteItem[] = [
  { id: "billions", title: "Billions", format: "series" },
  { id: "shrinking", title: "Shrinking", format: "series" },
  { id: "after-life", title: "After Life", format: "series" },
  { id: "how-i-met-your-mother-current", title: "How I Met Your Mother", format: "series" },
  { id: "bleach", title: "Bleach", format: "anime" },
  { id: "lanterns", title: "Lanterns", format: "series" },
  { id: "the-gentlemen", title: "The Gentlemen", format: "series" },
  { id: "ted-lasso", title: "Ted Lasso", format: "series" },
  { id: "the-mentalist", title: "The Mentalist", format: "series" },
];

export const favoriteMovies: readonly TasteItem[] = [
  { id: "harry-potter", title: "Harry Potter", format: "saga" },
  { id: "grown-ups", title: "Grown Ups", format: "movie" },
  { id: "grown-ups-2", title: "Grown Ups 2", format: "movie" },
];

export const favoriteSeries: readonly TasteItem[] = [
  { id: "the-blacklist", title: "The Blacklist", format: "series" },
  { id: "how-i-met-your-mother-favorite", title: "How I Met Your Mother", format: "series" },
  { id: "heroes", title: "Heroes", format: "series" },
  { id: "black-clover", title: "Black Clover", format: "anime" },
  { id: "my-hero-academia", title: "My Hero Academia", format: "anime" },
  { id: "fairy-tail", title: "Fairy Tail", format: "anime" },
  { id: "solo-leveling", title: "Solo Leveling", format: "anime" },
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
  { id: "der-alchemist", title: "Der Alchemist", creator: "Paulo Coelho", format: "book" },
  { id: "the-big-five-for-life", title: "The Big Five for Life", creator: "John Strelecky", format: "book" },
  { id: "das-cafe-am-rande-der-welt", title: "Das Café am Rande der Welt", creator: "John Strelecky", format: "book" },
];

export const currentlyReading: TasteItem = {
  id: "besser-fuehlen",
  title: "Besser fühlen: Eine Reise zur Gelassenheit",
  creator: "Leon Windscheid",
  format: "book",
};

export const currentlyPlaying: readonly TasteItem[] = [
  { id: "teamfight-tactics", title: "Teamfight Tactics", format: "game" },
  { id: "deadzone-rogue", title: "Deadzone Rogue", format: "game" },
  { id: "aniimo", title: "Aniimo", format: "game" },
  { id: "the-division-2", title: "Tom Clancy's The Division 2", format: "game" },
];
