import { getLocalizedPublishedSpotlight } from "@/data/i18n/people";
import type { Locale } from "@/lib/i18n/config";
import type { HqPulseItem } from "@/types/content";

const englishEditorialUpdates: Record<string, Partial<HqPulseItem>> = {
  "ecosystem-contact-social-v1": {
    type: "Digital HQ",
    title: "Contact and social presence connect the HQ to the outside world",
    teaser: "Verified profiles, clear project paths and an honest booking boundary show how people can reach Benjamin and GOATRECRUTAINER beyond the HQ.",
    ctaLabel: "Explore Contact & Social",
    status: "Live",
  },
  "goatrecrutainer-ecosystem-v1": {
    type: "Project update",
    title: "GOATRECRUTAINER opens up its professional ecosystem",
    teaser: "The project page explains the brand, its recruiting offer and its formats together — with a clearly marked path to the official external website.",
    ctaLabel: "Explore GOATRECRUTAINER",
    status: "Active / Growing",
  },
  "ratecom-ecosystem-v1": {
    type: "Project update",
    title: "RateCom has its own product path in the Digital HQ",
    teaser: "RateCom has a complete project surface and a verified route to its official website — with a transparent rebuild status rather than overstated product claims.",
    ctaLabel: "Explore RateCom",
    status: "Rebuild",
  },
  "life-alignment-modular-v1": {
    type: "Tool / Module",
    title: "Life Alignment V1 connects three perspectives of their own",
    teaser: "Self, Partner / Relationship and Life Vision form a modular family of reflection tools — local, intelligible and without a life, relationship or compatibility score.",
    ctaLabel: "Open Life Alignment",
    status: "V1 complete",
  },
  "find-your-next-step-v1": {
    type: "Tool / Journey",
    title: "Find Your Next Step V1 brings four functional journeys together",
    teaser: "Self, Career, Problem and Idea move from personal context to an intelligible next step — without an account, storage or a finished answer.",
    ctaLabel: "Open Find Your Next Step",
    status: "V1 complete",
  },
};

