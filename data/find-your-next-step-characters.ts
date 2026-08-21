import type { Locale } from "@/lib/i18n/config";
import type { FynsFigureRepresentation } from "@/data/find-your-next-step-figures";

export const fynsCharacterIds = [
  "explorer",
  "builder",
  "connector",
  "independent",
  "thinker",
  "stabilizer",
  "challenger",
  "caregiver",
  "creator",
  "organizer",
  "harmonizer",
  "achiever",
] as const;

export type FynsCharacterId = (typeof fynsCharacterIds)[number];

export interface FynsCharacterDefinition {
  id: FynsCharacterId;
  name: string;
  subtitle: string;
}

export const fynsCharacterRegistry: readonly FynsCharacterDefinition[] = [
  { id: "explorer", name: "Explorer", subtitle: "Neugier & Entdeckung" },
  { id: "builder", name: "Builder", subtitle: "Gestaltung & Umsetzung" },
  { id: "connector", name: "Connector", subtitle: "Verbindung & Zugehörigkeit" },
  { id: "independent", name: "Independent", subtitle: "Autonomie" },
  { id: "thinker", name: "Thinker", subtitle: "Tiefe & Verständnis" },
  { id: "stabilizer", name: "Stabilizer", subtitle: "Sicherheit & Beständigkeit" },
  { id: "challenger", name: "Challenger", subtitle: "Herausforderung & Entwicklung" },
  { id: "caregiver", name: "Caregiver", subtitle: "Fürsorge & Beitrag" },
  { id: "creator", name: "Creator", subtitle: "Ausdruck & Originalität" },
  { id: "organizer", name: "Organizer", subtitle: "Struktur & Klarheit" },
  { id: "harmonizer", name: "Harmonizer", subtitle: "Balance & gutes Miteinander" },
  { id: "achiever", name: "Achiever", subtitle: "Fortschritt & Wirksamkeit" },
] as const;

const subtitles: Record<Exclude<Locale, "de">, Record<FynsCharacterId, string>> = {
  en: {
    explorer: "Curiosity & discovery", builder: "Shaping & implementation", connector: "Connection & belonging",
    independent: "Autonomy", thinker: "Depth & understanding", stabilizer: "Security & steadiness",
    challenger: "Challenge & development", caregiver: "Care & contribution", creator: "Expression & originality",
    organizer: "Structure & clarity", harmonizer: "Balance & good collaboration", achiever: "Progress & effectiveness",
  },
  es: {
    explorer: "Curiosidad y descubrimiento", builder: "Diseño y ejecución", connector: "Conexión y pertenencia",
    independent: "Autonomía", thinker: "Profundidad y comprensión", stabilizer: "Seguridad y constancia",
    challenger: "Reto y desarrollo", caregiver: "Cuidado y contribución", creator: "Expresión y originalidad",
    organizer: "Estructura y claridad", harmonizer: "Equilibrio y buena convivencia", achiever: "Progreso y eficacia",
  },
  tr: {
    explorer: "Merak ve keşif", builder: "Şekillendirme ve uygulama", connector: "Bağ ve aidiyet",
    independent: "Özerklik", thinker: "Derinlik ve anlayış", stabilizer: "Güven ve istikrar",
    challenger: "Zorluk ve gelişim", caregiver: "Özen ve katkı", creator: "İfade ve özgünlük",
    organizer: "Yapı ve açıklık", harmonizer: "Denge ve iyi iş birliği", achiever: "İlerleme ve etkililik",
  },
  pl: {
    explorer: "Ciekawość i odkrywanie", builder: "Kształtowanie i realizacja", connector: "Więź i przynależność",
    independent: "Autonomia", thinker: "Głębia i zrozumienie", stabilizer: "Bezpieczeństwo i stałość",
    challenger: "Wyzwanie i rozwój", caregiver: "Troska i wkład", creator: "Ekspresja i oryginalność",
    organizer: "Struktura i jasność", harmonizer: "Równowaga i dobre współdziałanie", achiever: "Postęp i skuteczność",
  },
  el: {
    explorer: "Περιέργεια και ανακάλυψη", builder: "Διαμόρφωση και υλοποίηση", connector: "Σύνδεση και αίσθημα του ανήκειν",
    independent: "Αυτονομία", thinker: "Βάθος και κατανόηση", stabilizer: "Ασφάλεια και σταθερότητα",
    challenger: "Πρόκληση και εξέλιξη", caregiver: "Φροντίδα και συνεισφορά", creator: "Έκφραση και πρωτοτυπία",
    organizer: "Δομή και σαφήνεια", harmonizer: "Ισορροπία και καλή συνεργασία", achiever: "Πρόοδος και αποτελεσματικότητα",
  },
  ru: {
    explorer: "Любознательность и открытие", builder: "Создание и воплощение", connector: "Связь и принадлежность",
    independent: "Автономия", thinker: "Глубина и понимание", stabilizer: "Безопасность и устойчивость",
    challenger: "Вызов и развитие", caregiver: "Забота и вклад", creator: "Самовыражение и оригинальность",
    organizer: "Структура и ясность", harmonizer: "Баланс и хорошее взаимодействие", achiever: "Прогресс и результативность",
  },
};

