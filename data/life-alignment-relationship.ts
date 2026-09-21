import type { Locale } from "@/lib/i18n/config";
import type {
  LocalizedText,
  RelationshipDimensionDefinition,
  RelationshipModuleDefinition,
  RelationshipModuleId,
  RelationshipQuestionDefinition,
  RelationshipSectionDefinition,
} from "@/types/life-alignment-relationship";

const t = (de: string, en: string, es: string, tr: string, pl: string, el: string, ru: string): LocalizedText => ({ de, en, es, tr, pl, el, ru });

export function relationshipText(copy: LocalizedText, locale: Locale): string {
  return copy[locale];
}

type AxisId = "closeness" | "cadence" | "structure" | "pace" | "risk" | "depth" | "ownership" | "power" | "quality" | "support" | "change";

const axes: Record<AxisId, readonly [LocalizedText, LocalizedText]> = {
  closeness: [t("Mehr Eigenraum", "More individual space", "Más espacio propio", "Daha fazla kişisel alan", "Więcej własnej przestrzeni", "Περισσότερος προσωπικός χώρος", "Больше личного пространства"), t("Mehr Gemeinsamkeit", "More togetherness", "Más cercanía", "Daha fazla birliktelik", "Więcej wspólnoty", "Περισσότερη εγγύτητα", "Больше близости")],
  cadence: [t("Seltener und flexibel", "Less frequent and flexible", "Menos frecuente y flexible", "Daha seyrek ve esnek", "Rzadziej i elastycznie", "Πιο αραιά και ευέλικτα", "Реже и гибче"), t("Häufiger und regelmäßig", "More frequent and regular", "Más frecuente y regular", "Daha sık ve düzenli", "Częściej i regularnie", "Πιο συχνά και σταθερά", "Чаще и регулярнее")],
  structure: [t("Offen und flexibel", "Open and flexible", "Abierto y flexible", "Açık ve esnek", "Otwarcie i elastycznie", "Ανοιχτά και ευέλικτα", "Открыто и гибко"), t("Explizit und planbar", "Explicit and predictable", "Explícito y previsible", "Açık ve öngörülebilir", "Jawnie i przewidywalnie", "Ρητά και προβλέψιμα", "Явно и предсказуемо")],
  pace: [t("Bedacht und schrittweise", "Deliberate and gradual", "Pausado y gradual", "Düşünerek ve adım adım", "Rozważnie i stopniowo", "Με σκέψη και σταδιακά", "Обдуманно и постепенно"), t("Schnell und direkt", "Fast and direct", "Rápido y directo", "Hızlı ve doğrudan", "Szybko i bezpośrednio", "Γρήγορα και άμεσα", "Быстро и прямо")],
  risk: [t("Sicherheit zuerst", "Security first", "Primero la seguridad", "Önce güvenlik", "Najpierw bezpieczeństwo", "Πρώτα η ασφάλεια", "Сначала безопасность"), t("Chance zuerst", "Opportunity first", "Primero la oportunidad", "Önce fırsat", "Najpierw szansa", "Πρώτα η ευκαιρία", "Сначала возможность")],
  depth: [t("Leichter und situativ", "Lighter and situational", "Más ligero y situacional", "Daha hafif ve duruma göre", "Lżej i zależnie od sytuacji", "Πιο ανάλαφρα και ανάλογα", "Легче и по ситуации"), t("Tiefer und persönlicher", "Deeper and more personal", "Más profundo y personal", "Daha derin ve kişisel", "Głębiej i bardziej osobiście", "Πιο βαθιά και προσωπικά", "Глубже и личнее")],
  ownership: [t("Geteilte Verantwortung", "Shared ownership", "Responsabilidad compartida", "Paylaşılan sorumluluk", "Wspólna odpowiedzialność", "Κοινή ευθύνη", "Общая ответственность"), t("Klare Einzelverantwortung", "Clear individual ownership", "Responsabilidad individual clara", "Net bireysel sorumluluk", "Jasna odpowiedzialność indywidualna", "Σαφής ατομική ευθύνη", "Чёткая личная ответственность")],
  power: [t("Gemeinsam entscheiden", "Decide together", "Decidir juntos", "Birlikte karar vermek", "Decydować wspólnie", "Απόφαση μαζί", "Решать вместе"), t("Klare Entscheidungsrolle", "Clear decision owner", "Responsable claro de decisión", "Net karar sahibi", "Jasny właściciel decyzji", "Σαφής υπεύθυνος απόφασης", "Чёткий ответственный за решение")],
  quality: [t("Geschwindigkeit priorisieren", "Prioritise speed", "Priorizar velocidad", "Hıza öncelik vermek", "Priorytet szybkości", "Προτεραιότητα στην ταχύτητα", "Приоритет скорости"), t("Qualität priorisieren", "Prioritise quality", "Priorizar calidad", "Kaliteye öncelik vermek", "Priorytet jakości", "Προτεραιότητα στην ποιότητα", "Приоритет качества")],
  support: [t("Raum geben", "Give space", "Dar espacio", "Alan tanımak", "Dać przestrzeń", "Να δίνω χώρο", "Давать пространство"), t("Aktiv unterstützen", "Offer active support", "Apoyar activamente", "Aktif destek sunmak", "Aktywnie wspierać", "Ενεργή υποστήριξη", "Активно поддерживать")],
  change: [t("Stabilität bewahren", "Protect stability", "Proteger la estabilidad", "İstikrarı korumak", "Chronić stabilność", "Προστασία σταθερότητας", "Сохранять стабильность"), t("Veränderung gestalten", "Shape change", "Impulsar el cambio", "Değişimi şekillendirmek", "Kształtować zmianę", "Διαμόρφωση αλλαγής", "Формировать изменения")],
};

