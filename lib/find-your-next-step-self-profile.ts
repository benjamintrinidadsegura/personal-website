import {
  getSelfProfileDefinitions,
  getSelfProfileSecondaryCopy,
} from "@/data/find-your-next-step-self-profile";
import type {
  SelfProfileDefinition,
  SelfProfileId,
} from "@/data/find-your-next-step-self-profile";
import {
  getSelfReflectionDimensions,
  getSelfReflectionQuestions,
} from "@/data/find-your-next-step-self";
import type { Locale } from "@/lib/i18n/config";
import {
  buildSelfReflectionResult,
  calculateSelfReflectionScores,
  getMissingSelfReflectionQuestionIds,
} from "@/lib/find-your-next-step-self";
import type {
  SelfReflectionAnswers,
  SelfReflectionDimensionId,
  SelfReflectionResult,
  SelfReflectionSectionId,
  SelfReflectionVisibility,
} from "@/types/find-your-next-step";

export type SelfProfileBasis = "tension" | "explicit-pair" | "co-visible";
export type SelfProfileStrength = "strong" | "possible";

const profileCopy = {
  de: { contextual: (v: string) => `Situationsabhängig zeigt sich zusätzlich: ${v}`, co: (a: string, b: string) => `${a} und ${b} zeigen sich jeweils klar und eigenständig in mehreren Bereichen. Die Kombination wurde jedoch nicht direkt als gemeinsames Muster gewählt und bleibt deshalb eine mögliche redaktionelle Lesart.`, breadth: (n: number) => n === 1 ? "einem Abschnitt" : `${n} Abschnitten`, tension: (v: string) => `Beide Signale sind sichtbar und erscheinen in deinem bestehenden Ergebnis bereits als Spannungsfeld. Antworten aus ${v} tragen diese Verbindung, ohne daraus eine dauerhafte Identität abzuleiten.`, pair: (v: string) => `Beide Signale sind sichtbar und wurden in mindestens einer Antwort direkt gemeinsam gewählt. Weitere Hinweise aus insgesamt ${v} stützen die Profil-Linse.`, incomplete: "Die Profil-Linse entsteht erst, wenn alle Reflexionsfragen beantwortet sind.", sparse: "Deine Antworten zeigen diesmal einzelne Hinweise, aber kein ausreichend klares gemeinsames Muster für eine Profil-Linse. FYNS lässt die Zuordnung deshalb bewusst offen – auch das ist ein valides Ergebnis.", unsupported: "In deiner Momentaufnahme sind einzelne Themen erkennbar, aber keine der kuratierten Profil-Linsen ist ausreichend belegt.", mixed: "Deine Momentaufnahme ist gerade vielseitiger als eindeutig. Mehrere Profil-Linsen wären ähnlich gut begründbar; deshalb stellt FYNS bewusst keine davon an die erste Stelle." },
  en: { contextual: (v: string) => `Depending on the situation, an additional signal appears: ${v}`, co: (a: string, b: string) => `${a} and ${b} each appear clearly and independently in several areas. However, you did not select the combination directly as a shared pattern, so it remains one possible editorial reading.`, breadth: (n: number) => n === 1 ? "one section" : `${n} sections`, tension: (v: string) => `Both signals are visible and already appear as a tension in your existing result. Answers across ${v} support the connection without turning it into a permanent identity.`, pair: (v: string) => `Both signals are visible and were selected together directly in at least one answer. Further indications across ${v} support this profile lens.`, incomplete: "The profile lens is built only after all reflection questions have been answered.", sparse: "Your answers show individual indications this time, but no sufficiently clear shared pattern for a profile lens. FYNS deliberately leaves the assignment open — that is a valid result too.", unsupported: "Individual themes are visible in your snapshot, but none of the curated profile lenses has enough support.", mixed: "Your snapshot is currently more varied than singular. Several profile lenses would be supported similarly well, so FYNS deliberately does not place one of them first." },
  es: { contextual: (v: string) => `Según la situación, aparece además: ${v}`, co: (a: string, b: string) => `${a} y ${b} aparecen con claridad y de forma independiente en varias áreas. Como no elegiste directamente la combinación, sigue siendo una posible lectura editorial.`, breadth: (n: number) => n === 1 ? "una sección" : `${n} secciones`, tension: (v: string) => `Ambas señales son visibles y ya aparecen como tensión en tu resultado. Las respuestas de ${v} sostienen la conexión sin convertirla en una identidad permanente.`, pair: (v: string) => `Ambas señales son visibles y se eligieron juntas al menos una vez. Otros indicios de ${v} apoyan esta lente.`, incomplete: "La lente de perfil se forma cuando hayas respondido todas las preguntas de reflexión.", sparse: "Tus respuestas muestran indicios sueltos, pero no un patrón conjunto suficientemente claro. FYNS deja la asignación abierta de forma consciente; también es un resultado válido.", unsupported: "En tu instantánea se reconocen temas individuales, pero ninguna de las lentes seleccionadas tiene apoyo suficiente.", mixed: "Tu instantánea es ahora más variada que unívoca. Varias lentes tendrían un apoyo parecido, así que FYNS no coloca ninguna en primer lugar." },
  tr: { contextual: (v: string) => `Duruma bağlı olarak ek bir sinyal görünüyor: ${v}`, co: (a: string, b: string) => `${a} ve ${b} birkaç alanda açık ve bağımsız biçimde görünüyor. Birleşimi doğrudan seçmediğin için bu, olası bir editoryal okuma olarak kalır.`, breadth: (n: number) => n === 1 ? "bir bölüm" : `${n} bölüm`, tension: (v: string) => `İki sinyal de görünür ve mevcut sonucunda zaten bir gerilim oluşturuyor. ${v} içindeki yanıtlar bu bağlantıyı kalıcı kimliğe dönüştürmeden destekliyor.`, pair: (v: string) => `İki sinyal de görünür ve en az bir yanıtta birlikte seçildi. ${v} içindeki diğer işaretler bu merceği destekliyor.`, incomplete: "Profil merceği tüm düşünme soruları yanıtlandıktan sonra oluşur.", sparse: "Yanıtların bazı işaretler gösteriyor, ancak profil merceği için yeterince net ortak örüntü yok. FYNS eşleştirmeyi bilinçli olarak açık bırakır; bu da geçerli bir sonuçtur.", unsupported: "Anlık görüntünde ayrı temalar seçiliyor, ancak düzenlenmiş profil merceklerinden hiçbiri yeterince desteklenmiyor.", mixed: "Anlık görüntün şu anda tek bir örüntüden daha çeşitli. Birkaç mercek benzer ölçüde gerekçelendirilebilir; FYNS bu yüzden hiçbirini öne koymaz." },
  pl: { contextual: (v: string) => `Zależnie od sytuacji pojawia się też: ${v}`, co: (a: string, b: string) => `${a} i ${b} są wyraźnie i niezależnie widoczne w kilku obszarach. Nie wybrano jednak ich bezpośrednio jako wspólnego wzorca, więc pozostają możliwą redakcyjną interpretacją.`, breadth: (n: number) => n === 1 ? "jednej sekcji" : `${n} sekcji`, tension: (v: string) => `Oba sygnały są widoczne i już pojawiają się w wyniku jako napięcie. Odpowiedzi z ${v} wspierają połączenie, nie czyniąc z niego trwałej tożsamości.`, pair: (v: string) => `Oba sygnały są widoczne i co najmniej raz wybrane razem. Dalsze wskazówki z ${v} wspierają tę soczewkę.`, incomplete: "Soczewka profilu powstaje dopiero po odpowiedzi na wszystkie pytania refleksyjne.", sparse: "Odpowiedzi pokazują pojedyncze wskazówki, ale nie dość wyraźny wspólny wzorzec. FYNS świadomie pozostawia przypisanie otwarte — to również prawidłowy wynik.", unsupported: "W obrazie widać pojedyncze tematy, lecz żadna z wybranych soczewek nie ma wystarczającego wsparcia.", mixed: "Twój obraz jest teraz bardziej różnorodny niż jednoznaczny. Kilka soczewek miałoby podobne uzasadnienie, dlatego FYNS żadnej nie stawia na pierwszym miejscu." },
  el: { contextual: (v: string) => `Ανάλογα με την κατάσταση, εμφανίζεται επιπλέον: ${v}`, co: (a: string, b: string) => `${a} και ${b} εμφανίζονται καθαρά και ανεξάρτητα σε πολλούς τομείς. Δεν επέλεξες όμως άμεσα τον συνδυασμό ως κοινό μοτίβ, οπότε παραμένει μια πιθανή επιμελητική ανάγνωση.`, breadth: (n: number) => n === 1 ? "μία ενότητα" : `${n} ενότητες`, tension: (v: string) => `Και τα δύο σήματα είναι ορατά και εμφανίζονται ήδη ως ένταση στο αποτέλεσμα. Απαντήσεις από ${v} στηρίζουν τη σύνδεση χωρίς να τη μετατρέπουν σε μόνιμη ταυτότητα.`, pair: (v: string) => `Και τα δύο σήματα είναι ορατά και επιλέχθηκαν μαζί τουλάχιστον μία φορά. Πρόσθετες ενδείξεις από ${v} στηρίζουν τον φακό.`, incomplete: "Ο φακός προφίλ σχηματίζεται αφού απαντηθούν όλες οι ερωτήσεις αναστοχασμού.", sparse: "Οι απαντήσεις δείχνουν μεμονωμένες ενδείξεις, αλλά όχι αρκετά καθαρό κοινό μοτίβ. Το FYNS αφήνει συνειδητά την αντιστοίχιση ανοιχτή· και αυτό είναι έγκυρο αποτέλεσμα.", unsupported: "Στο στιγμιότυπο διακρίνονται μεμονωμένα θέματα, αλλά κανένας επιμελημένος φακός δεν στηρίζεται αρκετά.", mixed: "Το στιγμιότυπό σου είναι τώρα πιο ποικίλο παρά μονοσήμαντο. Πολλοί φακοί θα στηρίζονταν εξίσου, οπότε το FYNS δεν δίνει προτεραιότητα σε κανέναν." },
  ru: { contextual: (v: string) => `В зависимости от ситуации также проявляется: ${v}`, co: (a: string, b: string) => `${a} и ${b} ясно и независимо проявляются в нескольких областях. Но сочетание не было выбрано напрямую как общий паттерн, поэтому остаётся возможной редакционной интерпретацией.`, breadth: (n: number) => n === 1 ? "одного раздела" : `${n} разделов`, tension: (v: string) => `Оба сигнала видны и уже проявляются в результате как противоречие. Ответы из ${v} поддерживают связь, не превращая её в постоянную идентичность.`, pair: (v: string) => `Оба сигнала видны и хотя бы один раз выбраны вместе. Дополнительные признаки из ${v} поддерживают эту линзу.`, incomplete: "Профильная линза формируется после ответа на все вопросы для размышления.", sparse: "В ответах есть отдельные признаки, но нет достаточно ясного общего паттерна. FYNS сознательно оставляет сопоставление открытым — это тоже допустимый результат.", unsupported: "В снимке заметны отдельные темы, но ни одна из подготовленных линз не получила достаточной поддержки.", mixed: "Сейчас твой снимок скорее разнообразный, чем однозначный. Несколько линз обоснованы почти одинаково, поэтому FYNS сознательно не ставит одну из них первой." },
} as const;

