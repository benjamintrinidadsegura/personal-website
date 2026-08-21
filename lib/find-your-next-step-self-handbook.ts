import {
  getSelfHandbookActivityDefinitions,
  getSelfHandbookExperimentDefinitions,
  getSelfHandbookPatterns,
  getSelfHandbookTextDefinitions,
  selfHandbookActivityDefinitions,
  selfHandbookExperimentDefinitions,
  selfHandbookPatterns,
  selfHandbookTextDefinitions,
} from "@/data/find-your-next-step-self-handbook";
import type {
  SelfHandbookActivityDefinition,
  SelfHandbookExperimentArea,
  SelfHandbookPatternDefinition,
  SelfHandbookTextKind,
} from "@/data/find-your-next-step-self-handbook";
import {
  getSelfReflectionQuestions,
  selfReflectionQuestions,
  selfReflectionSections,
} from "@/data/find-your-next-step-self";
import type { Locale } from "@/lib/i18n/config";
import {
  calculateSelfReflectionScores,
  getMissingSelfReflectionQuestionIds,
  selfReflectionDimensionOrder,
} from "@/lib/find-your-next-step-self";
import type { SelfReflectionDimensionEvaluation } from "@/lib/find-your-next-step-self";
import type {
  SelfReflectionAnswers,
  SelfReflectionDimensionId,
  SelfReflectionEvidenceRole,
  SelfReflectionSectionId,
  SelfReflectionVisibility,
} from "@/types/find-your-next-step";

export interface SelfHandbookSource {
  patternId: string;
  label: string;
  dimensions: readonly SelfReflectionDimensionId[];
  visibility: SelfReflectionVisibility;
  contextual: boolean;
}

export interface SelfHandbookItem {
  id: string;
  text: string;
  source: SelfHandbookSource;
}

export interface SelfHandbookActivityExample {
  id: string;
  activity: string;
  why: string;
}

export interface SelfHandbookActivity {
  id: string;
  title: string;
  properties: readonly string[];
  why: string;
  examples: readonly SelfHandbookActivityExample[];
  source: SelfHandbookSource;
}

export interface SelfHandbookExperiment {
  id: string;
  title: string;
  framing: string;
  action: string;
  scope?: string;
  observe: string;
  area: SelfHandbookExperimentArea;
  source: SelfHandbookSource;
}

export interface SelfHandbook {
  decisionQuestions: readonly SelfHandbookItem[];
  environmentChecklist: readonly SelfHandbookItem[];
  energySupports: readonly SelfHandbookItem[];
  energyWatchouts: readonly SelfHandbookItem[];
  workStrategies: readonly SelfHandbookItem[];
  learningIdeas: readonly SelfHandbookItem[];
  activitySuggestions: readonly SelfHandbookActivity[];
  experiments: readonly SelfHandbookExperiment[];
}

interface EvidenceHit {
  questionId: string;
  sectionId: SelfReflectionSectionId;
  optionId: string;
  role: SelfReflectionEvidenceRole;
}

interface SourceEvaluation {
  source: SelfHandbookSource;
  explicitPair: boolean;
  evidenceQuestionCount: number;
  weakestRatio: number;
  sectionBreadth: number;
}

interface RankedCandidate<T> extends SourceEvaluation {
  id: string;
  semanticKey: string;
  normalizedText: string;
  suppresses: readonly string[];
  libraryIndex: number;
  value: T;
}

const patternById = new Map(selfHandbookPatterns.map((pattern) => [pattern.id, pattern]));
const knownEvidenceRoles: readonly SelfReflectionEvidenceRole[] = [
  "priority",
  "work",
  "decision",
  "energyGain",
  "energyDrain",
  "condition",
  "selfImage",
  "context",
  "synthesis",
];

function normalizeText(value: string, locale: Locale = "de"): string {
  return value.trim().toLocaleLowerCase({ de: "de-DE", en: "en-GB", es: "es", tr: "tr", pl: "pl", el: "el", ru: "ru" }[locale]).replace(/\s+/gu, " ");
}

