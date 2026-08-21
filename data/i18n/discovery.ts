import { getLocalizedProjects } from "@/data/i18n/projects";
import { getLocalizedPublishedSpotlights } from "@/data/i18n/people";
import { localizeHqPulseItem } from "@/data/i18n/hq-pulse";
import { getWorldMapDictionary } from "@/data/i18n/world-map";
import { guidedDiscoveryPrompts } from "@/data/discovery-curation";
import { projects } from "@/data/projects";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import type { DiscoveryGroup, DiscoveryItem, DiscoveryReasonLabel, DiscoveryStatus } from "@/types/discovery";
import type { GuidedDiscoveryPrompt } from "@/types/discovery";

type DiscoveryUiCopy = {
  searchLabel: string;
  placeholder: string;
  open: string;
  description: string;
  resultsLabel: string;
  discoverTitle: string;
  discoverDescription: string;
  examples: string;
  noResults: string;
  noResultsFor: (query: string) => string;
  count: (count: number) => string;
  startTyping: string;
  shortcuts: string;
  unavailable: string;
  moreResults: string;
  topMatch: string;
  openDetail: string;
  openResult: string;
  contextCanvas: string;
  currentContext: (query: string) => string;
  canvasDescription: string;
  noSignal: string;
  noCurated: (query: string) => string;
  noCuratedHelp: string;
  moreCount: (count: number) => string;
  groups: Record<DiscoveryGroup, string>;
  statuses: Record<DiscoveryStatus, string>;
  reasons: Record<DiscoveryReasonLabel, string>;
};