export interface SelfProfileDimensionEvidence {
  dimension: SelfReflectionDimensionId;
  visibility: SelfReflectionVisibility;
  questionCount: number;
  sectionCount: number;
}

export interface SelfProfileEvidenceMetadata {
  supportingQuestionCount: number;
  supportingSectionCount: number;
  directPairQuestionCount: number;
  dimensions: readonly SelfProfileDimensionEvidence[];
}

export interface SelfProfileSecondarySignal {
  dimension: SelfReflectionDimensionId;
  label: string;
  visibility: SelfReflectionVisibility;
  contextual: boolean;
  text: string;
}

export type SelfProfileIdentityResult =
  | {
      status: "profile";
      strength: SelfProfileStrength;
      definition: SelfProfileDefinition;
      basis: SelfProfileBasis;
      contextual: boolean;
      secondarySignals: readonly SelfProfileSecondarySignal[];
      evidence: SelfProfileEvidenceMetadata;
      why: string;
    }
  | {
      status: "mixed";
      candidateIds: readonly SelfProfileId[];
      message: string;
    }
  | {
      status: "none";
      reason: "incomplete" | "sparse" | "unsupported";
      message: string;
    };

interface CandidateEvidence {
  questionIds: ReadonlySet<string>;
  sectionIds: ReadonlySet<SelfReflectionSectionId>;
  directPairQuestionIds: ReadonlySet<string>;
}