function lowerFirst(value: string, locale: Locale): string {
  return value.length === 0 ? value : `${value[0].toLocaleLowerCase({ de: "de-DE", en: "en-GB", es: "es", tr: "tr", pl: "pl", el: "el", ru: "ru" }[locale])}${value.slice(1)}`;
}

function collectEvidence(answers: SelfReflectionAnswers, locale: Locale): {
  byDimension: ReadonlyMap<SelfReflectionDimensionId, readonly EvidenceHit[]>;
  selectedSignalSets: readonly {
    questionId: string;
    dimensions: ReadonlySet<SelfReflectionDimensionId>;
  }[];
} {
  const mutableByDimension = new Map<SelfReflectionDimensionId, EvidenceHit[]>();
  const selectedSignalSets: {
    questionId: string;
    dimensions: ReadonlySet<SelfReflectionDimensionId>;
  }[] = [];

  for (const question of getSelfReflectionQuestions(locale)) {
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      if (!option) continue;
      const dimensions = new Set((option.signals ?? []).map(({ dimension }) => dimension));
      if (dimensions.size > 0) selectedSignalSets.push({ questionId: question.id, dimensions });

      for (const dimension of dimensions) {
        const hits = mutableByDimension.get(dimension) ?? [];
        hits.push({
          questionId: question.id,
          sectionId: question.sectionId,
          optionId,
          role: question.evidenceRole,
        });
        mutableByDimension.set(dimension, hits);
      }
    }
  }

  return { byDimension: mutableByDimension, selectedSignalSets };
}

function uniqueDimensions(
  pattern: SelfHandbookPatternDefinition,
  additionalDimensions: readonly SelfReflectionDimensionId[] = [],
): readonly SelfReflectionDimensionId[] {
  return [...new Set([...pattern.dimensions, ...additionalDimensions])];
}

function buildSourceEvaluation({
  pattern,
  sourceId = pattern.id,
  sourceLabel = pattern.label,
  additionalDimensions = [],
  evaluationsByDimension,
  evidenceByDimension,
  selectedSignalSets,
}: {
  pattern: SelfHandbookPatternDefinition;
  sourceId?: string;
  sourceLabel?: string;
  additionalDimensions?: readonly SelfReflectionDimensionId[];
  evaluationsByDimension: ReadonlyMap<SelfReflectionDimensionId, SelfReflectionDimensionEvaluation>;
  evidenceByDimension: ReadonlyMap<SelfReflectionDimensionId, readonly EvidenceHit[]>;
  selectedSignalSets: readonly { questionId: string; dimensions: ReadonlySet<SelfReflectionDimensionId> }[];
}): SourceEvaluation | null {
  const dimensions = uniqueDimensions(pattern, additionalDimensions);
  const evaluations = dimensions.map((dimension) => evaluationsByDimension.get(dimension));
  if (evaluations.some((evaluation) => !evaluation?.visibility)) return null;
  if (dimensions.some((dimension) => (evidenceByDimension.get(dimension) ?? []).length === 0)) return null;

  const evidence = dimensions.flatMap((dimension) => evidenceByDimension.get(dimension) ?? []);
  const questionIds = new Set(evidence.map(({ questionId }) => questionId));
  if (dimensions.length > 1 && questionIds.size < 3) return null;

  const visibleEvaluations = evaluations as SelfReflectionDimensionEvaluation[];
  const visibility: SelfReflectionVisibility = visibleEvaluations.every(({ visibility: level }) => level === "clear")
    ? "clear"
    : "multiple";
  const contextual = visibleEvaluations.some(({ contextual: isContextual }) => isContextual);
  const explicitPair = dimensions.length > 1 && selectedSignalSets.some(({ dimensions: selectedDimensions }) =>
    dimensions.every((dimension) => selectedDimensions.has(dimension)),
  );

  return {
    source: {
      patternId: sourceId,
      label: sourceLabel,
      dimensions,
      visibility,
      contextual,
    },
    explicitPair,
    evidenceQuestionCount: questionIds.size,
    weakestRatio: Math.min(...visibleEvaluations.map(({ score, maximum }) => maximum === 0 ? 0 : score / maximum)),
    sectionBreadth: new Set(evidence.map(({ sectionId }) => sectionId)).size,
  };
}