const registryById = new Map(fynsCharacterRegistry.map((character) => [character.id, character]));

export function getFynsCharacter(id: FynsCharacterId, locale: Locale): FynsCharacterDefinition {
  const definition = registryById.get(id);
  if (!definition) throw new Error(`Unknown FYNS character: ${id}`);
  return locale === "de" ? definition : { ...definition, subtitle: subtitles[locale][id] };
}

export type FynsCharacterArtworkSet = Readonly<Record<FynsFigureRepresentation, string>>;

const artwork = (id: FynsCharacterId): FynsCharacterArtworkSet => ({
  neutral: `/images/find-your-next-step/characters/v1/${id}-nonbinary.png`,
  masculine: `/images/find-your-next-step/characters/v1/${id}-masculine.png`,
  feminine: `/images/find-your-next-step/characters/v1/${id}-feminine.png`,
});

// Human-accepted V1 compromise assets. Character and representation IDs are
// language-neutral; Context Scene people remain a separate asset family.
export const fynsCharacterArtworkRegistry: Readonly<Record<FynsCharacterId, FynsCharacterArtworkSet>> = {
  explorer: artwork("explorer"),
  builder: artwork("builder"),
  connector: artwork("connector"),
  independent: artwork("independent"),
  thinker: artwork("thinker"),
  stabilizer: artwork("stabilizer"),
  challenger: artwork("challenger"),
  caregiver: artwork("caregiver"),
  creator: artwork("creator"),
  organizer: artwork("organizer"),
  harmonizer: artwork("harmonizer"),
  achiever: artwork("achiever"),
};

export function getFynsCharacterArtwork(
  id: FynsCharacterId,
  representation: FynsFigureRepresentation,
): string {
  return fynsCharacterArtworkRegistry[id][representation];
}

export type FynsCharacterConstellationCopy = {
  eyebrow: string;
  dominant: string;
  supporting: string;
  why: string;
  contribution: string;
  conditions: string;
  needs: string;
  notice: string;
  combination: string;
  evidence: string;
  interpretation: string;
  possibility: string;
  synthesis: string;
  tensions: string;
  application: string;
  environments: string;
  energy: string;
  friction: string;
  reflection: string;
  experiment: string;
  artworkUnavailable: string;
  currentFacet: (name: string) => string;
  evidenceMeaning: (answers: readonly string[], meaning: string, contextual: boolean) => string;
  synthesisLead: (dominant: string, supporting: readonly string[]) => string;
  tensionFrame: (text: string) => string;
  facetReflection: (evidence: string) => string;
  facetExperiment: (evidence: string) => string;
};