const editorialUpdatesByLocale: Record<Locale, Record<string, Partial<HqPulseItem>>> = {
  de: {},
  en: englishEditorialUpdates,
  es: {
    "ecosystem-contact-social-v1": { type: "Digital HQ", title: "Contacto y presencia social conectan el HQ con el exterior", teaser: "Perfiles verificados, rutas claras hacia los proyectos y un límite honesto para la reserva muestran cómo contactar con Benjamin y GOATRECRUTAINER fuera del HQ.", ctaLabel: "Explorar contacto y redes", status: "En vivo" },
    "goatrecrutainer-ecosystem-v1": { type: "Actualización del proyecto", title: "GOATRECRUTAINER abre su ecosistema profesional", teaser: "La página reúne la marca, su propuesta de recruiting y sus formatos, con un camino claramente marcado al sitio oficial.", ctaLabel: "Explorar GOATRECRUTAINER", status: "Activo / En crecimiento" },
    "ratecom-ecosystem-v1": { type: "Actualización del proyecto", title: "RateCom tiene su propio recorrido en el Digital HQ", teaser: "RateCom cuenta con una superficie de proyecto completa y un enlace verificado al sitio oficial, con un estado de reconstrucción transparente.", ctaLabel: "Explorar RateCom", status: "Reconstrucción" },
    "life-alignment-modular-v1": { type: "Herramienta / Módulo", title: "Life Alignment V1 conecta tres perspectivas propias", teaser: "Self, Partner / Relationship y Life Vision forman una familia modular de reflexión, local y comprensible, sin puntuaciones de vida, relación o compatibilidad.", ctaLabel: "Abrir Life Alignment", status: "V1 completa" },
    "find-your-next-step-v1": { type: "Herramienta / Recorrido", title: "Find Your Next Step V1 reúne cuatro recorridos funcionales", teaser: "Self, Career, Problem e Idea avanzan desde el contexto personal hacia un siguiente paso comprensible, sin cuenta, almacenamiento ni respuesta cerrada.", ctaLabel: "Abrir Find Your Next Step", status: "V1 completa" },
  },
  tr: {
    "ecosystem-contact-social-v1": { type: "Digital HQ", title: "İletişim ve sosyal varlık HQ’yu dış dünyaya bağlar", teaser: "Doğrulanmış profiller, açık proje yolları ve dürüst rezervasyon sınırı Benjamin ve GOATRECRUTAINER’a HQ dışında nasıl ulaşılacağını gösterir.", ctaLabel: "İletişim ve sosyal kanalları keşfet", status: "Canlı" },
    "goatrecrutainer-ecosystem-v1": { type: "Proje güncellemesi", title: "GOATRECRUTAINER profesyonel ekosistemini açıyor", teaser: "Proje sayfası markayı, işe alım teklifini ve formatlarını resmi siteye açıkça işaretlenmiş bir yolla birlikte anlatır.", ctaLabel: "GOATRECRUTAINER’ı keşfet", status: "Aktif / Büyüyor" },
    "ratecom-ecosystem-v1": { type: "Proje güncellemesi", title: "RateCom’un Digital HQ içinde kendi ürün yolu var", teaser: "RateCom eksiksiz proje yüzeyine ve resmi siteye doğrulanmış yola sahip; yeniden kuruluş durumu abartısız ve şeffaftır.", ctaLabel: "RateCom’u keşfet", status: "Yeniden kuruluyor" },
    "life-alignment-modular-v1": { type: "Araç / Modül", title: "Life Alignment V1 üç bağımsız perspektifi bağlıyor", teaser: "Self, Partner / Relationship ve Life Vision; yaşam, ilişki veya uyumluluk puanı olmadan yerel ve anlaşılır bir düşünme araçları ailesi oluşturur.", ctaLabel: "Life Alignment’ı aç", status: "V1 tamamlandı" },
    "find-your-next-step-v1": { type: "Araç / Yolculuk", title: "Find Your Next Step V1 dört işlevsel yolculuğu buluşturuyor", teaser: "Self, Career, Problem ve Idea kişisel bağlamdan anlaşılır bir sonraki adıma ilerler; hesap, kayıt veya hazır cevap yoktur.", ctaLabel: "Find Your Next Step’i aç", status: "V1 tamamlandı" },
  },
  pl: {
    "ecosystem-contact-social-v1": { type: "Digital HQ", title: "Kontakt i profile społecznościowe łączą HQ ze światem", teaser: "Zweryfikowane profile, jasne ścieżki projektów i uczciwa granica rezerwacji pokazują, jak dotrzeć do Benjamina i GOATRECRUTAINER poza HQ.", ctaLabel: "Odkryj kontakt i profile", status: "Działa" },
    "goatrecrutainer-ecosystem-v1": { type: "Aktualizacja projektu", title: "GOATRECRUTAINER otwiera swój zawodowy ekosystem", teaser: "Strona łączy markę, ofertę rekrutacyjną i formaty z jasno oznaczoną drogą do oficjalnej witryny.", ctaLabel: "Odkryj GOATRECRUTAINER", status: "Aktywny / Rozwija się" },
    "ratecom-ecosystem-v1": { type: "Aktualizacja projektu", title: "RateCom ma własną ścieżkę produktu w Digital HQ", teaser: "RateCom ma pełną stronę projektu i zweryfikowaną drogę do oficjalnej witryny, z uczciwym statusem przebudowy.", ctaLabel: "Odkryj RateCom", status: "Przebudowa" },
    "life-alignment-modular-v1": { type: "Narzędzie / Moduł", title: "Life Alignment V1 łączy trzy odrębne perspektywy", teaser: "Self, Partner / Relationship i Life Vision tworzą modułową rodzinę refleksji — lokalną, zrozumiałą i bez ocen życia, relacji czy zgodności.", ctaLabel: "Otwórz Life Alignment", status: "V1 ukończona" },
    "find-your-next-step-v1": { type: "Narzędzie / Ścieżka", title: "Find Your Next Step V1 łączy cztery funkcjonalne ścieżki", teaser: "Self, Career, Problem i Idea prowadzą od osobistego kontekstu do zrozumiałego kolejnego kroku — bez konta, zapisu i gotowej odpowiedzi.", ctaLabel: "Otwórz Find Your Next Step", status: "V1 ukończona" },
  },
  el: {
    "ecosystem-contact-social-v1": { type: "Digital HQ", title: "Η επικοινωνία και η κοινωνική παρουσία συνδέουν το HQ με τον έξω κόσμο", teaser: "Επαληθευμένα προφίλ, σαφείς διαδρομές έργων και ένα ειλικρινές όριο κράτησης δείχνουν πώς μπορεί κανείς να βρει τον Benjamin και το GOATRECRUTAINER.", ctaLabel: "Εξερεύνησε επικοινωνία και προφίλ", status: "Ενεργό" },
    "goatrecrutainer-ecosystem-v1": { type: "Ενημέρωση έργου", title: "Το GOATRECRUTAINER ανοίγει το επαγγελματικό του οικοσύστημα", teaser: "Η σελίδα συνδέει τη μάρκα, την πρόταση recruiting και τις μορφές της με σαφή διαδρομή προς τον επίσημο ιστότοπο.", ctaLabel: "Εξερεύνησε το GOATRECRUTAINER", status: "Ενεργό / Αναπτύσσεται" },
    "ratecom-ecosystem-v1": { type: "Ενημέρωση έργου", title: "Το RateCom έχει τη δική του διαδρομή προϊόντος στο Digital HQ", teaser: "Το RateCom έχει πλήρη σελίδα έργου και επαληθευμένη διαδρομή προς τον επίσημο ιστότοπο, με ειλικρινή κατάσταση επανασχεδιασμού.", ctaLabel: "Εξερεύνησε το RateCom", status: "Επανασχεδιασμός" },
    "life-alignment-modular-v1": { type: "Εργαλείο / Μονάδα", title: "Το Life Alignment V1 συνδέει τρεις ξεχωριστές οπτικές", teaser: "Self, Partner / Relationship και Life Vision σχηματίζουν μια αρθρωτή οικογένεια αναστοχασμού — τοπική, κατανοητή και χωρίς βαθμολογία ζωής, σχέσης ή συμβατότητας.", ctaLabel: "Άνοιξε το Life Alignment", status: "V1 ολοκληρωμένο" },
    "find-your-next-step-v1": { type: "Εργαλείο / Διαδρομή", title: "Το Find Your Next Step V1 ενώνει τέσσερις λειτουργικές διαδρομές", teaser: "Self, Career, Problem και Idea προχωρούν από το προσωπικό πλαίσιο σε ένα κατανοητό επόμενο βήμα — χωρίς λογαριασμό, αποθήκευση ή έτοιμη απάντηση.", ctaLabel: "Άνοιξε το Find Your Next Step", status: "V1 ολοκληρωμένο" },
  },
  ru: {
    "ecosystem-contact-social-v1": { type: "Digital HQ", title: "Контакты и социальные площадки связывают HQ с внешним миром", teaser: "Проверенные профили, ясные пути к проектам и честная граница записи показывают, как связаться с Benjamin и GOATRECRUTAINER за пределами HQ.", ctaLabel: "Открыть контакты и профили", status: "Работает" },
    "goatrecrutainer-ecosystem-v1": { type: "Обновление проекта", title: "GOATRECRUTAINER открывает свою профессиональную экосистему", teaser: "Страница объединяет бренд, рекрутинговое предложение и форматы с ясно отмеченным путём на официальный сайт.", ctaLabel: "Открыть GOATRECRUTAINER", status: "Активно / Растёт" },
    "ratecom-ecosystem-v1": { type: "Обновление проекта", title: "У RateCom есть собственный продуктовый путь в Digital HQ", teaser: "RateCom получил полную страницу проекта и проверенный путь на официальный сайт с честным статусом перестройки.", ctaLabel: "Открыть RateCom", status: "Перестройка" },
    "life-alignment-modular-v1": { type: "Инструмент / Модуль", title: "Life Alignment V1 связывает три самостоятельных взгляда", teaser: "Self, Partner / Relationship и Life Vision образуют модульное семейство рефлексии — локальное, понятное и без оценок жизни, отношений или совместимости.", ctaLabel: "Открыть Life Alignment", status: "V1 завершена" },
    "find-your-next-step-v1": { type: "Инструмент / Путь", title: "Find Your Next Step V1 объединяет четыре полноценных пути", teaser: "Self, Career, Problem и Idea ведут от личного контекста к понятному следующему шагу — без аккаунта, хранения и готового ответа.", ctaLabel: "Открыть Find Your Next Step", status: "V1 завершена" },
  },
};