const sectionDescription = (title: LocalizedText): LocalizedText => ({
  de: `${title.de} bewusst und ohne richtige Antwort erkunden.`, en: `Explore ${title.en.toLowerCase()} without a single right answer.`,
  es: `Explorar ${title.es.toLowerCase()} sin una única respuesta correcta.`, tr: `${title.tr.toLocaleLowerCase("tr")} konusunu tek bir doğru aramadan keşfet.`,
  pl: `Przyjrzyj się: ${title.pl.toLowerCase()} — bez jednej poprawnej odpowiedzi.`, el: `Διερεύνησε: ${title.el.toLowerCase()} χωρίς μία σωστή απάντηση.`,
  ru: `Исследуйте: ${title.ru.toLowerCase()} — без единственно верного ответа.`,
});

const section = (id: string, title: LocalizedText): RelationshipSectionDefinition => ({ id, title, description: sectionDescription(title) });
type DimensionSeed = readonly [sectionId: string, id: string, title: LocalizedText, axis: AxisId, complementary?: boolean];

const questionPrompt = (title: LocalizedText): LocalizedText => ({
  de: `Welche Ausrichtung passt für dich bei „${title.de}“ eher?`, en: `Which direction fits you better for “${title.en}”?`,
  es: `¿Qué orientación encaja mejor contigo en «${title.es}»?`, tr: `“${title.tr}” konusunda hangi yönelim sana daha uygun?`,
  pl: `Które podejście lepiej Ci odpowiada w obszarze „${title.pl}”?`, el: `Ποια κατεύθυνση σου ταιριάζει περισσότερο στο «${title.el}»;`,
  ru: `Какой подход вам ближе в теме «${title.ru}»?`,
});

const scenarioPrompt = (title: LocalizedText): LocalizedText => ({
  de: `Wenn „${title.de}“ unter Druck gerät: Zu welcher Seite würdest du eher tendieren?`, en: `If “${title.en}” came under pressure, which side would you lean toward?`,
  es: `Si «${title.es}» estuviera bajo presión, ¿hacia qué lado tenderías?`, tr: `“${title.tr}” baskı altına girse hangi tarafa yönelirdin?`,
  pl: `Gdy obszar „${title.pl}” znajdzie się pod presją, ku której stronie się skłonisz?`, el: `Αν το «${title.el}» πιεστεί, προς ποια πλευρά θα έκλινες;`,
  ru: `Если тема «${title.ru}» окажется под давлением, к какой стороне вы склонитесь?`,
});