const ui: Record<Locale, DiscoveryUiCopy> = {
  de: {
    searchLabel: "Inhalte entdecken", placeholder: "Projekte, Karriere, Menschen und Tools entdecken", open: "Discovery öffnen", description: "Vorschläge erscheinen während der Eingabe. Mit den Pfeiltasten ein verfügbares Ergebnis auswählen und mit Enter öffnen.", resultsLabel: "Discovery-Ergebnisse", discoverTitle: "Das Digital HQ entdecken", discoverDescription: "Projekte, Einblicke, Tools, Menschen und Seiten entdecken.", examples: "Beispiele für Discovery-Anfragen", noResults: "Keine Treffer", noResultsFor: (query) => `Für „${query}“ wurde noch nichts Passendes gefunden.`, count: (count) => `${count} Treffer`, startTyping: "Eingabe ab 1 Zeichen", shortcuts: "↑↓ Auswahl · Enter Öffnen · Esc Schließen", unavailable: "Noch nicht verfügbar", moreResults: "Weitere Ergebnisse – scrollen", topMatch: "Bester Treffer", openDetail: "Detailseite öffnen", openResult: "Ergebnis öffnen", contextCanvas: "Context Canvas / Discovery-Ansicht", currentContext: (query) => `Dein aktueller Kontext: „${query}“`, canvasDescription: "Die Oberfläche reagiert auf dein Signal – ruhig, kuratiert und auf Basis der bestehenden Discovery.", noSignal: "Noch kein passendes Signal", noCurated: (query) => `Für „${query}“ ist aktuell nichts Passendes kuratiert.`, noCuratedHelp: "Versuche einen Begriff aus Projekten, Einblicken, Tools, Menschen oder Seiten. Dein Suchbegriff bleibt dabei vollständig unter deiner Kontrolle.", moreCount: (count) => `+ ${count} weitere Treffer`,
    groups: { Projects: "Projekte", Insights: "Einblicke", Tools: "Tools", People: "Menschen", Pages: "Seiten" },
    statuses: { Live: "Live", Beta: "Beta", "In Development": "In Entwicklung", "Coming Soon": "Demnächst" },
    reasons: { "Passt zu": "Passt zu", "Gefunden über": "Gefunden über", "Relevant für": "Relevant für" },
  },
  en: {
    searchLabel: "Discover content", placeholder: "Discover projects, careers, people and tools", open: "Open Discovery", description: "Suggestions appear as you type. Use the arrow keys to select an available result and Enter to open it.", resultsLabel: "Discovery results", discoverTitle: "Discover the Digital HQ", discoverDescription: "Explore projects, insights, tools, people and pages.", examples: "Example Discovery searches", noResults: "No results", noResultsFor: (query) => `Nothing matching “${query}” has been found yet.`, count: (count) => `${count} results`, startTyping: "Type at least 1 character", shortcuts: "↑↓ Select · Enter Open · Esc Close", unavailable: "Not available yet", moreResults: "More results — scroll", topMatch: "Top match", openDetail: "Open detail page", openResult: "Open result", contextCanvas: "Context Canvas / Discovery View", currentContext: (query) => `Your current context: “${query}”`, canvasDescription: "The surface responds to your signal calmly and deliberately, using the existing Discovery index.", noSignal: "No matching signal yet", noCurated: (query) => `Nothing matching “${query}” is currently curated.`, noCuratedHelp: "Try a term related to projects, insights, tools, people or pages. Your search remains entirely under your control.", moreCount: (count) => `+ ${count} more results`,
    groups: { Projects: "Projects", Insights: "Insights", Tools: "Tools", People: "People", Pages: "Pages" },
    statuses: { Live: "Live", Beta: "Beta", "In Development": "In development", "Coming Soon": "Coming soon" },
    reasons: { "Passt zu": "Matches", "Gefunden über": "Found through", "Relevant für": "Relevant for" },
  },
  es: {
    searchLabel: "Descubrir contenido", placeholder: "Descubre proyectos, carreras, personas y herramientas", open: "Abrir Discovery", description: "Las sugerencias aparecen mientras escribes. Usa las flechas para elegir un resultado disponible y Enter para abrirlo.", resultsLabel: "Resultados de Discovery", discoverTitle: "Descubre el Digital HQ", discoverDescription: "Explora proyectos, ideas, herramientas, personas y páginas.", examples: "Ejemplos de búsquedas", noResults: "Sin resultados", noResultsFor: (query) => `Todavía no se ha encontrado nada para «${query}».`, count: (count) => `${count} resultados`, startTyping: "Escribe al menos 1 carácter", shortcuts: "↑↓ Elegir · Enter Abrir · Esc Cerrar", unavailable: "Aún no disponible", moreResults: "Más resultados — desplázate", topMatch: "Mejor resultado", openDetail: "Abrir página de detalle", openResult: "Abrir resultado", contextCanvas: "Context Canvas / Vista Discovery", currentContext: (query) => `Tu contexto actual: «${query}»`, canvasDescription: "La superficie responde a tu señal de forma tranquila y deliberada, usando el índice común de Discovery.", noSignal: "Aún no hay una señal adecuada", noCurated: (query) => `Ahora mismo no hay nada seleccionado para «${query}».`, noCuratedHelp: "Prueba un término relacionado con proyectos, ideas, herramientas, personas o páginas. Tu búsqueda permanece bajo tu control.", moreCount: (count) => `+ ${count} resultados más`, groups: { Projects: "Proyectos", Insights: "Ideas", Tools: "Herramientas", People: "Personas", Pages: "Páginas" }, statuses: { Live: "Activo", Beta: "Beta", "In Development": "En desarrollo", "Coming Soon": "Próximamente" }, reasons: { "Passt zu": "Coincide con", "Gefunden über": "Encontrado por", "Relevant für": "Relevante para" },
  },
  tr: {
    searchLabel: "İçerik keşfet", placeholder: "Projeleri, kariyeri, insanları ve araçları keşfet", open: "Discovery’yi aç", description: "Yazdıkça öneriler görünür. Kullanılabilir sonucu ok tuşlarıyla seç ve Enter ile aç.", resultsLabel: "Discovery sonuçları", discoverTitle: "Digital HQ’yu keşfet", discoverDescription: "Projeleri, içgörüleri, araçları, insanları ve sayfaları keşfet.", examples: "Örnek Discovery aramaları", noResults: "Sonuç yok", noResultsFor: (query) => `“${query}” için henüz uygun bir sonuç bulunamadı.`, count: (count) => `${count} sonuç`, startTyping: "En az 1 karakter yaz", shortcuts: "↑↓ Seç · Enter Aç · Esc Kapat", unavailable: "Henüz kullanılamıyor", moreResults: "Daha fazla sonuç — kaydır", topMatch: "En iyi eşleşme", openDetail: "Ayrıntı sayfasını aç", openResult: "Sonucu aç", contextCanvas: "Context Canvas / Discovery Görünümü", currentContext: (query) => `Güncel bağlamın: “${query}”`, canvasDescription: "Yüzey, ortak Discovery dizinini kullanarak sinyaline sakin ve özenli biçimde yanıt verir.", noSignal: "Henüz eşleşen sinyal yok", noCurated: (query) => `“${query}” için şu anda seçilmiş bir içerik yok.`, noCuratedHelp: "Projeler, içgörüler, araçlar, insanlar veya sayfalarla ilgili bir terim dene. Araman senin kontrolünde kalır.", moreCount: (count) => `+ ${count} sonuç daha`, groups: { Projects: "Projeler", Insights: "İçgörüler", Tools: "Araçlar", People: "İnsanlar", Pages: "Sayfalar" }, statuses: { Live: "Canlı", Beta: "Beta", "In Development": "Geliştiriliyor", "Coming Soon": "Yakında" }, reasons: { "Passt zu": "Eşleşir", "Gefunden über": "Şununla bulundu", "Relevant für": "Şunun için ilgili" },
  },
  pl: {
    searchLabel: "Odkrywaj treści", placeholder: "Odkrywaj projekty, kariery, ludzi i narzędzia", open: "Otwórz Discovery", description: "Sugestie pojawiają się podczas pisania. Wybierz dostępny wynik strzałkami i otwórz Enterem.", resultsLabel: "Wyniki Discovery", discoverTitle: "Odkryj Digital HQ", discoverDescription: "Poznaj projekty, wnioski, narzędzia, ludzi i strony.", examples: "Przykładowe wyszukiwania", noResults: "Brak wyników", noResultsFor: (query) => `Nie znaleziono jeszcze niczego dla „${query}”.`, count: (count) => `${count} wyników`, startTyping: "Wpisz co najmniej 1 znak", shortcuts: "↑↓ Wybierz · Enter Otwórz · Esc Zamknij", unavailable: "Jeszcze niedostępne", moreResults: "Więcej wyników — przewiń", topMatch: "Najlepsze dopasowanie", openDetail: "Otwórz stronę szczegółów", openResult: "Otwórz wynik", contextCanvas: "Context Canvas / Widok Discovery", currentContext: (query) => `Twój obecny kontekst: „${query}”`, canvasDescription: "Widok spokojnie i świadomie odpowiada na twój sygnał, korzystając ze wspólnego indeksu Discovery.", noSignal: "Brak pasującego sygnału", noCurated: (query) => `Dla „${query}” nie ma teraz wybranych treści.`, noCuratedHelp: "Spróbuj terminu związanego z projektami, wnioskami, narzędziami, ludźmi lub stronami. Wyszukiwanie pozostaje pod twoją kontrolą.", moreCount: (count) => `+ ${count} kolejnych wyników`, groups: { Projects: "Projekty", Insights: "Wnioski", Tools: "Narzędzia", People: "Ludzie", Pages: "Strony" }, statuses: { Live: "Działa", Beta: "Beta", "In Development": "W rozwoju", "Coming Soon": "Wkrótce" }, reasons: { "Passt zu": "Pasuje do", "Gefunden über": "Znaleziono przez", "Relevant für": "Istotne dla" },
  },
  el: {
    searchLabel: "Ανακάλυψε περιεχόμενο", placeholder: "Ανακάλυψε έργα, σταδιοδρομία, ανθρώπους και εργαλεία", open: "Άνοιξε το Discovery", description: "Οι προτάσεις εμφανίζονται καθώς γράφεις. Διάλεξε διαθέσιμο αποτέλεσμα με τα βέλη και άνοιξέ το με Enter.", resultsLabel: "Αποτελέσματα Discovery", discoverTitle: "Ανακάλυψε το Digital HQ", discoverDescription: "Εξερεύνησε έργα, ιδέες, εργαλεία, ανθρώπους και σελίδες.", examples: "Παραδείγματα αναζητήσεων", noResults: "Κανένα αποτέλεσμα", noResultsFor: (query) => `Δεν βρέθηκε ακόμη κάτι για «${query}».`, count: (count) => `${count} αποτελέσματα`, startTyping: "Γράψε τουλάχιστον 1 χαρακτήρα", shortcuts: "↑↓ Επιλογή · Enter Άνοιγμα · Esc Κλείσιμο", unavailable: "Δεν είναι ακόμη διαθέσιμο", moreResults: "Περισσότερα αποτελέσματα — κύλιση", topMatch: "Καλύτερο αποτέλεσμα", openDetail: "Άνοιξε τη σελίδα λεπτομερειών", openResult: "Άνοιξε το αποτέλεσμα", contextCanvas: "Context Canvas / Προβολή Discovery", currentContext: (query) => `Το τρέχον πλαίσιό σου: «${query}»`, canvasDescription: "Η επιφάνεια ανταποκρίνεται ήρεμα και σκόπιμα στο σήμα σου, χρησιμοποιώντας τον κοινό δείκτη Discovery.", noSignal: "Δεν υπάρχει ακόμη σχετικό σήμα", noCurated: (query) => `Δεν υπάρχει τώρα επιμελημένο περιεχόμενο για «${query}».`, noCuratedHelp: "Δοκίμασε όρο σχετικό με έργα, ιδέες, εργαλεία, ανθρώπους ή σελίδες. Η αναζήτηση παραμένει υπό τον έλεγχό σου.", moreCount: (count) => `+ ${count} ακόμη αποτελέσματα`, groups: { Projects: "Έργα", Insights: "Ιδέες", Tools: "Εργαλεία", People: "Άνθρωποι", Pages: "Σελίδες" }, statuses: { Live: "Ενεργό", Beta: "Beta", "In Development": "Σε ανάπτυξη", "Coming Soon": "Σύντομα" }, reasons: { "Passt zu": "Ταιριάζει με", "Gefunden über": "Βρέθηκε μέσω", "Relevant für": "Σχετικό για" },
  },
  ru: {
    searchLabel: "Найти контент", placeholder: "Исследуйте проекты, карьеру, людей и инструменты", open: "Открыть Discovery", description: "Подсказки появляются по мере ввода. Выберите доступный результат стрелками и откройте клавишей Enter.", resultsLabel: "Результаты Discovery", discoverTitle: "Исследуйте Digital HQ", discoverDescription: "Открывайте проекты, идеи, инструменты, людей и страницы.", examples: "Примеры запросов", noResults: "Нет результатов", noResultsFor: (query) => `По запросу «${query}» пока ничего не найдено.`, count: (count) => `${count} результатов`, startTyping: "Введите хотя бы 1 символ", shortcuts: "↑↓ Выбрать · Enter Открыть · Esc Закрыть", unavailable: "Пока недоступно", moreResults: "Больше результатов — прокрутите", topMatch: "Лучшее совпадение", openDetail: "Открыть подробную страницу", openResult: "Открыть результат", contextCanvas: "Context Canvas / Вид Discovery", currentContext: (query) => `Ваш текущий контекст: «${query}»`, canvasDescription: "Поверхность спокойно и продуманно отвечает на ваш сигнал, используя общий индекс Discovery.", noSignal: "Подходящего сигнала пока нет", noCurated: (query) => `Для «${query}» сейчас нет отобранного материала.`, noCuratedHelp: "Попробуйте термин о проектах, идеях, инструментах, людях или страницах. Поиск остаётся под вашим контролем.", moreCount: (count) => `+ ещё ${count} результатов`, groups: { Projects: "Проекты", Insights: "Идеи", Tools: "Инструменты", People: "Люди", Pages: "Страницы" }, statuses: { Live: "Работает", Beta: "Beta", "In Development": "В разработке", "Coming Soon": "Скоро" }, reasons: { "Passt zu": "Совпадает с", "Gefunden über": "Найдено через", "Relevant für": "Актуально для" },
  },
};