function hasRequiredRoleEvidence(
  dimensions: readonly SelfReflectionDimensionId[],
  roles: readonly SelfReflectionEvidenceRole[],
  evidenceByDimension: ReadonlyMap<SelfReflectionDimensionId, readonly EvidenceHit[]>,
): boolean {
  return dimensions.every((dimension) =>
    (evidenceByDimension.get(dimension) ?? []).some(({ role }) => roles.includes(role)),
  );
}

function compareCandidates<T>(left: RankedCandidate<T>, right: RankedCandidate<T>): number {
  const visibilityRank = { clear: 2, multiple: 1 } as const;
  const visibilityDifference = visibilityRank[right.source.visibility] - visibilityRank[left.source.visibility];
  if (visibilityDifference !== 0) return visibilityDifference;
  if (left.explicitPair !== right.explicitPair) return left.explicitPair ? -1 : 1;
  if (left.source.dimensions.length !== right.source.dimensions.length) {
    return right.source.dimensions.length - left.source.dimensions.length;
  }
  if (left.evidenceQuestionCount !== right.evidenceQuestionCount) {
    return right.evidenceQuestionCount - left.evidenceQuestionCount;
  }
  if (left.weakestRatio !== right.weakestRatio) return right.weakestRatio - left.weakestRatio;
  if (left.sectionBreadth !== right.sectionBreadth) return right.sectionBreadth - left.sectionBreadth;
  return left.libraryIndex - right.libraryIndex;
}

const handbookQualifierCopy: Record<Locale, { contextualDecision: string; contextual: string; multiple: string; attention: string; trial: string }> = {
  de: { contextualDecision: "Wenn dieser Kontext gerade relevant ist:", contextual: "Je nach Aufgabe könnte Folgendes hilfreich sein:", multiple: "Das könnte einen Versuch wert sein:", attention: "Darauf könntest du achten:", trial: "Für einen Versuch könnte es hilfreich sein:" },
  en: { contextualDecision: "If this context is relevant right now:", contextual: "Depending on the task, this may be helpful:", multiple: "This may be worth trying:", attention: "You could pay attention to this:", trial: "For a small trial, this may be helpful:" },
  es: { contextualDecision: "Si este contexto es relevante ahora:", contextual: "Según la tarea, esto podría ayudarte:", multiple: "Podría merecer la pena probarlo:", attention: "Podrías prestar atención a esto:", trial: "Para una prueba pequeña, esto podría ayudarte:" },
  tr: { contextualDecision: "Bu bağlam şu anda anlamlıysa:", contextual: "Göreve bağlı olarak şu yararlı olabilir:", multiple: "Bunu denemeye değer olabilir:", attention: "Şuna dikkat edebilirsin:", trial: "Küçük bir deneme için şu yararlı olabilir:" },
  pl: { contextualDecision: "Jeśli ten kontekst jest teraz istotny:", contextual: "Zależnie od zadania pomocne może być:", multiple: "Warto to wypróbować:", attention: "Możesz zwrócić uwagę na:", trial: "W małej próbie pomocne może być:" },
  el: { contextualDecision: "Αν αυτό το πλαίσιο είναι τώρα σχετικό:", contextual: "Ανάλογα με το έργο, μπορεί να βοηθήσει το εξής:", multiple: "Ίσως αξίζει να το δοκιμάσεις:", attention: "Θα μπορούσες να προσέξεις το εξής:", trial: "Για μια μικρή δοκιμή, μπορεί να βοηθήσει το εξής:" },
  ru: { contextualDecision: "Если этот контекст сейчас актуален:", contextual: "В зависимости от задачи может помочь следующее:", multiple: "Это может стоить небольшой пробы:", attention: "Можно обратить внимание на следующее:", trial: "Для небольшой пробы может помочь следующее:" },
};

