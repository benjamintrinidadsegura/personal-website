import {
  selfReflectionDimensions,
  selfReflectionQuestions,
  selfReflectionResultSections,
  selfReflectionSections,
  selfReflectionTensions,
} from "@/data/find-your-next-step-self";
import type {
  SelfReflectionAnswers,
  SelfReflectionDimensionId,
  SelfReflectionEvidence,
  SelfReflectionEvidenceRole,
  SelfReflectionJourneyAction,
  SelfReflectionJourneyState,
  SelfReflectionQuestion,
  SelfReflectionResult,
  SelfReflectionResultSection,
  SelfReflectionSectionId,
  SelfReflectionTensionResult,
  SelfReflectionVisibility,
} from "@/types/find-your-next-step";

export const selfReflectionDimensionOrder = Object.keys(
  selfReflectionDimensions,
) as SelfReflectionDimensionId[];

export const initialSelfReflectionState: SelfReflectionJourneyState = {
  phase: "intro",
  questionIndex: 0,
  answers: {},
  validationMessage: null,
  editingSectionId: null,
  restartPending: false,
};

export function isSelfReflectionQuestionComplete(
  question: SelfReflectionQuestion,
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

export function getMissingSelfReflectionQuestionIds(answers: SelfReflectionAnswers): string[] {
  return selfReflectionQuestions
    .filter((question) => !isSelfReflectionQuestionComplete(question, answers[question.id]))
    .map(({ id }) => id);
}

export function calculateQuestionDimensionCapacity(
  question: SelfReflectionQuestion,
  dimension: SelfReflectionDimensionId,
): number {
  return question.options
    .filter(({ exclusive }) => !exclusive)
    .map((option) =>
      (option.signals ?? [])
        .filter((signal) => signal.dimension === dimension)
        .reduce((total, signal) => total + signal.weight, 0),
    )
    .sort((left, right) => right - left)
    .slice(0, question.maxSelections)
    .reduce((total, weight) => total + weight, 0);
}

export interface SelfReflectionDimensionEvaluation {
  dimension: SelfReflectionDimensionId;
  score: number;
  maximum: number;
  evidenceQuestionCount: number;
  evidenceSectionCount: number;
  visibility: SelfReflectionVisibility | null;
  contextual: boolean;
}

export function calculateSelfReflectionScores(
  answers: SelfReflectionAnswers,
): readonly SelfReflectionDimensionEvaluation[] {
  const contextualDimensions = new Set<SelfReflectionDimensionId>();

  for (const question of selfReflectionQuestions) {
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      for (const dimension of option?.contextualDimensions ?? []) contextualDimensions.add(dimension);
    }
  }

  return selfReflectionDimensionOrder.map((dimension) => {
    let score = 0;
    let maximum = 0;
    const evidenceQuestions = new Set<string>();
    const evidenceSections = new Set<SelfReflectionSectionId>();

    for (const question of selfReflectionQuestions) {
      maximum += calculateQuestionDimensionCapacity(question, dimension);

      let questionScore = 0;
      for (const optionId of answers[question.id] ?? []) {
        const option = question.options.find(({ id }) => id === optionId);
        questionScore += (option?.signals ?? [])
          .filter((signal) => signal.dimension === dimension)
          .reduce((total, signal) => total + signal.weight, 0);
      }

      if (questionScore > 0) {
        score += questionScore;
        evidenceQuestions.add(question.id);
        evidenceSections.add(question.sectionId);
      }
    }

    const ratio = maximum === 0 ? 0 : score / maximum;
    let visibility: SelfReflectionVisibility | null = null;
    if (ratio >= 0.6 && evidenceQuestions.size >= 3 && evidenceSections.size >= 2) {
      visibility = "clear";
    } else if (ratio >= 0.35 && evidenceQuestions.size >= 2 && evidenceSections.size >= 2) {
      visibility = "multiple";
    }

    return {
      dimension,
      score,
      maximum,
      evidenceQuestionCount: evidenceQuestions.size,
      evidenceSectionCount: evidenceSections.size,
      visibility,
      contextual: contextualDimensions.has(dimension),
    };
  });
}

function getDimensionEvidence(
  answers: SelfReflectionAnswers,
  dimension: SelfReflectionDimensionId,
  roles?: readonly SelfReflectionEvidenceRole[],
): SelfReflectionEvidence[] {
  const evidence: SelfReflectionEvidence[] = [];

  for (const question of selfReflectionQuestions) {
    if (roles && !roles.includes(question.evidenceRole)) continue;

    for (const option of question.options) {
      if (!(answers[question.id] ?? []).includes(option.id)) continue;
      if (!(option.signals ?? []).some((signal) => signal.dimension === dimension)) continue;
      evidence.push({
        questionId: question.id,
        optionId: option.id,
        sectionId: question.sectionId,
        answer: option.label,
      });
    }
  }

  return evidence;
}

