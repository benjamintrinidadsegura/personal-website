import {
  careerActivitySignalIds,
  careerConstraintIds,
  careerConstraintSummaryCopy,
  careerDirections,
  careerEnvironmentSignalIds,
  careerJobTitles,
  careerMotivationSignalIds,
  careerQuestions,
  careerSections,
  careerSignalCopy,
  careerSignalIds,
  careerTensionDefinitions,
} from "@/data/find-your-next-step-career";
import type {
  CareerActivitySignalId,
  CareerAnswers,
  CareerCondition,
  CareerConstraintId,
  CareerDirection,
  CareerDirectionId,
  CareerEvidence,
  CareerJourneyAction,
  CareerJourneyState,
  CareerJobTitleDefinition,
  CareerNextStep,
  CareerNextStepMode,
  CareerQualificationScope,
  CareerQuestion,
  CareerQuestionOption,
  CareerResult,
  CareerResultDirection,
  CareerResultJobTitle,
  CareerSectionId,
  CareerSignalId,
  CareerTensionResult,
} from "@/types/find-your-next-step";

export const CAREER_PRIMARY_THRESHOLD = 0.5;
export const CAREER_ADDITIONAL_THRESHOLD = 0.3;
export const CAREER_JOB_RESULT_LIMIT = 8;
export const CAREER_WEAK_JOB_RESULT_LIMIT = 4;
export const CAREER_HYBRID_JOB_LIMIT = 3;
export const CAREER_ADDITIONAL_JOB_LIMIT = 2;

interface WeightedCareerEvidence extends CareerEvidence {
  contribution: number;
  coreActivity: boolean;
}

export interface CareerDirectionEvaluation {
  directionId: CareerDirectionId;
  score: number;
  evidenceQuestionCount: number;
  evidenceSectionCount: number;
  coreActivityQuestionCount: number;
  evidence: readonly WeightedCareerEvidence[];
}

export const initialCareerState: CareerJourneyState = {
  phase: "intro",
  questionIndex: 0,
  answers: {},
  validationMessage: null,
  editingSectionId: null,
  restartPending: false,
};

export function enumerateValidCareerSelections(question: CareerQuestion): readonly (readonly string[])[] {
  const selections: string[][] = [];
  const optionIds = question.options.map(({ id }) => id);

  function visit(startIndex: number, selected: string[]) {
    if (selected.length >= question.minSelections && selected.length <= question.maxSelections) {
      const selectedOptions = selected.map((optionId) => question.options.find(({ id }) => id === optionId));
      if (!selectedOptions.some((option) => option?.exclusive) || selected.length === 1) {
        selections.push([...selected]);
      }
    }
    if (selected.length === question.maxSelections) return;

    for (let index = startIndex; index < optionIds.length; index += 1) {
      const option = question.options[index];
      if (option.exclusive && selected.length > 0) continue;
      if (selected.some((optionId) => question.options.find(({ id }) => id === optionId)?.exclusive)) continue;
      visit(index + 1, [...selected, option.id]);
    }
  }

  visit(0, []);
  return selections;
}

export function isCareerQuestionComplete(
  question: CareerQuestion,
  optionIds: readonly string[] | undefined,
): boolean {
  if (!optionIds) return false;
  const selectedIds = new Set(optionIds);
  if (selectedIds.size !== optionIds.length) return false;
  if (optionIds.length < question.minSelections || optionIds.length > question.maxSelections) return false;
  const selectedOptions = optionIds.map((optionId) => question.options.find(({ id }) => id === optionId));
  if (selectedOptions.some((option) => !option)) return false;
  if (selectedOptions.some((option) => option?.exclusive) && selectedOptions.length !== 1) return false;
  return true;
}

export function getMissingCareerQuestionIds(answers: CareerAnswers): string[] {
  return careerQuestions
    .filter((question) => !isCareerQuestionComplete(question, answers[question.id]))
    .map(({ id }) => id);
}

function optionDirectionContribution(option: CareerQuestionOption, direction: CareerDirection): number {
  const profileWeights = new Map(direction.profile.map(({ signalId, weight }) => [signalId, weight]));
  return (option.signals ?? []).reduce(
    (total, careerSignal) => total + careerSignal.weight * (profileWeights.get(careerSignal.id) ?? 0),
    0,
  );
}

export function calculateCareerQuestionCapacity(
  question: CareerQuestion,
  direction: CareerDirection,
): number {
  if (question.matchingWeight === 0) return 0;
  return Math.max(
    0,
    ...enumerateValidCareerSelections(question).map((selection) =>
      selection.reduce((total, optionId) => {
        const option = question.options.find(({ id }) => id === optionId);
        return total + (option ? optionDirectionContribution(option, direction) : 0);
      }, 0),
    ),
  );
}

function compareCareerEvaluations(
  left: CareerDirectionEvaluation,
  right: CareerDirectionEvaluation,
): number {
  if (left.score !== right.score) return right.score - left.score;
  if (left.coreActivityQuestionCount !== right.coreActivityQuestionCount) {
    return right.coreActivityQuestionCount - left.coreActivityQuestionCount;
  }
  if (left.evidenceSectionCount !== right.evidenceSectionCount) {
    return right.evidenceSectionCount - left.evidenceSectionCount;
  }
  if (left.evidenceQuestionCount !== right.evidenceQuestionCount) {
    return right.evidenceQuestionCount - left.evidenceQuestionCount;
  }
  return careerDirections.findIndex(({ id }) => id === left.directionId)
    - careerDirections.findIndex(({ id }) => id === right.directionId);
}