function qualifyText(kind: SelfHandbookTextKind, text: string, source: SelfHandbookSource, locale: Locale): string {
  const copy = handbookQualifierCopy[locale];
  if (source.contextual) return `${kind === "decision" ? copy.contextualDecision : copy.contextual} ${text}`;
  if (source.visibility === "multiple") return `${copy.multiple} ${text}`;
  if (kind === "decision") return text;
  if (kind === "environment" || kind === "energyWatchout") return `${copy.attention} ${text}`;
  return `${copy.trial} ${text}`;
}

function selectCandidates<T>(candidates: readonly RankedCandidate<T>[], limit: number): readonly T[] {
  const selected: T[] = [];
  const ids = new Set<string>();
  const semanticKeys = new Set<string>();
  const normalizedTexts = new Set<string>();
  const suppressedSemanticKeys = new Set<string>();

  for (const candidate of [...candidates].sort(compareCandidates)) {
    if (selected.length >= limit) break;
    if (
      ids.has(candidate.id)
      || semanticKeys.has(candidate.semanticKey)
      || normalizedTexts.has(candidate.normalizedText)
      || suppressedSemanticKeys.has(candidate.semanticKey)
    ) continue;

    ids.add(candidate.id);
    semanticKeys.add(candidate.semanticKey);
    normalizedTexts.add(candidate.normalizedText);
    for (const semanticKey of candidate.suppresses) suppressedSemanticKeys.add(semanticKey);
    selected.push(candidate.value);
  }

  return selected;
}

function buildTextCandidates({
  kind,
  evaluationsByDimension,
  evidenceByDimension,
  selectedSignalSets,
  locale,
}: {
  kind: SelfHandbookTextKind;
  evaluationsByDimension: ReadonlyMap<SelfReflectionDimensionId, SelfReflectionDimensionEvaluation>;
  evidenceByDimension: ReadonlyMap<SelfReflectionDimensionId, readonly EvidenceHit[]>;
  selectedSignalSets: readonly { questionId: string; dimensions: ReadonlySet<SelfReflectionDimensionId> }[];
  locale: Locale;
}): readonly RankedCandidate<SelfHandbookItem>[] {
  const patterns = new Map(getSelfHandbookPatterns(locale).map((pattern) => [pattern.id, pattern]));
  return getSelfHandbookTextDefinitions(locale).flatMap((definition, libraryIndex) => {
    if (definition.kind !== kind) return [];
    const pattern = patterns.get(definition.patternId);
    if (!pattern) return [];
    const sourceEvaluation = buildSourceEvaluation({
      pattern,
      sourceId: definition.requiredDimensions?.length ? definition.id : pattern.id,
      sourceLabel: definition.sourceLabel ?? pattern.label,
      additionalDimensions: definition.requiredDimensions,
      evaluationsByDimension,
      evidenceByDimension,
      selectedSignalSets,
    });
    if (!sourceEvaluation) return [];
    if (!hasRequiredRoleEvidence(sourceEvaluation.source.dimensions, definition.roles, evidenceByDimension)) return [];
    const variants = [
      { id: definition.id, semanticKey: definition.semanticKey, text: definition.text },
      ...(definition.followUp ? [definition.followUp] : []),
    ];
    return variants.map((variant, variantIndex) => {
      const text = qualifyText(kind, variant.text, sourceEvaluation.source, locale);
      return {
        ...sourceEvaluation,
        id: variant.id,
        semanticKey: variant.semanticKey,
        normalizedText: normalizeText(text, locale),
        suppresses: definition.suppresses ?? [],
        libraryIndex: (libraryIndex * 2) + variantIndex,
        value: { id: variant.id, text, source: sourceEvaluation.source },
      };
    });
  });
}

function contextualizeActivityWhy(definition: SelfHandbookActivityDefinition, source: SelfHandbookSource, locale: Locale): string {
  const prefix: Record<Locale, string> = { de: "Wenn dieser Kontext gerade relevant ist,", en: "If this context is relevant right now,", es: "Si este contexto es relevante ahora,", tr: "Bu bağlam şu anda anlamlıysa,", pl: "Jeśli ten kontekst jest teraz istotny,", el: "Αν αυτό το πλαίσιο είναι τώρα σχετικό,", ru: "Если этот контекст сейчас актуален," };
  return source.contextual
    ? `${prefix[locale]} ${lowerFirst(definition.why, locale)}`
    : definition.why;
}