function buildParts(seeds: readonly DimensionSeed[], sections: readonly RelationshipSectionDefinition[], extraCrisis = false) {
  const dimensions: RelationshipDimensionDefinition[] = seeds.map(([sectionId, id, title]) => ({ id, sectionId, title, description: questionPrompt(title) }));
  const questions: RelationshipQuestionDefinition[] = seeds.map(([sectionId, id, title, axis, complementary], index) => ({
    id: `${id}-position`, sectionId, dimensionId: id,
    kind: (["preference", "expectation", "tradeoff", "priority"] as const)[index % 4], prompt: questionPrompt(title),
    leftLabel: axes[axis][0], rightLabel: axes[axis][1], complementary,
  }));
  for (const item of sections) {
    const matches = seeds.filter(([sectionId]) => sectionId === item.id);
    const seed = matches[0];
    if (!seed) continue;
    const [, id, title, axis, complementary] = seed;
    questions.push({ id: `${item.id}-scenario`, sectionId: item.id, dimensionId: id, kind: "scenario", prompt: scenarioPrompt(title), leftLabel: axes[axis][0], rightLabel: axes[axis][1], complementary, optional: true });
    if (extraCrisis && item.id === "crisis") {
      for (const additional of matches.slice(1)) {
        const [, crisisId, crisisTitle, crisisAxis, crisisComplementary] = additional;
        questions.push({ id: `${crisisId}-scenario`, sectionId: item.id, dimensionId: crisisId, kind: "scenario", prompt: scenarioPrompt(crisisTitle), leftLabel: axes[crisisAxis][0], rightLabel: axes[crisisAxis][1], complementary: crisisComplementary, optional: true });
      }
    }
  }
  return { dimensions, questions } as const;
}