const pulseCopy: Record<Locale, { title: string; description: string; newest: string; source: string; interview: string; published: string; readArticle: string; readWriting: string; dateLocale: string }> = {
  de: { title: "Was sich gerade bewegt.", description: "Die jüngsten öffentlichen Entwicklungen im Digital HQ — kuratiert, kontextreich und direkt mit dem verbunden, was sich verändert hat.", newest: "Neueste", source: "Quelle", interview: "Gespräch öffnen", published: "Veröffentlicht", readArticle: "Artikel lesen", readWriting: "Writing lesen", dateLocale: "de-DE" },
  en: { title: "What’s moving right now.", description: "The latest public developments in the Digital HQ — curated, rich in context and linked directly to what has changed.", newest: "Newest", source: "Source", interview: "Open interview", published: "Published", readArticle: "Read article", readWriting: "Read Writing", dateLocale: "en-GB" },
  es: { title: "Lo que se está moviendo.", description: "Los últimos avances públicos del Digital HQ, seleccionados, con contexto y conectados directamente con lo que ha cambiado.", newest: "Más reciente", source: "Fuente", interview: "Abrir entrevista", published: "Publicado", readArticle: "Leer artículo", readWriting: "Leer Writing", dateLocale: "es-ES" },
  tr: { title: "Şu anda hareket edenler.", description: "Digital HQ’daki en yeni herkese açık gelişmeler — seçilmiş, bağlamlı ve doğrudan değişen şeye bağlı.", newest: "En yeni", source: "Kaynak", interview: "Sohbeti aç", published: "Yayımlandı", readArticle: "Makaleyi oku", readWriting: "Writing’i oku", dateLocale: "tr-TR" },
  pl: { title: "Co właśnie się zmienia.", description: "Najnowsze publiczne wydarzenia w Digital HQ — wybrane, osadzone w kontekście i połączone bezpośrednio z tym, co się zmieniło.", newest: "Najnowsze", source: "Źródło", interview: "Otwórz rozmowę", published: "Opublikowano", readArticle: "Czytaj artykuł", readWriting: "Czytaj Writing", dateLocale: "pl-PL" },
  el: { title: "Τι κινείται αυτή τη στιγμή.", description: "Οι πιο πρόσφατες δημόσιες εξελίξεις στο Digital HQ — επιμελημένες, με πλαίσιο και άμεσα συνδεδεμένες με ό,τι άλλαξε.", newest: "Νεότερο", source: "Πηγή", interview: "Άνοιξε τη συζήτηση", published: "Δημοσιεύτηκε", readArticle: "Διάβασε το άρθρο", readWriting: "Διάβασε το Writing", dateLocale: "el-GR" },
  ru: { title: "Что меняется прямо сейчас.", description: "Последние публичные изменения в Digital HQ — отобранные, с контекстом и прямой связью с тем, что изменилось.", newest: "Новое", source: "Источник", interview: "Открыть разговор", published: "Опубликовано", readArticle: "Читать статью", readWriting: "Читать Writing", dateLocale: "ru-RU" },
};

