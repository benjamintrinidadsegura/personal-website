import {
  fynsCharacterConstellationCopy,
  getFynsCharacter,
} from "@/data/find-your-next-step-characters";
import type { FynsCharacterDefinition, FynsCharacterId } from "@/data/find-your-next-step-characters";
import {
  getSelfReflectionDimensions,
  getSelfReflectionQuestions,
  getSelfReflectionTensions,
} from "@/data/find-your-next-step-self";
import {
  calculateSelfReflectionScores,
  orderVisibleSelfReflectionEvaluations,
} from "@/lib/find-your-next-step-self";
import type { SelfHandbook } from "@/lib/find-your-next-step-self-handbook";
import type { SelfProfileIdentityResult } from "@/lib/find-your-next-step-self-profile";
import type { Locale } from "@/lib/i18n/config";
import type {
  SelfReflectionAnswers,
  SelfReflectionDimensionId,
  SelfReflectionResult,
  SelfReflectionResultSectionId,
  SelfReflectionResultStatement,
  SelfReflectionVisibility,
} from "@/types/find-your-next-step";

export const fynsSelfCharacterMappings = {
  variety: "explorer",
  connection: "connector",
  agency: "independent",
  depth: "thinker",
  reliability: "stabilizer",
  growth: "challenger",
  orientation: "organizer",
  making: "builder",
  care: "caregiver",
  expression: "creator",
  harmony: "harmonizer",
  effectiveness: "achiever",
} as const satisfies Partial<Record<SelfReflectionDimensionId, FynsCharacterId>>;

export const fynsExplicitFacetSignalDimensions = [
  "making", "care", "expression", "harmony", "effectiveness",
] as const satisfies readonly SelfReflectionDimensionId[];

export interface FynsVisibleCharacter extends FynsCharacterDefinition {
  sourceDimension: keyof typeof fynsSelfCharacterMappings;
  visibility: SelfReflectionVisibility;
  contextual: boolean;
  why: string;
  contribution: string;
  conditions: string;
  friction: string;
  notice: string;
  semanticIds: readonly string[];
}

export interface FynsCharacterCombination {
  title: string;
  evidence: string;
  interpretation: string;
  possibility: string;
}

export interface FynsCharacterApplication {
  environments?: string;
  energy?: string;
  friction?: string;
  needs?: string;
  reflection?: string;
  experiment?: string;
}

export interface FynsConstellationRelationships {
  reinforcement?: string;
  condition?: string;
  application?: string;
}

export interface FynsCharacterConstellation {
  dominant: FynsVisibleCharacter;
  supporting: readonly FynsVisibleCharacter[];
  combination?: FynsCharacterCombination;
  synthesis: string;
  relationships: FynsConstellationRelationships;
  tensions: readonly { id: string; title: string; text: string; sourceText: string }[];
  application: FynsCharacterApplication;
}

function statementFor(
  result: SelfReflectionResult,
  dimension: SelfReflectionDimensionId,
  preferredSections: readonly SelfReflectionResultSectionId[],
): SelfReflectionResultStatement | undefined {
  for (const sectionId of preferredSections) {
    const statement = result.sections
      .find((section) => section.id === sectionId)
      ?.statements.find(({ id }) => id === `${sectionId}-${dimension}`);
    if (statement) return statement;
  }
  return undefined;
}

function collectDimensionStatements(
  result: SelfReflectionResult,
  dimension: SelfReflectionDimensionId,
): readonly SelfReflectionResultStatement[] {
  return result.sections
    .flatMap(({ statements }) => statements)
    .filter(({ id }) => id.endsWith(`-${dimension}`));
}

function selectedEvidenceLabels(
  answers: SelfReflectionAnswers,
  dimensions: readonly SelfReflectionDimensionId[],
  locale: Locale,
  requireEveryDimension = false,
): readonly string[] {
  const labels: string[] = [];
  for (const question of getSelfReflectionQuestions(locale)) {
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      if (!option) continue;
      const optionDimensions = new Set((option.signals ?? []).map(({ dimension }) => dimension));
      const supported = requireEveryDimension
        ? dimensions.every((dimension) => optionDimensions.has(dimension))
        : dimensions.some((dimension) => optionDimensions.has(dimension));
      if (supported && !labels.includes(option.label)) labels.push(option.label);
    }
  }
  return labels;
}