export function calculateCareerDirectionEvaluations(
  answers: CareerAnswers,
): readonly CareerDirectionEvaluation[] {
  return careerDirections.map((direction) => {
    let weightedContribution = 0;
    let availableWeight = 0;
    const evidence: WeightedCareerEvidence[] = [];
    const evidenceQuestions = new Set<string>();
    const evidenceSections = new Set<CareerSectionId>();
    const coreActivityQuestions = new Set<string>();

    for (const question of careerQuestions) {
      if (question.matchingWeight === 0) continue;
      const capacity = calculateCareerQuestionCapacity(question, direction);
      if (capacity <= 0) continue;
      availableWeight += question.matchingWeight;

      let questionContribution = 0;
      for (const optionId of answers[question.id] ?? []) {
        const option = question.options.find(({ id }) => id === optionId);
        if (!option) continue;
        const optionContribution = optionDirectionContribution(option, direction);
        if (optionContribution <= 0) continue;

        const weightedOptionContribution = optionContribution * question.matchingWeight / capacity;
        questionContribution += optionContribution;
        const coreActivity = (option.signals ?? []).some(({ id }) =>
          direction.coreActivitySignals.includes(id as CareerActivitySignalId),
        );
        evidence.push({
          questionId: question.id,
          optionId: option.id,
          sectionId: question.sectionId,
          answer: option.label,
          contribution: weightedOptionContribution,
          coreActivity,
        });
        evidenceQuestions.add(question.id);
        evidenceSections.add(question.sectionId);
        if (coreActivity) coreActivityQuestions.add(question.id);
      }

      weightedContribution += questionContribution / capacity * question.matchingWeight;
    }

    return {
      directionId: direction.id,
      score: availableWeight === 0 ? 0 : weightedContribution / availableWeight,
      evidenceQuestionCount: evidenceQuestions.size,
      evidenceSectionCount: evidenceSections.size,
      coreActivityQuestionCount: coreActivityQuestions.size,
      evidence,
    };
  }).sort(compareCareerEvaluations);
}

function isPrimaryEvaluation(evaluation: CareerDirectionEvaluation): boolean {
  return evaluation.score >= CAREER_PRIMARY_THRESHOLD
    && evaluation.evidenceQuestionCount >= 3
    && evaluation.evidenceSectionCount >= 2
    && evaluation.coreActivityQuestionCount >= 1;
}

function isAdditionalEvaluation(evaluation: CareerDirectionEvaluation): boolean {
  return evaluation.score >= CAREER_ADDITIONAL_THRESHOLD
    && evaluation.evidenceQuestionCount >= 2
    && evaluation.coreActivityQuestionCount >= 1;
}

function selectedConstraints(answers: CareerAnswers): Set<CareerConstraintId> {
  const constraints = new Set<CareerConstraintId>();
  for (const question of careerQuestions) {
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      for (const constraint of option?.constraints ?? []) constraints.add(constraint);
    }
  }
  return constraints;
}

function selectedQualificationScope(answers: CareerAnswers): CareerQualificationScope {
  for (const question of careerQuestions) {
    for (const optionId of answers[question.id] ?? []) {
      const scope = question.options.find(({ id }) => id === optionId)?.qualificationScope;
      if (scope) return scope;
    }
  }
  return "undecided";
}

function selectedNextStepMode(answers: CareerAnswers): CareerNextStepMode {
  for (const question of careerQuestions) {
    for (const optionId of answers[question.id] ?? []) {
      const mode = question.options.find(({ id }) => id === optionId)?.nextStepMode;
      if (mode) return mode;
    }
  }
  return "role-comparison";
}

function takeDirectionEvidence(evaluation: CareerDirectionEvaluation, limit = 4): CareerEvidence[] {
  const remaining = [...evaluation.evidence].sort((left, right) => {
    if (left.contribution !== right.contribution) return right.contribution - left.contribution;
    const leftQuestionIndex = careerQuestions.findIndex(({ id }) => id === left.questionId);
    const rightQuestionIndex = careerQuestions.findIndex(({ id }) => id === right.questionId);
    return leftQuestionIndex - rightQuestionIndex;
  });
  const chosen: WeightedCareerEvidence[] = [];

  while (remaining.length > 0 && chosen.length < limit) {
    const chosenSections = new Set(chosen.map(({ sectionId }) => sectionId));
    const chosenQuestions = new Set(chosen.map(({ questionId }) => questionId));
    remaining.sort((left, right) => {
      if (chosen.length === 0 && left.contribution !== right.contribution) return right.contribution - left.contribution;
      const leftNewSection = chosenSections.has(left.sectionId) ? 0 : 1;
      const rightNewSection = chosenSections.has(right.sectionId) ? 0 : 1;
      if (leftNewSection !== rightNewSection) return rightNewSection - leftNewSection;
      const leftNewQuestion = chosenQuestions.has(left.questionId) ? 0 : 1;
      const rightNewQuestion = chosenQuestions.has(right.questionId) ? 0 : 1;
      if (leftNewQuestion !== rightNewQuestion) return rightNewQuestion - leftNewQuestion;
      if (left.contribution !== right.contribution) return right.contribution - left.contribution;
      const leftQuestionIndex = careerQuestions.findIndex(({ id }) => id === left.questionId);
      const rightQuestionIndex = careerQuestions.findIndex(({ id }) => id === right.questionId);
      return leftQuestionIndex - rightQuestionIndex;
    });
    chosen.push(remaining.shift() as WeightedCareerEvidence);
  }

  return chosen.map(({ questionId, optionId, sectionId, answer }) => ({
    questionId,
    optionId,
    sectionId,
    answer,
  }));
}

function directionWhy(direction: CareerDirection, answers: CareerAnswers): string {
  const profileWeights = new Map(direction.profile.map(({ signalId, weight }) => [signalId, weight]));
  const support = new Map<CareerSignalId, { contribution: number; questions: Set<string> }>();

  for (const question of careerQuestions) {
    if (question.matchingWeight === 0) continue;
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      for (const careerSignal of option?.signals ?? []) {
        const profileWeight = profileWeights.get(careerSignal.id) ?? 0;
        if (profileWeight === 0) continue;
        const current = support.get(careerSignal.id) ?? { contribution: 0, questions: new Set<string>() };
        current.contribution += careerSignal.weight * profileWeight * question.matchingWeight;
        current.questions.add(question.id);
        support.set(careerSignal.id, current);
      }
    }
  }

  const strongest = [...support]
    .sort((left, right) => {
      if (left[1].contribution !== right[1].contribution) return right[1].contribution - left[1].contribution;
      if (left[1].questions.size !== right[1].questions.size) return right[1].questions.size - left[1].questions.size;
      return careerSignalIds.indexOf(left[0]) - careerSignalIds.indexOf(right[0]);
    })
    .slice(0, 2)
    .map(([signalId]) => careerSignalCopy[signalId].evidence);

  if (strongest.length === 0) return direction.rationale;
  if (strongest.length === 1) return `In deiner Auswahl zeigt sich als Anknüpfungspunkt besonders: ${strongest[0]}.`;
  return `In deiner Auswahl zeigen sich besonders ${strongest[0]} und ${strongest[1]}.`;
}

