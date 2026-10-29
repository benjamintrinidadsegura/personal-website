import type { Locale } from "@/lib/i18n/config";

type HomeViewsCopy = {
  label: string;
  discoverDescription: string;
  exploreDescription: string;
  title: string;
  introduction: string;
  invitation: string;
};

export const homeViewsCopy: Record<Locale, HomeViewsCopy> = {
  de: {
    label: "Ansicht wählen", discoverDescription: "Ein ruhiger Einstieg", exploreDescription: "Das vollständige Digital HQ",
    title: "Menschen. Gedanken. Was daraus entstehen kann.",
    introduction: "Ich bin Benjamin. Hier verbinde ich Recruiting, Storytelling und Product Thinking — mit Raum für den Kontext hinter Menschen und Ideen.",
    invitation: "Nutze die Suche, um deinen eigenen Einstieg zu finden. In Explore steht dir das gesamte HQ offen.",
  },
  en: {
    label: "Choose a view", discoverDescription: "A quieter way in", exploreDescription: "The complete Digital HQ",
    title: "People. Ideas. What we can build from them.",
    introduction: "I'm Benjamin. This is where I bring recruiting, storytelling and product thinking together — with room for the context behind people and ideas.",
    invitation: "Use the search to find your own way in. Explore opens the whole HQ.",
  },
  es: {
    label: "Elige una vista", discoverDescription: "Una entrada más tranquila", exploreDescription: "Todo el Digital HQ",
    title: "Personas. Ideas. Lo que podemos construir con ellas.",
    introduction: "Soy Benjamin. Aquí conecto recruiting, storytelling y pensamiento de producto, dejando espacio al contexto detrás de las personas y las ideas.",
    invitation: "Usa la búsqueda para encontrar tu propio punto de partida. Explore te abre todo el HQ.",
  },
  tr: {
    label: "Görünüm seç", discoverDescription: "Daha sakin bir başlangıç", exploreDescription: "Digital HQ’nun tamamı",
    title: "İnsanlar. Fikirler. Birlikte kurabileceklerimiz.",
    introduction: "Ben Benjamin. Burada işe alımı, hikâye anlatıcılığını ve ürün odaklı düşünmeyi bir araya getiriyorum; insanların ve fikirlerin ardındaki bağlama da yer açıyorum.",
    invitation: "Kendi başlangıç noktanı bulmak için aramayı kullan. Explore ile HQ’nun tamamını keşfedebilirsin.",
  },
  pl: {
    label: "Wybierz widok", discoverDescription: "Spokojniejszy początek", exploreDescription: "Całe Digital HQ",
    title: "Ludzie. Pomysły. To, co możemy z nich stworzyć.",
    introduction: "Jestem Benjamin. Łączę tu rekrutację, opowiadanie historii i myślenie produktowe, zostawiając miejsce na kontekst stojący za ludźmi i pomysłami.",
    invitation: "Skorzystaj z wyszukiwarki, aby znaleźć własny punkt wyjścia. Explore otwiera całe HQ.",
  },
  el: {
    label: "Επίλεξε προβολή", discoverDescription: "Μια πιο ήρεμη αρχή", exploreDescription: "Ολόκληρο το Digital HQ",
    title: "Άνθρωποι. Ιδέες. Όσα μπορούμε να χτίσουμε μαζί.",
    introduction: "Είμαι ο Benjamin. Εδώ συνδέω το recruiting, την αφήγηση και τη σκέψη γύρω από το προϊόν, δίνοντας χώρο στο πλαίσιο πίσω από τους ανθρώπους και τις ιδέες.",
    invitation: "Χρησιμοποίησε την αναζήτηση για να βρεις τη δική σου αφετηρία. Το Explore ανοίγει ολόκληρο το HQ.",
  },
  ru: {
    label: "Выбрать вид", discoverDescription: "Спокойное начало", exploreDescription: "Весь Digital HQ",
    title: "Люди. Идеи. То, что мы можем создать вместе.",
    introduction: "Я Бенджамин. Здесь я объединяю рекрутинг, истории и продуктовое мышление, оставляя место для контекста, стоящего за людьми и идеями.",
    invitation: "Воспользуйтесь поиском, чтобы найти свою отправную точку. Explore открывает весь HQ.",
  },
};