function sourceSupportsPair(
  sourceDimensions: readonly SelfReflectionDimensionId[],
  pair: readonly SelfReflectionDimensionId[],
): boolean {
  return pair.every((dimension) => sourceDimensions.includes(dimension));
}

function buildCombination(
  answers: SelfReflectionAnswers,
  profileIdentity: SelfProfileIdentityResult | null,
  handbook: SelfHandbook | null,
  locale: Locale,
  visibleDimensions: ReadonlySet<SelfReflectionDimensionId>,
): FynsCharacterCombination | undefined {
  if (profileIdentity?.status !== "profile") return undefined;
  if (!profileIdentity.definition.dimensions.every((dimension) => visibleDimensions.has(dimension))) return undefined;
  if (!profileIdentity.definition.dimensions.every((dimension) => dimension in fynsSelfCharacterMappings)) return undefined;

  const pair = profileIdentity.definition.dimensions;
  const directPairEvidence = selectedEvidenceLabels(answers, pair, locale, true);
  const evidence = directPairEvidence.length > 0
    ? directPairEvidence.slice(0, 2)
    : selectedEvidenceLabels(answers, pair, locale).slice(0, 2);
  if (evidence.length === 0) return undefined;

  const pairExperiment = handbook?.experiments.find(({ source }) => sourceSupportsPair(source.dimensions, pair));
  const pairQuestion = handbook?.decisionQuestions.find(({ source }) => sourceSupportsPair(source.dimensions, pair));

  return {
    title: profileIdentity.definition.name,
    evidence: evidence.join(" · "),
    interpretation: [profileIdentity.definition.tagline, ...profileIdentity.definition.signatureSignals].join(" "),
    possibility: pairExperiment
      ? [pairExperiment.action, pairExperiment.observe].join(" ")
      : pairQuestion?.text ?? profileIdentity.definition.signatureSignals.at(-1) ?? profileIdentity.definition.tagline,
  };
}