function buildActivityCandidates({
  evaluationsByDimension,
  evidenceByDimension,
  selectedSignalSets,
  locale,
}: {
  evaluationsByDimension: ReadonlyMap<SelfReflectionDimensionId, SelfReflectionDimensionEvaluation>;
  evidenceByDimension: ReadonlyMap<SelfReflectionDimensionId, readonly EvidenceHit[]>;
  selectedSignalSets: readonly { questionId: string; dimensions: ReadonlySet<SelfReflectionDimensionId> }[];
  locale: Locale;
}): readonly RankedCandidate<SelfHandbookActivity>[] {
  const patterns = new Map(getSelfHandbookPatterns(locale).map((pattern) => [pattern.id, pattern]));
  return getSelfHandbookActivityDefinitions(locale).flatMap((definition, libraryIndex) => {
    const pattern = patterns.get(definition.patternId);
    if (!pattern) return [];
    const sourceEvaluation = buildSourceEvaluation({
      pattern,
      evaluationsByDimension,
      evidenceByDimension,
      selectedSignalSets,
    });
    if (!sourceEvaluation) return [];
    if (!hasRequiredRoleEvidence(sourceEvaluation.source.dimensions, definition.roles, evidenceByDimension)) return [];
    const why = contextualizeActivityWhy(definition, sourceEvaluation.source, locale);
    return [{
      ...sourceEvaluation,
      id: definition.id,
      semanticKey: definition.semanticKey,
      normalizedText: normalizeText(`${definition.title} ${why}`, locale),
      suppresses: [],
      libraryIndex,
      value: {
        id: definition.id,
        title: definition.title,
        properties: definition.properties,
        why,
        examples: definition.examples,
        source: sourceEvaluation.source,
      },
    }];
  });
}

function selectActivities(candidates: readonly RankedCandidate<SelfHandbookActivity>[], locale: Locale): readonly SelfHandbookActivity[] {
  const selected: SelfHandbookActivity[] = [];
  const ids = new Set<string>();
  const semanticKeys = new Set<string>();
  const normalizedTexts = new Set<string>();
  const exampleIds = new Set<string>();
  const exampleNames = new Set<string>();

  for (const candidate of [...candidates].sort(compareCandidates)) {
    if (selected.length >= 4) break;
    if (
      ids.has(candidate.id)
      || semanticKeys.has(candidate.semanticKey)
      || normalizedTexts.has(candidate.normalizedText)
    ) continue;

    const examples = candidate.value.examples.filter((example) => {
      const normalizedName = normalizeText(example.activity, locale);
      return !exampleIds.has(example.id) && !exampleNames.has(normalizedName);
    });
    if (examples.length < 2) continue;

    const boundedExamples = examples.slice(0, 4);
    ids.add(candidate.id);
    semanticKeys.add(candidate.semanticKey);
    normalizedTexts.add(candidate.normalizedText);
    for (const example of boundedExamples) {
      exampleIds.add(example.id);
      exampleNames.add(normalizeText(example.activity, locale));
    }
    selected.push({ ...candidate.value, examples: boundedExamples });
  }

  return selected;
}

