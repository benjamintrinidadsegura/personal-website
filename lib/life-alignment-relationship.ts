import { getRelationshipModule, relationshipText } from "@/data/life-alignment-relationship";
import type { Locale } from "@/lib/i18n/config";
import type {
  RelationshipAnswer,
  RelationshipAnswerSet,
  RelationshipEvidence,
  RelationshipImportance,
  RelationshipInsight,
  RelationshipModuleDefinition,
  RelationshipModuleId,
  RelationshipQuestionDefinition,
  RelationshipResultCategory,
  RelationshipSharedResult,
  RelationshipSoloReflection,
  RelationshipSoloResult,
} from "@/types/life-alignment-relationship";

export const relationshipResultCategories: readonly RelationshipResultCategory[] = [
  "strong-alignment",
  "different-workable",
  "needs-conversation",
  "potential-friction",
  "complementary-strengths",
  "insufficient-evidence",
];

const importanceRank: Record<RelationshipImportance, number> = { low: 1, medium: 2, high: 3 };
const categoryRank: Record<RelationshipResultCategory, number> = {
  "potential-friction": 6,
  "needs-conversation": 5,
  "complementary-strengths": 4,
  "different-workable": 3,
  "strong-alignment": 2,
  "insufficient-evidence": 1,
};

type ResultCopy = {
  category: Record<RelationshipResultCategory, string>;
  aligned: string;
  different: string;
  importantDifference: string;
  friction: string;
  complementary: string;
  insufficient: string;
  meaningAligned: string;
  meaningDifferent: string;
  meaningImportant: string;
  meaningFriction: string;
  meaningComplementary: string;
  meaningInsufficient: string;
  talk: string;
  try: string;
  agreement: string;
  soloExpectation: string;
  soloClarify: string;
  soloTry: string;
};

