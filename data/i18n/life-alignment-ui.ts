import type { AddedLifeLocale } from "@/data/i18n/life-alignment-extra";
import { partnerVisionLifeUiCopy } from "@/data/i18n/life-alignment-ui-partner-vision-copy";
import { lifeAlignmentUiSelfCopy } from "@/data/i18n/life-alignment-ui-self-copy";
import { lifeVisionUiVisionCopy } from "@/data/i18n/life-alignment-ui-vision-copy";
import { lifeAlignmentUiEngineCopy } from "@/data/i18n/life-alignment-ui-engine-copy";
import type { Locale } from "@/lib/i18n/config";

const shortKeys = [
  "Back", "Continue", "Cancel", "Try again", "Start over", "Yes, delete", "Yes, delete all", "Keep", "Open", "optional", "sensitive", "marked", "of", "valid state", "Breadcrumb", "Privacy", "Scope", "For whom", "Focus", "Direction", "Effect", "Importance", "Certainty", "Expectation", "Trade-off", "Boundary", "First step", "Observation question", "Learning question", "Reversibility", "Possible paths", "Small tools", "Current conditions", "Current experience", "Desired direction", "Life areas", "Relevant life areas", "Protected priorities", "Real conditions", "Supporting conditions", "Source signals", "View answers used", "View snapshot", "View landscape", "Reload journey", "To the hub", "How it works", "Before starting", "What you might learn", "Possible approach", "Concrete signals", "Shared stance", "Shared relationship context", "Three perspectives", "Three reversible explorations", "Qualitative signals", "Traceable observations", "Conversation tools", "Questions to take with you", "Begin reflection", "Begin Life Vision", "Begin with Person A", "Seal and hand over", "Consent and compare", "Private by design", "Local-only", "Independent first", "Active perspective", "You answer only for yourself", "The other perspective", "One perspective", "One released perspective", "Custom life area", "Include in snapshot", "e.g. spirituality", "Protected life areas", "Potentially competing directions", "Present-day conditions", "Possible first step", "Relevant trade-off", "Why this path may fit", "Why this observation appears", "What is this based on?", "Possible examples—not claims about your life", "In everyday life", "What becomes visible", "No decision is made for you here.",
] as const;