function experimentFraming(source: SelfHandbookSource, locale: Locale): string {
  const copy: Record<Locale, { contextual: string; clear: string; multiple: string }> = {
    de: { contextual: "Wenn dieser Kontext gerade relevant ist, könntest du diesen kleinen Versuch nutzen.", clear: "Für einen Versuch könnte es hilfreich sein, diese Hypothese praktisch zu prüfen.", multiple: "Das könnte einen Versuch wert sein." },
    en: { contextual: "If this context is relevant right now, you could use this small experiment.", clear: "For a small trial, it may be helpful to test this hypothesis in practice.", multiple: "This may be worth trying." },
    es: { contextual: "Si este contexto es relevante ahora, podrías usar este pequeño experimento.", clear: "En una prueba pequeña, podría ayudarte comprobar esta hipótesis en la práctica.", multiple: "Podría merecer la pena probarlo." },
    tr: { contextual: "Bu bağlam şu anda anlamlıysa bu küçük denemeyi kullanabilirsin.", clear: "Küçük bir denemede bu varsayımı uygulamada sınamak yararlı olabilir.", multiple: "Bunu denemeye değer olabilir." },
    pl: { contextual: "Jeśli ten kontekst jest teraz istotny, możesz wykorzystać tę małą próbę.", clear: "W małej próbie pomocne może być sprawdzenie tej hipotezy w praktyce.", multiple: "Warto to wypróbować." },
    el: { contextual: "Αν αυτό το πλαίσιο είναι τώρα σχετικό, μπορείς να χρησιμοποιήσεις αυτό το μικρό πείραμα.", clear: "Σε μια μικρή δοκιμή μπορεί να βοηθήσει να ελέγξεις αυτή την υπόθεση στην πράξη.", multiple: "Ίσως αξίζει να το δοκιμάσεις." },
    ru: { contextual: "Если этот контекст сейчас актуален, можно использовать этот небольшой эксперимент.", clear: "В небольшой пробе полезно проверить эту гипотезу на практике.", multiple: "Это может стоить небольшой пробы." },
  };
  if (source.contextual) return copy[locale].contextual;
  return source.visibility === "clear" ? copy[locale].clear : copy[locale].multiple;
}

function buildExperimentCandidates({
  evaluationsByDimension,
  evidenceByDimension,
  selectedSignalSets,
  locale,
}: {
  evaluationsByDimension: ReadonlyMap<SelfReflectionDimensionId, SelfReflectionDimensionEvaluation>;
  evidenceByDimension: ReadonlyMap<SelfReflectionDimensionId, readonly EvidenceHit[]>;
  selectedSignalSets: readonly { questionId: string; dimensions: ReadonlySet<SelfReflectionDimensionId> }[];
  locale: Locale;
}): readonly RankedCandidate<SelfHandbookExperiment>[] {
  const patterns = new Map(getSelfHandbookPatterns(locale).map((pattern) => [pattern.id, pattern]));
  return getSelfHandbookExperimentDefinitions(locale).flatMap((definition, libraryIndex) => {
    const pattern = patterns.get(definition.patternId);
    if (!pattern) return [];
    const sourceEvaluation = buildSourceEvaluation({
      pattern,
      evaluationsByDimension,
      evidenceByDimension,
      selectedSignalSets,
    });
    if (!sourceEvaluation) return [];
    if (!hasRequiredRoleEvidence(sourceEvaluation.source.dimensions, definition.roles, evidenceByDimension)) return [];
    const framing = experimentFraming(sourceEvaluation.source, locale);
    return [{
      ...sourceEvaluation,
      id: definition.id,
      semanticKey: definition.semanticKey,
      normalizedText: normalizeText(`${definition.title} ${definition.action}`, locale),
      suppresses: definition.suppresses ?? [],
      libraryIndex,
      value: {
        id: definition.id,
        title: definition.title,
        framing,
        action: definition.action,
        scope: definition.scope,
        observe: definition.observe,
        area: definition.area,
        source: sourceEvaluation.source,
      },
    }];
  });
}

function selectExperiments(
  candidates: readonly RankedCandidate<SelfHandbookExperiment>[],
): readonly SelfHandbookExperiment[] {
  const ranked = [...candidates].sort(compareCandidates);
  const selectedCandidates: RankedCandidate<SelfHandbookExperiment>[] = [];
  const areas = new Set<SelfHandbookExperimentArea>();
  const ids = new Set<string>();
  const semanticKeys = new Set<string>();
  const normalizedTexts = new Set<string>();
  const suppressedSemanticKeys = new Set<string>();

  const trySelect = (candidate: RankedCandidate<SelfHandbookExperiment>) => {
    if (
      ids.has(candidate.id)
      || semanticKeys.has(candidate.semanticKey)
      || normalizedTexts.has(candidate.normalizedText)
      || suppressedSemanticKeys.has(candidate.semanticKey)
    ) return false;
    ids.add(candidate.id);
    semanticKeys.add(candidate.semanticKey);
    normalizedTexts.add(candidate.normalizedText);
    for (const semanticKey of candidate.suppresses) suppressedSemanticKeys.add(semanticKey);
    areas.add(candidate.value.area);
    selectedCandidates.push(candidate);
    return true;
  };

  for (const candidate of ranked) {
    if (selectedCandidates.length >= 3) break;
    if (areas.has(candidate.value.area)) continue;
    trySelect(candidate);
  }
  for (const candidate of ranked) {
    if (selectedCandidates.length >= 3) break;
    trySelect(candidate);
  }

  return selectedCandidates.map(({ value }) => value);
}