function orderedFields(direction: CareerDirection, scope: CareerQualificationScope): string[] {
  const rankForScope: Record<CareerQualificationScope, Record<CareerDirection["fields"][number]["qualification"], number>> = {
    short: { open: 0, upskill: 1, substantial: 2 },
    "several-months": { open: 0, upskill: 0, substantial: 1 },
    "formal-open": { open: 0, upskill: 0, substantial: 0 },
    undecided: { open: 0, upskill: 0, substantial: 0 },
  };
  return direction.fields
    .map((field, index) => ({ field, index }))
    .sort((left, right) =>
      rankForScope[scope][left.field.qualification] - rankForScope[scope][right.field.qualification]
      || left.index - right.index,
    )
    .map(({ field }) => field.label);
}

function qualificationNote(direction: CareerDirection, scope: CareerQualificationScope): string | undefined {
  if (!direction.qualificationNote) return undefined;
  if (scope === "short") {
    return `Du hast aktuell einen kurzen Qualifizierungsrahmen gewählt. ${direction.qualificationNote}`;
  }
  if (scope === "several-months") {
    return `Mehrere Monate Qualifizierung sind für dich realistisch. ${direction.qualificationNote}`;
  }
  if (scope === "formal-open") {
    return `Du kannst auch längere Qualifizierungswege grundsätzlich prüfen. ${direction.qualificationNote}`;
  }
  return `Dein Qualifizierungsrahmen ist noch offen. ${direction.qualificationNote}`;
}

function buildResultDirection(
  evaluation: CareerDirectionEvaluation,
  answers: CareerAnswers,
  constraints: ReadonlySet<CareerConstraintId>,
  scope: CareerQualificationScope,
): CareerResultDirection {
  const direction = careerDirections.find(({ id }) => id === evaluation.directionId) as CareerDirection;
  return {
    id: direction.id,
    title: direction.title,
    description: direction.description,
    why: directionWhy(direction, answers),
    evidence: takeDirectionEvidence(evaluation),
    fields: orderedFields(direction, scope),
    environments: direction.environments,
    qualificationNote: qualificationNote(direction, scope),
    constraintNotes: direction.constraintNotes
      .filter(({ constraintId }) => constraints.has(constraintId))
      .map(({ text }) => text),
  };
}

function selectedSignalEvidence(answers: CareerAnswers): Map<CareerSignalId, CareerEvidence[]> {
  const bySignal = new Map<CareerSignalId, CareerEvidence[]>();
  for (const question of careerQuestions) {
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      if (!option) continue;
      for (const careerSignal of option.signals ?? []) {
        const evidence = bySignal.get(careerSignal.id) ?? [];
        evidence.push({ questionId: question.id, optionId: option.id, sectionId: question.sectionId, answer: option.label });
        bySignal.set(careerSignal.id, evidence);
      }
    }
  }
  return bySignal;
}

export function buildCareerSummary(answers: CareerAnswers, constraints: ReadonlySet<CareerConstraintId> = new Set()): readonly string[] {
  const signalTotals = new Map<CareerSignalId, { score: number; questions: Set<string> }>();
  for (const question of careerQuestions) {
    if (question.matchingWeight === 0) continue;
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      for (const careerSignal of option?.signals ?? []) {
        const current = signalTotals.get(careerSignal.id) ?? { score: 0, questions: new Set<string>() };
        current.score += careerSignal.weight * question.matchingWeight;
        current.questions.add(question.id);
        signalTotals.set(careerSignal.id, current);
      }
    }
  }

  const strongest = <T extends CareerSignalId>(signalIds: readonly T[], limit: number): T[] => signalIds
    .filter((signalId) => (signalTotals.get(signalId)?.questions.size ?? 0) >= 2)
    .sort((left, right) => {
      const leftSignal = signalTotals.get(left);
      const rightSignal = signalTotals.get(right);
      if ((leftSignal?.score ?? 0) !== (rightSignal?.score ?? 0)) return (rightSignal?.score ?? 0) - (leftSignal?.score ?? 0);
      if ((leftSignal?.questions.size ?? 0) !== (rightSignal?.questions.size ?? 0)) return (rightSignal?.questions.size ?? 0) - (leftSignal?.questions.size ?? 0);
      return signalIds.indexOf(left) - signalIds.indexOf(right);
    })
    .slice(0, limit);

  const activities = strongest(careerActivitySignalIds, 2);
  const motivations = strongest(careerMotivationSignalIds, 1);
  const environments = strongest(careerEnvironmentSignalIds, 1);
  const summary: string[] = [];

  if (activities.length >= 2) {
    summary.push(`Deine Auswahl zieht dich besonders zu Arbeit hin, in der diese Tätigkeiten zusammenkommen: ${careerSignalCopy[activities[0]].summary} sowie ${careerSignalCopy[activities[1]].summary}.`);
  } else if (activities.length === 1) {
    summary.push(`In deiner Auswahl zeigt sich vorsichtig ein Interesse an dieser Tätigkeit: ${careerSignalCopy[activities[0]].summary}.`);
  } else {
    summary.push("Deine Auswahl öffnet mehrere berufliche Spuren, ohne dass ein einzelnes Tätigkeitsmuster klar dominiert.");
  }

  const contextParts = [
    motivations[0] ? careerSignalCopy[motivations[0]].summary : null,
    environments[0] ? careerSignalCopy[environments[0]].summary : null,
  ].filter((value): value is string => Boolean(value));
  if (contextParts.length === 2) summary.push(`Dabei wirken ${contextParts[0]} und ${contextParts[1]} wichtig.`);
  else if (contextParts.length === 1) summary.push(`Dabei wirkt ${contextParts[0]} als wiederkehrender Anknüpfungspunkt.`);

  const firstConstraint = careerConstraintIds.find((constraintId) => constraints.has(constraintId));
  if (firstConstraint) {
    summary.push(`Für deine weitere Erkundung sollte diese Bedingung von Anfang an mitgedacht werden: ${careerConstraintSummaryCopy[firstConstraint]}.`);
  }
  return summary.slice(0, 3);
}

function buildConditions(answers: CareerAnswers): CareerCondition[] {
  const conditions: CareerCondition[] = [];
  for (const question of careerQuestions) {
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      if (!option) continue;
      if (option.constraints?.length) {
        conditions.push({ id: option.id, kind: "constraint", text: option.label });
      } else if (question.id === "reality-transition-priorities") {
        conditions.push({ id: option.id, kind: "preference", text: option.label });
      } else if (option.qualificationScope) {
        conditions.push({ id: option.id, kind: "qualification", text: option.label });
      }
    }
  }
  return conditions;
}