const shortValues: Record<AddedLifeLocale, readonly string[]> = {
  es: ["Atrás", "Continuar", "Cancelar", "Reintentar", "Empezar de nuevo", "Sí, eliminar", "Sí, eliminar todo", "Conservar", "Abierto", "opcional", "sensible", "marcado", "de", "selección válida", "Ruta de navegación", "Privacidad", "Alcance", "Para quién", "Foco", "Dirección", "Efecto", "Importancia", "Certeza", "Expectativa", "Renuncia", "Límite", "Primer paso", "Pregunta de observación", "Pregunta de aprendizaje", "Reversibilidad", "Caminos posibles", "Pequeñas herramientas", "Condiciones actuales", "Experiencia actual", "Dirección deseada", "Ámbitos de vida", "Ámbitos relevantes", "Prioridades protegidas", "Condiciones reales", "Condiciones de apoyo", "Señales de origen", "Ver respuestas utilizadas", "Ver panorama", "Ver paisaje", "Recargar recorrido", "Ir al inicio", "Cómo funciona", "Antes de empezar", "Qué podríais aprender", "Enfoque posible", "Señales concretas", "Postura compartida", "Contexto compartido de la relación", "Tres perspectivas", "Tres exploraciones reversibles", "Señales cualitativas", "Observaciones rastreables", "Herramientas de conversación", "Preguntas para llevarte", "Comenzar reflexión", "Comenzar Life Vision", "Empezar con la Persona A", "Sellar y entregar", "Dar consentimiento y comparar", "Privado por diseño", "Solo local", "Primero por separado", "Perspectiva activa", "Respondes solo por ti", "La otra perspectiva", "Una perspectiva", "Una perspectiva compartida", "Ámbito propio", "Incluir en el panorama", "p. ej., espiritualidad", "Ámbitos protegidos", "Direcciones que podrían competir", "Condiciones actuales", "Primer paso posible", "Renuncia relevante", "Por qué puede encajar", "Por qué aparece", "¿En qué se basa?", "Ejemplos posibles, no afirmaciones sobre tu vida", "En la vida cotidiana", "Lo que se hace visible", "Aquí no se decide por ti."],
  tr: ["Geri", "Devam", "İptal", "Yeniden dene", "Baştan başla", "Evet, sil", "Evet, hepsini sil", "Koru", "Açık", "isteğe bağlı", "hassas", "işaretli", "/", "geçerli seçim", "Sayfa yolu", "Gizlilik", "Kapsam", "Kim için", "Odak", "Yön", "Etki", "Önem", "Kesinlik", "Beklenti", "Ödünleşme", "Sınır", "İlk adım", "Gözlem sorusu", "Öğrenme sorusu", "Geri alınabilirlik", "Olası yollar", "Küçük araçlar", "Bugünkü koşullar", "Bugünkü deneyim", "İstenen yön", "Yaşam alanları", "İlgili yaşam alanları", "Korunan öncelikler", "Gerçek koşullar", "Destekleyici koşullar", "Kaynak sinyalleri", "Kullanılan yanıtları gör", "Görünümü aç", "Manzarayı gör", "Yolculuğu yenile", "Ana sayfaya", "Nasıl işliyor", "Başlamadan önce", "Neler öğrenebilirsiniz", "Olası yaklaşım", "Somut sinyaller", "Ortak duruş", "Ortak ilişki bağlamı", "Üç bakış açısı", "Üç geri alınabilir keşif", "Nitel sinyaller", "İzlenebilir gözlemler", "Konuşma araçları", "Yanında götüreceğin sorular", "Düşünmeye başla", "Life Vision'a başla", "A Kişisiyle başla", "Mühürle ve devret", "Onayla ve karşılaştır", "Tasarım gereği özel", "Yalnızca yerel", "Önce bağımsız", "Etkin bakış", "Yalnızca kendin için yanıtlıyorsun", "Diğer bakış", "Bir bakış", "Paylaşılan bir bakış", "Kendi yaşam alanın", "Görünüme ekle", "örn. maneviyat", "Korunan yaşam alanları", "Olası çatışan yönler", "Bugünkü koşullar", "Olası ilk adım", "İlgili ödünleşme", "Bu yol neden uyabilir", "Bu gözlem neden görünüyor", "Neye dayanıyor?", "Olası örnekler; yaşamınla ilgili iddia değil", "Gündelik yaşamda", "Görünür olan", "Burada senin adına karar verilmez."],
  pl: ["Wstecz", "Dalej", "Anuluj", "Spróbuj ponownie", "Zacznij od nowa", "Tak, usuń", "Tak, usuń wszystko", "Zachowaj", "Otwarte", "opcjonalne", "wrażliwe", "zaznaczone", "z", "prawidłowy wybór", "Okruszki nawigacji", "Prywatność", "Zakres", "Dla kogo", "Punkt uwagi", "Kierunek", "Wpływ", "Znaczenie", "Pewność", "Oczekiwanie", "Kompromis", "Granica", "Pierwszy krok", "Pytanie obserwacyjne", "Pytanie do nauki", "Odwracalność", "Możliwe drogi", "Małe narzędzia", "Obecne warunki", "Obecne doświadczenie", "Pożądany kierunek", "Obszary życia", "Istotne obszary", "Chronione priorytety", "Realne warunki", "Warunki wspierające", "Sygnały źródłowe", "Pokaż użyte odpowiedzi", "Pokaż obraz", "Pokaż krajobraz", "Wczytaj ponownie", "Do strony głównej", "Jak to działa", "Przed rozpoczęciem", "Czego możecie się dowiedzieć", "Możliwe podejście", "Konkretne sygnały", "Wspólna postawa", "Wspólny kontekst relacji", "Trzy perspektywy", "Trzy odwracalne próby", "Sygnały jakościowe", "Możliwe do prześledzenia obserwacje", "Narzędzia rozmowy", "Pytania na dalszą drogę", "Rozpocznij refleksję", "Rozpocznij Life Vision", "Zacznij od Osoby A", "Zapieczętuj i przekaż", "Wyraź zgodę i porównaj", "Prywatność w założeniu", "Tylko lokalnie", "Najpierw niezależnie", "Aktywna perspektywa", "Odpowiadasz tylko za siebie", "Druga perspektywa", "Jedna perspektywa", "Jedna udostępniona perspektywa", "Własny obszar życia", "Uwzględnij w obrazie", "np. duchowość", "Chronione obszary życia", "Potencjalnie konkurujące kierunki", "Dzisiejsze warunki", "Możliwy pierwszy krok", "Istotny kompromis", "Dlaczego ta droga może pasować", "Dlaczego pojawia się ta obserwacja", "Na czym to się opiera?", "Możliwe przykłady, nie twierdzenia o Twoim życiu", "W codzienności", "Co staje się widoczne", "Tutaj nikt nie decyduje za Ciebie."],
  el: ["Πίσω", "Συνέχεια", "Ακύρωση", "Δοκίμασε ξανά", "Από την αρχή", "Ναι, διαγραφή", "Ναι, διαγραφή όλων", "Διατήρηση", "Ανοιχτό", "προαιρετικό", "ευαίσθητο", "επιλεγμένο", "από", "έγκυρη επιλογή", "Πλοήγηση διαδρομής", "Ιδιωτικότητα", "Έκταση", "Για ποιον", "Εστίαση", "Κατεύθυνση", "Επίδραση", "Σημασία", "Βεβαιότητα", "Προσδοκία", "Συμβιβασμός", "Όριο", "Πρώτο βήμα", "Ερώτηση παρατήρησης", "Ερώτηση μάθησης", "Αναστρεψιμότητα", "Πιθανές διαδρομές", "Μικρά εργαλεία", "Σημερινές συνθήκες", "Σημερινή εμπειρία", "Επιθυμητή κατεύθυνση", "Τομείς ζωής", "Σχετικοί τομείς", "Προστατευμένες προτεραιότητες", "Πραγματικές συνθήκες", "Υποστηρικτικές συνθήκες", "Σήματα προέλευσης", "Δες τις απαντήσεις", "Δες την εικόνα", "Δες το τοπίο", "Επαναφόρτωση διαδρομής", "Στην αρχική", "Πώς λειτουργεί", "Πριν ξεκινήσεις", "Τι μπορείτε να μάθετε", "Πιθανή προσέγγιση", "Συγκεκριμένα σήματα", "Κοινή στάση", "Κοινό πλαίσιο σχέσης", "Τρεις οπτικές", "Τρεις αναστρέψιμες διερευνήσεις", "Ποιοτικά σήματα", "Ανιχνεύσιμες παρατηρήσεις", "Εργαλεία συζήτησης", "Ερωτήσεις για τη συνέχεια", "Έναρξη αναστοχασμού", "Έναρξη Life Vision", "Έναρξη με το Άτομο Α", "Σφράγιση και παράδοση", "Συναίνεση και σύγκριση", "Ιδιωτικό από τον σχεδιασμό", "Μόνο τοπικά", "Πρώτα ανεξάρτητα", "Ενεργή οπτική", "Απαντάς μόνο για εσένα", "Η άλλη οπτική", "Μία οπτική", "Μία κοινοποιημένη οπτική", "Δικός σου τομέας ζωής", "Συμπερίληψη στην εικόνα", "π.χ. πνευματικότητα", "Προστατευμένοι τομείς", "Πιθανώς ανταγωνιστικές κατευθύνσεις", "Σημερινές συνθήκες", "Πιθανό πρώτο βήμα", "Σχετικός συμβιβασμός", "Γιατί μπορεί να ταιριάζει", "Γιατί εμφανίζεται", "Σε τι βασίζεται;", "Πιθανά παραδείγματα, όχι ισχυρισμοί για τη ζωή σου", "Στην καθημερινότητα", "Τι γίνεται ορατό", "Εδώ δεν λαμβάνεται απόφαση για εσένα."],
  ru: ["Назад", "Продолжить", "Отмена", "Повторить", "Начать заново", "Да, удалить", "Да, удалить всё", "Сохранить", "Открыто", "необязательно", "чувствительная тема", "отмечено", "из", "допустимый выбор", "Навигационная цепочка", "Конфиденциальность", "Объём", "Для кого", "Фокус", "Направление", "Влияние", "Важность", "Уверенность", "Ожидание", "Компромисс", "Граница", "Первый шаг", "Вопрос для наблюдения", "Вопрос для обучения", "Обратимость", "Возможные пути", "Небольшие инструменты", "Нынешние условия", "Нынешний опыт", "Желаемое направление", "Сферы жизни", "Значимые сферы", "Защищаемые приоритеты", "Реальные условия", "Поддерживающие условия", "Сигналы происхождения", "Показать использованные ответы", "Показать обзор", "Показать ландшафт", "Перезагрузить путь", "На главную", "Как это работает", "Перед началом", "Что можно узнать", "Возможный подход", "Конкретные сигналы", "Общая позиция", "Общий контекст отношений", "Три перспективы", "Три обратимых исследования", "Качественные сигналы", "Прослеживаемые наблюдения", "Инструменты разговора", "Вопросы для дальнейшего пути", "Начать размышление", "Начать Life Vision", "Начать с Человека A", "Закрыть и передать", "Согласиться и сравнить", "Конфиденциальность по замыслу", "Только локально", "Сначала независимо", "Активная перспектива", "Вы отвечаете только за себя", "Другая перспектива", "Одна перспектива", "Одна открытая перспектива", "Своя сфера жизни", "Включить в обзор", "например, духовность", "Защищаемые сферы жизни", "Возможно конкурирующие направления", "Нынешние условия", "Возможный первый шаг", "Значимый компромисс", "Почему этот путь может подойти", "Почему появляется это наблюдение", "На чём это основано?", "Возможные примеры, а не утверждения о вашей жизни", "В повседневности", "Что становится видимым", "Здесь решение не принимают за вас."],
};