const partnerSections = [
  section("connection", t("Verbindung und Nähe", "Connection and closeness", "Conexión y cercanía", "Bağ ve yakınlık", "Więź i bliskość", "Σύνδεση και εγγύτητα", "Связь и близость")),
  section("communication", t("Kommunikation und Konflikt", "Communication and conflict", "Comunicación y conflicto", "İletişim ve çatışma", "Komunikacja i konflikt", "Επικοινωνία και σύγκρουση", "Общение и конфликт")),
  section("everyday", t("Alltag und Verantwortung", "Everyday life and responsibility", "Vida cotidiana y responsabilidad", "Günlük yaşam ve sorumluluk", "Codzienność i odpowiedzialność", "Καθημερινότητα και ευθύνη", "Повседневность и ответственность")),
  section("future", t("Zukunft und Lebensstil", "Future and lifestyle", "Futuro y estilo de vida", "Gelecek ve yaşam tarzı", "Przyszłość i styl życia", "Μέλλον και τρόπος ζωής", "Будущее и образ жизни")),
  section("trust", t("Vertrauen und Grenzen", "Trust and boundaries", "Confianza y límites", "Güven ve sınırlar", "Zaufanie i granice", "Εμπιστοσύνη και όρια", "Доверие и границы")),
  section("growth", t("Wachstum und Veränderung", "Growth and change", "Crecimiento y cambio", "Gelişim ve değişim", "Rozwój i zmiana", "Ανάπτυξη και αλλαγή", "Рост и изменения")),
] as const;
const partnerSeeds: readonly DimensionSeed[] = [
  ["connection", "emotional-connection", t("Emotionale Verbindung", "Emotional connection", "Conexión emocional", "Duygusal bağ", "Więź emocjonalna", "Συναισθηματική σύνδεση", "Эмоциональная связь"), "depth"],
  ["connection", "closeness-autonomy", t("Nähe und Eigenraum", "Closeness and autonomy", "Cercanía y autonomía", "Yakınlık ve özerklik", "Bliskość i autonomia", "Εγγύτητα και αυτονομία", "Близость и автономия"), "closeness", true],
  ["connection", "time-attention", t("Zeit und Aufmerksamkeit", "Time and attention", "Tiempo y atención", "Zaman ve ilgi", "Czas i uwaga", "Χρόνος και προσοχή", "Время и внимание"), "cadence"],
  ["communication", "communication", t("Kommunikation", "Communication", "Comunicación", "İletişim", "Komunikacja", "Επικοινωνία", "Общение"), "depth"],
  ["communication", "conflict", t("Umgang mit Konflikten", "Approach to conflict", "Manejo del conflicto", "Çatışma yaklaşımı", "Podejście do konfliktu", "Διαχείριση σύγκρουσης", "Подход к конфликтам"), "pace"],
  ["everyday", "responsibility", t("Alltagsverantwortung", "Everyday responsibility", "Responsabilidad cotidiana", "Günlük sorumluluk", "Codzienna odpowiedzialność", "Καθημερινή ευθύνη", "Повседневная ответственность"), "ownership", true],
  ["everyday", "support", t("Unterstützung", "Support", "Apoyo", "Destek", "Wsparcie", "Υποστήριξη", "Поддержка"), "support", true],
  ["future", "future-expectations", t("Zukunftserwartungen", "Future expectations", "Expectativas de futuro", "Gelecek beklentileri", "Oczekiwania wobec przyszłości", "Προσδοκίες για το μέλλον", "Ожидания от будущего"), "structure"],
  ["future", "money-lifestyle", t("Geld und Lebensstil", "Money and lifestyle", "Dinero y estilo de vida", "Para ve yaşam tarzı", "Pieniądze i styl życia", "Χρήματα και τρόπος ζωής", "Деньги и образ жизни"), "risk"],
  ["trust", "trust-safety", t("Vertrauen und Sicherheit", "Trust and safety", "Confianza y seguridad", "Güven ve emniyet", "Zaufanie i bezpieczeństwo", "Εμπιστοσύνη και ασφάλεια", "Доверие и безопасность"), "structure"],
  ["trust", "boundaries", t("Persönliche Grenzen", "Personal boundaries", "Límites personales", "Kişisel sınırlar", "Granice osobiste", "Προσωπικά όρια", "Личные границы"), "structure"],
  ["growth", "growth-change", t("Wachstum und Veränderung", "Growth and change", "Crecimiento y cambio", "Gelişim ve değişim", "Rozwój i zmiana", "Ανάπτυξη και αλλαγή", "Рост и изменения"), "change", true],
];