export function buildSelfHandbook(answers: SelfReflectionAnswers, locale: Locale = "de"): SelfHandbook | null {
  if (getMissingSelfReflectionQuestionIds(answers, locale).length > 0) return null;

  const evaluations = calculateSelfReflectionScores(answers, locale);
  const evaluationsByDimension = new Map(evaluations.map((evaluation) => [evaluation.dimension, evaluation]));
  const { byDimension: evidenceByDimension, selectedSignalSets } = collectEvidence(answers, locale);
  const candidateInput = { evaluationsByDimension, evidenceByDimension, selectedSignalSets, locale };

  const decisionQuestions = selectCandidates(buildTextCandidates({ kind: "decision", ...candidateInput }), 5);
  const environmentChecklist = selectCandidates(buildTextCandidates({ kind: "environment", ...candidateInput }), 6);
  const energySupports = selectCandidates(buildTextCandidates({ kind: "energySupport", ...candidateInput }), 2);
  const energyWatchouts = selectCandidates(buildTextCandidates({ kind: "energyWatchout", ...candidateInput }), 2);
  const workStrategies = selectCandidates(buildTextCandidates({ kind: "work", ...candidateInput }), 4);
  const learningIdeas = selectCandidates(buildTextCandidates({ kind: "learning", ...candidateInput }), 2);

  return {
    decisionQuestions: decisionQuestions.length >= 2 ? decisionQuestions : [],
    environmentChecklist,
    energySupports,
    energyWatchouts,
    workStrategies,
    learningIdeas,
    activitySuggestions: selectActivities(buildActivityCandidates(candidateInput), locale),
    experiments: selectExperiments(buildExperimentCandidates(candidateInput)),
  };
}