function takeDistinctEvidence(
  evidence: readonly SelfReflectionEvidence[],
  limit = 3,
): SelfReflectionEvidence[] {
  const answers = new Set<string>();
  const distinct: SelfReflectionEvidence[] = [];
  for (const item of evidence) {
    if (answers.has(item.answer)) continue;
    answers.add(item.answer);
    distinct.push(item);
    if (distinct.length >= limit) break;
  }
  return distinct;
}

function compareEvaluations(
  left: SelfReflectionDimensionEvaluation,
  right: SelfReflectionDimensionEvaluation,
): number {
  const visibilityRank = { clear: 2, multiple: 1 } as const;
  const leftRank = left.visibility ? visibilityRank[left.visibility] : 0;
  const rightRank = right.visibility ? visibilityRank[right.visibility] : 0;
  if (leftRank !== rightRank) return rightRank - leftRank;
  if (left.evidenceQuestionCount !== right.evidenceQuestionCount) {
    return right.evidenceQuestionCount - left.evidenceQuestionCount;
  }
  if (left.evidenceSectionCount !== right.evidenceSectionCount) {
    return right.evidenceSectionCount - left.evidenceSectionCount;
  }

  const leftRatio = left.maximum === 0 ? 0 : left.score / left.maximum;
  const rightRatio = right.maximum === 0 ? 0 : right.score / right.maximum;
  if (leftRatio !== rightRatio) return rightRatio - leftRatio;

  return selfReflectionDimensionOrder.indexOf(left.dimension)
    - selfReflectionDimensionOrder.indexOf(right.dimension);
}

function buildVisibleDimensionSummary(
  evaluations: readonly SelfReflectionDimensionEvaluation[],
): string {
  const visible = [...evaluations]
    .filter((evaluation): evaluation is SelfReflectionDimensionEvaluation & {
      visibility: SelfReflectionVisibility;
    } => evaluation.visibility !== null)
    .sort(compareEvaluations)
    .slice(0, 2);

  if (visible.length === 0) {
    return evaluations.some(({ contextual }) => contextual)
      ? "Deine Antworten ergeben im Moment kein stark verdichtetes Muster – einige Themen scheinen stärker vom jeweiligen Kontext abzuhängen."
      : "Deine Antworten ergeben im Moment ein offenes Bild, ohne dass ein einzelnes Thema deutlich in den Vordergrund tritt.";
  }

  const [first, second] = visible;
  const firstLabel = selfReflectionDimensions[first.dimension].label;
  if (!second) {
    return first.visibility === "clear"
      ? `In deiner Momentaufnahme zeigt sich ${firstLabel} besonders klar.`
      : `In deiner Momentaufnahme taucht ${firstLabel} an mehreren Stellen auf.`;
  }

  const secondLabel = selfReflectionDimensions[second.dimension].label;
  if (first.visibility === "clear" && second.visibility === "clear") {
    return `In deiner Momentaufnahme zeigen sich ${firstLabel} und ${secondLabel} besonders klar.`;
  }
  if (first.visibility === "clear") {
    return `${firstLabel} zeigt sich in deiner Momentaufnahme besonders klar; ${secondLabel} taucht ebenfalls an mehreren Stellen auf.`;
  }
  return `In deiner Momentaufnahme tauchen ${firstLabel} und ${secondLabel} an mehreren Stellen auf.`;
}

export function buildSelfReflectionSummary(
  evaluations: readonly SelfReflectionDimensionEvaluation[],
  tensions: readonly SelfReflectionTensionResult[],
  selfImageSection: SelfReflectionResultSection | null,
): readonly string[] {
  const summary = [buildVisibleDimensionSummary(evaluations)];
  const firstTension = tensions[0];

  if (firstTension) {
    summary.push(`Spannend ist außerdem die Kombination „${firstTension.title}“.`);
    summary.push(firstTension.text);
    return summary;
  }

  const visibleDimensionCount = evaluations.filter(({ visibility }) => visibility !== null).length;
  const selfImageAnswer = selfImageSection?.statements[0]?.evidence[0]?.answer;
  if (visibleDimensionCount < 2 && selfImageAnswer) {
    summary.push(`Als eigene Beobachtung hast du außerdem ausgewählt: „${selfImageAnswer}“`);
  }

  return summary;
}