function takeDistinctCareerEvidence(evidence: readonly CareerEvidence[], limit = 3): CareerEvidence[] {
  const keys = new Set<string>();
  const result: CareerEvidence[] = [];
  for (const item of evidence) {
    const key = `${item.questionId}:${item.optionId}`;
    if (keys.has(key)) continue;
    keys.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

function buildTensions(
  answers: CareerAnswers,
  constraints: ReadonlySet<CareerConstraintId>,
  scope: CareerQualificationScope,
): CareerTensionResult[] {
  const evidenceBySignal = selectedSignalEvidence(answers);
  const constraintEvidence = new Map<CareerConstraintId, CareerEvidence>();
  for (const question of careerQuestions) {
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      if (!option) continue;
      for (const constraintId of option.constraints ?? []) {
        constraintEvidence.set(constraintId, { questionId: question.id, optionId: option.id, sectionId: question.sectionId, answer: option.label });
      }
    }
  }

  return careerTensionDefinitions.flatMap((definition) => {
    const leftEvidence = definition.leftSignals.flatMap((signalId) => evidenceBySignal.get(signalId) ?? []);
    const rightSignalEvidence = definition.rightSignals.flatMap((signalId) => evidenceBySignal.get(signalId) ?? []);
    const rightConstraintEvidence = definition.rightConstraints
      .filter((constraintId) => constraints.has(constraintId))
      .flatMap((constraintId) => constraintEvidence.get(constraintId) ?? []);
    const qualificationMatches = "qualificationScope" in definition && definition.qualificationScope === scope;
    const rightSupported = rightSignalEvidence.length > 0 || rightConstraintEvidence.length > 0 || qualificationMatches;
    if (leftEvidence.length === 0 || !rightSupported) return [];

    const qualificationQuestion = careerQuestions.find(({ purpose }) => purpose === "qualification");
    const qualificationOptionId = qualificationQuestion
      ? (answers[qualificationQuestion.id] ?? []).find((optionId) => qualificationQuestion.options.find(({ id }) => id === optionId)?.qualificationScope === scope)
      : undefined;
    const qualificationOption = qualificationQuestion?.options.find(({ id }) => id === qualificationOptionId);
    const qualificationEvidence: CareerEvidence[] = qualificationMatches && qualificationQuestion && qualificationOption
      ? [{ questionId: qualificationQuestion.id, optionId: qualificationOption.id, sectionId: qualificationQuestion.sectionId, answer: qualificationOption.label }]
      : [];

    return [{
      id: definition.id,
      title: definition.title,
      text: definition.text,
      evidence: takeDistinctCareerEvidence([
        leftEvidence[0],
        ...(rightSignalEvidence[0] ? [rightSignalEvidence[0]] : []),
        ...rightConstraintEvidence,
        ...qualificationEvidence,
      ].filter((item): item is CareerEvidence => Boolean(item))),
    }];
  }).slice(0, 2);
}

function directionName(direction: CareerDirection | undefined): string {
  return direction ? `„${direction.title}“` : "einer deiner sichtbaren Richtungen";
}

export function normalizeCareerJobTerm(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("de-DE").replace(/\s+/g, " ");
}

function roundRobinCareerJobs(
  directionIds: readonly CareerDirectionId[],
  candidates: readonly CareerJobTitleDefinition[],
  selectedIds: Set<string>,
  limit: number,
): CareerJobTitleDefinition[] {
  const selected: CareerJobTitleDefinition[] = [];
  let madeProgress = true;

  while (selected.length < limit && madeProgress) {
    madeProgress = false;
    for (const directionId of directionIds) {
      const next = candidates.find((candidate) =>
        candidate.directionIds.includes(directionId) && !selectedIds.has(candidate.id),
      );
      if (!next) continue;
      selected.push(next);
      selectedIds.add(next.id);
      madeProgress = true;
      if (selected.length >= limit) break;
    }
  }

  return selected;
}

function hybridPairKey(directionIds: readonly CareerDirectionId[]): string {
  return [...directionIds].sort().join(":");
}

export function selectCareerJobDefinitions(
  primaryDirectionIds: readonly CareerDirectionId[],
  additionalDirectionIds: readonly CareerDirectionId[],
): readonly CareerJobTitleDefinition[] {
  const primaryIds = new Set(primaryDirectionIds);
  const additionalIds = new Set(additionalDirectionIds);
  const selectedIds = new Set<string>();

  if (primaryDirectionIds.length === 0) {
    const additionalCandidates = careerJobTitles.filter((job) =>
      job.directionIds.some((directionId) => additionalIds.has(directionId)),
    );
    return roundRobinCareerJobs(
      additionalDirectionIds,
      additionalCandidates,
      selectedIds,
      CAREER_WEAK_JOB_RESULT_LIMIT,
    );
  }

  const selected: CareerJobTitleDefinition[] = [];
  const primaryPairKeys: string[] = [];
  for (let leftIndex = 0; leftIndex < primaryDirectionIds.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < primaryDirectionIds.length; rightIndex += 1) {
      primaryPairKeys.push(hybridPairKey([
        primaryDirectionIds[leftIndex],
        primaryDirectionIds[rightIndex],
      ]));
    }
  }

  let hybridProgress = true;
  while (selected.length < CAREER_HYBRID_JOB_LIMIT && hybridProgress) {
    hybridProgress = false;
    for (const pairKey of primaryPairKeys) {
      const next = careerJobTitles.find((job) =>
        job.hybridDirectionIds
        && hybridPairKey(job.hybridDirectionIds) === pairKey
        && job.hybridDirectionIds.every((directionId) => primaryIds.has(directionId))
        && !selectedIds.has(job.id),
      );
      if (!next) continue;
      selected.push(next);
      selectedIds.add(next.id);
      hybridProgress = true;
      if (selected.length >= CAREER_HYBRID_JOB_LIMIT) break;
    }
  }

  const primaryCandidates = careerJobTitles.filter((job) =>
    job.directionIds.some((directionId) => primaryIds.has(directionId)),
  );
  selected.push(...roundRobinCareerJobs(
    primaryDirectionIds,
    primaryCandidates,
    selectedIds,
    Math.max(0, 6 - selected.length),
  ));

  const additionalOnlyCandidates = careerJobTitles.filter((job) =>
    job.directionIds.some((directionId) => additionalIds.has(directionId))
    && !job.directionIds.some((directionId) => primaryIds.has(directionId)),
  );
  selected.push(...roundRobinCareerJobs(
    additionalDirectionIds,
    additionalOnlyCandidates,
    selectedIds,
    Math.min(CAREER_ADDITIONAL_JOB_LIMIT, CAREER_JOB_RESULT_LIMIT - selected.length),
  ));

  return selected.slice(0, CAREER_JOB_RESULT_LIMIT);
}