const friendshipSections = [
  section("contact", t("Kontakt und Nähe", "Contact and closeness", "Contacto y cercanía", "İletişim ve yakınlık", "Kontakt i bliskość", "Επαφή και εγγύτητα", "Контакт и близость")),
  section("reciprocity", t("Initiative und Verlässlichkeit", "Initiative and reliability", "Iniciativa y fiabilidad", "İnisiyatif ve güvenilirlik", "Inicjatywa i niezawodność", "Πρωτοβουλία και αξιοπιστία", "Инициатива и надёжность")),
  section("support", t("Unterstützung und Grenzen", "Support and boundaries", "Apoyo y límites", "Destek ve sınırlar", "Wsparcie i granice", "Υποστήριξη και όρια", "Поддержка и границы")),
  section("conflict", t("Konflikt und Erwartungen", "Conflict and expectations", "Conflicto y expectativas", "Çatışma ve beklentiler", "Konflikt i oczekiwania", "Σύγκρουση και προσδοκίες", "Конфликт и ожидания")),
  section("change", t("Lebensphasen und Distanz", "Life phases and distance", "Etapas vitales y distancia", "Yaşam evreleri ve mesafe", "Etapy życia i dystans", "Φάσεις ζωής και απόσταση", "Этапы жизни и дистанция")),
] as const;
const friendshipSeeds: readonly DimensionSeed[] = [
  ["contact", "contact-frequency", t("Kontakthäufigkeit", "Contact frequency", "Frecuencia de contacto", "İletişim sıklığı", "Częstotliwość kontaktu", "Συχνότητα επαφής", "Частота общения"), "cadence"],
  ["contact", "depth-lightness", t("Tiefe und Leichtigkeit", "Depth and lightness", "Profundidad y ligereza", "Derinlik ve hafiflik", "Głębia i lekkość", "Βάθος και ελαφρότητα", "Глубина и лёгкость"), "depth", true],
  ["contact", "shared-activities", t("Gemeinsame Aktivitäten", "Shared activities", "Actividades compartidas", "Ortak etkinlikler", "Wspólne aktywności", "Κοινές δραστηριότητες", "Совместные занятия"), "cadence"],
  ["reciprocity", "initiative", t("Initiative", "Initiative", "Iniciativa", "İnisiyatif", "Inicjatywa", "Πρωτοβουλία", "Инициатива"), "ownership", true],
  ["reciprocity", "reliability", t("Verlässlichkeit", "Reliability", "Fiabilidad", "Güvenilirlik", "Niezawodność", "Αξιοπιστία", "Надёжность"), "structure"],
  ["support", "support-style", t("Art der Unterstützung", "Support style", "Forma de apoyo", "Destek biçimi", "Sposób wsparcia", "Τρόπος υποστήριξης", "Стиль поддержки"), "support", true],
  ["support", "availability", t("Erreichbarkeit", "Availability", "Disponibilidad", "Ulaşılabilirlik", "Dostępność", "Διαθεσιμότητα", "Доступность"), "cadence"],
  ["support", "boundaries", t("Grenzen", "Boundaries", "Límites", "Sınırlar", "Granice", "Όρια", "Границы"), "structure"],
  ["conflict", "conflict-repair", t("Konflikt und Klärung", "Conflict and repair", "Conflicto y reparación", "Çatışma ve onarım", "Konflikt i naprawa", "Σύγκρουση και αποκατάσταση", "Конфликт и восстановление"), "pace"],
  ["conflict", "friendship-expectations", t("Freundschaftserwartungen", "Friendship expectations", "Expectativas de amistad", "Arkadaşlık beklentileri", "Oczekiwania wobec przyjaźni", "Προσδοκίες φιλίας", "Ожидания от дружбы"), "structure"],
  ["change", "life-phase-distance", t("Lebensphasen und Distanz", "Life phases and distance", "Etapas vitales y distancia", "Yaşam evreleri ve mesafe", "Etapy życia i dystans", "Φάσεις ζωής και απόσταση", "Этапы жизни и дистанция"), "change", true],
];

