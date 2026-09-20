import { getLocalizedPublishedSpotlight } from "@/data/i18n/people";
import { getLocalizedProject } from "@/data/i18n/projects";
import { getWorldMapDictionary } from "@/data/i18n/world-map";
import type { Locale } from "@/lib/i18n/config";
import type {
  HqPulseCurrentState,
  HqPulseItem,
  HqPulseSource,
  OpenLoopType,
} from "@/types/hq-pulse";

export type HqPulseCopy = {
  eyebrow: string;
  title: string;
  description: string;
  humanMarker: string;
  humanTitle: string;
  humanDescription: string;
  rightNow: string;
  onMyMind: string;
  next: string;
  openLoops: string;
  openLoopsDescription: string;
  noOpenLoops: string;
  systemMarker: string;
  recentTitle: string;
  recentDescription: string;
  noRecent: string;
  currentStatesTitle: string;
  currentStatesDescription: string;
  openSource: string;
  openState: string;
  sourceLabels: Record<HqPulseSource, string>;
  typeLabels: Record<HqPulseItem["type"], string>;
  openLoopTypeLabels: Record<OpenLoopType, string>;
  discoveryState: string;
  dateLocale: string;
};

const copy: Record<Locale, HqPulseCopy> = {
  de: {
    eyebrow: "HQ Pulse / Aktueller Einblick", title: "Was in Benjamins Welt gerade passiert.", description: "Menschlicher Kontext und belegbare öffentliche Entwicklungen ergeben gemeinsam einen ruhigen Blick in dieses Digital HQ.",
    humanMarker: "Menschlicher Kontext", humanTitle: "Worauf die Aufmerksamkeit gerade liegt.", humanDescription: "Bedeutung, Fokus und Einladung bleiben bewusst menschlich geschrieben.", rightNow: "Gerade jetzt", onMyMind: "In meinen Gedanken", next: "Als Nächstes", openLoops: "Offene Wege", openLoopsDescription: "Öffentliche Einladungen, über die Menschen Teil der Reise werden können.", noOpenLoops: "Zurzeit sind hier keine aktiven öffentlichen Einladungen eingetragen.",
    systemMarker: "Aus öffentlichen BTS-Daten", recentTitle: "Jüngster Pulse", recentDescription: "Chronologisch geordnete Veröffentlichungen mit belegbarem Datum und direktem Weg zur Quelle.", noRecent: "Derzeit gibt es keine datierten öffentlichen Entwicklungen für diese Ansicht.", currentStatesTitle: "Aktueller Stand", currentStatesDescription: "Öffentliche Zustände ohne erfundene Ereigniszeit.", openSource: "Kontext öffnen", openState: "Aktuellen Stand öffnen",
    sourceLabels: { writing: "Writing", projects: "Projekte", people: "Menschen", "world-map": "World Map", discovery: "Discovery" }, typeLabels: { publication: "Veröffentlichung", conversation: "Gespräch" }, openLoopTypeLabels: { idea: "Idee", feedback: "Feedback", collaboration: "Zusammenarbeit", interview: "Interview", "team-up": "Team-Up", "expertise-help": "Expertise / Hilfe" }, discoveryState: "Öffentliche Wege durch Projekte, Menschen, Writing und Tools sind über Discovery erreichbar.", dateLocale: "de-DE",
  },
  en: {
    eyebrow: "HQ Pulse / Current view", title: "What is happening in Benjamin’s world right now.", description: "Human context and verifiable public developments come together in one calm view of this Digital HQ.",
    humanMarker: "Human context", humanTitle: "Where attention is right now.", humanDescription: "Meaning, focus and invitations remain deliberately human-authored.", rightNow: "Right now", onMyMind: "On my mind", next: "Next", openLoops: "Open loops", openLoopsDescription: "Public invitations through which people can become part of the journey.", noOpenLoops: "There are currently no active public invitations listed here.",
    systemMarker: "From public BTS data", recentTitle: "Recent pulse", recentDescription: "Chronological publications with trustworthy dates and a direct path to their source.", noRecent: "There are currently no dated public developments for this view.", currentStatesTitle: "Current state", currentStatesDescription: "Public states shown without invented event times.", openSource: "Open context", openState: "Open current state",
    sourceLabels: { writing: "Writing", projects: "Projects", people: "People", "world-map": "World Map", discovery: "Discovery" }, typeLabels: { publication: "Publication", conversation: "Conversation" }, openLoopTypeLabels: { idea: "Idea", feedback: "Feedback", collaboration: "Collaboration", interview: "Interview", "team-up": "Team-Up", "expertise-help": "Expertise / Help" }, discoveryState: "Public paths through projects, people, Writing and tools are available through Discovery.", dateLocale: "en-GB",
  },
  es: {
    eyebrow: "HQ Pulse / Vista actual", title: "Lo que está pasando ahora en el mundo de Benjamin.", description: "El contexto humano y los avances públicos verificables se unen en una vista serena de este Digital HQ.",
    humanMarker: "Contexto humano", humanTitle: "Dónde está la atención ahora.", humanDescription: "El significado, el enfoque y las invitaciones siguen siendo deliberadamente humanos.", rightNow: "Ahora mismo", onMyMind: "En mi mente", next: "Lo siguiente", openLoops: "Caminos abiertos", openLoopsDescription: "Invitaciones públicas para formar parte del recorrido.", noOpenLoops: "Ahora mismo no hay invitaciones públicas activas aquí.",
    systemMarker: "Desde datos públicos de BTS", recentTitle: "Pulso reciente", recentDescription: "Publicaciones cronológicas con fechas fiables y acceso directo a la fuente.", noRecent: "No hay avances públicos fechados para esta vista.", currentStatesTitle: "Estado actual", currentStatesDescription: "Estados públicos sin inventar una fecha de evento.", openSource: "Abrir contexto", openState: "Abrir estado actual",
    sourceLabels: { writing: "Writing", projects: "Proyectos", people: "Personas", "world-map": "Mapa mundial", discovery: "Discovery" }, typeLabels: { publication: "Publicación", conversation: "Conversación" }, openLoopTypeLabels: { idea: "Idea", feedback: "Opinión", collaboration: "Colaboración", interview: "Entrevista", "team-up": "Team-Up", "expertise-help": "Experiencia / Ayuda" }, discoveryState: "Discovery ofrece rutas públicas por proyectos, personas, Writing y herramientas.", dateLocale: "es-ES",
  },
  tr: {
    eyebrow: "HQ Pulse / Güncel görünüm", title: "Benjamin’in dünyasında şu anda olanlar.", description: "İnsan bağlamı ve doğrulanabilir kamusal gelişmeler bu Digital HQ’nun sakin bir görünümünde buluşuyor.",
    humanMarker: "İnsan bağlamı", humanTitle: "Dikkatin şu anda olduğu yer.", humanDescription: "Anlam, odak ve davetler bilinçli olarak insan tarafından yazılır.", rightNow: "Şu anda", onMyMind: "Aklımda", next: "Sırada", openLoops: "Açık yollar", openLoopsDescription: "İnsanların yolculuğa katılabileceği kamusal davetler.", noOpenLoops: "Şu anda burada etkin bir kamusal davet yok.",
    systemMarker: "Kamusal BTS verilerinden", recentTitle: "Son gelişmeler", recentDescription: "Güvenilir tarihleri ve kaynağa doğrudan yolu olan kronolojik yayınlar.", noRecent: "Bu görünüm için tarihli kamusal bir gelişme yok.", currentStatesTitle: "Güncel durum", currentStatesDescription: "Uydurulmuş olay zamanı olmadan gösterilen kamusal durumlar.", openSource: "Bağlamı aç", openState: "Güncel durumu aç",
    sourceLabels: { writing: "Writing", projects: "Projeler", people: "İnsanlar", "world-map": "Dünya Haritası", discovery: "Discovery" }, typeLabels: { publication: "Yayın", conversation: "Sohbet" }, openLoopTypeLabels: { idea: "Fikir", feedback: "Geri bildirim", collaboration: "İş birliği", interview: "Röportaj", "team-up": "Team-Up", "expertise-help": "Uzmanlık / Yardım" }, discoveryState: "Projeler, insanlar, Writing ve araçlar arasındaki kamusal yollar Discovery üzerinden erişilebilir.", dateLocale: "tr-TR",
  },
  pl: {
    eyebrow: "HQ Pulse / Aktualny widok", title: "Co dzieje się teraz w świecie Benjamina.", description: "Ludzki kontekst i możliwe do potwierdzenia publiczne zmiany tworzą spokojny obraz tego Digital HQ.",
    humanMarker: "Ludzki kontekst", humanTitle: "Na czym skupia się teraz uwaga.", humanDescription: "Znaczenie, kierunek i zaproszenia pozostają świadomie pisane przez człowieka.", rightNow: "W tej chwili", onMyMind: "O czym myślę", next: "Dalej", openLoops: "Otwarte ścieżki", openLoopsDescription: "Publiczne zaproszenia do udziału w tej drodze.", noOpenLoops: "Obecnie nie ma tu aktywnych publicznych zaproszeń.",
    systemMarker: "Z publicznych danych BTS", recentTitle: "Najnowszy puls", recentDescription: "Chronologiczne publikacje z wiarygodnymi datami i bezpośrednim linkiem do źródła.", noRecent: "Brak obecnie datowanych publicznych zmian dla tego widoku.", currentStatesTitle: "Aktualny stan", currentStatesDescription: "Publiczne stany bez zmyślonego czasu wydarzenia.", openSource: "Otwórz kontekst", openState: "Otwórz aktualny stan",
    sourceLabels: { writing: "Writing", projects: "Projekty", people: "Ludzie", "world-map": "Mapa świata", discovery: "Discovery" }, typeLabels: { publication: "Publikacja", conversation: "Rozmowa" }, openLoopTypeLabels: { idea: "Pomysł", feedback: "Informacja zwrotna", collaboration: "Współpraca", interview: "Wywiad", "team-up": "Team-Up", "expertise-help": "Wiedza / Pomoc" }, discoveryState: "Publiczne ścieżki przez projekty, ludzi, Writing i narzędzia są dostępne w Discovery.", dateLocale: "pl-PL",
  },
  el: {
    eyebrow: "HQ Pulse / Τρέχουσα εικόνα", title: "Τι συμβαίνει τώρα στον κόσμο του Benjamin.", description: "Το ανθρώπινο πλαίσιο και οι επαληθεύσιμες δημόσιες εξελίξεις συνθέτουν μια ήρεμη εικόνα αυτού του Digital HQ.",
    humanMarker: "Ανθρώπινο πλαίσιο", humanTitle: "Πού βρίσκεται τώρα η προσοχή.", humanDescription: "Το νόημα, η εστίαση και οι προσκλήσεις παραμένουν συνειδητά ανθρώπινα.", rightNow: "Αυτή τη στιγμή", onMyMind: "Στο μυαλό μου", next: "Επόμενο", openLoops: "Ανοιχτοί δρόμοι", openLoopsDescription: "Δημόσιες προσκλήσεις για συμμετοχή στη διαδρομή.", noOpenLoops: "Αυτή τη στιγμή δεν υπάρχουν ενεργές δημόσιες προσκλήσεις εδώ.",
    systemMarker: "Από δημόσια δεδομένα BTS", recentTitle: "Πρόσφατος παλμός", recentDescription: "Χρονολογικές δημοσιεύσεις με αξιόπιστες ημερομηνίες και άμεση διαδρομή προς την πηγή.", noRecent: "Δεν υπάρχουν τώρα χρονολογημένες δημόσιες εξελίξεις για αυτή την εικόνα.", currentStatesTitle: "Τρέχουσα κατάσταση", currentStatesDescription: "Δημόσιες καταστάσεις χωρίς επινοημένο χρόνο συμβάντος.", openSource: "Άνοιγμα πλαισίου", openState: "Άνοιγμα τρέχουσας κατάστασης",
    sourceLabels: { writing: "Writing", projects: "Έργα", people: "Άνθρωποι", "world-map": "Παγκόσμιος χάρτης", discovery: "Discovery" }, typeLabels: { publication: "Δημοσίευση", conversation: "Συζήτηση" }, openLoopTypeLabels: { idea: "Ιδέα", feedback: "Ανατροφοδότηση", collaboration: "Συνεργασία", interview: "Συνέντευξη", "team-up": "Team-Up", "expertise-help": "Εξειδίκευση / Βοήθεια" }, discoveryState: "Δημόσιες διαδρομές μέσα από έργα, ανθρώπους, Writing και εργαλεία είναι διαθέσιμες μέσω του Discovery.", dateLocale: "el-GR",
  },
  ru: {
    eyebrow: "HQ Pulse / Текущий обзор", title: "Что происходит сейчас в мире Benjamin.", description: "Человеческий контекст и подтверждаемые публичные изменения складываются в спокойный обзор этого Digital HQ.",
    humanMarker: "Человеческий контекст", humanTitle: "На чём сейчас сосредоточено внимание.", humanDescription: "Смысл, фокус и приглашения остаются осознанно написанными человеком.", rightNow: "Прямо сейчас", onMyMind: "О чём я думаю", next: "Дальше", openLoops: "Открытые пути", openLoopsDescription: "Публичные приглашения присоединиться к этому пути.", noOpenLoops: "Сейчас здесь нет активных публичных приглашений.",
    systemMarker: "Из публичных данных BTS", recentTitle: "Последние изменения", recentDescription: "Хронологические публикации с достоверными датами и прямым переходом к источнику.", noRecent: "Сейчас для этого обзора нет датированных публичных изменений.", currentStatesTitle: "Текущее состояние", currentStatesDescription: "Публичные состояния без выдуманного времени события.", openSource: "Открыть контекст", openState: "Открыть текущее состояние",
    sourceLabels: { writing: "Writing", projects: "Проекты", people: "Люди", "world-map": "Карта мира", discovery: "Discovery" }, typeLabels: { publication: "Публикация", conversation: "Разговор" }, openLoopTypeLabels: { idea: "Идея", feedback: "Обратная связь", collaboration: "Сотрудничество", interview: "Интервью", "team-up": "Team-Up", "expertise-help": "Экспертиза / Помощь" }, discoveryState: "Публичные пути к проектам, людям, Writing и инструментам доступны через Discovery.", dateLocale: "ru-RU",
  },
};

export function localizeHqPulseItem(item: HqPulseItem, locale: Locale): HqPulseItem {
  if (item.source !== "people") return item;
  const person = getLocalizedPublishedSpotlight(item.provenance.entityId, locale);
  return person ? { ...item, title: person.title, summary: person.teaser } : item;
}

export function localizeHqPulseItems(items: readonly HqPulseItem[], locale: Locale): HqPulseItem[] {
  return items.map((item) => localizeHqPulseItem(item, locale));
}

export function localizeHqPulseCurrentStates(
  states: readonly HqPulseCurrentState[],
  locale: Locale,
): HqPulseCurrentState[] {
  return states.map((state) => {
    if (state.source === "projects") {
      const project = getLocalizedProject(state.entityId, locale);
      return project ? { ...state, title: project.name, summary: project.currentState, status: project.status } : state;
    }
    if (state.template === "world-map-public-context") {
      const map = getWorldMapDictionary(locale);
      return { ...state, title: map.breadcrumb, summary: map.metadata.description };
    }
    if (state.template === "discovery-available") return { ...state, summary: copy[locale].discoveryState };
    return state;
  });
}

export function getHqPulseCopy(locale: Locale): HqPulseCopy {
  return copy[locale];
}