export function formatSelfReflectionSelectionCount(
  selectedCount: number,
  maxSelections: number,
): string {
  return `${selectedCount} von ${maxSelections} ausgewählt`;
}

function buildDimensionSections(
  answers: SelfReflectionAnswers,
  evaluations: readonly SelfReflectionDimensionEvaluation[],
): SelfReflectionResultSection[] {
  return selfReflectionResultSections.flatMap((section) => {
    const statements = [...evaluations]
      .filter(({ visibility }) => visibility !== null)
      .sort(compareEvaluations)
      .flatMap((evaluation) => {
        const definition = selfReflectionDimensions[evaluation.dimension];
        const text = definition.copy[section.id];
        const evidence = takeDistinctEvidence(getDimensionEvidence(
          answers,
          evaluation.dimension,
          section.roles,
        ));
        if (!text || evidence.length === 0 || !evaluation.visibility) return [];

        return [{
          id: `${section.id}-${evaluation.dimension}`,
          text,
          dimensionLabel: definition.label,
          visibility: evaluation.visibility,
          contextual: evaluation.contextual,
          evidence,
        }];
      })
      .slice(0, section.limit);

    return statements.length > 0 ? [{ id: section.id, title: section.title, statements }] : [];
  });
}

function buildSelfImageSection(answers: SelfReflectionAnswers): SelfReflectionResultSection | null {
  const question = selfReflectionQuestions.find(({ evidenceRole }) => evidenceRole === "selfImage");
  if (!question) return null;

  const statements = question.options.flatMap((option) => {
    if (!(answers[question.id] ?? []).includes(option.id) || !option.reflection) return [];
    return [{
      id: `self-image-${option.id}`,
      text: option.reflection,
      evidence: [{
        questionId: question.id,
        optionId: option.id,
        sectionId: question.sectionId,
        answer: option.label,
      }],
    }];
  });

  return statements.length > 0
    ? { id: "selfImage", title: "Was du bei dir selbst wiedererkennst", statements }
    : null;
}

function selectedOptionSupportsPair(
  answers: SelfReflectionAnswers,
  dimensions: readonly [SelfReflectionDimensionId, SelfReflectionDimensionId],
): boolean {
  return selfReflectionQuestions.some((question) =>
    question.options.some((option) => {
      if (!(answers[question.id] ?? []).includes(option.id)) return false;
      const optionDimensions = new Set((option.signals ?? []).map(({ dimension }) => dimension));
      return dimensions.every((dimension) => optionDimensions.has(dimension));
    }),
  );
}

function buildTensions(
  answers: SelfReflectionAnswers,
  evaluations: readonly SelfReflectionDimensionEvaluation[],
) {
  const evaluationByDimension = new Map(evaluations.map((evaluation) => [evaluation.dimension, evaluation]));

  return selfReflectionTensions
    .flatMap((tension, definitionIndex) => {
      const [leftDimension, rightDimension] = tension.dimensions;
      const left = evaluationByDimension.get(leftDimension);
      const right = evaluationByDimension.get(rightDimension);
      if (!left?.visibility || !right?.visibility) return [];

      const allEvidence = [
        ...getDimensionEvidence(answers, leftDimension),
        ...getDimensionEvidence(answers, rightDimension),
      ];
      const independentQuestions = new Set(allEvidence.map(({ questionId }) => questionId));
      if (independentQuestions.size < 3) return [];

      const evidence: SelfReflectionEvidence[] = [];
      for (const dimension of tension.dimensions) {
        const first = getDimensionEvidence(answers, dimension)[0];
        if (first && !evidence.some(({ questionId, optionId }) => questionId === first.questionId && optionId === first.optionId)) {
          evidence.push(first);
        }
      }
      for (const item of allEvidence) {
        if (evidence.length >= 3) break;
        if (!evidence.some(({ questionId, optionId }) => questionId === item.questionId && optionId === item.optionId)) {
          evidence.push(item);
        }
      }

      const leftRatio = left.maximum === 0 ? 0 : left.score / left.maximum;
      const rightRatio = right.maximum === 0 ? 0 : right.score / right.maximum;
      return [{
        result: {
          id: tension.id,
          title: tension.title,
          text: tension.text,
          evidence: takeDistinctEvidence(evidence),
        },
        explicitPair: selectedOptionSupportsPair(answers, tension.dimensions),
        weakestRatio: Math.min(leftRatio, rightRatio),
        definitionIndex,
      }];
    })
    .sort((left, right) => {
      if (left.explicitPair !== right.explicitPair) return left.explicitPair ? -1 : 1;
      if (left.weakestRatio !== right.weakestRatio) return right.weakestRatio - left.weakestRatio;
      return left.definitionIndex - right.definitionIndex;
    })
    .slice(0, 2)
    .map(({ result }) => result);
}