function jobQualificationNote(
  definition: CareerJobTitleDefinition,
  scope: CareerQualificationScope,
): string | undefined {
  if (!definition.qualificationNote) return undefined;
  const prefix: Record<CareerQualificationScope, string> = {
    short: "Du hast aktuell einen kurzen Qualifizierungsrahmen gewählt.",
    "several-months": "Mehrere Monate Qualifizierung sind für dich realistisch.",
    "formal-open": "Du kannst auch längere Qualifizierungswege grundsätzlich prüfen.",
    undecided: "Dein Qualifizierungsrahmen ist noch offen.",
  };
  return `${prefix[scope]} ${definition.qualificationNote}`;
}

function buildCareerJobWhy(
  definition: CareerJobTitleDefinition,
  directions: CareerResultJobTitle["directions"],
): string {
  if (directions.length >= 2 && definition.hybridDirectionIds) {
    return "Diese Rolle verbindet zwei deiner besonders sichtbaren Erkundungsspuren.";
  }
  if (directions.length >= 2) {
    return `Diese Rolle berührt die sichtbaren Spuren „${directions[0].title}“ und „${directions[1].title}“.`;
  }
  const direction = directions[0];
  if (!direction) return "Dieser Titel ist ein offener Suchbegriff für deine weitere Recherche.";
  if (direction.tier === "primary") {
    return `Dieser Suchbegriff konkretisiert deine sichtbare Spur „${direction.title}“.`;
  }
  return `Dieser Suchbegriff öffnet eine konkrete Recherche innerhalb der zusätzlich sichtbaren Spur „${direction.title}“.`;
}

function buildCareerResultJobTitles(
  primaryDirections: readonly CareerResultDirection[],
  additionalDirections: readonly CareerResultDirection[],
  constraints: ReadonlySet<CareerConstraintId>,
  scope: CareerQualificationScope,
): CareerResultJobTitle[] {
  const primaryIds = new Set(primaryDirections.map(({ id }) => id));
  const definitions = selectCareerJobDefinitions(
    primaryDirections.map(({ id }) => id),
    additionalDirections.map(({ id }) => id),
  );
  const usedTerms = new Set(definitions.map(({ title }) => normalizeCareerJobTerm(title)));

  return definitions.map((definition) => {
    const qualifiedHybrid = definition.hybridDirectionIds?.every((directionId) => primaryIds.has(directionId));
    const visibleDefinitionDirectionIds = [
      ...primaryDirections.map(({ id }) => id),
      ...additionalDirections.map(({ id }) => id),
    ].filter((directionId) => definition.directionIds.includes(directionId));
    const connectedIds = qualifiedHybrid
      ? definition.hybridDirectionIds as readonly CareerDirectionId[]
      : definition.hybridDirectionIds
        ? visibleDefinitionDirectionIds.slice(0, 1)
        : visibleDefinitionDirectionIds;
    const directions = connectedIds.map((directionId) => ({
      id: directionId,
      title: careerDirections.find(({ id }) => id === directionId)?.title ?? directionId,
      tier: primaryIds.has(directionId) ? "primary" as const : "additional" as const,
    }));
    const aliases = (definition.aliases ?? []).filter((alias) => {
      const normalized = normalizeCareerJobTerm(alias);
      if (!normalized || usedTerms.has(normalized)) return false;
      usedTerms.add(normalized);
      return true;
    });

    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      directions,
      why: buildCareerJobWhy(definition, directions),
      aliases,
      qualificationNote: jobQualificationNote(definition, scope),
      constraintNotes: (definition.constraintHints ?? [])
        .filter(({ constraintId }) => constraints.has(constraintId))
        .map(({ text }) => text),
    };
  });
}

function quotedJobTitles(jobTitles: readonly CareerResultJobTitle[], limit: number): string {
  const titles = jobTitles.slice(0, limit).map(({ title }) => `„${title}“`);
  if (titles.length <= 1) return titles[0] ?? "einen passenden Jobtitel";
  return `${titles.slice(0, -1).join(", ")} und ${titles.at(-1)}`;
}