const guidedPromptsByLocale: Record<Locale, readonly GuidedDiscoveryPrompt[]> = {
  de: guidedDiscoveryPrompts,
  en: [{ id: "life-alignment", label: "Life and priorities", query: "Does my life fit what matters to me?" }, { id: "recruiting", label: "Explore recruiting", query: "Recruiting" }, { id: "career", label: "Careers and jobs", query: "career direction" }, { id: "stories", label: "People and stories", query: "people and stories" }, { id: "ideas", label: "Projects and ideas", query: "projects and ideas" }, { id: "orientation", label: "Find a next step", query: "I do not know what to do next" }, { id: "community", label: "Community and feedback", query: "community and feedback" }],
  es: [{ id: "life-alignment", label: "Vida y prioridades", query: "dirección vital y prioridades" }, { id: "recruiting", label: "Explorar recruiting", query: "recruiting" }, { id: "career", label: "Carrera y empleo", query: "dirección profesional" }, { id: "stories", label: "Personas e historias", query: "personas y entrevistas" }, { id: "ideas", label: "Proyectos e ideas", query: "proyectos e ideas" }, { id: "orientation", label: "Encontrar el siguiente paso", query: "qué hacer ahora" }, { id: "community", label: "Comunidad y comentarios", query: "comunidad y comentarios" }],
  tr: [{ id: "life-alignment", label: "Hayat ve öncelikler", query: "yaşam yönü ve öncelikler" }, { id: "recruiting", label: "İşe alımı keşfet", query: "işe alım" }, { id: "career", label: "Kariyer ve işler", query: "kariyer yönü" }, { id: "stories", label: "İnsanlar ve hikâyeler", query: "insanlar ve röportajlar" }, { id: "ideas", label: "Projeler ve fikirler", query: "projeler ve fikirler" }, { id: "orientation", label: "Sonraki adımı bul", query: "şimdi ne yapmalıyım" }, { id: "community", label: "Topluluk ve geri bildirim", query: "topluluk ve geri bildirim" }],
  pl: [{ id: "life-alignment", label: "Życie i priorytety", query: "kierunek życia i priorytety" }, { id: "recruiting", label: "Odkryj rekrutację", query: "rekrutacja" }, { id: "career", label: "Kariera i praca", query: "kierunek kariery" }, { id: "stories", label: "Ludzie i historie", query: "ludzie i wywiady" }, { id: "ideas", label: "Projekty i pomysły", query: "projekty i pomysły" }, { id: "orientation", label: "Znajdź kolejny krok", query: "co mam zrobić dalej" }, { id: "community", label: "Społeczność i opinie", query: "społeczność i opinie" }],
  el: [{ id: "life-alignment", label: "Ζωή και προτεραιότητες", query: "κατεύθυνση ζωής και προτεραιότητες" }, { id: "recruiting", label: "Εξερεύνησε το recruiting", query: "recruiting" }, { id: "career", label: "Σταδιοδρομία και δουλειά", query: "επαγγελματική κατεύθυνση" }, { id: "stories", label: "Άνθρωποι και ιστορίες", query: "άνθρωποι και συνεντεύξεις" }, { id: "ideas", label: "Έργα και ιδέες", query: "έργα και ιδέες" }, { id: "orientation", label: "Βρες επόμενο βήμα", query: "τι να κάνω μετά" }, { id: "community", label: "Κοινότητα και σχόλια", query: "κοινότητα και σχόλια" }],
  ru: [{ id: "life-alignment", label: "Жизнь и приоритеты", query: "направление жизни и приоритеты" }, { id: "recruiting", label: "Исследовать рекрутинг", query: "рекрутинг" }, { id: "career", label: "Карьера и работа", query: "направление карьеры" }, { id: "stories", label: "Люди и истории", query: "люди и интервью" }, { id: "ideas", label: "Проекты и идеи", query: "проекты и идеи" }, { id: "orientation", label: "Найти следующий шаг", query: "что делать дальше" }, { id: "community", label: "Сообщество и отзывы", query: "сообщество и отзывы" }],
};