interface ProfileCandidate {
  definition: SelfProfileDefinition;
  basis: SelfProfileBasis;
  contextual: boolean;
  strength: SelfProfileStrength;
  evidence: SelfProfileEvidenceMetadata;
  visibilityLevel: 0 | 1 | 2;
  libraryIndex: number;
}

function collectCandidateEvidence(
  answers: SelfReflectionAnswers,
  dimensions: readonly [SelfReflectionDimensionId, SelfReflectionDimensionId],
  locale: Locale,
): CandidateEvidence {
  const questionIds = new Set<string>();
  const sectionIds = new Set<SelfReflectionSectionId>();
  const directPairQuestionIds = new Set<string>();

  for (const question of getSelfReflectionQuestions(locale)) {
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      if (!option) continue;
      const optionDimensions = new Set((option.signals ?? []).map(({ dimension }) => dimension));
      if (!dimensions.some((dimension) => optionDimensions.has(dimension))) continue;

      questionIds.add(question.id);
      sectionIds.add(question.sectionId);
      if (dimensions.every((dimension) => optionDimensions.has(dimension))) {
        directPairQuestionIds.add(question.id);
      }
    }
  }

  return { questionIds, sectionIds, directPairQuestionIds };
}

function basisPriority(basis: SelfProfileBasis): number {
  if (basis === "tension") return 3;
  if (basis === "explicit-pair") return 2;
  return 1;
}