export function buildCareerNextStep(
  answers: CareerAnswers,
  visibleEvaluations: readonly CareerDirectionEvaluation[],
  jobTitles: readonly CareerResultJobTitle[] = [],
): CareerNextStep {
  const mode = selectedNextStepMode(answers);
  const first = careerDirections.find(({ id }) => id === visibleEvaluations[0]?.directionId);
  const second = careerDirections.find(({ id }) => id === visibleEvaluations[1]?.directionId);
  const similarlyRelevant = Boolean(
    first && second && Math.abs(visibleEvaluations[0].score - visibleEvaluations[1].score) <= 0.07,
  );
  const compare = Boolean(first && second && (similarlyRelevant || mode === "role-comparison"));

  if (!first) {
    const generic: Record<CareerNextStepMode, CareerNextStep> = {
      conversation: { mode, title: "Sprich über zwei konkrete Tätigkeiten", text: "Wähle zwei Tätigkeiten aus deinen Antworten und sprich mit einer Person, die beide aus ihrem Arbeitsalltag kennt. Frage nach Aufgaben, Bedingungen und notwendigen Erfahrungen." },
      "role-comparison": { mode, title: "Vergleiche Aufgaben statt Titel", text: "Vergleiche sechs unterschiedliche Stellenanzeigen und markiere ausschließlich wiederkehrende Tätigkeiten, Bedingungen und Zugangsvoraussetzungen." },
      "mini-project": { mode, title: "Teste zwei kleine Arbeitsproben", text: "Wähle zwei Tätigkeiten aus deinen Antworten und simuliere jede davon für 45 Minuten. Notiere danach Interesse, Energie und offene Lernfragen." },
      "skill-test": { mode, title: "Teste einen wiederkehrenden Skill", text: "Wähle eine Tätigkeit, die mehrfach in deinen Antworten auftaucht, und bearbeite dazu eine kleine praktische Übung statt nur darüber zu lesen." },
      "work-observation": { mode, title: "Beobachte einen echten Arbeitsablauf", text: "Bitte eine Person, dir einen typischen Arbeitsablauf zu zeigen. Achte auf Tätigkeiten, Unterbrechungen, Menschenkontakt und Rahmenbedingungen." },
    };
    return generic[mode];
  }

  if (jobTitles.length > 0 && mode === "role-comparison") {
    return {
      mode,
      title: "Vergleiche konkrete Jobtitel anhand realer Aufgaben",
      text: `Suche zum Beispiel nach ${quotedJobTitles(jobTitles, 3)} und vergleiche insgesamt sechs Stellenanzeigen ausschließlich nach Tätigkeiten, Bedingungen und Zugangsvoraussetzungen – nicht zuerst nach Arbeitgeber oder Titelwirkung.`,
    };
  }
  if (jobTitles.length > 0 && mode === "conversation") {
    return {
      mode,
      title: "Führe ein Gespräch zu konkreten Rollen",
      text: `Nutze ${quotedJobTitles(jobTitles, 2)} als Suchbegriffe, um Gesprächspartner zu finden. Frage nach typischen Tätigkeiten, Arbeitsrhythmus, Zugang, schwierigen Seiten und einem realistischen Einstieg.`,
    };
  }
  if (jobTitles.length > 0 && mode === "work-observation") {
    return {
      mode,
      title: "Beobachte konkrete Arbeitsabläufe",
      text: `Nutze ${quotedJobTitles(jobTitles, 2)} als Ausgangspunkt und bitte eine Person, dir einen typischen Arbeitsablauf zu zeigen. Achte auf Tätigkeiten, Unterbrechungen, Menschenkontakt und Rahmenbedingungen.`,
    };
  }

  if (mode === "conversation") {
    return compare
      ? { mode, title: "Führe zwei vergleichbare Feldgespräche", text: `Sprich mit je einer Person aus ${directionName(first)} und ${directionName(second)}. Stelle beiden dieselben fünf Fragen zu Tätigkeiten, Arbeitsrhythmus, Zugang, schwierigen Seiten und einem realistischen Einstieg.` }
      : { mode, title: `Sprich mit jemandem aus ${directionName(first)}`, text: first.conversationPrompt };
  }
  if (mode === "role-comparison") {
    return compare
      ? { mode, title: "Vergleiche zwei Richtungen anhand realer Aufgaben", text: `Vergleiche sechs Stellenanzeigen aus ${directionName(first)} und ${directionName(second)}. Achte ausschließlich auf Tätigkeiten, Bedingungen und Zugangsvoraussetzungen – nicht zuerst auf Titel oder Arbeitgeber.` }
      : { mode, title: `Vergleiche Rollen in ${directionName(first)}`, text: "Lies sechs unterschiedliche Stellenanzeigen und markiere wiederkehrende Tätigkeiten, Bedingungen und Zugangsvoraussetzungen. Prüfe, wie stark die konkreten Rollen innerhalb derselben Richtung variieren." };
  }
  if (mode === "mini-project") {
    return compare
      ? { mode, title: "Teste zwei kurze Vergleichsexperimente", text: `Plane je ein 45-minütiges Mini-Experiment für ${directionName(first)} und ${directionName(second)}. Vergleiche danach Interesse, Energie, Lernbedarf und den Wunsch, weiterzumachen.` }
      : { mode, title: `Probiere ${directionName(first)} praktisch aus`, text: first.microExperiment };
  }
  if (mode === "skill-test") {
    return compare
      ? { mode, title: "Vergleiche zwei typische Skills", text: `Teste je eine kleine praktische Aufgabe aus ${directionName(first)} und ${directionName(second)}. Bewerte nicht deine heutige Leistung, sondern Neugier, Konzentration und Lernbereitschaft.` }
      : { mode, title: `Teste einen Skill aus ${directionName(first)}`, text: first.skillExperiment };
  }
  return compare
    ? { mode, title: "Beobachte zwei unterschiedliche Arbeitsrealitäten", text: `Bitte je eine Person aus ${directionName(first)} und ${directionName(second)}, dir einen typischen Ablauf zu zeigen. Vergleiche Tätigkeiten, Menschenkontakt, Fokus, Rhythmus und Zugangsvoraussetzungen.` }
    : { mode, title: `Beobachte den Alltag in ${directionName(first)}`, text: first.observationPrompt };
}

export function buildCareerResult(answers: CareerAnswers):
  | { status: "incomplete"; missingQuestionIds: readonly string[] }
  | { status: "complete"; result: CareerResult } {
  const missingQuestionIds = getMissingCareerQuestionIds(answers);
  if (missingQuestionIds.length > 0) return { status: "incomplete", missingQuestionIds };

  const evaluations = calculateCareerDirectionEvaluations(answers);
  const primaryEvaluations = evaluations.filter(isPrimaryEvaluation).slice(0, 3);
  const primaryIds = new Set(primaryEvaluations.map(({ directionId }) => directionId));
  const additionalEvaluations = evaluations
    .filter((evaluation) => !primaryIds.has(evaluation.directionId) && isAdditionalEvaluation(evaluation))
    .slice(0, 3);
  const constraints = selectedConstraints(answers);
  const scope = selectedQualificationScope(answers);
  const visibleEvaluations = [...primaryEvaluations, ...additionalEvaluations].sort(compareCareerEvaluations);
  const primaryDirections = primaryEvaluations.map((evaluation) => buildResultDirection(evaluation, answers, constraints, scope));
  const additionalDirections = additionalEvaluations.map((evaluation) => buildResultDirection(evaluation, answers, constraints, scope));
  const jobTitles = buildCareerResultJobTitles(primaryDirections, additionalDirections, constraints, scope);

  return {
    status: "complete",
    result: {
      title: "Deine Career Map",
      description: "Eine lokale Momentaufnahme möglicher beruflicher Erkundungsräume – keine Bewertung deiner Person und keine Entscheidung über einen Beruf.",
      summary: buildCareerSummary(answers, constraints),
      primaryDirections,
      additionalDirections,
      jobTitles,
      conditions: buildConditions(answers),
      tensions: buildTensions(answers, constraints, scope),
      nextStep: buildCareerNextStep(answers, visibleEvaluations, jobTitles),
    },
  };
}

export function formatCareerSelectionCount(selectedCount: number, maxSelections: number): string {
  return `${selectedCount} von ${maxSelections} ausgewählt`;
}

function selectionInstruction(question: CareerQuestion): string {
  if (question.minSelections === question.maxSelections) {
    return question.minSelections === 1
      ? "Wähle eine Antwort aus."
      : `Wähle genau ${question.minSelections} Antworten aus.`;
  }
  return `Wähle ${question.minSelections} bis ${question.maxSelections} Antworten aus.`;
}