export function getGuidedDiscoveryPrompts(locale: Locale): readonly GuidedDiscoveryPrompt[] {
  return guidedPromptsByLocale[locale];
}

const englishStaticCopy: Record<string, Partial<DiscoveryItem>> = {
  "tool-life-alignment": { description: "Choose a perspective for reflecting on yourself, a relationship or your future direction.", category: "Life Alignment Tool", tags: ["ME", "WE", "WHERE I AM GOING", "relationships", "life direction"], keywords: ["Self", "Partner", "Relationship", "Life Vision", "future direction", "priorities"] },
  "tool-life-alignment-self": { title: "Self / Personal snapshot", description: "Reflect on your present life, priorities, energy and room to move.", category: "Life Alignment Tool", tags: ["Self", "priorities", "life areas"], keywords: ["understand myself", "life balance", "personal snapshot"] },
  "tool-life-alignment-partner": { description: "Bring two independent perspectives into a shared relationship context without scores or rankings.", category: "Life Alignment Tool", tags: ["WE", "relationship", "two perspectives"], keywords: ["Partner", "Relationship", "expectations", "conversation"] },
  "tool-life-alignment-life-vision": { description: "Explore protected priorities, possible paths and trade-offs in your future direction.", category: "Life Alignment Tool", tags: ["future", "priorities", "trade-offs"], keywords: ["Life Vision", "life direction", "possible paths"] },
  "tool-find-your-next-step": { description: "Move from personal context towards an intelligible next step.", category: "Reflection Tool", tags: ["orientation", "next step", "Self", "Career", "Problem", "Idea"], keywords: ["what should I do next", "life direction", "career", "writing", "projects"] },
  "tool-find-your-next-step-self": { description: "Reflect on strengths, values, needs and helpful conditions.", category: "Reflection Journey", tags: ["self", "strengths", "values"], keywords: ["understand myself", "personal direction"] },
  "tool-find-your-next-step-career": { description: "Explore professional directions and the conditions in which work can fit.", category: "Career Journey", tags: ["career", "job", "work"], keywords: ["which job suits me", "career direction", "career change"] },
  "tool-find-your-next-step-problem": { description: "Put a difficult situation into context and identify possible next steps.", category: "Reflection Journey", tags: ["problem", "options", "support"], keywords: ["I have a problem", "what can I do"] },
  "tool-find-your-next-step-idea": { description: "Structure an idea and turn it into a first realistic plan.", category: "Idea Journey", tags: ["idea", "concept", "project"], keywords: ["develop an idea", "start a project"] },
  "tool-echowall": { description: "A moderated community wall for thoughts, feedback, reactions and messages.", category: "Community Tool", tags: ["Community", "Feedback", "Signals"], keywords: ["Echo", "message", "wall"] },
  "page-home": { description: "Benjamin Trinidad Segura’s central digital home.", category: "Page", tags: ["Home", "bts.online"], keywords: ["homepage", "overview"] },
  "page-now": { description: "Current projects, developments and areas of focus.", category: "Page", tags: ["Current", "Building"], keywords: ["Developing", "Rebuilding", "Exploring"] },
  "page-projects": { description: "All projects and ideas in the growing ecosystem.", category: "Page", tags: ["Projects", "Portfolio"], keywords: ["Building", "projects"] },
  "page-writing": { description: "Field Notes about work, identity, courage and development.", category: "Page", tags: ["Insights", "articles"], keywords: ["writing", "essays", "magazine"] },
  "page-interviews": { description: "Conversations about work, decisions, ideas and what lies behind visible roles.", category: "Page", tags: ["Insights", "Human Archive"], keywords: ["conversations", "people", "interviews"] },
  "page-pulse": { description: "Recent stories, formats and project updates.", category: "Page", tags: ["Insights", "Updates"], keywords: ["current", "Pulse"] },
  "page-about": { description: "How Benjamin connects recruiting, talent acquisition, storytelling and product thinking to make missing human context visible.", category: "ProfilePage", tags: ["Benjamin Trinidad Segura", "Personal Positioning", "Human Context"], keywords: ["GOATRECRUTAINER", "RateCom", "Recruiting", "Talent Acquisition", "Product Thinking", "community", "Discovery"] },
  "page-contact": { description: "Contact, projects and verified profiles for Benjamin and GOATRECRUTAINER.", category: "Page", tags: ["Partners", "Contact", "Social"], keywords: ["Collaborations", "Recruiting", "LinkedIn", "TikTok", "Instagram", "YouTube"] },
  "page-career-spotlight": { description: "The shared Career and Service Spotlight archive.", category: "Page", tags: ["Career Spotlight", "Service Spotlight", "People"], keywords: ["GOATRECRUTAINER", "interviews"] },
};

type ExtendedLocale = Exclude<Locale, "de" | "en">;