const germanStatus: Record<string, string> = {
  "Active / Growing": "Aktiv / im Wachstum",
  Rebuild: "Neuaufbau",
  "V1 complete": "V1 abgeschlossen",
  Published: "Veröffentlicht",
};

const germanType: Record<string, string> = {
  "Project update": "Projektupdate",
  "Tool / Module": "Tool / Modul",
  "Tool / Journey": "Tool / Weg",
  Article: "Artikel",
};

const typeLabels: Record<Locale, Record<string, string>> = {
  de: germanType,
  en: {},
  es: { "Project update": "Actualización del proyecto", "Tool / Module": "Herramienta / Módulo", "Tool / Journey": "Herramienta / Recorrido", Article: "Artículo", Interview: "Entrevista" },
  tr: { "Project update": "Proje güncellemesi", "Tool / Module": "Araç / Modül", "Tool / Journey": "Araç / Yolculuk", Article: "Makale", Interview: "Röportaj" },
  pl: { "Project update": "Aktualizacja projektu", "Tool / Module": "Narzędzie / Moduł", "Tool / Journey": "Narzędzie / Ścieżka", Article: "Artykuł", Interview: "Wywiad" },
  el: { "Project update": "Ενημέρωση έργου", "Tool / Module": "Εργαλείο / Μονάδα", "Tool / Journey": "Εργαλείο / Διαδρομή", Article: "Άρθρο", Interview: "Συνέντευξη" },
  ru: { "Project update": "Обновление проекта", "Tool / Module": "Инструмент / Модуль", "Tool / Journey": "Инструмент / Путь", Article: "Статья", Interview: "Интервью" },
};

