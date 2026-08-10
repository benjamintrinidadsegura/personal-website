import {
  selfProfileDefinitions,
  selfProfileSecondaryCopy,
} from "@/data/find-your-next-step-self-profile";
import type {
  SelfProfileDefinition,
  SelfProfileId,
} from "@/data/find-your-next-step-self-profile";
import {
  selfReflectionDimensions,
  selfReflectionQuestions,
} from "@/data/find-your-next-step-self";
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

const mixedMessage =
  "Deine Momentaufnahme ist gerade vielseitiger als eindeutig. Mehrere Profil-Linsen wären ähnlich gut begründbar; deshalb stellt FYNS bewusst keine davon an die erste Stelle.";

function collectCandidateEvidence(
  answers: SelfReflectionAnswers,
  dimensions: readonly [SelfReflectionDimensionId, SelfReflectionDimensionId],
): CandidateEvidence {
  const questionIds = new Set<string>();
  const sectionIds = new Set<SelfReflectionSectionId>();
  const directPairQuestionIds = new Set<string>();

  for (const question of selfReflectionQuestions) {
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
): readonly SelfProfileSecondarySignal[] {
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
    const baseText = selfProfileSecondaryCopy[evaluation.dimension];
    return [{
      dimension: evaluation.dimension,
      label: selfReflectionDimensions[evaluation.dimension].label,
      visibility: evaluation.visibility,
      contextual: evaluation.contextual,
      text: evaluation.contextual
        ? `Situationsabhängig zeigt sich zusätzlich: ${baseText}`
        : baseText,
    }];
  });
}

function buildWhy(candidate: ProfileCandidate): string {
  if (candidate.basis === "co-visible") {
    const [first, second] = candidate.evidence.dimensions;
    return `${selfReflectionDimensions[first.dimension].label} und ${selfReflectionDimensions[second.dimension].label} zeigen sich jeweils klar und eigenständig in mehreren Bereichen. Die Kombination wurde jedoch nicht direkt als gemeinsames Muster gewählt und bleibt deshalb eine mögliche redaktionelle Lesart.`;
  }

  const breadth = candidate.evidence.supportingSectionCount === 1
    ? "einem Abschnitt"
    : `${candidate.evidence.supportingSectionCount} Abschnitten`;
  if (candidate.basis === "tension") {
    return `Beide Signale sind sichtbar und erscheinen in deinem bestehenden Ergebnis bereits als Spannungsfeld. Antworten aus ${breadth} tragen diese Verbindung, ohne daraus eine dauerhafte Identität abzuleiten.`;
  }
  return `Beide Signale sind sichtbar und wurden in mindestens einer Antwort direkt gemeinsam gewählt. Weitere Hinweise aus insgesamt ${breadth} stützen die Profil-Linse.`;
}

function buildCandidates(
  answers: SelfReflectionAnswers,
  result: SelfReflectionResult,
): {
  candidates: readonly ProfileCandidate[];
  evaluations: ReturnType<typeof calculateSelfReflectionScores>;
} {
  const evaluations = calculateSelfReflectionScores(answers);
  const evaluationsByDimension = new Map(evaluations.map((evaluation) => [evaluation.dimension, evaluation]));
  const visibleTensionIds = new Set(result.tensions.map(({ id }) => id));

  const candidates = selfProfileDefinitions.flatMap((definition, libraryIndex) => {
    const dimensionEvaluations = definition.dimensions.map((dimension) => evaluationsByDimension.get(dimension));
    if (dimensionEvaluations.some((evaluation) => !evaluation?.visibility)) return [];

    const visibleEvaluations = dimensionEvaluations as (typeof evaluations)[number][];
    const candidateEvidence = collectCandidateEvidence(answers, definition.dimensions);

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
): SelfProfileIdentityResult {
  if (getMissingSelfReflectionQuestionIds(answers).length > 0) {
    return {
      status: "none",
      reason: "incomplete",
      message: "Die Profil-Linse entsteht erst, wenn alle Reflexionsfragen beantwortet sind.",
    };
  }

  let result = existingResult;
  if (!result) {
    const built = buildSelfReflectionResult(answers);
    if (built.status !== "complete") {
      return {
        status: "none",
        reason: "incomplete",
        message: "Die Profil-Linse entsteht erst, wenn alle Reflexionsfragen beantwortet sind.",
      };
    }
    result = built.result;
  }

  const { candidates, evaluations } = buildCandidates(answers, result);
  const visibleDimensions = evaluations.filter(({ visibility }) => visibility !== null);
  if (visibleDimensions.length === 0) {
    return {
      status: "none",
      reason: "sparse",
      message: "Deine Antworten zeigen diesmal einzelne Hinweise, aber kein ausreichend klares gemeinsames Muster für eine Profil-Linse. FYNS lässt die Zuordnung deshalb bewusst offen – auch das ist ein valides Ergebnis.",
    };
  }
  if (candidates.length === 0) {
    return {
      status: "none",
      reason: "unsupported",
      message: "In deiner Momentaufnahme sind einzelne Themen erkennbar, aber keine der kuratierten Profil-Linsen ist ausreichend belegt.",
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
      message: mixedMessage,
    };
  }

  return {
    status: "profile",
    strength: primary.strength,
    definition: primary.definition,
    basis: primary.basis,
    contextual: primary.contextual,
    secondarySignals: selectSecondarySignals(evaluations, primary.definition.dimensions),
    evidence: primary.evidence,
    why: buildWhy(primary),
  };
}