function visibilityLevel(visibilities: readonly SelfReflectionVisibility[]): 0 | 1 | 2 {
  const clearCount = visibilities.filter((visibility) => visibility === "clear").length;
  if (clearCount === 2) return 2;
  if (clearCount === 1) return 1;
  return 0;
}

function compareCandidates(left: ProfileCandidate, right: ProfileCandidate): number {
  if (left.visibilityLevel !== right.visibilityLevel) return right.visibilityLevel - left.visibilityLevel;
  if (left.evidence.supportingQuestionCount !== right.evidence.supportingQuestionCount) {
    return right.evidence.supportingQuestionCount - left.evidence.supportingQuestionCount;
  }
  const basisDifference = basisPriority(right.basis) - basisPriority(left.basis);
  if (basisDifference !== 0) return basisDifference;
  if (left.evidence.supportingSectionCount !== right.evidence.supportingSectionCount) {
    return right.evidence.supportingSectionCount - left.evidence.supportingSectionCount;
  }
  if (left.contextual !== right.contextual) return left.contextual ? 1 : -1;
  return left.libraryIndex - right.libraryIndex;
}

function dominates(left: ProfileCandidate, right: ProfileCandidate): boolean {
  const leftValues = [
    left.visibilityLevel,
    left.evidence.supportingQuestionCount,
    basisPriority(left.basis),
    left.evidence.supportingSectionCount,
    left.contextual ? 0 : 1,
  ];
  const rightValues = [
    right.visibilityLevel,
    right.evidence.supportingQuestionCount,
    basisPriority(right.basis),
    right.evidence.supportingSectionCount,
    right.contextual ? 0 : 1,
  ];
  return leftValues.every((value, index) => value >= rightValues[index])
    && leftValues.some((value, index) => value > rightValues[index]);
}

function selectSecondarySignals(
  evaluations: ReturnType<typeof calculateSelfReflectionScores>,
  primaryDimensions: readonly SelfReflectionDimensionId[],
  locale: Locale,
): readonly SelfProfileSecondarySignal[] {
  const dimensions = getSelfReflectionDimensions(locale);
  const secondaryCopy = getSelfProfileSecondaryCopy(locale);
  const remaining = evaluations.filter((evaluation) =>
    evaluation.visibility !== null && !primaryDimensions.includes(evaluation.dimension),
  );
  if (remaining.length === 0) return [];

  const clear = remaining.filter(({ visibility }) => visibility === "clear");
  const selected = clear.length > 0
    ? clear.length <= 2 ? clear : []
    : remaining.length <= 2 ? remaining : [];

  return selected.flatMap((evaluation) => {
    if (!evaluation.visibility) return [];
    const baseText = secondaryCopy[evaluation.dimension];
    return [{
      dimension: evaluation.dimension,
      label: dimensions[evaluation.dimension].label,
      visibility: evaluation.visibility,
      contextual: evaluation.contextual,
      text: evaluation.contextual
        ? profileCopy[locale].contextual(baseText)
        : baseText,
    }];
  });
}

function buildWhy(candidate: ProfileCandidate, locale: Locale): string {
  const dimensions = getSelfReflectionDimensions(locale);
  const copy = profileCopy[locale];
  const [first, second] = candidate.evidence.dimensions;
  if (candidate.basis === "co-visible") {
    return copy.co(dimensions[first.dimension].label, dimensions[second.dimension].label);
  }
  const breadth = copy.breadth(candidate.evidence.supportingSectionCount);
  return candidate.basis === "tension" ? copy.tension(breadth) : copy.pair(breadth);
}