const extendedStaticCopy: Record<ExtendedLocale, Record<string, Partial<DiscoveryItem>>> = {
  es: {
    "tool-life-alignment": { description: "Elige una perspectiva para reflexionar sobre ti, una relación o tu dirección futura.", category: "Herramienta Life Alignment", tags: ["relaciones", "dirección vital", "prioridades"], keywords: ["personas", "relaciones", "carrera", "dirección vital", "herramientas"] },
    "tool-life-alignment-self": { title: "Self / Imagen personal", description: "Reflexiona sobre tu vida actual, prioridades, energía y margen de cambio.", category: "Herramienta Life Alignment", tags: ["vida", "prioridades"], keywords: ["comprenderme", "equilibrio vital"] },
    "tool-life-alignment-partner": { description: "Reúne dos perspectivas independientes en un contexto compartido sin puntuaciones ni rankings.", category: "Herramienta Life Alignment", tags: ["relación", "dos perspectivas"], keywords: ["pareja", "relaciones", "expectativas", "conversación"] },
    "tool-life-alignment-life-vision": { description: "Explora prioridades protegidas, caminos posibles y concesiones en tu dirección futura.", category: "Herramienta Life Alignment", tags: ["futuro", "prioridades"], keywords: ["visión de vida", "dirección vital", "caminos posibles"] },
    "tool-find-your-next-step": { description: "Avanza desde tu contexto hacia un siguiente paso comprensible.", category: "Herramienta de reflexión", tags: ["orientación", "siguiente paso", "carrera", "problemas", "ideas"], keywords: ["qué hacer ahora", "carrera", "escritura", "proyectos"] },
    "tool-find-your-next-step-self": { description: "Reflexiona sobre fortalezas, valores, necesidades y condiciones útiles.", category: "Recorrido de reflexión", tags: ["persona", "fortalezas", "valores"], keywords: ["comprenderme", "dirección personal"] },
    "tool-find-your-next-step-career": { description: "Explora direcciones profesionales y las condiciones en las que el trabajo puede encajar.", category: "Recorrido profesional", tags: ["carrera", "empleo", "trabajo"], keywords: ["qué trabajo me conviene", "dirección profesional", "cambio de carrera", "recruiting"] },
    "tool-find-your-next-step-problem": { description: "Pon una situación difícil en contexto e identifica posibles pasos.", category: "Recorrido de reflexión", tags: ["problema", "opciones", "apoyo"], keywords: ["tengo un problema", "qué puedo hacer"] },
    "tool-find-your-next-step-idea": { description: "Estructura una idea y conviértela en un primer plan realista.", category: "Recorrido de ideas", tags: ["idea", "concepto", "proyecto"], keywords: ["desarrollar una idea", "iniciar un proyecto"] },
    "tool-echowall": { description: "Una pared comunitaria moderada para pensamientos, comentarios y mensajes.", category: "Herramienta comunitaria", tags: ["comunidad", "comentarios"], keywords: ["mensaje", "pared", "personas"] },
    "page-home": { description: "El hogar digital central de Benjamin Trinidad Segura.", category: "Página", tags: ["inicio"], keywords: ["portada", "resumen"] },
    "page-projects": { description: "Todos los proyectos e ideas del ecosistema en crecimiento.", category: "Página", tags: ["proyectos"], keywords: ["proyectos", "ideas"] },
    "page-writing": { description: "Notas de campo sobre trabajo, identidad, valentía y desarrollo.", category: "Página", tags: ["artículos"], keywords: ["escritura", "artículos", "ensayos"] },
    "page-interviews": { description: "Conversaciones sobre trabajo, decisiones, ideas y lo que hay detrás de los roles visibles.", category: "Página", tags: ["archivo humano"], keywords: ["personas", "entrevistas", "conversaciones"] },
    "page-about": { description: "Cómo Benjamin conecta recruiting, narrativa y pensamiento de producto para mostrar contexto humano.", category: "Perfil", tags: ["posicionamiento", "contexto humano"], keywords: ["recruiting", "personas", "proyectos"] },
    "page-contact": { description: "Contacto, proyectos y perfiles verificados de Benjamin y GOATRECRUTAINER.", category: "Página", tags: ["contacto"], keywords: ["colaboración", "recruiting"] },
    "page-career-spotlight": { description: "El archivo común de Career y Service Spotlight.", category: "Página", tags: ["personas"], keywords: ["entrevistas", "carreras", "recruiting"] },
  },
  tr: {
    "tool-life-alignment": { description: "Kendin, bir ilişki veya gelecekteki yönün üzerine düşünmek için perspektif seç.", category: "Life Alignment aracı", tags: ["ilişkiler", "yaşam yönü", "öncelikler"], keywords: ["insanlar", "ilişkiler", "kariyer", "yaşam yönü", "araçlar"] },
    "tool-life-alignment-self": { title: "Self / Kişisel görünüm", description: "Bugünkü hayatını, önceliklerini, enerjini ve hareket alanını değerlendir.", category: "Life Alignment aracı", tags: ["hayat", "öncelikler"], keywords: ["kendimi anlamak", "yaşam dengesi"] },
    "tool-life-alignment-partner": { description: "İki bağımsız bakışı puan veya sıralama olmadan ortak ilişki bağlamına getir.", category: "Life Alignment aracı", tags: ["ilişki", "iki perspektif"], keywords: ["partner", "ilişkiler", "beklentiler", "sohbet"] },
    "tool-life-alignment-life-vision": { description: "Gelecek yönündeki korunan öncelikleri, olası yolları ve değiş tokuşları keşfet.", category: "Life Alignment aracı", tags: ["gelecek", "öncelikler"], keywords: ["yaşam vizyonu", "yaşam yönü", "olası yollar"] },
    "tool-find-your-next-step": { description: "Kişisel bağlamdan anlaşılır bir sonraki adıma ilerle.", category: "Düşünme aracı", tags: ["yön bulma", "sonraki adım", "kariyer", "sorunlar", "fikirler"], keywords: ["şimdi ne yapmalıyım", "kariyer", "yazı", "projeler"] },
    "tool-find-your-next-step-self": { description: "Güçlü yanlar, değerler, ihtiyaçlar ve yardımcı koşullar üzerine düşün.", category: "Düşünme yolculuğu", tags: ["insan", "güçlü yönler", "değerler"], keywords: ["kendimi anlamak", "kişisel yön"] },
    "tool-find-your-next-step-career": { description: "Mesleki yönleri ve işin uyabileceği koşulları keşfet.", category: "Kariyer yolculuğu", tags: ["kariyer", "iş", "çalışma"], keywords: ["hangi iş bana uygun", "kariyer yönü", "kariyer değişimi", "işe alım"] },
    "tool-find-your-next-step-problem": { description: "Zor bir durumu bağlama yerleştir ve olası adımları gör.", category: "Düşünme yolculuğu", tags: ["sorun", "seçenekler", "destek"], keywords: ["bir sorunum var", "ne yapabilirim"] },
    "tool-find-your-next-step-idea": { description: "Bir fikri yapılandır ve ilk gerçekçi plana dönüştür.", category: "Fikir yolculuğu", tags: ["fikir", "konsept", "proje"], keywords: ["fikir geliştirmek", "proje başlatmak"] },
    "tool-echowall": { description: "Düşünceler, geri bildirim ve mesajlar için denetlenen topluluk duvarı.", category: "Topluluk aracı", tags: ["topluluk", "geri bildirim"], keywords: ["mesaj", "duvar", "insanlar"] },
    "page-home": { description: "Benjamin Trinidad Segura’nın merkezi dijital evi.", category: "Sayfa", tags: ["ana sayfa"], keywords: ["başlangıç", "genel bakış"] },
    "page-projects": { description: "Büyüyen ekosistemdeki tüm projeler ve fikirler.", category: "Sayfa", tags: ["projeler"], keywords: ["projeler", "fikirler"] },
    "page-writing": { description: "İş, kimlik, cesaret ve gelişim üzerine saha notları.", category: "Sayfa", tags: ["makaleler"], keywords: ["yazı", "makaleler", "denemeler"] },
    "page-interviews": { description: "İş, kararlar, fikirler ve görünen rollerin arkasındakiler üzerine sohbetler.", category: "Sayfa", tags: ["insan arşivi"], keywords: ["insanlar", "röportajlar", "sohbetler"] },
    "page-about": { description: "Benjamin’in insan bağlamını görünür kılmak için işe alım, hikâye ve ürün düşüncesini bağlama biçimi.", category: "Profil", tags: ["konumlandırma", "insan bağlamı"], keywords: ["işe alım", "insanlar", "projeler"] },
    "page-contact": { description: "Benjamin ve GOATRECRUTAINER için iletişim, projeler ve doğrulanmış profiller.", category: "Sayfa", tags: ["iletişim"], keywords: ["iş birliği", "işe alım"] },
    "page-career-spotlight": { description: "Ortak Career ve Service Spotlight arşivi.", category: "Sayfa", tags: ["insanlar"], keywords: ["röportajlar", "kariyer", "işe alım"] },
  },
  pl: {
    "tool-life-alignment": { description: "Wybierz perspektywę refleksji nad sobą, relacją lub przyszłym kierunkiem.", category: "Narzędzie Life Alignment", tags: ["relacje", "kierunek życia", "priorytety"], keywords: ["ludzie", "relacje", "kariera", "kierunek życia", "narzędzia"] },
    "tool-life-alignment-self": { title: "Self / Osobisty obraz", description: "Przyjrzyj się obecnemu życiu, priorytetom, energii i przestrzeni do zmiany.", category: "Narzędzie Life Alignment", tags: ["życie", "priorytety"], keywords: ["zrozumieć siebie", "równowaga życia"] },
    "tool-life-alignment-partner": { description: "Połącz dwie niezależne perspektywy we wspólnym kontekście relacji bez ocen i rankingów.", category: "Narzędzie Life Alignment", tags: ["relacja", "dwie perspektywy"], keywords: ["partner", "relacje", "oczekiwania", "rozmowa"] },
    "tool-life-alignment-life-vision": { description: "Odkryj chronione priorytety, możliwe drogi i kompromisy w przyszłym kierunku.", category: "Narzędzie Life Alignment", tags: ["przyszłość", "priorytety"], keywords: ["wizja życia", "kierunek życia", "możliwe drogi"] },
    "tool-find-your-next-step": { description: "Przejdź od osobistego kontekstu do zrozumiałego kolejnego kroku.", category: "Narzędzie refleksji", tags: ["orientacja", "kolejny krok", "kariera", "problemy", "pomysły"], keywords: ["co mam zrobić", "kariera", "pisanie", "projekty"] },
    "tool-find-your-next-step-self": { description: "Zastanów się nad mocnymi stronami, wartościami, potrzebami i pomocnymi warunkami.", category: "Ścieżka refleksji", tags: ["człowiek", "mocne strony", "wartości"], keywords: ["zrozumieć siebie", "osobisty kierunek"] },
    "tool-find-your-next-step-career": { description: "Poznaj kierunki zawodowe i warunki, w których praca może pasować.", category: "Ścieżka kariery", tags: ["kariera", "praca", "zawód"], keywords: ["jaka praca do mnie pasuje", "kierunek kariery", "zmiana zawodu", "rekrutacja"] },
    "tool-find-your-next-step-problem": { description: "Umieść trudną sytuację w kontekście i zobacz możliwe kroki.", category: "Ścieżka refleksji", tags: ["problem", "możliwości", "wsparcie"], keywords: ["mam problem", "co mogę zrobić"] },
    "tool-find-your-next-step-idea": { description: "Uporządkuj pomysł i zmień go w pierwszy realistyczny plan.", category: "Ścieżka pomysłu", tags: ["pomysł", "koncepcja", "projekt"], keywords: ["rozwinąć pomysł", "zacząć projekt"] },
    "tool-echowall": { description: "Moderowana ściana społeczności dla myśli, opinii i wiadomości.", category: "Narzędzie społeczności", tags: ["społeczność", "opinie"], keywords: ["wiadomość", "ściana", "ludzie"] },
    "page-home": { description: "Centralny cyfrowy dom Benjamina Trinidad Segury.", category: "Strona", tags: ["strona główna"], keywords: ["początek", "przegląd"] },
    "page-projects": { description: "Wszystkie projekty i pomysły w rozwijającym się ekosystemie.", category: "Strona", tags: ["projekty"], keywords: ["projekty", "pomysły"] },
    "page-writing": { description: "Notatki o pracy, tożsamości, odwadze i rozwoju.", category: "Strona", tags: ["artykuły"], keywords: ["pisanie", "artykuły", "eseje"] },
    "page-interviews": { description: "Rozmowy o pracy, decyzjach, pomysłach i tym, co stoi za widocznymi rolami.", category: "Strona", tags: ["archiwum ludzi"], keywords: ["ludzie", "wywiady", "rozmowy"] },
    "page-about": { description: "Jak Benjamin łączy rekrutację, storytelling i myślenie produktowe, by pokazywać ludzki kontekst.", category: "Profil", tags: ["pozycjonowanie", "ludzki kontekst"], keywords: ["rekrutacja", "ludzie", "projekty"] },
    "page-contact": { description: "Kontakt, projekty i zweryfikowane profile Benjamina i GOATRECRUTAINER.", category: "Strona", tags: ["kontakt"], keywords: ["współpraca", "rekrutacja"] },
    "page-career-spotlight": { description: "Wspólne archiwum Career i Service Spotlight.", category: "Strona", tags: ["ludzie"], keywords: ["wywiady", "kariera", "rekrutacja"] },
  },
  el: {
    "tool-life-alignment": { description: "Διάλεξε οπτική για αναστοχασμό γύρω από εσένα, μια σχέση ή τη μελλοντική σου κατεύθυνση.", category: "Εργαλείο Life Alignment", tags: ["σχέσεις", "κατεύθυνση ζωής", "προτεραιότητες"], keywords: ["άνθρωποι", "σχέσεις", "σταδιοδρομία", "κατεύθυνση ζωής", "εργαλεία"] },
    "tool-life-alignment-self": { title: "Self / Προσωπική εικόνα", description: "Σκέψου την παρούσα ζωή, τις προτεραιότητες, την ενέργεια και τον χώρο αλλαγής.", category: "Εργαλείο Life Alignment", tags: ["ζωή", "προτεραιότητες"], keywords: ["να καταλάβω τον εαυτό μου", "ισορροπία ζωής"] },
    "tool-life-alignment-partner": { description: "Φέρε δύο ανεξάρτητες οπτικές σε κοινό πλαίσιο σχέσης χωρίς βαθμολογίες ή κατατάξεις.", category: "Εργαλείο Life Alignment", tags: ["σχέση", "δύο οπτικές"], keywords: ["σύντροφος", "σχέσεις", "προσδοκίες", "συζήτηση"] },
    "tool-life-alignment-life-vision": { description: "Εξερεύνησε προστατευμένες προτεραιότητες, πιθανούς δρόμους και συμβιβασμούς στη μελλοντική κατεύθυνση.", category: "Εργαλείο Life Alignment", tags: ["μέλλον", "προτεραιότητες"], keywords: ["όραμα ζωής", "κατεύθυνση ζωής", "πιθανοί δρόμοι"] },
    "tool-find-your-next-step": { description: "Προχώρησε από το προσωπικό πλαίσιο σε ένα κατανοητό επόμενο βήμα.", category: "Εργαλείο αναστοχασμού", tags: ["προσανατολισμός", "επόμενο βήμα", "σταδιοδρομία", "προβλήματα", "ιδέες"], keywords: ["τι να κάνω", "σταδιοδρομία", "γραφή", "έργα"] },
    "tool-find-your-next-step-self": { description: "Σκέψου δυνατά σημεία, αξίες, ανάγκες και βοηθητικές συνθήκες.", category: "Διαδρομή αναστοχασμού", tags: ["άνθρωπος", "δυνατά σημεία", "αξίες"], keywords: ["να καταλάβω τον εαυτό μου", "προσωπική κατεύθυνση"] },
    "tool-find-your-next-step-career": { description: "Εξερεύνησε επαγγελματικές κατευθύνσεις και τις συνθήκες όπου η εργασία μπορεί να ταιριάζει.", category: "Διαδρομή σταδιοδρομίας", tags: ["σταδιοδρομία", "δουλειά", "εργασία"], keywords: ["ποια δουλειά μου ταιριάζει", "επαγγελματική κατεύθυνση", "αλλαγή καριέρας", "recruiting"] },
    "tool-find-your-next-step-problem": { description: "Βάλε μια δύσκολη κατάσταση σε πλαίσιο και δες πιθανά βήματα.", category: "Διαδρομή αναστοχασμού", tags: ["πρόβλημα", "επιλογές", "υποστήριξη"], keywords: ["έχω πρόβλημα", "τι μπορώ να κάνω"] },
    "tool-find-your-next-step-idea": { description: "Οργάνωσε μια ιδέα και μετέτρεψέ την σε πρώτο ρεαλιστικό σχέδιο.", category: "Διαδρομή ιδέας", tags: ["ιδέα", "έννοια", "έργο"], keywords: ["ανάπτυξη ιδέας", "έναρξη έργου"] },
    "tool-echowall": { description: "Ελεγχόμενος τοίχος κοινότητας για σκέψεις, σχόλια και μηνύματα.", category: "Εργαλείο κοινότητας", tags: ["κοινότητα", "σχόλια"], keywords: ["μήνυμα", "τοίχος", "άνθρωποι"] },
    "page-home": { description: "Το κεντρικό ψηφιακό σπίτι του Benjamin Trinidad Segura.", category: "Σελίδα", tags: ["αρχική"], keywords: ["αρχική σελίδα", "επισκόπηση"] },
    "page-projects": { description: "Όλα τα έργα και οι ιδέες στο αναπτυσσόμενο οικοσύστημα.", category: "Σελίδα", tags: ["έργα"], keywords: ["έργα", "ιδέες"] },
    "page-writing": { description: "Σημειώσεις για εργασία, ταυτότητα, θάρρος και εξέλιξη.", category: "Σελίδα", tags: ["άρθρα"], keywords: ["γραφή", "άρθρα", "δοκίμια"] },
    "page-interviews": { description: "Συζητήσεις για εργασία, αποφάσεις, ιδέες και όσα βρίσκονται πίσω από ορατούς ρόλους.", category: "Σελίδα", tags: ["ανθρώπινο αρχείο"], keywords: ["άνθρωποι", "συνεντεύξεις", "συζητήσεις"] },
    "page-about": { description: "Πώς ο Benjamin συνδέει recruiting, αφήγηση και προϊοντική σκέψη για να δείξει ανθρώπινο πλαίσιο.", category: "Προφίλ", tags: ["τοποθέτηση", "ανθρώπινο πλαίσιο"], keywords: ["recruiting", "άνθρωποι", "έργα"] },
    "page-contact": { description: "Επικοινωνία, έργα και επαληθευμένα προφίλ του Benjamin και του GOATRECRUTAINER.", category: "Σελίδα", tags: ["επικοινωνία"], keywords: ["συνεργασία", "recruiting"] },
    "page-career-spotlight": { description: "Το κοινό αρχείο Career και Service Spotlight.", category: "Σελίδα", tags: ["άνθρωποι"], keywords: ["συνεντεύξεις", "σταδιοδρομία", "recruiting"] },
  },
  ru: {
    "tool-life-alignment": { description: "Выберите взгляд для размышления о себе, отношениях или будущем направлении.", category: "Инструмент Life Alignment", tags: ["отношения", "направление жизни", "приоритеты"], keywords: ["люди", "отношения", "карьера", "направление жизни", "инструменты"] },
    "tool-life-alignment-self": { title: "Self / Личный снимок", description: "Осмыслите нынешнюю жизнь, приоритеты, энергию и пространство для перемен.", category: "Инструмент Life Alignment", tags: ["жизнь", "приоритеты"], keywords: ["понять себя", "баланс жизни"] },
    "tool-life-alignment-partner": { description: "Соедините два независимых взгляда в общем контексте отношений без баллов и рейтингов.", category: "Инструмент Life Alignment", tags: ["отношения", "два взгляда"], keywords: ["партнёр", "отношения", "ожидания", "разговор"] },
    "tool-life-alignment-life-vision": { description: "Исследуйте защищённые приоритеты, возможные пути и компромиссы в будущем направлении.", category: "Инструмент Life Alignment", tags: ["будущее", "приоритеты"], keywords: ["видение жизни", "направление жизни", "возможные пути"] },
    "tool-find-your-next-step": { description: "Пройдите от личного контекста к понятному следующему шагу.", category: "Инструмент рефлексии", tags: ["ориентация", "следующий шаг", "карьера", "проблемы", "идеи"], keywords: ["что делать дальше", "карьера", "тексты", "проекты"] },
    "tool-find-your-next-step-self": { description: "Осмыслите сильные стороны, ценности, потребности и полезные условия.", category: "Путь рефлексии", tags: ["человек", "сильные стороны", "ценности"], keywords: ["понять себя", "личное направление"] },
    "tool-find-your-next-step-career": { description: "Исследуйте профессиональные направления и условия, в которых работа может подходить.", category: "Карьерный путь", tags: ["карьера", "работа", "профессия"], keywords: ["какая работа мне подходит", "направление карьеры", "смена карьеры", "рекрутинг"] },
    "tool-find-your-next-step-problem": { description: "Поместите сложную ситуацию в контекст и найдите возможные шаги.", category: "Путь рефлексии", tags: ["проблема", "варианты", "поддержка"], keywords: ["у меня проблема", "что я могу сделать"] },
    "tool-find-your-next-step-idea": { description: "Структурируйте идею и превратите её в первый реалистичный план.", category: "Путь идеи", tags: ["идея", "концепция", "проект"], keywords: ["развить идею", "начать проект"] },
    "tool-echowall": { description: "Модерируемая стена сообщества для мыслей, отзывов и сообщений.", category: "Инструмент сообщества", tags: ["сообщество", "отзывы"], keywords: ["сообщение", "стена", "люди"] },
    "page-home": { description: "Главный цифровой дом Benjamin Trinidad Segura.", category: "Страница", tags: ["главная"], keywords: ["главная страница", "обзор"] },
    "page-projects": { description: "Все проекты и идеи растущей экосистемы.", category: "Страница", tags: ["проекты"], keywords: ["проекты", "идеи"] },
    "page-writing": { description: "Полевые заметки о работе, идентичности, смелости и развитии.", category: "Страница", tags: ["статьи"], keywords: ["тексты", "статьи", "эссе"] },
    "page-interviews": { description: "Разговоры о работе, решениях, идеях и том, что стоит за видимыми ролями.", category: "Страница", tags: ["архив людей"], keywords: ["люди", "интервью", "разговоры"] },
    "page-about": { description: "Как Benjamin соединяет рекрутинг, сторителлинг и продуктовое мышление, чтобы показывать человеческий контекст.", category: "Профиль", tags: ["позиционирование", "человеческий контекст"], keywords: ["рекрутинг", "люди", "проекты"] },
    "page-contact": { description: "Контакты, проекты и проверенные профили Benjamin и GOATRECRUTAINER.", category: "Страница", tags: ["контакт"], keywords: ["сотрудничество", "рекрутинг"] },
    "page-career-spotlight": { description: "Общий архив Career и Service Spotlight.", category: "Страница", tags: ["люди"], keywords: ["интервью", "карьера", "рекрутинг"] },
  },
};