export function buildSelfCharacterConstellation({
  answers,
  result,
  profileIdentity,
  handbook,
  locale = "de",
}: {
  answers: SelfReflectionAnswers;
  result: SelfReflectionResult;
  profileIdentity: SelfProfileIdentityResult | null;
  handbook: SelfHandbook | null;
  locale?: Locale;
}): FynsCharacterConstellation | null {
  const copy = fynsCharacterConstellationCopy[locale];
  const dimensionDefinitions = getSelfReflectionDimensions(locale);
  const evaluations = orderVisibleSelfReflectionEvaluations(calculateSelfReflectionScores(answers, locale));

  const visible = evaluations.flatMap((evaluation): FynsVisibleCharacter[] => {
    if (!(evaluation.dimension in fynsSelfCharacterMappings)) return [];
    const dimension = evaluation.dimension as keyof typeof fynsSelfCharacterMappings;
    const statements = collectDimensionStatements(result, dimension);
    if (statements.length === 0) return [];

    const evidenceAnswers = [...new Set(statements.flatMap(({ evidence }) => evidence.map(({ answer }) => answer)))].slice(0, 2);
    if (evidenceAnswers.length === 0) return [];

    const definitionCopy = dimensionDefinitions[dimension].copy;
    const contribution = statementFor(result, dimension, ["importance", "work", "energyGain"]);
    const conditions = statementFor(result, dimension, ["conditions", "energyGain", "work"]);
    const notice = statementFor(result, dimension, ["energyDrain", "work", "conditions"]);
    const fallback = statements[0];
    const contributionText = contribution?.text ?? definitionCopy.importance ?? definitionCopy.work ?? fallback.text;
    const decisionQuestion = handbook?.decisionQuestions.find(({ source }) => source.dimensions.includes(dimension));

    return [{
      ...getFynsCharacter(fynsSelfCharacterMappings[dimension], locale),
      sourceDimension: dimension,
      visibility: evaluation.visibility,
      contextual: evaluation.contextual,
      why: copy.evidenceMeaning(evidenceAnswers, contributionText, evaluation.contextual),
      contribution: contributionText,
      conditions: conditions?.text ?? definitionCopy.conditions ?? definitionCopy.energyGain ?? fallback.text,
      friction: notice?.text ?? definitionCopy.energyDrain ?? definitionCopy.work ?? fallback.text,
      notice: decisionQuestion?.text ?? definitionCopy.energyGain ?? definitionCopy.work ?? fallback.text,
      semanticIds: statements.map(({ id }) => id),
    }];
  }).slice(0, 4);

  const dominant = visible[0];
  if (!dominant) return null;

  const supporting = visible.slice(1, 4);
  const visibleDimensions = new Set<SelfReflectionDimensionId>(visible.map(({ sourceDimension }) => sourceDimension));
  const tensionDimensions = new Map(getSelfReflectionTensions(locale).map(({ id, dimensions }) => [id, dimensions]));
  const tensions = result.tensions
    .filter(({ id }) => tensionDimensions.get(id)?.every((dimension) => visibleDimensions.has(dimension)))
    .map(({ id, title, text }) => ({ id, title, sourceText: text, text: copy.tensionFrame(text) }));

  const combination = buildCombination(answers, profileIdentity, handbook, locale, visibleDimensions);
  const profilePair = profileIdentity?.status === "profile"
    ? profileIdentity.definition.dimensions
    : null;
  const pairEnvironment = profilePair
    ? handbook?.environmentChecklist.find(({ source }) => sourceSupportsPair(source.dimensions, profilePair))
    : undefined;
  const pairNeed = profilePair
    ? handbook?.workStrategies.find(({ source }) => sourceSupportsPair(source.dimensions, profilePair))
      ?? handbook?.decisionQuestions.find(({ source }) => sourceSupportsPair(source.dimensions, profilePair))
    : undefined;
  const pairExperiment = profilePair
    ? handbook?.experiments.find(({ source }) => sourceSupportsPair(source.dimensions, profilePair))
    : undefined;
  const relationships: FynsConstellationRelationships = {
    reinforcement: combination?.interpretation,
    condition: pairEnvironment?.text ?? pairNeed?.text,
    application: pairExperiment
      ? [pairExperiment.action, pairExperiment.observe].join(" ")
      : combination?.possibility,
  };
  const synthesis = [
    copy.synthesisLead(dominant.name, supporting.map(({ name }) => name)),
    ...result.summary,
    relationships.reinforcement,
    relationships.condition,
  ].filter((sentence): sentence is string => Boolean(sentence)).join(" ");

  const firstExperiment = pairExperiment ?? handbook?.experiments[0];
  const isExplicitFacetSignal = fynsExplicitFacetSignalDimensions.includes(
    dominant.sourceDimension as (typeof fynsExplicitFacetSignalDimensions)[number],
  );
  const dominantEvidence = selectedEvidenceLabels(answers, [dominant.sourceDimension], locale)[0]
    ?? dominant.contribution;
  return {
    dominant,
    supporting,
    combination,
    synthesis,
    relationships,
    tensions,
    application: {
      environments: isExplicitFacetSignal ? dominant.conditions : pairEnvironment?.text ?? handbook?.environmentChecklist[0]?.text,
      energy: isExplicitFacetSignal ? dominant.contribution : handbook?.energySupports[0]?.text,
      friction: isExplicitFacetSignal ? dominant.friction : handbook?.energyWatchouts[0]?.text,
      needs: isExplicitFacetSignal ? dominant.conditions : pairNeed?.text ?? handbook?.workStrategies[0]?.text,
      reflection: isExplicitFacetSignal
        ? copy.facetReflection(dominantEvidence)
        : handbook?.decisionQuestions.find(({ source }) => profilePair && sourceSupportsPair(source.dimensions, profilePair))?.text
          ?? handbook?.decisionQuestions[0]?.text,
      experiment: isExplicitFacetSignal
        ? copy.facetExperiment(dominantEvidence)
        : firstExperiment
        ? [firstExperiment.action, firstExperiment.observe].join(" ")
        : undefined,
    },
  };
}