function buildCandidates(
  answers: SelfReflectionAnswers,
  result: SelfReflectionResult,
  locale: Locale,
): {
  candidates: readonly ProfileCandidate[];
  evaluations: ReturnType<typeof calculateSelfReflectionScores>;
} {
  const evaluations = calculateSelfReflectionScores(answers, locale);
  const evaluationsByDimension = new Map(evaluations.map((evaluation) => [evaluation.dimension, evaluation]));
  const visibleTensionIds = new Set(result.tensions.map(({ id }) => id));

  const candidates = getSelfProfileDefinitions(locale).flatMap((definition, libraryIndex) => {
    const dimensionEvaluations = definition.dimensions.map((dimension) => evaluationsByDimension.get(dimension));
    if (dimensionEvaluations.some((evaluation) => !evaluation?.visibility)) return [];

    const visibleEvaluations = dimensionEvaluations as (typeof evaluations)[number][];
    const candidateEvidence = collectCandidateEvidence(answers, definition.dimensions, locale);

    const visibilities = visibleEvaluations.map(({ visibility }) => visibility) as SelfReflectionVisibility[];
    const contextual = visibleEvaluations.some((evaluation) => evaluation.contextual);
    let basis: SelfProfileBasis;

    if (definition.coVisibleOnly) {
      const independentlyClear = visibleEvaluations.every((evaluation) =>
        evaluation.visibility === "clear"
        && evaluation.evidenceQuestionCount >= 3
        && evaluation.evidenceSectionCount >= 2,
      );
      if (!independentlyClear || candidateEvidence.directPairQuestionIds.size > 0) return [];
      basis = "co-visible";
    } else {
      if (candidateEvidence.questionIds.size < 3 || candidateEvidence.sectionIds.size < 2) return [];
      if (definition.tensionId && visibleTensionIds.has(definition.tensionId)) {
        basis = "tension";
      } else if (candidateEvidence.directPairQuestionIds.size > 0) {
        basis = "explicit-pair";
      } else {
        return [];
      }
    }

    const dimensionEvidence = visibleEvaluations.map((evaluation): SelfProfileDimensionEvidence => ({
      dimension: evaluation.dimension,
      visibility: evaluation.visibility as SelfReflectionVisibility,
      questionCount: evaluation.evidenceQuestionCount,
      sectionCount: evaluation.evidenceSectionCount,
    }));
    const candidateVisibilityLevel = visibilityLevel(visibilities);
    const strength: SelfProfileStrength = basis !== "co-visible"
      && candidateVisibilityLevel === 2
      && !contextual
      ? "strong"
      : "possible";

    return [{
      definition,
      basis,
      contextual,
      strength,
      evidence: {
        supportingQuestionCount: basis === "co-visible" ? 0 : candidateEvidence.questionIds.size,
        supportingSectionCount: basis === "co-visible" ? 0 : candidateEvidence.sectionIds.size,
        directPairQuestionCount: candidateEvidence.directPairQuestionIds.size,
        dimensions: dimensionEvidence,
      },
      visibilityLevel: candidateVisibilityLevel,
      libraryIndex,
    }];
  });

  return { candidates, evaluations };
}

export function buildSelfProfileIdentity(
  answers: SelfReflectionAnswers,
  existingResult?: SelfReflectionResult,
  locale: Locale = "de",
): SelfProfileIdentityResult {
  const copy = profileCopy[locale];
  if (getMissingSelfReflectionQuestionIds(answers, locale).length > 0) {
    return {
      status: "none",
      reason: "incomplete",
      message: copy.incomplete,
    };
  }

  let result = existingResult;
  if (!result) {
    const built = buildSelfReflectionResult(answers, locale);
    if (built.status !== "complete") {
      return {
        status: "none",
        reason: "incomplete",
        message: copy.incomplete,
      };
    }
    result = built.result;
  }

  const { candidates, evaluations } = buildCandidates(answers, result, locale);
  const visibleDimensions = evaluations.filter(({ visibility }) => visibility !== null);
  if (visibleDimensions.length === 0) {
    return {
      status: "none",
      reason: "sparse",
      message: copy.sparse,
    };
  }
  if (candidates.length === 0) {
    return {
      status: "none",
      reason: "unsupported",
      message: copy.unsupported,
    };
  }

  const sortedCandidates = [...candidates].sort(compareCandidates);
  let primary: ProfileCandidate | undefined;
  if (sortedCandidates.length === 1) {
    primary = sortedCandidates[0];
  } else {
    primary = sortedCandidates.find((candidate) =>
      sortedCandidates.every((other) => candidate === other || dominates(candidate, other)),
    );
    if (primary?.contextual) primary = undefined;
  }

  if (!primary) {
    return {
      status: "mixed",
      candidateIds: sortedCandidates.slice(0, 2).map(({ definition }) => definition.id),
      message: copy.mixed,
    };
  }

  return {
    status: "profile",
    strength: primary.strength,
    definition: primary.definition,
    basis: primary.basis,
    contextual: primary.contextual,
    secondarySignals: selectSecondarySignals(evaluations, primary.definition.dimensions, locale),
    evidence: primary.evidence,
    why: buildWhy(primary, locale),
  };
}