const founderSections = [
  section("human", t("Menschliche Zusammenarbeit", "Human fit", "Encaje humano", "İnsani uyum", "Dopasowanie ludzkie", "Ανθρώπινη συνεργασία", "Человеческое взаимодействие")),
  section("vision", t("Vision", "Vision fit", "Visión", "Vizyon uyumu", "Wizja", "Κοινό όραμα", "Совпадение видения")),
  section("business", t("Geschäftserwartungen", "Business fit", "Encaje empresarial", "İş uyumu", "Dopasowanie biznesowe", "Επιχειρηματική σύμπλευση", "Деловые ожидания")),
  section("working", t("Arbeitsweise", "Working fit", "Forma de trabajar", "Çalışma uyumu", "Sposób pracy", "Τρόπος εργασίας", "Рабочий стиль")),
  section("capability", t("Fähigkeiten und Verantwortung", "Capability fit", "Capacidades y responsabilidad", "Yetkinlik uyumu", "Kompetencje i odpowiedzialność", "Ικανότητες και ευθύνη", "Компетенции и ответственность")),
  section("governance", t("Macht und Governance", "Power and governance", "Poder y gobernanza", "Güç ve yönetişim", "Władza i ład", "Ισχύς και διακυβέρνηση", "Власть и управление")),
  section("crisis", t("Krisen", "Crisis fit", "Crisis", "Kriz uyumu", "Sytuacje kryzysowe", "Διαχείριση κρίσης", "Кризисные ситуации")),
] as const;
const founderSeeds: readonly DimensionSeed[] = [
  ["human", "founder-communication", t("Kommunikation", "Communication", "Comunicación", "İletişim", "Komunikacja", "Επικοινωνία", "Общение"), "depth"],
  ["human", "founder-feedback", t("Feedback und Konflikt", "Feedback and conflict", "Feedback y conflicto", "Geri bildirim ve çatışma", "Informacja zwrotna i konflikt", "Ανατροφοδότηση και σύγκρουση", "Обратная связь и конфликт"), "pace"],
  ["human", "founder-accountability", t("Vertrauen und Verantwortlichkeit", "Trust and accountability", "Confianza y responsabilidad", "Güven ve hesap verebilirlik", "Zaufanie i odpowiedzialność", "Εμπιστοσύνη και λογοδοσία", "Доверие и ответственность"), "structure"],
  ["vision", "founder-ambition", t("Ambition und Wachstum", "Ambition and growth", "Ambición y crecimiento", "Hırs ve büyüme", "Ambicja i wzrost", "Φιλοδοξία και ανάπτυξη", "Амбиции и рост"), "risk"],
  ["vision", "founder-horizon", t("Zeithorizont und Exit", "Time horizon and exit", "Horizonte temporal y salida", "Zaman ufku ve çıkış", "Horyzont i wyjście", "Χρονικός ορίζοντας και έξοδος", "Горизонт и выход"), "structure"],
  ["vision", "founder-philosophy", t("Produkt- und Kundenphilosophie", "Product and customer philosophy", "Filosofía de producto y cliente", "Ürün ve müşteri felsefesi", "Filozofia produktu i klienta", "Φιλοσοφία προϊόντος και πελάτη", "Философия продукта и клиента"), "quality"],
  ["business", "founder-capital", t("Kapital und Risiko", "Capital and risk", "Capital y riesgo", "Sermaye ve risk", "Kapitał i ryzyko", "Κεφάλαιο και ρίσκο", "Капитал и риск"), "risk"],
  ["business", "founder-revenue-growth", t("Umsatz und Wachstum", "Revenue and growth", "Ingresos y crecimiento", "Gelir ve büyüme", "Przychody i wzrost", "Έσοδα και ανάπτυξη", "Выручка и рост"), "risk"],
  ["business", "founder-compensation", t("Gehalt und Equity-Erwartungen", "Salary and equity expectations", "Expectativas salariales y de capital", "Maaş ve hisse beklentileri", "Oczekiwania płacowe i udziałowe", "Προσδοκίες αμοιβής και μετοχών", "Ожидания по зарплате и долям"), "structure"],
  ["working", "founder-availability", t("Zeit und Verfügbarkeit", "Time and availability", "Tiempo y disponibilidad", "Zaman ve uygunluk", "Czas i dostępność", "Χρόνος και διαθεσιμότητα", "Время и доступность"), "cadence"],
  ["working", "founder-documentation", t("Dokumentation und Meetings", "Documentation and meetings", "Documentación y reuniones", "Dokümantasyon ve toplantılar", "Dokumentacja i spotkania", "Τεκμηρίωση και συναντήσεις", "Документация и встречи"), "structure"],
  ["working", "founder-execution", t("Autonomie und Ausführung", "Autonomy and execution", "Autonomía y ejecución", "Özerklik ve uygulama", "Autonomia i wykonanie", "Αυτονομία και εκτέλεση", "Автономия и исполнение"), "pace", true],
  ["capability", "founder-product-technical", t("Produkt, Technik und Design", "Product, engineering and design", "Producto, ingeniería y diseño", "Ürün, mühendislik ve tasarım", "Produkt, inżynieria i projektowanie", "Προϊόν, μηχανική και σχεδιασμός", "Продукт, инженерия и дизайн"), "ownership", true],
  ["capability", "founder-commercial", t("Sales, Finance und Operations", "Sales, finance and operations", "Ventas, finanzas y operaciones", "Satış, finans ve operasyon", "Sprzedaż, finanse i operacje", "Πωλήσεις, οικονομικά και λειτουργίες", "Продажи, финансы и операции"), "ownership", true],
  ["capability", "founder-people-strategy", t("People und Strategie", "People and strategy", "Personas y estrategia", "İnsan ve strateji", "Ludzie i strategia", "Άνθρωποι και στρατηγική", "Люди и стратегия"), "ownership", true],
  ["governance", "founder-decisions", t("Entscheidungsrechte", "Decision rights", "Derechos de decisión", "Karar hakları", "Prawa decyzyjne", "Δικαιώματα απόφασης", "Права принятия решений"), "power"],
  ["governance", "founder-leadership", t("Führung und Rollen", "Leadership and roles", "Liderazgo y roles", "Liderlik ve roller", "Przywództwo i role", "Ηγεσία και ρόλοι", "Лидерство и роли"), "ownership"],
  ["governance", "founder-influence", t("Investoren und künftige Einstellungen", "Investors and future hiring", "Inversores y futuras contrataciones", "Yatırımcılar ve gelecekteki işe alımlar", "Inwestorzy i przyszłe zatrudnienie", "Επενδυτές και μελλοντικές προσλήψεις", "Инвесторы и будущий найм"), "power"],
  ["crisis", "founder-runway", t("Kurze Runway", "Short runway", "Poca liquidez", "Kısa nakit süresi", "Krótki runway", "Περιορισμένο ταμειακό περιθώριο", "Короткий запас средств"), "risk"],
  ["crisis", "founder-traction-pivot", t("Fehlende Traktion und Pivot", "Low traction and pivot", "Poca tracción y giro", "Düşük çekiş ve yön değiştirme", "Brak trakcji i pivot", "Χαμηλή απήχηση και αλλαγή πορείας", "Низкая тяга и поворот"), "change"],
  ["crisis", "founder-crisis-quality", t("Kundenkrise: Tempo und Qualität", "Customer crisis: speed and quality", "Crisis de cliente: velocidad y calidad", "Müşteri krizi: hız ve kalite", "Kryzys klienta: szybkość i jakość", "Κρίση πελάτη: ταχύτητα και ποιότητα", "Кризис клиента: скорость и качество"), "quality", true],
];