const resultCopy: Record<Locale, ResultCopy> = {
  en: {
    category: { "strong-alignment": "Strong alignment", "different-workable": "Different, but workable", "needs-conversation": "Needs a conversation", "potential-friction": "Potential friction", "complementary-strengths": "Complementary strengths", "insufficient-evidence": "Not enough evidence" },
    aligned: "Your answers point in a similar direction.", different: "You approach this differently, while its current priority is limited.", importantDifference: "You approach this differently and at least one of you marks it as important.", friction: "A large, high-priority difference may create recurring tension when circumstances become difficult.", complementary: "Your different approaches may complement each other when ownership and context are explicit.", insufficient: "The available answers do not support a confident shared interpretation.",
    meaningAligned: "This may give you useful shared ground, provided the expectation remains explicit.", meaningDifferent: "The difference can be workable without either preference being wrong.", meaningImportant: "The difference matters enough to clarify before assumptions harden.", meaningFriction: "The pattern is context-dependent, not a prediction about the relationship.", meaningComplementary: "The value appears when both approaches are understood and used deliberately.", meaningInsufficient: "Leaving this open is more truthful than forcing a conclusion.",
    talk: "What would this look like in an ordinary week, and what would feel respectful to each of you?", try: "Choose one small, reversible way to make the expectation visible, then review what happened.", agreement: "We will make our expectation here explicit and revisit it after trying it.",
    soloExpectation: "Your answer shows where you currently lean.", soloClarify: "What would another person need to know so they do not have to guess this expectation?", soloTry: "Name one concrete situation and describe what would feel workable to you.",
  },
  de: {
    category: { "strong-alignment": "Starke Ausrichtung", "different-workable": "Unterschiedlich, aber tragfähig", "needs-conversation": "Braucht ein Gespräch", "potential-friction": "Mögliche Reibung", "complementary-strengths": "Ergänzende Stärken", "insufficient-evidence": "Nicht genug Hinweise" },
    aligned: "Eure Antworten weisen in eine ähnliche Richtung.", different: "Ihr geht damit unterschiedlich um, während das Thema aktuell nur begrenzte Priorität hat.", importantDifference: "Ihr geht damit unterschiedlich um und mindestens eine Person bewertet das Thema als wichtig.", friction: "Ein großer Unterschied mit hoher Bedeutung kann in schwierigen Situationen wiederkehrende Spannung erzeugen.", complementary: "Eure unterschiedlichen Ansätze können sich ergänzen, wenn Verantwortung und Kontext ausdrücklich geklärt sind.", insufficient: "Die verfügbaren Antworten tragen keine belastbare gemeinsame Deutung.",
    meaningAligned: "Das kann eine hilfreiche gemeinsame Grundlage sein, sofern die Erwartung sichtbar bleibt.", meaningDifferent: "Der Unterschied kann tragfähig sein, ohne dass eine Präferenz falsch ist.", meaningImportant: "Der Unterschied ist wichtig genug, um ihn vor festen Annahmen zu klären.", meaningFriction: "Das Muster hängt vom Kontext ab und sagt nichts über den Erfolg der Beziehung voraus.", meaningComplementary: "Der Nutzen entsteht, wenn beide Ansätze verstanden und bewusst eingesetzt werden.", meaningInsufficient: "Offenheit ist hier wahrhaftiger als eine erzwungene Schlussfolgerung.",
    talk: "Wie würde das in einer gewöhnlichen Woche aussehen, und was wäre für euch jeweils respektvoll?", try: "Macht die Erwartung in einem kleinen, reversiblen Versuch sichtbar und besprecht danach, was passiert ist.", agreement: "Wir machen unsere Erwartung hier ausdrücklich und schauen nach einem Versuch erneut darauf.",
    soloExpectation: "Deine Antwort zeigt, wohin du aktuell tendierst.", soloClarify: "Was müsste eine andere Person wissen, damit sie diese Erwartung nicht erraten muss?", soloTry: "Nenne eine konkrete Situation und beschreibe, was sich für dich tragfähig anfühlen würde.",
  },
  es: {
    category: { "strong-alignment": "Alineación sólida", "different-workable": "Diferente, pero viable", "needs-conversation": "Requiere conversación", "potential-friction": "Posible fricción", "complementary-strengths": "Fortalezas complementarias", "insufficient-evidence": "No hay suficiente evidencia" },
    aligned: "Vuestras respuestas apuntan en una dirección parecida.", different: "Lo abordáis de forma distinta y su prioridad actual es limitada.", importantDifference: "Lo abordáis de forma distinta y al menos una persona lo considera importante.", friction: "Una diferencia grande y prioritaria puede generar tensión recurrente en situaciones difíciles.", complementary: "Los enfoques distintos pueden complementarse si el contexto y la responsabilidad son explícitos.", insufficient: "Las respuestas disponibles no permiten una interpretación compartida fiable.",
    meaningAligned: "Puede ser una base común útil si la expectativa sigue explícita.", meaningDifferent: "La diferencia puede funcionar sin que ninguna preferencia sea incorrecta.", meaningImportant: "Conviene aclarar la diferencia antes de que las suposiciones se fijen.", meaningFriction: "Es un patrón contextual, no una predicción sobre la relación.", meaningComplementary: "El valor aparece cuando ambos enfoques se comprenden y usan con intención.", meaningInsufficient: "Dejarlo abierto es más honesto que forzar una conclusión.",
    talk: "¿Cómo se vería esto en una semana normal y qué resultaría respetuoso para cada persona?", try: "Probad una forma pequeña y reversible de hacer visible la expectativa y revisad el resultado.", agreement: "Haremos explícita esta expectativa y la revisaremos después de probarla.", soloExpectation: "Tu respuesta muestra hacia dónde te inclinas ahora.", soloClarify: "¿Qué necesitaría saber otra persona para no tener que adivinar esta expectativa?", soloTry: "Nombra una situación concreta y describe qué sería viable para ti.",
  },
  tr: {
    category: { "strong-alignment": "Güçlü uyum", "different-workable": "Farklı ama yürütülebilir", "needs-conversation": "Konuşma gerektiriyor", "potential-friction": "Olası sürtüşme", "complementary-strengths": "Tamamlayıcı güçler", "insufficient-evidence": "Yeterli kanıt yok" },
    aligned: "Yanıtlarınız benzer bir yöne işaret ediyor.", different: "Bu konuya farklı yaklaşıyorsunuz ve mevcut önceliği sınırlı.", importantDifference: "Farklı yaklaşıyorsunuz ve en az biriniz bu konuyu önemli görüyor.", friction: "Büyük ve yüksek öncelikli bir fark zor koşullarda tekrarlayan gerilim yaratabilir.", complementary: "Farklı yaklaşımlarınız, sorumluluk ve bağlam açık olduğunda birbirini tamamlayabilir.", insufficient: "Mevcut yanıtlar güvenilir bir ortak yorum için yeterli değil.",
    meaningAligned: "Beklenti açık kaldığı sürece yararlı bir ortak zemin olabilir.", meaningDifferent: "Tercihlerden biri yanlış olmadan bu fark yürütülebilir.", meaningImportant: "Varsayımlar yerleşmeden önce açıklığa kavuşturulacak kadar önemli.", meaningFriction: "Bu bağlama bağlı bir örüntüdür; ilişkinin sonucunu öngörmez.", meaningComplementary: "Değer, iki yaklaşım anlaşılıp bilinçli kullanıldığında ortaya çıkar.", meaningInsufficient: "Bir sonuç zorlamaktansa açık bırakmak daha dürüsttür.",
    talk: "Bu sıradan bir haftada nasıl görünür ve her biriniz için ne saygılı olurdu?", try: "Beklentiyi görünür kılacak küçük, geri alınabilir bir yöntem deneyin ve sonucu değerlendirin.", agreement: "Bu beklentiyi açıkça konuşacak ve denemeden sonra yeniden değerlendireceğiz.", soloExpectation: "Yanıtın şu anda nereye yöneldiğini gösteriyor.", soloClarify: "Başka birinin bu beklentiyi tahmin etmemesi için neyi bilmesi gerekir?", soloTry: "Somut bir durum seç ve senin için neyin yürütülebilir olduğunu anlat.",
  },
  pl: {
    category: { "strong-alignment": "Silna zgodność", "different-workable": "Różnie, ale wykonalnie", "needs-conversation": "Wymaga rozmowy", "potential-friction": "Możliwe tarcie", "complementary-strengths": "Uzupełniające się mocne strony", "insufficient-evidence": "Za mało danych" },
    aligned: "Wasze odpowiedzi wskazują podobny kierunek.", different: "Podchodzicie do tego różnie, a obecny priorytet jest ograniczony.", importantDifference: "Podchodzicie do tego różnie i co najmniej jedna osoba uważa temat za ważny.", friction: "Duża różnica o wysokim priorytecie może powodować powracające napięcie w trudnych sytuacjach.", complementary: "Różne podejścia mogą się uzupełniać, gdy kontekst i odpowiedzialność są jasne.", insufficient: "Dostępne odpowiedzi nie dają podstaw do pewnej wspólnej interpretacji.",
    meaningAligned: "To może być użyteczny wspólny grunt, jeśli oczekiwanie pozostanie jawne.", meaningDifferent: "Różnica może działać bez uznawania którejkolwiek preferencji za błędną.", meaningImportant: "Warto ją wyjaśnić, zanim utrwalą się założenia.", meaningFriction: "To wzorzec zależny od kontekstu, a nie prognoza relacji.", meaningComplementary: "Wartość pojawia się, gdy oba podejścia są rozumiane i świadomie używane.", meaningInsufficient: "Pozostawienie tematu otwartego jest uczciwsze niż wymuszony wniosek.",
    talk: "Jak wyglądałoby to w zwykłym tygodniu i co byłoby pełne szacunku dla każdej osoby?", try: "Wypróbujcie mały, odwracalny sposób ujawnienia oczekiwania i omówcie efekt.", agreement: "Nazwiemy to oczekiwanie wprost i wrócimy do niego po próbie.", soloExpectation: "Odpowiedź pokazuje, ku czemu się teraz skłaniasz.", soloClarify: "Co druga osoba powinna wiedzieć, aby nie zgadywać tego oczekiwania?", soloTry: "Wskaż konkretną sytuację i opisz, co byłoby dla Ciebie wykonalne.",
  },
  el: {
    category: { "strong-alignment": "Ισχυρή ευθυγράμμιση", "different-workable": "Διαφορετικό αλλά λειτουργικό", "needs-conversation": "Χρειάζεται συζήτηση", "potential-friction": "Πιθανή τριβή", "complementary-strengths": "Συμπληρωματικές δυνάμεις", "insufficient-evidence": "Ανεπαρκή στοιχεία" },
    aligned: "Οι απαντήσεις σας δείχνουν παρόμοια κατεύθυνση.", different: "Το προσεγγίζετε διαφορετικά, με περιορισμένη σημερινή προτεραιότητα.", importantDifference: "Το προσεγγίζετε διαφορετικά και τουλάχιστον ένα άτομο το θεωρεί σημαντικό.", friction: "Μια μεγάλη διαφορά υψηλής προτεραιότητας μπορεί να προκαλεί επαναλαμβανόμενη ένταση υπό πίεση.", complementary: "Οι διαφορετικές προσεγγίσεις μπορούν να συμπληρωθούν όταν πλαίσιο και ευθύνη είναι σαφή.", insufficient: "Οι διαθέσιμες απαντήσεις δεν στηρίζουν ασφαλή κοινή ερμηνεία.",
    meaningAligned: "Μπορεί να είναι χρήσιμο κοινό έδαφος, αν η προσδοκία παραμένει ρητή.", meaningDifferent: "Η διαφορά μπορεί να λειτουργήσει χωρίς καμία προτίμηση να είναι λανθασμένη.", meaningImportant: "Αξίζει διευκρίνιση πριν παγιωθούν υποθέσεις.", meaningFriction: "Εξαρτάται από το πλαίσιο και δεν προβλέπει την πορεία της σχέσης.", meaningComplementary: "Η αξία προκύπτει όταν οι προσεγγίσεις κατανοούνται και χρησιμοποιούνται συνειδητά.", meaningInsufficient: "Το να μείνει ανοιχτό είναι πιο έντιμο από ένα αναγκαστικό συμπέρασμα.",
    talk: "Πώς θα φαινόταν αυτό σε μια συνηθισμένη εβδομάδα και τι θα ήταν σεβαστικό για τον καθένα;", try: "Δοκιμάστε έναν μικρό, αναστρέψιμο τρόπο να κάνετε την προσδοκία ορατή και αναθεωρήστε.", agreement: "Θα εκφράσουμε ρητά αυτή την προσδοκία και θα την επανεξετάσουμε μετά τη δοκιμή.", soloExpectation: "Η απάντησή σου δείχνει την τωρινή σου κλίση.", soloClarify: "Τι πρέπει να γνωρίζει το άλλο άτομο ώστε να μη μαντεύει την προσδοκία;", soloTry: "Διάλεξε μια συγκεκριμένη κατάσταση και περιέγραψε τι θα ήταν λειτουργικό για σένα.",
  },
  ru: {
    category: { "strong-alignment": "Сильное согласование", "different-workable": "Различается, но работает", "needs-conversation": "Нужен разговор", "potential-friction": "Возможное напряжение", "complementary-strengths": "Дополняющие сильные стороны", "insufficient-evidence": "Недостаточно данных" },
    aligned: "Ваши ответы указывают в схожем направлении.", different: "Вы подходите к теме по-разному, но сейчас её приоритет ограничен.", importantDifference: "Вы подходите к теме по-разному, и хотя бы один участник считает её важной.", friction: "Большая разница с высоким приоритетом может создавать повторяющееся напряжение в сложных условиях.", complementary: "Разные подходы могут дополнять друг друга, когда контекст и ответственность определены явно.", insufficient: "Ответов недостаточно для уверенной общей интерпретации.",
    meaningAligned: "Это может стать полезной общей основой, если ожидание остаётся явным.", meaningDifferent: "Различие может работать без признания одной из предпочтений неправильной.", meaningImportant: "Различие стоит обсудить до того, как предположения закрепятся.", meaningFriction: "Это контекстный паттерн, а не прогноз отношений.", meaningComplementary: "Польза возникает, когда оба подхода поняты и используются осознанно.", meaningInsufficient: "Оставить вопрос открытым честнее, чем навязать вывод.",
    talk: "Как это выглядело бы в обычную неделю и что было бы уважительно для каждого?", try: "Попробуйте небольшой обратимый способ сделать ожидание видимым и обсудите результат.", agreement: "Мы явно назовём это ожидание и вернёмся к нему после эксперимента.", soloExpectation: "Ответ показывает вашу нынешнюю склонность.", soloClarify: "Что другому человеку нужно знать, чтобы не угадывать это ожидание?", soloTry: "Выберите конкретную ситуацию и опишите, что было бы приемлемо для вас.",
  },
};

