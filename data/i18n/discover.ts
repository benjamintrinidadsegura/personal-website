import type { Locale } from "@/lib/i18n/config";

type DiscoverCopy = {
  featured: string;
  emptyTitle: string;
  emptyBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  writingLink: string;
  aboutLink: string;
  paths: string;
  projects: [string, string];
  writing: [string, string];
  people: [string, string];
  experiences: [string, string];
  continueTitle: string;
  connection: string;
  conversationLink: string;
  mapLink: string;
};

export const discoverCopy: Record<Locale, DiscoverCopy> = {
  de: {
    featured: "Heute im Fokus", emptyTitle: "Raum für den nächsten Gedanken.",
    emptyBody: "Hier ist noch kein Text veröffentlicht. Bis dahin: ein Gedanke für heute und Menschen, Projekte und Perspektiven zum Entdecken.",
    unavailableTitle: "Die Texte sind gerade nicht erreichbar.", unavailableBody: "Versuch es später noch einmal oder öffne Writing. Die übrigen Wege durch das HQ stehen dir offen.",
    writingLink: "Zu Writing", aboutLink: "Mehr über mich", paths: "Finde deinen Einstieg",
    projects: ["Projekte", "Was ich aufbaue."], writing: ["Writing", "Was mich beschäftigt."],
    people: ["Menschen", "Mit wem ich ins Gespräch komme."], experiences: ["Erlebnisse", "Finde deinen Weg."],
    continueTitle: "Weiter entdecken", connection: "Ein Gespräch. Ein Ort. Mehr Kontext.",
    conversationLink: "Das Gespräch entdecken", mapLink: "Verbindungen auf der World Map",
  },
  en: {
    featured: "Featured today", emptyTitle: "Room for the next thought.",
    emptyBody: "No writing has been published here yet. In the meantime: a thought for today, and people, projects and perspectives to discover.",
    unavailableTitle: "Writing is temporarily unavailable.", unavailableBody: "Try again later or open Writing. The other paths through the HQ are still here for you.",
    writingLink: "Open Writing", aboutLink: "More about me", paths: "Choose your path",
    projects: ["Projects", "What I’m building."], writing: ["Writing", "What I’m thinking."],
    people: ["People", "Who I’m connecting."], experiences: ["Experiences", "Find your way."],
    continueTitle: "Continue discovering", connection: "A conversation. A place. More context.",
    conversationLink: "Explore the conversation", mapLink: "Connections on the World Map",
  },
  es: {
    featured: "Hoy en primer plano", emptyTitle: "Espacio para la próxima idea.",
    emptyBody: "Todavía no hay textos publicados aquí. Mientras tanto: una idea para hoy, personas, proyectos y perspectivas por descubrir.",
    unavailableTitle: "Los textos no están disponibles por el momento.", unavailableBody: "Inténtalo más tarde o abre Writing. Los demás caminos por el HQ siguen abiertos.",
    writingLink: "Ir a Writing", aboutLink: "Más sobre mí", paths: "Elige tu camino",
    projects: ["Proyectos", "Lo que estoy construyendo."], writing: ["Writing", "Lo que estoy pensando."],
    people: ["Personas", "Con quién converso."], experiences: ["Experiencias", "Encuentra tu camino."],
    continueTitle: "Sigue descubriendo", connection: "Una conversación. Un lugar. Más contexto.",
    conversationLink: "Descubre la conversación", mapLink: "Conexiones en el World Map",
  },
  tr: {
    featured: "Bugün öne çıkanlar", emptyTitle: "Bir sonraki düşünceye yer var.",
    emptyBody: "Burada henüz yayımlanmış bir yazı yok. Bu arada bugün için bir düşünce; keşfedilecek insanlar, projeler ve bakış açıları var.",
    unavailableTitle: "Yazılara şu anda ulaşılamıyor.", unavailableBody: "Daha sonra tekrar dene veya Yazılar bölümünü aç. HQ’daki diğer yollar sana açık.",
    writingLink: "Yazılara git", aboutLink: "Hakkımda daha fazlası", paths: "Başlangıç noktanı seç",
    projects: ["Projeler", "Neler üretiyorum."], writing: ["Yazılar", "Neler düşünüyorum."],
    people: ["İnsanlar", "Kimlerle konuşuyorum."], experiences: ["Deneyimler", "Kendi yolunu bul."],
    continueTitle: "Keşfetmeye devam et", connection: "Bir sohbet. Bir yer. Daha fazla bağlam.",
    conversationLink: "Sohbeti keşfet", mapLink: "World Map üzerindeki bağlantılar",
  },
  pl: {
    featured: "Dziś na pierwszym planie", emptyTitle: "Miejsce na kolejną myśl.",
    emptyBody: "Nie ma tu jeszcze opublikowanych tekstów. Tymczasem: myśl na dziś oraz ludzie, projekty i perspektywy do odkrycia.",
    unavailableTitle: "Teksty są chwilowo niedostępne.", unavailableBody: "Spróbuj później lub otwórz sekcję tekstów. Pozostałe ścieżki przez HQ są nadal otwarte.",
    writingLink: "Przejdź do tekstów", aboutLink: "Więcej o mnie", paths: "Wybierz swoją ścieżkę",
    projects: ["Projekty", "Co tworzę."], writing: ["Teksty", "O czym myślę."],
    people: ["Ludzie", "Z kim rozmawiam."], experiences: ["Doświadczenia", "Znajdź swoją drogę."],
    continueTitle: "Odkrywaj dalej", connection: "Rozmowa. Miejsce. Więcej kontekstu.",
    conversationLink: "Odkryj rozmowę", mapLink: "Powiązania na World Map",
  },
  el: {
    featured: "Στο επίκεντρο σήμερα", emptyTitle: "Χώρος για την επόμενη σκέψη.",
    emptyBody: "Δεν έχουν δημοσιευτεί ακόμη κείμενα εδώ. Μέχρι τότε: μια σκέψη για σήμερα, άνθρωποι, έργα και οπτικές για να ανακαλύψεις.",
    unavailableTitle: "Τα κείμενα δεν είναι διαθέσιμα προσωρινά.", unavailableBody: "Δοκίμασε αργότερα ή άνοιξε τα Κείμενα. Οι υπόλοιπες διαδρομές στο HQ παραμένουν ανοιχτές.",
    writingLink: "Στα Κείμενα", aboutLink: "Περισσότερα για μένα", paths: "Διάλεξε τη διαδρομή σου",
    projects: ["Έργα", "Τι δημιουργώ."], writing: ["Κείμενα", "Τι σκέφτομαι."],
    people: ["Άνθρωποι", "Με ποιους συνομιλώ."], experiences: ["Εμπειρίες", "Βρες τον δρόμο σου."],
    continueTitle: "Συνέχισε την ανακάλυψη", connection: "Μια συζήτηση. Ένας τόπος. Περισσότερο πλαίσιο.",
    conversationLink: "Ανακάλυψε τη συζήτηση", mapLink: "Συνδέσεις στον World Map",
  },
  ru: {
    featured: "Сегодня в центре внимания", emptyTitle: "Место для следующей мысли.",
    emptyBody: "Здесь пока нет опубликованных текстов. А пока: мысль на сегодня, люди, проекты и взгляды, которые можно открыть для себя.",
    unavailableTitle: "Тексты временно недоступны.", unavailableBody: "Попробуйте позже или откройте раздел текстов. Остальные пути по HQ по-прежнему открыты.",
    writingLink: "К текстам", aboutLink: "Больше обо мне", paths: "Выберите свой путь",
    projects: ["Проекты", "Что я создаю."], writing: ["Тексты", "О чём я думаю."],
    people: ["Люди", "С кем я общаюсь."], experiences: ["Впечатления", "Найдите свой путь."],
    continueTitle: "Открывайте дальше", connection: "Разговор. Место. Больше контекста.",
    conversationLink: "Откройте разговор", mapLink: "Связи на World Map",
  },
};