export function buildSelfReflectionResult(answers: SelfReflectionAnswers):
  | { status: "incomplete"; missingQuestionIds: readonly string[] }
  | { status: "complete"; result: SelfReflectionResult } {
  const missingQuestionIds = getMissingSelfReflectionQuestionIds(answers);
  if (missingQuestionIds.length > 0) return { status: "incomplete", missingQuestionIds };

  const evaluations = calculateSelfReflectionScores(answers);
  const selfImageSection = buildSelfImageSection(answers);
  const sections = buildDimensionSections(answers, evaluations);
  if (selfImageSection) sections.push(selfImageSection);
  const tensions = buildTensions(answers, evaluations);

  return {
    status: "complete",
    result: {
      title: "Dein mögliches Arbeits- und Lebens-Habitat",
      description:
        "Eine Momentaufnahme deiner aktuellen Antworten – kein festes Persönlichkeitsprofil und keine Bewertung deiner Person.",
      summary: buildSelfReflectionSummary(evaluations, tensions, selfImageSection),
      sections,
      tensions,
    },
  };
}

function selectionInstruction(question: SelfReflectionQuestion): string {
  if (question.minSelections === question.maxSelections) {
    return question.minSelections === 1
      ? "Wähle eine Antwort aus."
      : `Wähle genau ${question.minSelections} Antworten aus.`;
  }
  return `Wähle ${question.minSelections} bis ${question.maxSelections} Antworten aus.`;
}

function isLastQuestionOfSection(questionIndex: number, sectionId: SelfReflectionSectionId): boolean {
  const nextQuestion = selfReflectionQuestions[questionIndex + 1];
  return !nextQuestion || nextQuestion.sectionId !== sectionId;
}

export function selfReflectionJourneyReducer(
  state: SelfReflectionJourneyState,
  action: SelfReflectionJourneyAction,
): SelfReflectionJourneyState {
  if (action.type === "confirm-restart") return initialSelfReflectionState;
  if (action.type === "request-restart") return { ...state, restartPending: true };
  if (action.type === "cancel-restart") return { ...state, restartPending: false };
  if (action.type === "start") {
    return { ...state, phase: "journey", questionIndex: 0, validationMessage: null, restartPending: false };
  }
  if (action.type === "edit-section") {
    const questionIndex = selfReflectionQuestions.findIndex(({ sectionId }) => sectionId === action.sectionId);
    if (questionIndex < 0) return state;
    return {
      ...state,
      phase: "journey",
      questionIndex,
      validationMessage: null,
      editingSectionId: action.sectionId,
      restartPending: false,
    };
  }
  if (action.type === "toggle-option") {
    if (state.phase !== "journey") return state;
    const question = selfReflectionQuestions[state.questionIndex];
    if (!question || question.id !== action.questionId) return state;
    const option = question.options.find(({ id }) => id === action.optionId);
    if (!option) return state;

    const current = [...(state.answers[question.id] ?? [])];
    const alreadySelected = current.includes(option.id);
    let selected: string[];
    if (question.format === "single") {
      selected = [option.id];
    } else if (alreadySelected) {
      selected = current.filter((optionId) => optionId !== option.id);
    } else if (option.exclusive) {
      selected = [option.id];
    } else {
      const withoutExclusive = current.filter((optionId) =>
        !question.options.find(({ id }) => id === optionId)?.exclusive,
      );
      if (withoutExclusive.length >= question.maxSelections) {
        return {
          ...state,
          validationMessage: `Du kannst höchstens ${question.maxSelections} Antworten auswählen.`,
        };
      }
      selected = [...withoutExclusive, option.id];
    }

    const optionOrder = new Map(question.options.map((candidate, index) => [candidate.id, index]));
    selected.sort((left, right) => (optionOrder.get(left) ?? 0) - (optionOrder.get(right) ?? 0));
    return {
      ...state,
      answers: { ...state.answers, [question.id]: selected },
      validationMessage: null,
    };
  }
  if (action.type === "back") {
    if (state.phase !== "journey") return state;
    const question = selfReflectionQuestions[state.questionIndex];
    const firstEditingIndex = state.editingSectionId
      ? selfReflectionQuestions.findIndex(({ sectionId }) => sectionId === state.editingSectionId)
      : -1;
    if (state.editingSectionId && state.questionIndex === firstEditingIndex) {
      return { ...state, phase: "result", editingSectionId: null, validationMessage: null };
    }
    if (!question || state.questionIndex === 0) {
      return { ...state, phase: "intro", questionIndex: 0, validationMessage: null };
    }
    return { ...state, questionIndex: state.questionIndex - 1, validationMessage: null };
  }
  if (action.type === "continue") {
    if (state.phase !== "journey") return state;
    const question = selfReflectionQuestions[state.questionIndex];
    if (!question) return state;
    if (!isSelfReflectionQuestionComplete(question, state.answers[question.id])) {
      return { ...state, validationMessage: selectionInstruction(question) };
    }

    const atJourneyEnd = state.questionIndex === selfReflectionQuestions.length - 1;
    const atEditedSectionEnd = state.editingSectionId
      ? isLastQuestionOfSection(state.questionIndex, state.editingSectionId)
      : false;
    if (atJourneyEnd || atEditedSectionEnd) {
      if (getMissingSelfReflectionQuestionIds(state.answers).length > 0) {
        return atJourneyEnd
          ? { ...state, validationMessage: "Beantworte bitte alle Fragen, bevor du dein Ergebnis öffnest." }
          : { ...state, questionIndex: state.questionIndex + 1, editingSectionId: null, validationMessage: null };
      }
      return { ...state, phase: "result", editingSectionId: null, validationMessage: null };
    }

    return { ...state, questionIndex: state.questionIndex + 1, validationMessage: null };
  }

  return state;
}