function validAnswer(value: unknown): value is RelationshipAnswer {
  if (!value || typeof value !== "object") return false;
  const answer = value as Partial<RelationshipAnswer>;
  return Number.isInteger(answer.value) && Number(answer.value) >= 1 && Number(answer.value) <= 5
    && (answer.importance === "low" || answer.importance === "medium" || answer.importance === "high");
}

export function normalizeRelationshipAnswers(module: RelationshipModuleDefinition, input: unknown, allowPartial = false): RelationshipAnswerSet | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const questionIds = new Set(module.questions.map(({ id }) => id));
  if (Object.keys(raw).some((id) => !questionIds.has(id))) return null;
  const normalized: Record<string, RelationshipAnswer> = {};
  for (const question of module.questions) {
    const value = raw[question.id];
    if (value === undefined && (allowPartial || question.optional)) continue;
    if (!validAnswer(value)) return null;
    normalized[question.id] = { value: value.value, importance: value.importance };
  }
  return normalized;
}

export function isRelationshipAssessmentComplete(module: RelationshipModuleDefinition, answers: RelationshipAnswerSet): boolean {
  return module.questions.every((question) => question.optional || validAnswer(answers[question.id]));
}

function importance(left: RelationshipAnswer, right: RelationshipAnswer): RelationshipImportance {
  return importanceRank[left.importance] >= importanceRank[right.importance] ? left.importance : right.importance;
}