function isLastQuestionOfCareerSection(questionIndex: number, sectionId: CareerSectionId): boolean {
  const nextQuestion = careerQuestions[questionIndex + 1];
  return !nextQuestion || nextQuestion.sectionId !== sectionId;
}

export function careerJourneyReducer(
  state: CareerJourneyState,
  action: CareerJourneyAction,
): CareerJourneyState {
  if (action.type === "confirm-restart") return initialCareerState;
  if (action.type === "request-restart") return { ...state, restartPending: true };
  if (action.type === "cancel-restart") return { ...state, restartPending: false };
  if (action.type === "start") {
    return { ...state, phase: "journey", questionIndex: 0, validationMessage: null, restartPending: false };
  }
  if (action.type === "edit-section") {
    const questionIndex = careerQuestions.findIndex(({ sectionId }) => sectionId === action.sectionId);
    if (questionIndex < 0) return state;
    return { ...state, phase: "journey", questionIndex, validationMessage: null, editingSectionId: action.sectionId, restartPending: false };
  }
  if (action.type === "toggle-option") {
    if (state.phase !== "journey") return state;
    const question = careerQuestions[state.questionIndex];
    if (!question || question.id !== action.questionId) return state;
    const option = question.options.find(({ id }) => id === action.optionId);
    if (!option) return state;

    const current = [...(state.answers[question.id] ?? [])];
    const alreadySelected = current.includes(option.id);
    let selected: string[];
    if (question.format === "single") selected = [option.id];
    else if (alreadySelected) selected = current.filter((optionId) => optionId !== option.id);
    else if (option.exclusive) selected = [option.id];
    else {
      const withoutExclusive = current.filter((optionId) => !question.options.find(({ id }) => id === optionId)?.exclusive);
      if (withoutExclusive.length >= question.maxSelections) {
        return { ...state, validationMessage: `Du kannst höchstens ${question.maxSelections} Antworten auswählen.` };
      }
      selected = [...withoutExclusive, option.id];
    }

    const optionOrder = new Map(question.options.map((candidate, index) => [candidate.id, index]));
    selected.sort((left, right) => (optionOrder.get(left) ?? 0) - (optionOrder.get(right) ?? 0));
    return { ...state, answers: { ...state.answers, [question.id]: selected }, validationMessage: null };
  }
  if (action.type === "back") {
    if (state.phase !== "journey") return state;
    const firstEditingIndex = state.editingSectionId
      ? careerQuestions.findIndex(({ sectionId }) => sectionId === state.editingSectionId)
      : -1;
    if (state.editingSectionId && state.questionIndex === firstEditingIndex) {
      return { ...state, phase: "result", editingSectionId: null, validationMessage: null };
    }
    if (state.questionIndex === 0) return { ...state, phase: "intro", questionIndex: 0, validationMessage: null };
    return { ...state, questionIndex: state.questionIndex - 1, validationMessage: null };
  }
  if (action.type === "continue") {
    if (state.phase !== "journey") return state;
    const question = careerQuestions[state.questionIndex];
    if (!question) return state;
    if (!isCareerQuestionComplete(question, state.answers[question.id])) {
      return { ...state, validationMessage: selectionInstruction(question) };
    }

    const atJourneyEnd = state.questionIndex === careerQuestions.length - 1;
    const atEditedSectionEnd = state.editingSectionId
      ? isLastQuestionOfCareerSection(state.questionIndex, state.editingSectionId)
      : false;
    if (atJourneyEnd || atEditedSectionEnd) {
      if (getMissingCareerQuestionIds(state.answers).length > 0) {
        return atJourneyEnd
          ? { ...state, validationMessage: "Beantworte bitte alle Fragen, bevor du deine Career Map öffnest." }
          : { ...state, questionIndex: state.questionIndex + 1, editingSectionId: null, validationMessage: null };
      }
      return { ...state, phase: "result", editingSectionId: null, validationMessage: null };
    }
    return { ...state, questionIndex: state.questionIndex + 1, validationMessage: null };
  }
  return state;
}