const shortMaps = Object.fromEntries(Object.entries(shortValues).map(([locale, values]) => [locale, Object.fromEntries(shortKeys.map((key, index) => [key, values[index]]))])) as Record<AddedLifeLocale, Record<string, string>>;

const explicitCopy: Record<AddedLifeLocale, Record<string, string>> = {
  es: { ...shortMaps.es, ...lifeAlignmentUiSelfCopy.es, ...partnerVisionLifeUiCopy.es, ...lifeVisionUiVisionCopy.es, ...lifeAlignmentUiEngineCopy.es },
  tr: { ...shortMaps.tr, ...lifeAlignmentUiSelfCopy.tr, ...partnerVisionLifeUiCopy.tr, ...lifeVisionUiVisionCopy.tr, ...lifeAlignmentUiEngineCopy.tr },
  pl: { ...shortMaps.pl, ...lifeAlignmentUiSelfCopy.pl, ...partnerVisionLifeUiCopy.pl, ...lifeVisionUiVisionCopy.pl, ...lifeAlignmentUiEngineCopy.pl },
  el: { ...shortMaps.el, ...lifeAlignmentUiSelfCopy.el, ...partnerVisionLifeUiCopy.el, ...lifeVisionUiVisionCopy.el, ...lifeAlignmentUiEngineCopy.el },
  ru: { ...shortMaps.ru, ...lifeAlignmentUiSelfCopy.ru, ...partnerVisionLifeUiCopy.ru, ...lifeVisionUiVisionCopy.ru, ...lifeAlignmentUiEngineCopy.ru },
};