function categoryFor(question: RelationshipQuestionDefinition, left?: RelationshipAnswer, right?: RelationshipAnswer): RelationshipResultCategory {
  if (!left || !right) return "insufficient-evidence";
  const difference = Math.abs(left.value - right.value);
  const priority = importance(left, right);
  if (difference <= 1) return "strong-alignment";
  if (question.complementary && difference <= 3) return "complementary-strengths";
  if (difference >= 4 && priority === "high") return "potential-friction";
  if (difference >= 2 && priority === "high") return "needs-conversation";
  if (difference >= 3 && priority === "medium") return "needs-conversation";
  return "different-workable";
}

function evidence(question: RelationshipQuestionDefinition, left?: RelationshipAnswer, right?: RelationshipAnswer): RelationshipEvidence {
  const difference = !left || !right ? "unknown" : Math.abs(left.value - right.value) === 0 ? "none" : Math.abs(left.value - right.value) === 1 ? "small" : Math.abs(left.value - right.value) <= 3 ? "meaningful" : "large";
  const evidenceImportance = left && right ? importance(left, right) : left?.importance ?? right?.importance ?? "low";
  return { questionId: question.id, dimensionId: question.dimensionId, importance: evidenceImportance, difference };
}

function buildInsight(module: RelationshipModuleDefinition, question: RelationshipQuestionDefinition, category: RelationshipResultCategory, itemEvidence: RelationshipEvidence, locale: Locale): RelationshipInsight {
  const copy = resultCopy[locale];
  const dimension = module.dimensions.find(({ id }) => id === question.dimensionId);
  if (!dimension) throw new Error(`Unknown dimension ${question.dimensionId}`);
  const title = `${copy.category[category]} · ${relationshipText(dimension.title, locale)}`;
  const content = {
    "strong-alignment": [copy.aligned, copy.meaningAligned], "different-workable": [copy.different, copy.meaningDifferent],
    "needs-conversation": [copy.importantDifference, copy.meaningImportant], "potential-friction": [copy.friction, copy.meaningFriction],
    "complementary-strengths": [copy.complementary, copy.meaningComplementary], "insufficient-evidence": [copy.insufficient, copy.meaningInsufficient],
  }[category];
  const priority = category === "potential-friction" || (category === "needs-conversation" && itemEvidence.importance === "high") ? "high" : category === "strong-alignment" || category === "insufficient-evidence" ? "low" : "medium";
  return { id: `${question.dimensionId}-${category}`, category, dimensionId: question.dimensionId, title, explanation: content[0], whatThisCouldMean: content[1], talkAboutThis: copy.talk, tryThis: copy.try, agreementStarter: copy.agreement, priority, evidence: [itemEvidence] };
}