const partnerParts = buildParts(partnerSeeds, partnerSections);
const friendshipParts = buildParts(friendshipSeeds, friendshipSections);
const founderParts = buildParts(founderSeeds, founderSections, true);

export const relationshipModules: Readonly<Record<RelationshipModuleId, RelationshipModuleDefinition>> = {
  partner: { id: "partner", version: "partner-v1.1", questionSetVersion: "partner-questions-v1.1", interpretationVersion: "relationship-engine-v1.1", title: t("Partner Alignment", "Partner Alignment", "Alineación de pareja", "Partner Uyumu", "Partner Alignment", "Ευθυγράμμιση συντρόφων", "Согласование партнёров"), shortDescription: t("Bedürfnisse, Erwartungen und Grenzen verstehen, ohne eure Beziehung zu bewerten.", "Understand needs, expectations and boundaries without judging your relationship.", "Comprender necesidades, expectativas y límites sin juzgar la relación.", "İlişkinizi yargılamadan ihtiyaçları, beklentileri ve sınırları anlayın.", "Zrozum potrzeby, oczekiwania i granice bez oceniania relacji.", "Κατανόηση αναγκών, προσδοκιών και ορίων χωρίς αξιολόγηση της σχέσης.", "Понять потребности, ожидания и границы без оценки отношений."), sections: partnerSections, ...partnerParts },
  friendship: { id: "friendship", version: "friendship-v1.1", questionSetVersion: "friendship-questions-v1.1", interpretationVersion: "relationship-engine-v1.1", title: t("Friendship Alignment", "Friendship Alignment", "Alineación de amistad", "Arkadaşlık Uyumu", "Friendship Alignment", "Ευθυγράμμιση φιλίας", "Согласование дружбы"), shortDescription: t("Unsichtbare Erwartungen an Kontakt, Unterstützung und Verlässlichkeit sichtbar machen.", "Make invisible expectations around contact, support and reliability visible.", "Hacer visibles expectativas sobre contacto, apoyo y fiabilidad.", "İletişim, destek ve güvenilirliğe dair görünmeyen beklentileri görünür kılın.", "Uwidocznij oczekiwania dotyczące kontaktu, wsparcia i niezawodności.", "Κάνε ορατές τις προσδοκίες για επαφή, στήριξη και αξιοπιστία.", "Сделать видимыми ожидания о контакте, поддержке и надёжности."), sections: friendshipSections, ...friendshipParts },
  founder: { id: "founder", version: "founder-v1.1", questionSetVersion: "founder-questions-v1.1", interpretationVersion: "relationship-engine-v1.1", title: t("Founder Alignment", "Founder Alignment", "Alineación de fundadores", "Kurucu Uyumu", "Founder Alignment", "Ευθυγράμμιση ιδρυτών", "Согласование основателей"), shortDescription: t("Menschliche, strategische, operative und Governance-Erwartungen vor schwierigen Entscheidungen klären.", "Clarify human, strategic, operating and governance expectations before difficult decisions.", "Aclarar expectativas humanas, estratégicas, operativas y de gobierno antes de decisiones difíciles.", "Zor kararlardan önce insani, stratejik, operasyonel ve yönetişim beklentilerini netleştirin.", "Wyjaśnij oczekiwania ludzkie, strategiczne, operacyjne i zarządcze przed trudnymi decyzjami.", "Διευκρίνισε ανθρώπινες, στρατηγικές, λειτουργικές και διοικητικές προσδοκίες πριν από δύσκολες αποφάσεις.", "Прояснить человеческие, стратегические, операционные и управленческие ожидания до сложных решений."), sections: founderSections, ...founderParts },
};

