import type { TasteFormat } from "@/data/nerd-corner";
import type { Locale } from "@/lib/i18n/config";

export type NerdCornerCopy = {
  title: string;
  description: string;
  breadcrumb: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  curatedNote: string;
  currentlyInto: string;
  currentlyIntoDescription: string;
  favorites: string;
  favoriteMovies: string;
  favoriteSeries: string;
  currentlyReading: string;
  currentlyReadingDescription: string;
  currentlyPlaying: string;
  currentlyPlayingDescription: string;
  music: string;
  currentlyIntoArtists: string;
  favoriteArtists: string;
  songs: string;
  books: string;
  favoriteBooks: string;
  artworkFallback: string;
  formats: Record<TasteFormat, string>;
  streamoryEyebrow: string;
  streamoryTitle: string;
  streamoryDescription: string;
  streamoryCta: string;
  streamoryStatus: string;
  streamoryProject: string;
};

export const nerdCornerDictionaries: Record<Locale, NerdCornerCopy> = {
  de: {
    title: "Nerd Corner — Kuratierter Geschmack | bts.online",
    description: "Ein kuratierter Einblick in Serien, Filme, Musik, Bücher und Games, die Benjamin gerade begleiten oder zu seinen Favoriten gehören.",
    breadcrumb: "Nerd Corner", eyebrow: "Persönliches Archiv / Curated Taste", heroTitle: "Nerd Corner.",
    heroDescription: "Ein persönliches Fenster in das, was ich gerade schaue, höre, lese und spiele — bewusst kuratiert, nicht vollständig.",
    curatedNote: "BTS.ONLINE zeigt die Auswahl. Das vollständige Taste Profile gehört später zu Streamory.",
    currentlyInto: "Schaue ich gerade", currentlyIntoDescription: "Serien, die ich gerade schaue.",
    favorites: "Favoriten", favoriteMovies: "Filme", favoriteSeries: "Serien",
    currentlyReading: "Lese ich gerade", currentlyReadingDescription: "Der aktuelle Platz im Bücherregal.",
    currentlyPlaying: "Spiele ich gerade", currentlyPlayingDescription: "Games, die aktuell Raum bekommen.",
    music: "Musik", currentlyIntoArtists: "Gerade im Ohr", favoriteArtists: "Lieblingsartists", songs: "Songs in Rotation",
    books: "Bücher", favoriteBooks: "Favoriten im Regal", artworkFallback: "Editoriale Darstellung · kein offizielles Artwork geladen",
    formats: { series: "Serie", movie: "Film", saga: "Saga", anime: "Anime", artist: "Artist", song: "Song", book: "Buch", game: "Game" },
    streamoryEyebrow: "Die vollständige Welt / Streamory", streamoryTitle: "Mein vollständiges Taste Profile auf Streamory entdecken.",
    streamoryDescription: "Nerd Corner bleibt die kuratierte Auswahl im Digital HQ. Das öffentliche, teilbare Taste Profile ist eine geplante Streamory-Funktion und hat noch keine verifizierte öffentliche URL.",
    streamoryCta: "Vollständiges Taste Profile öffnen", streamoryStatus: "Öffentliches Profil folgt", streamoryProject: "Streamory als Projekt ansehen",
  },
  en: {
    title: "Nerd Corner — Curated Taste | bts.online",
    description: "A curated window into the series, films, music, books and games Benjamin is currently into or keeps among his favourites.",
    breadcrumb: "Nerd Corner", eyebrow: "Personal archive / Curated taste", heroTitle: "Nerd Corner.",
    heroDescription: "A personal window into what I am watching, listening to, reading and playing—deliberately curated, never exhaustive.",
    curatedNote: "BTS.ONLINE holds the selection. The complete taste profile belongs in Streamory later.",
    currentlyInto: "Currently watching", currentlyIntoDescription: "Series I'm currently watching.",
    favorites: "Favourites", favoriteMovies: "Movies", favoriteSeries: "Series",
    currentlyReading: "Currently reading", currentlyReadingDescription: "The current place on the bookshelf.",
    currentlyPlaying: "Currently playing", currentlyPlayingDescription: "Games getting time right now.",
    music: "Music", currentlyIntoArtists: "Currently in rotation", favoriteArtists: "Favourite artists", songs: "Songs in rotation",
    books: "Books", favoriteBooks: "Shelf favourites", artworkFallback: "Editorial fallback · no official artwork loaded",
    formats: { series: "Series", movie: "Movie", saga: "Saga", anime: "Anime", artist: "Artist", song: "Song", book: "Book", game: "Game" },
    streamoryEyebrow: "The complete world / Streamory", streamoryTitle: "Explore my full taste profile on Streamory.",
    streamoryDescription: "Nerd Corner remains the curated selection inside the Digital HQ. The public, shareable Taste Profile is a planned Streamory capability and does not yet have a verified public URL.",
    streamoryCta: "Open full taste profile", streamoryStatus: "Public profile coming later", streamoryProject: "View the Streamory project",
  },
  es: {
    title: "Nerd Corner — Gustos seleccionados | bts.online",
    description: "Una mirada seleccionada a las series, películas, música, libros y juegos que acompañan ahora a Benjamin o están entre sus favoritos.",
    breadcrumb: "Nerd Corner", eyebrow: "Archivo personal / Gustos seleccionados", heroTitle: "Nerd Corner.",
    heroDescription: "Una ventana personal a lo que veo, escucho, leo y juego ahora: seleccionada con intención, nunca exhaustiva.",
    curatedNote: "BTS.ONLINE muestra la selección. El perfil completo de gustos pertenecerá más adelante a Streamory.",
    currentlyInto: "Viendo ahora", currentlyIntoDescription: "Series que estoy viendo actualmente.",
    favorites: "Favoritos", favoriteMovies: "Películas", favoriteSeries: "Series",
    currentlyReading: "Leyendo ahora", currentlyReadingDescription: "El lugar actual en la estantería.",
    currentlyPlaying: "Jugando ahora", currentlyPlayingDescription: "Juegos a los que dedico tiempo ahora.",
    music: "Música", currentlyIntoArtists: "Ahora en rotación", favoriteArtists: "Artistas favoritos", songs: "Canciones en rotación",
    books: "Libros", favoriteBooks: "Favoritos de la estantería", artworkFallback: "Composición editorial · sin arte oficial cargado",
    formats: { series: "Serie", movie: "Película", saga: "Saga", anime: "Anime", artist: "Artista", song: "Canción", book: "Libro", game: "Juego" },
    streamoryEyebrow: "El mundo completo / Streamory", streamoryTitle: "Explora mi perfil completo de gustos en Streamory.",
    streamoryDescription: "Nerd Corner sigue siendo la selección del Digital HQ. El perfil público y compartible es una función prevista de Streamory y todavía no tiene una URL pública verificada.",
    streamoryCta: "Abrir perfil completo", streamoryStatus: "Perfil público próximamente", streamoryProject: "Ver el proyecto Streamory",
  },
  tr: {
    title: "Nerd Corner — Seçilmiş zevkler | bts.online",
    description: "Benjamin'in şu sıralar ilgilendiği ya da favorileri arasında tuttuğu dizi, film, müzik, kitap ve oyunlardan seçilmiş bir pencere.",
    breadcrumb: "Nerd Corner", eyebrow: "Kişisel arşiv / Seçilmiş zevkler", heroTitle: "Nerd Corner.",
    heroDescription: "Şu anda izlediğim, dinlediğim, okuduğum ve oynadığım şeylere kişisel bir pencere; bilinçli olarak seçilmiş, asla eksiksiz değil.",
    curatedNote: "BTS.ONLINE seçkiyi gösterir. Eksiksiz zevk profili daha sonra Streamory'ye aittir.",
    currentlyInto: "Şu anda izliyorum", currentlyIntoDescription: "Şu anda izlediğim diziler.",
    favorites: "Favoriler", favoriteMovies: "Filmler", favoriteSeries: "Diziler",
    currentlyReading: "Şu anda okuyorum", currentlyReadingDescription: "Kitaplıktaki güncel yer.",
    currentlyPlaying: "Şu anda oynuyorum", currentlyPlayingDescription: "Şu anda zaman ayırdığım oyunlar.",
    music: "Müzik", currentlyIntoArtists: "Şu anda rotasyonda", favoriteArtists: "Favori sanatçılar", songs: "Rotasyondaki şarkılar",
    books: "Kitaplar", favoriteBooks: "Kitaplık favorileri", artworkFallback: "Editoryal görünüm · resmî görsel yüklenmedi",
    formats: { series: "Dizi", movie: "Film", saga: "Seri", anime: "Anime", artist: "Sanatçı", song: "Şarkı", book: "Kitap", game: "Oyun" },
    streamoryEyebrow: "Eksiksiz dünya / Streamory", streamoryTitle: "Streamory'deki eksiksiz zevk profilimi keşfet.",
    streamoryDescription: "Nerd Corner, Digital HQ içindeki seçki olarak kalır. Herkese açık ve paylaşılabilir Taste Profile planlanan bir Streamory özelliğidir; henüz doğrulanmış bir URL'si yoktur.",
    streamoryCta: "Tam zevk profilini aç", streamoryStatus: "Herkese açık profil daha sonra", streamoryProject: "Streamory projesini gör",
  },
  pl: {
    title: "Nerd Corner — Wybrane gusta | bts.online",
    description: "Wybrane spojrzenie na seriale, filmy, muzykę, książki i gry, które obecnie zajmują Benjamina lub należą do jego ulubionych.",
    breadcrumb: "Nerd Corner", eyebrow: "Osobiste archiwum / Wybrane gusta", heroTitle: "Nerd Corner.",
    heroDescription: "Osobiste okno na to, co teraz oglądam, czego słucham, co czytam i w co gram — świadomie wybrane, nigdy kompletne.",
    curatedNote: "BTS.ONLINE pokazuje wybór. Pełny profil gustu będzie później należał do Streamory.",
    currentlyInto: "Teraz oglądam", currentlyIntoDescription: "Seriale, które teraz oglądam.",
    favorites: "Ulubione", favoriteMovies: "Filmy", favoriteSeries: "Seriale",
    currentlyReading: "Teraz czytam", currentlyReadingDescription: "Aktualne miejsce na półce.",
    currentlyPlaying: "Teraz gram", currentlyPlayingDescription: "Gry, którym poświęcam teraz czas.",
    music: "Muzyka", currentlyIntoArtists: "Teraz w rotacji", favoriteArtists: "Ulubieni artyści", songs: "Utwory w rotacji",
    books: "Książki", favoriteBooks: "Ulubione z półki", artworkFallback: "Kompozycja redakcyjna · bez oficjalnej grafiki",
    formats: { series: "Serial", movie: "Film", saga: "Saga", anime: "Anime", artist: "Artysta", song: "Utwór", book: "Książka", game: "Gra" },
    streamoryEyebrow: "Pełny świat / Streamory", streamoryTitle: "Odkryj mój pełny profil gustu w Streamory.",
    streamoryDescription: "Nerd Corner pozostaje wybraną częścią Digital HQ. Publiczny, udostępnialny Taste Profile jest planowaną funkcją Streamory i nie ma jeszcze zweryfikowanego adresu.",
    streamoryCta: "Otwórz pełny profil gustu", streamoryStatus: "Profil publiczny pojawi się później", streamoryProject: "Zobacz projekt Streamory",
  },
  el: {
    title: "Nerd Corner — Επιλεγμένες προτιμήσεις | bts.online",
    description: "Μια επιλεγμένη ματιά στις σειρές, ταινίες, μουσική, βιβλία και παιχνίδια που απασχολούν τώρα τον Benjamin ή είναι αγαπημένα του.",
    breadcrumb: "Nerd Corner", eyebrow: "Προσωπικό αρχείο / Επιλεγμένες προτιμήσεις", heroTitle: "Nerd Corner.",
    heroDescription: "Ένα προσωπικό παράθυρο σε όσα βλέπω, ακούω, διαβάζω και παίζω τώρα — σκόπιμα επιλεγμένο, ποτέ εξαντλητικό.",
    curatedNote: "Το BTS.ONLINE κρατά την επιλογή. Το πλήρες προφίλ προτιμήσεων ανήκει αργότερα στο Streamory.",
    currentlyInto: "Παρακολουθώ τώρα", currentlyIntoDescription: "Σειρές που παρακολουθώ αυτή την περίοδο.",
    favorites: "Αγαπημένα", favoriteMovies: "Ταινίες", favoriteSeries: "Σειρές",
    currentlyReading: "Διαβάζω τώρα", currentlyReadingDescription: "Η τρέχουσα θέση στο ράφι.",
    currentlyPlaying: "Παίζω τώρα", currentlyPlayingDescription: "Παιχνίδια που παίρνουν χρόνο αυτή την περίοδο.",
    music: "Μουσική", currentlyIntoArtists: "Τώρα σε επανάληψη", favoriteArtists: "Αγαπημένοι καλλιτέχνες", songs: "Τραγούδια σε επανάληψη",
    books: "Βιβλία", favoriteBooks: "Αγαπημένα του ραφιού", artworkFallback: "Εκδοτική σύνθεση · χωρίς επίσημο artwork",
    formats: { series: "Σειρά", movie: "Ταινία", saga: "Saga", anime: "Anime", artist: "Καλλιτέχνης", song: "Τραγούδι", book: "Βιβλίο", game: "Παιχνίδι" },
    streamoryEyebrow: "Ο πλήρης κόσμος / Streamory", streamoryTitle: "Εξερεύνησε το πλήρες προφίλ προτιμήσεών μου στο Streamory.",
    streamoryDescription: "Το Nerd Corner παραμένει η επιλεγμένη εικόνα στο Digital HQ. Το δημόσιο, κοινοποιήσιμο Taste Profile είναι σχεδιαζόμενη δυνατότητα του Streamory και δεν έχει ακόμη επαληθευμένο URL.",
    streamoryCta: "Άνοιγμα πλήρους προφίλ", streamoryStatus: "Το δημόσιο προφίλ έρχεται αργότερα", streamoryProject: "Δες το έργο Streamory",
  },
  ru: {
    title: "Nerd Corner — Избранные вкусы | bts.online",
    description: "Избранный взгляд на сериалы, фильмы, музыку, книги и игры, которыми Benjamin увлечён сейчас или которые считает любимыми.",
    breadcrumb: "Nerd Corner", eyebrow: "Личный архив / Избранные вкусы", heroTitle: "Nerd Corner.",
    heroDescription: "Личное окно в то, что я сейчас смотрю, слушаю, читаю и во что играю — осознанная выборка, а не полный каталог.",
    curatedNote: "BTS.ONLINE показывает выборку. Полный профиль вкусов позже будет частью Streamory.",
    currentlyInto: "Сейчас смотрю", currentlyIntoDescription: "Сериалы, которые я сейчас смотрю.",
    favorites: "Любимое", favoriteMovies: "Фильмы", favoriteSeries: "Сериалы",
    currentlyReading: "Сейчас читаю", currentlyReadingDescription: "Текущее место на книжной полке.",
    currentlyPlaying: "Сейчас играю", currentlyPlayingDescription: "Игры, которым сейчас достаётся время.",
    music: "Музыка", currentlyIntoArtists: "Сейчас в ротации", favoriteArtists: "Любимые исполнители", songs: "Треки в ротации",
    books: "Книги", favoriteBooks: "Любимое на полке", artworkFallback: "Редакционная композиция · без официальной обложки",
    formats: { series: "Сериал", movie: "Фильм", saga: "Сага", anime: "Аниме", artist: "Исполнитель", song: "Трек", book: "Книга", game: "Игра" },
    streamoryEyebrow: "Полный мир / Streamory", streamoryTitle: "Откройте мой полный профиль вкусов в Streamory.",
    streamoryDescription: "Nerd Corner остаётся избранной частью Digital HQ. Публичный профиль Taste Profile с возможностью поделиться — запланированная функция Streamory, и проверенного публичного URL у неё пока нет.",
    streamoryCta: "Открыть полный профиль вкусов", streamoryStatus: "Публичный профиль появится позже", streamoryProject: "Посмотреть проект Streamory",
  },
};

export function getNerdCornerCopy(locale: Locale): NerdCornerCopy {
  return nerdCornerDictionaries[locale];
}