const statusLabels: Record<Locale, Record<string, string>> = {
  de: germanStatus,
  en: {},
  es: { "Active / Growing": "Activo / En crecimiento", Rebuild: "Reconstrucción", "V1 complete": "V1 completa", Published: "Publicado" },
  tr: { "Active / Growing": "Aktif / Büyüyor", Rebuild: "Yeniden kuruluyor", "V1 complete": "V1 tamamlandı", Published: "Yayımlandı" },
  pl: { "Active / Growing": "Aktywny / Rozwija się", Rebuild: "Przebudowa", "V1 complete": "V1 ukończona", Published: "Opublikowano" },
  el: { "Active / Growing": "Ενεργό / Αναπτύσσεται", Rebuild: "Επανασχεδιασμός", "V1 complete": "V1 ολοκληρωμένο", Published: "Δημοσιεύτηκε" },
  ru: { "Active / Growing": "Активно / Растёт", Rebuild: "Перестройка", "V1 complete": "V1 завершена", Published: "Опубликовано" },
};

export function localizeHqPulseItem(item: HqPulseItem, locale: Locale): HqPulseItem {
  const editorial = editorialUpdatesByLocale[locale][item.id];
  let localized = editorial ? { ...item, ...editorial } : { ...item };
  if (item.id.startsWith("spotlight-")) {
    const spotlight = getLocalizedPublishedSpotlight(item.id.slice("spotlight-".length), locale);
    if (spotlight) localized = {
      ...localized,
      title: spotlight.title,
      teaser: spotlight.teaser,
      ctaLabel: pulseCopy[locale].interview,
      type: typeLabels[locale].Interview ?? "Interview",
      status: pulseCopy[locale].published,
    };
  }
  if (item.id.startsWith("writing-")) localized = {
    ...localized,
    ctaLabel: item.type === "Article" ? pulseCopy[locale].readArticle : pulseCopy[locale].readWriting,
    status: pulseCopy[locale].published,
  };
  return {
    ...localized,
    type: typeLabels[locale][localized.type] ?? localized.type,
    status: localized.status ? statusLabels[locale][localized.status] ?? localized.status : localized.status,
  };
}

export function localizeHqPulseItems(items: readonly HqPulseItem[], locale: Locale): HqPulseItem[] {
  return items.map((item) => localizeHqPulseItem(item, locale));
}

export function getHqPulseCopy(locale: Locale) {
  return pulseCopy[locale];
}