export const relationshipModuleIds = Object.keys(relationshipModules) as RelationshipModuleId[];

export function isRelationshipModuleId(value: unknown): value is RelationshipModuleId {
  return typeof value === "string" && relationshipModuleIds.includes(value as RelationshipModuleId);
}

export function getRelationshipModule(moduleId: RelationshipModuleId): RelationshipModuleDefinition {
  return relationshipModules[moduleId];
}

export function assertRelationshipModuleCompleteness(): void {
  const locales: Locale[] = ["de", "en", "es", "tr", "pl", "el", "ru"];
  for (const definition of Object.values(relationshipModules)) {
    const sectionIds = new Set(definition.sections.map(({ id }) => id));
    const dimensionIds = new Set(definition.dimensions.map(({ id }) => id));
    if (sectionIds.size !== definition.sections.length || dimensionIds.size !== definition.dimensions.length) throw new Error(`${definition.id}: duplicate stable id`);
    if (new Set(definition.questions.map(({ id }) => id)).size !== definition.questions.length) throw new Error(`${definition.id}: duplicate question id`);
    for (const question of definition.questions) {
      if (!sectionIds.has(question.sectionId) || !dimensionIds.has(question.dimensionId)) throw new Error(`${definition.id}: orphan question ${question.id}`);
    }
    for (const copy of [definition.title, definition.shortDescription, ...definition.sections.flatMap(({ title, description }) => [title, description]), ...definition.dimensions.flatMap(({ title, description }) => [title, description]), ...definition.questions.flatMap(({ prompt, leftLabel, rightLabel }) => [prompt, leftLabel, rightLabel])]) {
      for (const locale of locales) if (!copy[locale]?.trim()) throw new Error(`${definition.id}: missing ${locale} copy`);
    }
  }
}