function projectCopyById(locale: Locale): Map<string, Partial<DiscoveryItem>> {
  const localizedProjects = getLocalizedProjects(locale);
  const copy = new Map<string, Partial<DiscoveryItem>>();
  for (const [projectIndex, project] of projects.entries()) {
    const translated = localizedProjects[projectIndex];
    copy.set(`project-${project.slug}`, { title: translated.name, description: translated.description, category: translated.category, tags: [translated.pitch, translated.longName, translated.positioning].filter((value): value is string => Boolean(value)), keywords: [translated.vision, translated.goal, ...(translated.services ?? []), ...(translated.industries ?? []), ...(translated.plannedElements ?? [])] });
    for (const [areaIndex, area] of (project.areas ?? []).entries()) {
      const id = `project-${project.slug}-area-${area.title.toLocaleLowerCase("de-DE").replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "")}`;
      const translatedArea = translated.areas?.[areaIndex];
      if (translatedArea) copy.set(id, { title: translatedArea.title, description: translatedArea.description ?? translated.name, category: translated.name, tags: [translated.category, "Format"] });
    }
  }
  return copy;
}

const staticCopyByLocale: Record<Locale, Record<string, Partial<DiscoveryItem>>> = {
  de: {},
  en: englishStaticCopy,
  ...extendedStaticCopy,
};