export const fynsCharacterConstellationCopy: Record<Locale, FynsCharacterConstellationCopy> = {
  de: {
    eyebrow: "Deine aktuelle Character Constellation", dominant: "Aktuell am sichtbarsten", supporting: "Unterstützende Facetten",
    why: "Warum sichtbar", contribution: "Was sie beiträgt", conditions: "Welche Bedingungen helfen", needs: "Was sie praktisch braucht", notice: "Worauf du achten kannst",
    combination: "Was in der Kombination sichtbar wird", evidence: "Evidenz", interpretation: "Einordnung", possibility: "Mögliche Lesart",
    synthesis: "Deine Konstellation im Zusammenhang", tensions: "Mögliche Dynamiken", application: "Damit weiterarbeiten",
    environments: "Passende Situationen", energy: "Mögliche Energiequelle", friction: "Mögliche Reibung", reflection: "Reflexionsfrage", experiment: "Kleines Experiment",
    artworkUnavailable: "Die akzeptierten Character-Artworks liegen in diesem Projekt noch nicht vor. Die Darstellungswahl ist deshalb in dieser lokalen Review-Ansicht deaktiviert.",
    currentFacet: (name) => `${name} ist in dieser Momentaufnahme die sichtbarste Facette — keine feste Identität.`,
    evidenceMeaning: (answers, meaning, contextual) => `${meaning} Konkret könnte das dort relevant sein, wo „${answers.join("“ und „")}“ zählt.${contextual ? " Wie stark das gilt, scheint von Situation und Umfeld abzuhängen." : ""}`,
    synthesisLead: (dominant, supporting) => `${dominant} steht aktuell im Vordergrund. ${supporting.join(", ")} verändern jedoch mit, welche Bedingungen diese Facette praktisch braucht.`,
    tensionFrame: (text) => `Hier treffen zwei berechtigte Bedürfnisse aufeinander, die je nach Situation in unterschiedliche Richtungen ziehen können: ${text}`,
    facetReflection: (evidence) => `Wo würde „${evidence}“ gerade wirklich helfen — und wo wäre es eher eine übernommene Erwartung oder durch die Situation erzwungen?`,
    facetExperiment: (evidence) => `Wähle eine kleine aktuelle Situation, in der „${evidence}“ zählt. Verändere für eine Woche nur eine passende Bedingung und beobachte, ob dein Handeln leichter, klarer oder wirksamer wird.`,
  },
  en: {
    eyebrow: "Your current Character Constellation", dominant: "Currently most visible", supporting: "Supporting facets",
    why: "Why it is visible", contribution: "What it contributes", conditions: "Conditions that may help", needs: "What it may need in practice", notice: "What to notice",
    combination: "What becomes visible in combination", evidence: "Evidence", interpretation: "Interpretation", possibility: "Possible reading",
    synthesis: "Your constellation in context", tensions: "Possible dynamics", application: "Put it to use",
    environments: "Situations that may fit", energy: "Possible energy source", friction: "Possible friction", reflection: "Reflection question", experiment: "Small experiment",
    artworkUnavailable: "The accepted Character artwork is not present in this project yet. Representation selection is therefore disabled in this local review view.",
    currentFacet: (name) => `${name} is the most visible facet in this snapshot — not a fixed identity.`,
    evidenceMeaning: (answers, meaning, contextual) => `${meaning} This may matter especially where “${answers.join("” and “")}” is relevant.${contextual ? " How strongly it applies seems to depend on the situation and environment." : ""}`,
    synthesisLead: (dominant, supporting) => `${dominant} is currently in the foreground. ${supporting.join(", ")} also shape the conditions this facet may need in practice.`,
    tensionFrame: (text) => `Two legitimate needs meet here and may pull in different directions depending on the situation: ${text}`,
    facetReflection: (evidence) => `Where would “${evidence}” genuinely help right now — and where might it be an inherited expectation or imposed by the situation?`,
    facetExperiment: (evidence) => `Choose one small current situation where “${evidence}” matters. Change just one relevant condition for a week and observe whether acting becomes easier, clearer or more effective.`,
  },
  es: {
    eyebrow: "Tu Character Constellation actual", dominant: "La faceta más visible ahora", supporting: "Facetas de apoyo",
    why: "Por qué es visible", contribution: "Qué aporta", conditions: "Qué condiciones pueden ayudar", needs: "Qué puede necesitar en la práctica", notice: "Qué conviene observar",
    combination: "Qué se hace visible en la combinación", evidence: "Evidencia", interpretation: "Interpretación", possibility: "Lectura posible",
    synthesis: "Tu constelación en contexto", tensions: "Dinámicas posibles", application: "Llevarlo a la práctica",
    environments: "Situaciones que pueden encajar", energy: "Posible fuente de energía", friction: "Posible fricción", reflection: "Pregunta de reflexión", experiment: "Pequeño experimento",
    artworkUnavailable: "Las ilustraciones de Character aceptadas aún no están en este proyecto. Por eso la elección de representación está desactivada en esta vista local de revisión.",
    currentFacet: (name) => `${name} es la faceta más visible en esta instantánea, no una identidad fija.`,
    evidenceMeaning: (answers, meaning, contextual) => `${meaning} Puede ser especialmente relevante allí donde cuenta «${answers.join("» y «")}».${contextual ? " Su peso parece depender de la situación y del entorno." : ""}`,
    synthesisLead: (dominant, supporting) => `${dominant} está ahora en primer plano. ${supporting.join(", ")} también modifican las condiciones que esta faceta puede necesitar en la práctica.`,
    tensionFrame: (text) => `Aquí coinciden dos necesidades legítimas que, según la situación, pueden tirar en direcciones distintas: ${text}`,
    facetReflection: (evidence) => `¿Dónde ayudaría realmente «${evidence}» ahora y dónde podría ser una expectativa heredada o impuesta por la situación?`,
    facetExperiment: (evidence) => `Elige una situación actual pequeña en la que cuente «${evidence}». Cambia solo una condición relevante durante una semana y observa si actuar resulta más fácil, claro o eficaz.`,
  },
  tr: {
    eyebrow: "Güncel Character Constellation'ın", dominant: "Şu anda en görünür", supporting: "Destekleyici yönler",
    why: "Neden görünür", contribution: "Ne katıyor", conditions: "Hangi koşullar yardımcı olabilir", needs: "Pratikte neye ihtiyaç duyabilir", notice: "Neye dikkat etmeli",
    combination: "Birlikte ne görünür oluyor", evidence: "Kanıt", interpretation: "Yorum", possibility: "Olası okuma",
    synthesis: "Bağlam içinde konstelasyonun", tensions: "Olası dinamikler", application: "Bunu kullanmak",
    environments: "Uygun olabilecek durumlar", energy: "Olası enerji kaynağı", friction: "Olası sürtüşme", reflection: "Düşünme sorusu", experiment: "Küçük deney",
    artworkUnavailable: "Kabul edilen Character çizimleri henüz bu projede bulunmuyor. Bu nedenle temsil seçimi yerel inceleme görünümünde devre dışı.",
    currentFacet: (name) => `${name} bu anlık görünümde en görünür yön; sabit bir kimlik değil.`,
    evidenceMeaning: (answers, meaning, contextual) => `${meaning} Bu, özellikle “${answers.join("” ve “")}” önemli olduğunda geçerli olabilir.${contextual ? " Ne ölçüde geçerli olduğu durum ve ortama bağlı görünüyor." : ""}`,
    synthesisLead: (dominant, supporting) => `${dominant} şu anda ön planda. ${supporting.join(", ")} da bu yönün pratikte ihtiyaç duyabileceği koşulları şekillendiriyor.`,
    tensionFrame: (text) => `Burada iki meşru ihtiyaç buluşuyor ve duruma göre farklı yönlere çekebilir: ${text}`,
    facetReflection: (evidence) => `“${evidence}” şu anda nerede gerçekten yardımcı olur; nerede devralınmış bir beklenti ya da durumun dayatması olabilir?`,
    facetExperiment: (evidence) => `“${evidence}” ifadesinin önemli olduğu küçük bir güncel durum seç. Bir hafta boyunca yalnızca ilgili bir koşulu değiştir ve hareket etmenin kolaylaşıp kolaylaşmadığını gözlemle.`,
  },
  pl: {
    eyebrow: "Twoja aktualna Character Constellation", dominant: "Obecnie najbardziej widoczna", supporting: "Wspierające aspekty",
    why: "Dlaczego jest widoczna", contribution: "Co wnosi", conditions: "Jakie warunki mogą pomagać", needs: "Czego może potrzebować w praktyce", notice: "Co warto zauważać",
    combination: "Co ujawnia się w połączeniu", evidence: "Podstawa", interpretation: "Interpretacja", possibility: "Możliwe odczytanie",
    synthesis: "Twoja konstelacja w kontekście", tensions: "Możliwe dynamiki", application: "Jak z tym pracować",
    environments: "Sytuacje, które mogą pasować", energy: "Możliwe źródło energii", friction: "Możliwe tarcie", reflection: "Pytanie do refleksji", experiment: "Mały eksperyment",
    artworkUnavailable: "Zaakceptowanych ilustracji Character nie ma jeszcze w tym projekcie. Dlatego wybór reprezentacji jest wyłączony w lokalnym widoku przeglądu.",
    currentFacet: (name) => `${name} jest obecnie najbardziej widocznym aspektem — nie stałą tożsamością.`,
    evidenceMeaning: (answers, meaning, contextual) => `${meaning} Może to być szczególnie istotne tam, gdzie liczy się „${answers.join("” oraz „")}”.${contextual ? " Znaczenie wydaje się zależeć od sytuacji i otoczenia." : ""}`,
    synthesisLead: (dominant, supporting) => `${dominant} jest obecnie na pierwszym planie. ${supporting.join(", ")} współkształtują jednak warunki, których ten aspekt może potrzebować w praktyce.`,
    tensionFrame: (text) => `Spotykają się tu dwie uzasadnione potrzeby, które zależnie od sytuacji mogą prowadzić w różne strony: ${text}`,
    facetReflection: (evidence) => `Gdzie „${evidence}” naprawdę pomogłoby teraz, a gdzie może być przejętym oczekiwaniem albo wymogiem sytuacji?`,
    facetExperiment: (evidence) => `Wybierz małą obecną sytuację, w której liczy się „${evidence}”. Przez tydzień zmień tylko jeden odpowiedni warunek i obserwuj, czy działanie staje się łatwiejsze, jaśniejsze lub skuteczniejsze.`,
  },
  el: {
    eyebrow: "Το τρέχον Character Constellation σου", dominant: "Πιο ορατή τώρα", supporting: "Υποστηρικτικές όψεις",
    why: "Γιατί είναι ορατή", contribution: "Τι συνεισφέρει", conditions: "Ποιες συνθήκες μπορεί να βοηθούν", needs: "Τι μπορεί να χρειάζεται στην πράξη", notice: "Τι να παρατηρείς",
    combination: "Τι γίνεται ορατό στον συνδυασμό", evidence: "Τεκμήρια", interpretation: "Ερμηνεία", possibility: "Πιθανή ανάγνωση",
    synthesis: "Ο αστερισμός σου στο πλαίσιο", tensions: "Πιθανές δυναμικές", application: "Αξιοποίησέ το",
    environments: "Καταστάσεις που μπορεί να ταιριάζουν", energy: "Πιθανή πηγή ενέργειας", friction: "Πιθανή τριβή", reflection: "Ερώτηση αναστοχασμού", experiment: "Μικρό πείραμα",
    artworkUnavailable: "Τα εγκεκριμένα εικαστικά Character δεν υπάρχουν ακόμη σε αυτό το έργο. Γι’ αυτό η επιλογή αναπαράστασης είναι απενεργοποιημένη στην τοπική προβολή ελέγχου.",
    currentFacet: (name) => `${name} είναι η πιο ορατή όψη σε αυτό το στιγμιότυπο — όχι σταθερή ταυτότητα.`,
    evidenceMeaning: (answers, meaning, contextual) => `${meaning} Αυτό μπορεί να έχει ιδιαίτερη σημασία εκεί όπου μετρά το «${answers.join("» και «")}».${contextual ? " Το πόσο ισχύει φαίνεται να εξαρτάται από την κατάσταση και το περιβάλλον." : ""}`,
    synthesisLead: (dominant, supporting) => `${dominant} βρίσκεται τώρα στο προσκήνιο. ${supporting.join(", ")} συνδιαμορφώνουν όμως τις συνθήκες που μπορεί να χρειάζεται αυτή η όψη στην πράξη.`,
    tensionFrame: (text) => `Εδώ συναντώνται δύο θεμιτές ανάγκες που, ανάλογα με την κατάσταση, μπορεί να τραβούν προς διαφορετικές κατευθύνσεις: ${text}`,
    facetReflection: (evidence) => `Πού θα βοηθούσε πραγματικά τώρα το «${evidence}» και πού μπορεί να είναι κληρονομημένη προσδοκία ή απαίτηση της κατάστασης;`,
    facetExperiment: (evidence) => `Επίλεξε μια μικρή τρέχουσα κατάσταση όπου μετρά το «${evidence}». Άλλαξε μόνο μία σχετική συνθήκη για μία εβδομάδα και παρατήρησε αν η δράση γίνεται ευκολότερη, σαφέστερη ή αποτελεσματικότερη.`,
  },
  ru: {
    eyebrow: "Твоя текущая Character Constellation", dominant: "Сейчас заметнее всего", supporting: "Поддерживающие грани",
    why: "Почему это видно", contribution: "Что это привносит", conditions: "Какие условия могут помогать", needs: "Что может требоваться на практике", notice: "Что стоит замечать",
    combination: "Что проявляется в сочетании", evidence: "Основание", interpretation: "Интерпретация", possibility: "Возможное прочтение",
    synthesis: "Твоя констелляция в контексте", tensions: "Возможные динамики", application: "Как это применить",
    environments: "Подходящие ситуации", energy: "Возможный источник энергии", friction: "Возможное трение", reflection: "Вопрос для размышления", experiment: "Небольшой эксперимент",
    artworkUnavailable: "Утверждённых иллюстраций Character пока нет в этом проекте. Поэтому выбор представления отключён в локальном режиме проверки.",
    currentFacet: (name) => `${name} — самая заметная грань в этом снимке, а не постоянная идентичность.`,
    evidenceMeaning: (answers, meaning, contextual) => `${meaning} Это может быть особенно важно там, где имеет значение «${answers.join("» и «")}».${contextual ? " Насколько это проявляется, похоже, зависит от ситуации и среды." : ""}`,
    synthesisLead: (dominant, supporting) => `${dominant} сейчас находится на переднем плане. ${supporting.join(", ")} также влияют на условия, которые могут быть нужны этой грани на практике.`,
    tensionFrame: (text) => `Здесь встречаются две обоснованные потребности, которые в зависимости от ситуации могут тянуть в разные стороны: ${text}`,
    facetReflection: (evidence) => `Где «${evidence}» действительно помогло бы сейчас, а где это может быть унаследованным ожиданием или требованием ситуации?`,
    facetExperiment: (evidence) => `Выбери небольшую текущую ситуацию, где важно «${evidence}». На неделю измени только одно подходящее условие и наблюдай, становится ли действовать легче, яснее или результативнее.`,
  },
};