export function hasExplicitLifeUiCopy(locale: AddedLifeLocale, source: string): boolean {
  return Object.hasOwn(explicitCopy[locale], source);
}

const sectionProgress: Record<Locale, (number: number, total: number) => string> = {
  de: (number, total) => `Abschnitt ${number} von ${total}`,
  en: (number, total) => `Section ${number} of ${total}`,
  es: (number, total) => `Sección ${number} de ${total}`,
  tr: (number, total) => `Bölüm ${number} / ${total}`,
  pl: (number, total) => `Sekcja ${number} z ${total}`,
  el: (number, total) => `Ενότητα ${number} από ${total}`,
  ru: (number, total) => `Раздел ${number} из ${total}`,
};

export function formatLifeSectionProgress(locale: Locale, number: number, total: number): string {
  return sectionProgress[locale](number, total);
}

const printCopy: Record<Locale, {
  selfTitle: string;
  partnerTitle: string;
  visionTitle: string;
  selfLandscape: string;
  visionLandscape: string;
  protectedSuffix: string;
}> = {
  de: { selfTitle: "Life Alignment – persönliche Momentaufnahme", partnerTitle: "Life Alignment – Partnervergleich", visionTitle: "Life Alignment – Lebensvision", selfLandscape: "Alignment-Landschaft", visionLandscape: "Landschaft der zukünftigen Richtung", protectedSuffix: " · geschützt" },
  en: { selfTitle: "Life Alignment – personal snapshot", partnerTitle: "Life Alignment – partner comparison", visionTitle: "Life Alignment – life vision", selfLandscape: "Alignment Landscape", visionLandscape: "Future Direction Landscape", protectedSuffix: " · protected" },
  es: { selfTitle: "Life Alignment – panorama personal", partnerTitle: "Life Alignment – comparación de pareja", visionTitle: "Life Alignment – visión de vida", selfLandscape: "Paisaje de alineación", visionLandscape: "Paisaje de dirección futura", protectedSuffix: " · protegido" },
  tr: { selfTitle: "Life Alignment – kişisel görünüm", partnerTitle: "Life Alignment – partner karşılaştırması", visionTitle: "Life Alignment – yaşam vizyonu", selfLandscape: "Uyum manzarası", visionLandscape: "Gelecek yönü manzarası", protectedSuffix: " · korunuyor" },
  pl: { selfTitle: "Life Alignment – osobisty obraz", partnerTitle: "Life Alignment – porównanie partnerskie", visionTitle: "Life Alignment – wizja życia", selfLandscape: "Krajobraz dopasowania", visionLandscape: "Krajobraz przyszłego kierunku", protectedSuffix: " · chronione" },
  el: { selfTitle: "Life Alignment – προσωπική εικόνα", partnerTitle: "Life Alignment – σύγκριση συντρόφων", visionTitle: "Life Alignment – όραμα ζωής", selfLandscape: "Τοπίο ευθυγράμμισης", visionLandscape: "Τοπίο μελλοντικής κατεύθυνσης", protectedSuffix: " · προστατευμένο" },
  ru: { selfTitle: "Life Alignment – личный обзор", partnerTitle: "Life Alignment – сравнение партнёров", visionTitle: "Life Alignment – видение жизни", selfLandscape: "Ландшафт согласованности", visionLandscape: "Ландшафт будущего направления", protectedSuffix: " · защищено" },
};

export function getLifePrintTitle(locale: Locale, kind: "self" | "partner" | "vision"): string {
  return printCopy[locale][`${kind}Title`];
}

export function getLifePrintLandscapeLabel(locale: Locale, kind: "self" | "vision"): string {
  return printCopy[locale][`${kind}Landscape`];
}

export function getLifeProtectedSuffix(locale: Locale): string {
  return printCopy[locale].protectedSuffix;
}

function translateString(locale: AddedLifeLocale, value: string): string {
  const exact = explicitCopy[locale][value];
  if (exact) return exact;
  throw new Error(`Missing explicit Life UI copy for ${locale}: ${JSON.stringify(value)}`);
}

export function lifeUiValue<T>(locale: Locale, englishValue: T, germanValue: T): T {
  const baseline: Partial<Record<Locale, T>> = { de: germanValue, en: englishValue };
  if (locale in baseline) return baseline[locale]!;
  const translate = (value: unknown): unknown => {
    if (typeof value === "string") return translateString(locale as AddedLifeLocale, value);
    if (Array.isArray(value)) return value.map(translate);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translate(item)]));
    }
    return value;
  };
  return translate(englishValue) as T;
}