export function buildRelationshipSharedResult(moduleId: RelationshipModuleId, participantA: RelationshipAnswerSet, participantB: RelationshipAnswerSet, locale: Locale = "en"): RelationshipSharedResult {
  const definition = getRelationshipModule(moduleId);
  if (!isRelationshipAssessmentComplete(definition, participantA) || !isRelationshipAssessmentComplete(definition, participantB)) throw new Error("ASSESSMENT_INCOMPLETE");
  const bestByDimension = new Map<string, RelationshipInsight>();
  for (const question of definition.questions) {
    const left = participantA[question.id];
    const right = participantB[question.id];
    const itemEvidence = evidence(question, left, right);
    const category = categoryFor(question, left, right);
    const insight = buildInsight(definition, question, category, itemEvidence, locale);
    const previous = bestByDimension.get(question.dimensionId);
    if (!previous || categoryRank[insight.category] > categoryRank[previous.category] || importanceRank[itemEvidence.importance] > importanceRank[previous.evidence[0]?.importance ?? "low"]) bestByDimension.set(question.dimensionId, insight);
    else previous.evidence = [...previous.evidence, itemEvidence];
  }
  const maximum = moduleId === "founder" ? 14 : 12;
  const insights = [...bestByDimension.values()].sort((a, b) => {
    const priority = { high: 3, medium: 2, low: 1 } as const;
    return priority[b.priority] - priority[a.priority] || categoryRank[b.category] - categoryRank[a.category] || a.id.localeCompare(b.id);
  }).slice(0, maximum);
  const categories = Object.fromEntries(relationshipResultCategories.map((category) => [category, insights.filter((insight) => insight.category === category)])) as Record<RelationshipResultCategory, RelationshipInsight[]>;
  return { kind: "shared", moduleId, moduleVersion: definition.version, questionSetVersion: definition.questionSetVersion, interpretationVersion: definition.interpretationVersion, insights, categories };
}