const interviewKeyword: Record<Locale, string> = {
  de: "Interview", en: "interview", es: "entrevista", tr: "röportaj", pl: "wywiad", el: "συνέντευξη", ru: "интервью",
};

export function getDiscoveryUiCopy(locale: Locale): DiscoveryUiCopy {
  return ui[locale];
}

export function localizeDiscoveryItems(items: readonly DiscoveryItem[], locale: Locale): DiscoveryItem[] {
  const people = new Map(getLocalizedPublishedSpotlights(locale).map((spotlight) => [spotlight.id, spotlight]));
  const localizedProjectCopy = projectCopyById(locale);
  return items.map((item) => {
    let localized: DiscoveryItem = { ...item, ...(staticCopyByLocale[locale][item.id] ?? localizedProjectCopy.get(item.id)) };
    if (item.id === "page-world-map") {
      const mapCopy = getWorldMapDictionary(locale);
      const terms: Record<Locale, { tags: string[]; keywords: string[] }> = {
        de: { tags: ["Menschen", "Kontext", "Karte"], keywords: ["Weltkarte", "Orte", "Interviews", "Beziehungen", "Entdeckung"] },
        en: { tags: ["People", "Context", "Map"], keywords: ["world map", "places", "interviews", "relationships", "discovery"] },
        es: { tags: ["Personas", "Contexto", "Mapa"], keywords: ["mapa mundial", "lugares", "entrevistas", "relaciones", "descubrimiento"] },
        tr: { tags: ["İnsanlar", "Bağlam", "Harita"], keywords: ["dünya haritası", "yerler", "röportajlar", "ilişkiler", "keşif"] },
        pl: { tags: ["Ludzie", "Kontekst", "Mapa"], keywords: ["mapa świata", "miejsca", "wywiady", "relacje", "odkrywanie"] },
        el: { tags: ["Άνθρωποι", "Πλαίσιο", "Χάρτης"], keywords: ["παγκόσμιος χάρτης", "τόποι", "συνεντεύξεις", "σχέσεις", "ανακάλυψη"] },
        ru: { tags: ["Люди", "Контекст", "Карта"], keywords: ["карта мира", "места", "интервью", "связи", "открытие"] },
      };
      localized = { ...localized, title: mapCopy.breadcrumb, description: mapCopy.metadata.description, tags: terms[locale].tags, keywords: terms[locale].keywords };
    }
    const person = people.get(item.id);
    if (person) localized = { ...localized, title: person.fullName, description: person.teaser, category: person.format, tags: [person.professionalContext, ...person.discovery.tags], keywords: [person.displayName, ...person.discovery.keywords, interviewKeyword[locale]] };
    if (item.id.startsWith("pulse-")) {
      const pulse = localizeHqPulseItem({ ...item, id: item.id.slice("pulse-".length), kind: "content", type: item.category, teaser: item.description, href: item.href ?? "/", ctaLabel: "", title: item.title }, locale);
      localized = { ...localized, title: pulse.title, description: pulse.teaser, category: pulse.type, tags: [pulse.source, pulse.status].filter((value): value is string => Boolean(value)) };
    }
    return { ...localized, href: localized.href ? localizeHref(localized.href, locale) : undefined };
  });
}