export function validateSelfReflectionData(): string[] {
  const errors: string[] = [];
  const sectionIds = new Set(selfReflectionSections.map(({ id }) => id));
  const questionIds = new Set<string>();
  const optionIds = new Set<string>();
  const knownDimensions = new Set(selfReflectionDimensionOrder);

  if (selfReflectionSections.length !== 5) errors.push("Self Reflection must define exactly five sections.");
  if (selfReflectionQuestions.length !== 15) errors.push("Self Reflection must define exactly fifteen questions.");

  for (const section of selfReflectionSections) {
    const questions = selfReflectionQuestions.filter(({ sectionId }) => sectionId === section.id);
    if (questions.length !== 3) errors.push(`${section.id} must own exactly three questions.`);
    if (!section.title.trim() || !section.description.trim()) errors.push(`${section.id} contains empty copy.`);
  }

  for (const question of selfReflectionQuestions) {
    if (questionIds.has(question.id)) errors.push(`Duplicate question id: ${question.id}`);
    questionIds.add(question.id);
    if (!sectionIds.has(question.sectionId)) errors.push(`Unknown section on ${question.id}.`);
    if (!question.prompt.trim() || question.options.length === 0) errors.push(`Empty question: ${question.id}`);
    if (
      question.minSelections < 1
      || question.minSelections > question.maxSelections
      || question.maxSelections > question.options.length
    ) {
      errors.push(`Invalid selection bounds: ${question.id}`);
    }
    if (question.format === "single" && (question.minSelections !== 1 || question.maxSelections !== 1)) {
      errors.push(`Single-select bounds must be one: ${question.id}`);
    }

    const dimensionsInQuestion = new Set<SelfReflectionDimensionId>();
    for (const option of question.options) {
      if (optionIds.has(option.id)) errors.push(`Duplicate option id: ${option.id}`);
      optionIds.add(option.id);
      if (!option.label.trim()) errors.push(`Empty option: ${option.id}`);
      if (option.exclusive && option.signals?.length) errors.push(`Exclusive option carries signals: ${option.id}`);

      for (const signal of option.signals ?? []) {
        if (!knownDimensions.has(signal.dimension)) errors.push(`Unknown dimension: ${signal.dimension}`);
        if (signal.weight !== 1 && signal.weight !== 2) errors.push(`Invalid weight: ${option.id}`);
        if (dimensionsInQuestion.has(signal.dimension)) {
          errors.push(`Dimension repeated within question ${question.id}: ${signal.dimension}`);
        }
        dimensionsInQuestion.add(signal.dimension);
      }
      for (const dimension of option.contextualDimensions ?? []) {
        if (!knownDimensions.has(dimension)) errors.push(`Unknown contextual dimension: ${dimension}`);
      }
    }
  }

  for (const dimension of selfReflectionDimensionOrder) {
    const questionCoverage = selfReflectionQuestions.filter((question) =>
      question.options.some((option) => option.signals?.some((signal) => signal.dimension === dimension)),
    );
    const sectionCoverage = new Set(questionCoverage.map(({ sectionId }) => sectionId));
    if (questionCoverage.length < 3 || sectionCoverage.size < 2) {
      errors.push(`Insufficient coverage for ${dimension}.`);
    }
  }

  return errors;
}