export function buildRelationshipSoloResult(moduleId: RelationshipModuleId, answers: RelationshipAnswerSet, locale: Locale = "en"): RelationshipSoloResult {
  const definition = getRelationshipModule(moduleId);
  if (!isRelationshipAssessmentComplete(definition, answers)) throw new Error("ASSESSMENT_INCOMPLETE");
  const copy = resultCopy[locale];
  const reflections: RelationshipSoloReflection[] = definition.questions.map((question) => {
    const answer = answers[question.id];
    if (!answer) throw new Error("ASSESSMENT_INCOMPLETE");
    const dimension = definition.dimensions.find(({ id }) => id === question.dimensionId);
    if (!dimension) throw new Error(`Unknown dimension ${question.dimensionId}`);
    return { id: question.id, dimensionId: question.dimensionId, title: relationshipText(dimension.title, locale), expectation: copy.soloExpectation, clarify: copy.soloClarify, tryThis: copy.soloTry, priority: answer.importance, evidence: [evidence(question, answer)] };
  });
  const ranked = reflections.sort((a, b) => importanceRank[b.priority] - importanceRank[a.priority] || a.id.localeCompare(b.id)).slice(0, moduleId === "founder" ? 14 : 10);
  return { kind: "solo", moduleId, moduleVersion: definition.version, questionSetVersion: definition.questionSetVersion, interpretationVersion: definition.interpretationVersion, reflections: ranked };
}

export function getRelationshipCategoryLabel(category: RelationshipResultCategory, locale: Locale): string {
  return resultCopy[locale].category[category];
}