export function validateCareerData(): string[] {
  const errors: string[] = [];
  const sectionIds = new Set(careerSections.map(({ id }) => id));
  const signalIds = new Set<CareerSignalId>(careerSignalIds);
  const constraintIds = new Set<CareerConstraintId>(careerConstraintIds);
  const questionIds = new Set<string>();
  const optionIds = new Set<string>();
  const directionIds = new Set<CareerDirectionId>();

  if (careerSections.length !== 5) errors.push("Career must define exactly five sections.");
  if (careerQuestions.length !== 14) errors.push("Career must define exactly fourteen interactions.");
  const expectedSectionCounts = [3, 3, 3, 3, 2];
  careerSections.forEach((section, index) => {
    if (!section.title.trim() || !section.description.trim() || !section.mapLabel.trim()) errors.push(`Empty section copy: ${section.id}`);
    if (careerQuestions.filter(({ sectionId }) => sectionId === section.id).length !== expectedSectionCounts[index]) {
      errors.push(`Unexpected question count for ${section.id}.`);
    }
  });

  for (const question of careerQuestions) {
    if (questionIds.has(question.id)) errors.push(`Duplicate question id: ${question.id}`);
    questionIds.add(question.id);
    if (!sectionIds.has(question.sectionId)) errors.push(`Unknown section: ${question.id}`);
    if (!question.prompt.trim() || question.options.length === 0) errors.push(`Empty question: ${question.id}`);
    if (question.minSelections < 1 || question.minSelections > question.maxSelections || question.maxSelections > question.options.length) {
      errors.push(`Invalid selection bounds: ${question.id}`);
    }
    if (question.format === "single" && (question.minSelections !== 1 || question.maxSelections !== 1)) {
      errors.push(`Single-select bounds must be one: ${question.id}`);
    }
    if (question.purpose !== "matching" && question.matchingWeight !== 0) errors.push(`Non-matching question carries weight: ${question.id}`);

    for (const option of question.options) {
      if (optionIds.has(option.id)) errors.push(`Duplicate option id: ${option.id}`);
      optionIds.add(option.id);
      if (!option.label.trim()) errors.push(`Empty option: ${option.id}`);
      if ("direction" in option || "directionId" in option || "directions" in option) errors.push(`Direct direction assignment: ${option.id}`);
      if (option.exclusive && (option.signals?.length || option.constraints?.length)) errors.push(`Exclusive option carries interpretation: ${option.id}`);
      if ((option.signals?.filter(({ weight }) => weight === 2).length ?? 0) > 2) errors.push(`Too many primary signals: ${option.id}`);
      if ((option.signals?.filter(({ weight }) => weight === 1).length ?? 0) > 2) errors.push(`Too many supporting signals: ${option.id}`);
      for (const careerSignal of option.signals ?? []) {
        if (!signalIds.has(careerSignal.id)) errors.push(`Unknown signal: ${careerSignal.id}`);
        if (careerSignal.weight !== 1 && careerSignal.weight !== 2) errors.push(`Invalid signal weight: ${option.id}`);
      }
      for (const constraintId of option.constraints ?? []) {
        if (!constraintIds.has(constraintId)) errors.push(`Unknown constraint: ${constraintId}`);
        if (question.purpose !== "constraints") errors.push(`Constraint outside constraint question: ${option.id}`);
      }
      if (option.qualificationScope && question.purpose !== "qualification") errors.push(`Qualification outside qualification question: ${option.id}`);
      if (option.nextStepMode && question.purpose !== "next-step") errors.push(`Next step outside next-step question: ${option.id}`);
    }
  }

  for (const direction of careerDirections) {
    if (directionIds.has(direction.id)) errors.push(`Duplicate direction id: ${direction.id}`);
    directionIds.add(direction.id);
    if (!direction.title.trim() || !direction.description.trim() || !direction.rationale.trim()) errors.push(`Empty direction copy: ${direction.id}`);
    if (direction.fields.length === 0 || direction.environments.length === 0) errors.push(`Empty direction exploration data: ${direction.id}`);
    if (direction.coreActivitySignals.length === 0) errors.push(`Missing core activity: ${direction.id}`);
    for (const signalId of direction.coreActivitySignals) {
      if (!careerActivitySignalIds.includes(signalId)) errors.push(`Invalid core activity: ${direction.id}:${signalId}`);
    }
    for (const profileSignal of direction.profile) {
      if (!signalIds.has(profileSignal.signalId)) errors.push(`Unknown profile signal: ${direction.id}:${profileSignal.signalId}`);
      if (profileSignal.weight !== 1 && profileSignal.weight !== 2) errors.push(`Invalid profile weight: ${direction.id}:${profileSignal.signalId}`);
    }
    for (const note of direction.constraintNotes) {
      if (!constraintIds.has(note.constraintId) || !note.text.trim()) errors.push(`Invalid constraint note: ${direction.id}`);
    }
  }

  const jobIds = new Set<string>();
  const canonicalJobTitles = new Set<string>();
  for (const job of careerJobTitles) {
    const normalizedTitle = normalizeCareerJobTerm(job.title);
    if (jobIds.has(job.id)) errors.push(`Duplicate job id: ${job.id}`);
    jobIds.add(job.id);
    if (!job.id.trim() || !job.title.trim() || !job.description.trim()) errors.push(`Empty job copy: ${job.id}`);
    if (canonicalJobTitles.has(normalizedTitle)) errors.push(`Duplicate job title: ${job.title}`);
    canonicalJobTitles.add(normalizedTitle);
  }

  const globalAliases = new Set<string>();
  const prohibitedJobLanguage = /\b(score|ranking|match|prozent|geeignet|ungeeignet|perfekte jobs?|beste jobs?|top jobs?)\b|%/iu;
  for (const job of careerJobTitles) {
    if (job.directionIds.length === 0) errors.push(`Job without direction: ${job.id}`);
    if (new Set(job.directionIds).size !== job.directionIds.length) errors.push(`Duplicate job direction: ${job.id}`);
    for (const directionId of job.directionIds) {
      if (!directionIds.has(directionId)) errors.push(`Unknown job direction: ${job.id}:${directionId}`);
    }
    if (job.hybridDirectionIds) {
      if (new Set(job.hybridDirectionIds).size !== 2) errors.push(`Invalid hybrid pair: ${job.id}`);
      for (const directionId of job.hybridDirectionIds) {
        if (!directionIds.has(directionId) || !job.directionIds.includes(directionId)) {
          errors.push(`Invalid hybrid direction: ${job.id}:${directionId}`);
        }
      }
    }
    if ((job.aliases?.length ?? 0) > 4) errors.push(`Too many job aliases: ${job.id}`);
    const localAliases = new Set<string>();
    for (const alias of job.aliases ?? []) {
      const normalizedAlias = normalizeCareerJobTerm(alias);
      if (!normalizedAlias) errors.push(`Empty job alias: ${job.id}`);
      if (canonicalJobTitles.has(normalizedAlias)) errors.push(`Job alias collides with canonical title: ${job.id}:${alias}`);
      if (localAliases.has(normalizedAlias)) errors.push(`Duplicate local job alias: ${job.id}:${alias}`);
      if (globalAliases.has(normalizedAlias)) errors.push(`Duplicate global job alias: ${job.id}:${alias}`);
      localAliases.add(normalizedAlias);
      globalAliases.add(normalizedAlias);
    }
    for (const hint of job.constraintHints ?? []) {
      if (!constraintIds.has(hint.constraintId) || !hint.text.trim()) errors.push(`Invalid job constraint hint: ${job.id}`);
    }
    if (prohibitedJobLanguage.test(JSON.stringify(job))) errors.push(`Prohibited job language: ${job.id}`);
  }

  const jobCoverage = careerDirections.map((direction) =>
    careerJobTitles.filter(({ directionIds: jobDirectionIds }) => jobDirectionIds.includes(direction.id)).length,
  );
  if (Math.min(...jobCoverage) < 8 || Math.max(...jobCoverage) > 12) {
    errors.push("Every career direction must have eight to twelve job titles.");
  }
  if (Math.max(...jobCoverage) - Math.min(...jobCoverage) > 4) {
    errors.push("Career job title coverage is structurally imbalanced.");
  }

  const coverage = careerDirections.map((direction) => careerQuestions.filter((question) =>
    question.matchingWeight > 0 && calculateCareerQuestionCapacity(question, direction) > 0,
  ).length);
  if (Math.min(...coverage) < 8) errors.push("Career directions need matching coverage across at least eight questions.");
  if (Math.max(...coverage) - Math.min(...coverage) > 3) errors.push("Career direction coverage is structurally imbalanced.");

  const regulatedTerms = /\bArzt|Psychotherapeut|Rechtsanwalt\b/iu;
  if (regulatedTerms.test(careerDirections.flatMap(({ fields }) => fields.map(({ label }) => label)).join(" "))) {
    errors.push("Career examples include a regulated profession.");
  }
  if (regulatedTerms.test(JSON.stringify(careerJobTitles))) errors.push("Career job titles include a regulated profession.");
  return errors;
}