export function validateSelfHandbookData(): string[] {
  const errors: string[] = [];
  const knownDimensions = new Set(selfReflectionDimensionOrder);
  const knownRoles = new Set(knownEvidenceRoles);
  const patternIds = new Set<string>();
  const contentIds = new Set<string>();
  const exampleIds = new Set<string>();
  const exampleNames = new Set<string>();
  const optionIds = new Set(selfReflectionQuestions.flatMap(({ options }) => options.map(({ id }) => id)));
  const prohibitedCopy = /\b(?:du bist|du brauchst|du solltest unbedingt|dein perfektes hobby|passt zu deiner persönlichkeit|dafür geeignet|talent für|adhs|autismus|depression|trauma|angststörung|burnout|neurodivergenz|persönlichkeitsstörung|nervensystem|archetyp|persönlichkeitstyp)\b/iu;

  const registerContentId = (id: string) => {
    if (!id.trim()) errors.push("Handbook content contains an empty id.");
    if (contentIds.has(id)) errors.push(`Duplicate Handbook content id: ${id}`);
    contentIds.add(id);
  };
  const validateCopy = (id: string, values: readonly string[]) => {
    for (const value of values) {
      if (!value.trim()) errors.push(`Empty Handbook copy: ${id}`);
      if (prohibitedCopy.test(value)) errors.push(`Prohibited Handbook copy: ${id}`);
    }
  };
  const validateRoles = (id: string, roles: readonly SelfReflectionEvidenceRole[]) => {
    if (roles.length === 0) errors.push(`Missing Handbook evidence roles: ${id}`);
    for (const role of roles) if (!knownRoles.has(role)) errors.push(`Unknown Handbook evidence role on ${id}: ${role}`);
  };

  for (const pattern of selfHandbookPatterns) {
    if (patternIds.has(pattern.id)) errors.push(`Duplicate Handbook pattern id: ${pattern.id}`);
    patternIds.add(pattern.id);
    if (!pattern.label.trim()) errors.push(`Empty Handbook pattern label: ${pattern.id}`);
    if (pattern.dimensions.length < 1 || pattern.dimensions.length > 2) errors.push(`Invalid Handbook pattern size: ${pattern.id}`);
    if (new Set(pattern.dimensions).size !== pattern.dimensions.length) errors.push(`Duplicate Handbook pattern dimension: ${pattern.id}`);
    for (const dimension of pattern.dimensions) {
      if (!knownDimensions.has(dimension)) errors.push(`Unknown Handbook pattern dimension: ${pattern.id}:${dimension}`);
    }
  }
  if (selfHandbookPatterns.filter(({ dimensions }) => dimensions.length === 2).length !== 7) {
    errors.push("Handbook must define exactly seven general combined patterns.");
  }

  for (const definition of selfHandbookTextDefinitions) {
    registerContentId(definition.id);
    if (definition.followUp) registerContentId(definition.followUp.id);
    if (!patternIds.has(definition.patternId)) errors.push(`Unknown Handbook pattern on ${definition.id}.`);
    if (!definition.semanticKey.trim()) errors.push(`Empty Handbook semantic key: ${definition.id}`);
    validateRoles(definition.id, definition.roles);
    validateCopy(definition.id, [definition.text, definition.sourceLabel ?? "valid", definition.followUp?.text ?? "valid"]);
    if (definition.followUp && !definition.followUp.semanticKey.trim()) errors.push(`Empty Handbook follow-up semantic key: ${definition.followUp.id}`);
    for (const dimension of definition.requiredDimensions ?? []) {
      if (!knownDimensions.has(dimension)) errors.push(`Unknown required Handbook dimension: ${definition.id}:${dimension}`);
    }
    if (definition.kind === "learning" && definition.patternId !== "single-growth") {
      errors.push(`Learning idea does not originate from visible growth: ${definition.id}`);
    }
  }

  for (const definition of selfHandbookActivityDefinitions) {
    registerContentId(definition.id);
    const pattern = patternById.get(definition.patternId);
    if (!pattern) errors.push(`Unknown Activity pattern on ${definition.id}.`);
    if (pattern && pattern.dimensions.length < 2) errors.push(`Activity maps directly from a single dimension: ${definition.id}`);
    if (!definition.semanticKey.trim() || definition.properties.length === 0) errors.push(`Incomplete Activity direction: ${definition.id}`);
    validateRoles(definition.id, definition.roles);
    validateCopy(definition.id, [definition.title, definition.why, ...definition.properties]);
    if (definition.examples.length < 2 || definition.examples.length > 4) errors.push(`Invalid Activity example count: ${definition.id}`);
    for (const example of definition.examples) {
      if (exampleIds.has(example.id)) errors.push(`Duplicate Activity example id: ${example.id}`);
      exampleIds.add(example.id);
      const normalizedName = normalizeText(example.activity);
      if (exampleNames.has(normalizedName)) errors.push(`Duplicate Activity example name: ${example.activity}`);
      exampleNames.add(normalizedName);
      validateCopy(example.id, [example.activity, example.why]);
    }
    const serialized = JSON.stringify(definition);
    for (const optionId of optionIds) {
      if (serialized.includes(optionId)) errors.push(`Activity maps from answer option ${optionId}: ${definition.id}`);
    }
  }

  for (const definition of selfHandbookExperimentDefinitions) {
    registerContentId(definition.id);
    if (!patternIds.has(definition.patternId)) errors.push(`Unknown Experiment pattern on ${definition.id}.`);
    if (!definition.semanticKey.trim()) errors.push(`Empty Experiment semantic key: ${definition.id}`);
    validateRoles(definition.id, definition.roles);
    validateCopy(definition.id, [definition.title, definition.action, definition.scope ?? "valid", definition.observe]);
  }

  if (selfReflectionSections.length !== 5 || selfReflectionQuestions.length !== 16) {
    errors.push("Handbook expects the five-section, sixteen-question Self foundation.");
  }

  return errors;
}
