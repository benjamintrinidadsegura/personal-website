import {
  getSelfReflectionDimensions,
  getSelfReflectionQuestions,
  getSelfReflectionResultSections,
  getSelfReflectionTensions,
  selfReflectionDimensions,
  selfReflectionQuestions,
  selfReflectionSections,
} from "@/data/find-your-next-step-self";
import { selfGeneratedCopy } from "@/data/find-your-next-step-self-locales";
import type { SelfGeneratedCopy } from "@/data/find-your-next-step-self-locales";
import type { Locale } from "@/lib/i18n/config";
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

const selfResultCopyByLocale: Record<Locale, SelfGeneratedCopy> = {
  de: { openContext: "Deine Antworten ergeben im Moment kein stark verdichtetes Muster – einige Themen scheinen stärker vom jeweiligen Kontext abzuhängen.", open: "Deine Antworten ergeben im Moment ein offenes Bild, ohne dass ein einzelnes Thema deutlich in den Vordergrund tritt.", oneClear: (a) => `In deiner Momentaufnahme zeigt sich ${a} besonders klar.`, oneMultiple: (a) => `In deiner Momentaufnahme taucht ${a} an mehreren Stellen auf.`, twoClear: (a, b) => `In deiner Momentaufnahme zeigen sich ${a} und ${b} besonders klar.`, clearMultiple: (a, b) => `${a} zeigt sich in deiner Momentaufnahme besonders klar; ${b} taucht ebenfalls an mehreren Stellen auf.`, twoMultiple: (a, b) => `In deiner Momentaufnahme tauchen ${a} und ${b} an mehreren Stellen auf.`, tension: (title) => `Spannend ist außerdem die Kombination „${title}“.`, own: (answer) => `Als eigene Beobachtung hast du außerdem ausgewählt: „${answer}“`, selected: (n, max) => `${n} von ${max} ausgewählt`, selfImage: "Was du bei dir selbst wiedererkennst", title: "Dein mögliches Arbeits- und Lebens-Habitat", description: "Eine Momentaufnahme deiner aktuellen Antworten – kein festes Persönlichkeitsprofil und keine Bewertung deiner Person.", one: "Wähle eine Antwort aus.", exact: (n) => `Wähle genau ${n} Antworten aus.`, range: (a, b) => `Wähle ${a} bis ${b} Antworten aus.`, max: (n) => `Du kannst höchstens ${n} Antworten auswählen.`, incomplete: "Beantworte bitte alle Fragen, bevor du dein Ergebnis öffnest." },
  en: { openContext: "Your answers do not form a strongly concentrated pattern at the moment — some themes appear to depend more on the particular context.", open: "Your answers currently form an open picture, without one theme moving clearly into the foreground.", oneClear: (a) => `In your snapshot, ${a} appears especially clearly.`, oneMultiple: (a) => `In your snapshot, ${a} appears in several places.`, twoClear: (a, b) => `In your snapshot, ${a} and ${b} appear especially clearly.`, clearMultiple: (a, b) => `${a} appears especially clearly in your snapshot; ${b} also appears in several places.`, twoMultiple: (a, b) => `In your snapshot, ${a} and ${b} appear in several places.`, tension: (title) => `The combination “${title}” also stands out.`, own: (answer) => `As an observation of your own, you also selected: “${answer}”`, selected: (n, max) => `${n} of ${max} selected`, selfImage: "What you recognise in yourself", title: "Your possible habitat for work and life", description: "A snapshot of your current answers — not a fixed personality profile or an assessment of you.", one: "Choose one answer.", exact: (n) => `Choose exactly ${n} answers.`, range: (a, b) => `Choose between ${a} and ${b} answers.`, max: (n) => `You can select no more than ${n} answers.`, incomplete: "Please answer every question before opening your result." },
  ...selfGeneratedCopy,
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

export function getMissingSelfReflectionQuestionIds(answers: SelfReflectionAnswers, locale: Locale = "de"): string[] {
  return getSelfReflectionQuestions(locale)
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
  locale: Locale = "de",
): readonly SelfReflectionDimensionEvaluation[] {
  const activeQuestions = getSelfReflectionQuestions(locale);
  const contextualDimensions = new Set<SelfReflectionDimensionId>();

  for (const question of activeQuestions) {
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

    for (const question of activeQuestions) {
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
  locale: Locale = "de",
): SelfReflectionEvidence[] {
  const evidence: SelfReflectionEvidence[] = [];

  for (const question of getSelfReflectionQuestions(locale)) {
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

export function compareSelfReflectionEvaluations(
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

export function orderVisibleSelfReflectionEvaluations(
  evaluations: readonly SelfReflectionDimensionEvaluation[],
): readonly (SelfReflectionDimensionEvaluation & { visibility: SelfReflectionVisibility })[] {
  return evaluations
    .filter((evaluation): evaluation is SelfReflectionDimensionEvaluation & {
      visibility: SelfReflectionVisibility;
    } => evaluation.visibility !== null)
    .sort(compareSelfReflectionEvaluations);
}

function buildVisibleDimensionSummary(
  evaluations: readonly SelfReflectionDimensionEvaluation[],
  locale: Locale,
): string {
  const copy = selfResultCopyByLocale[locale];
  const dimensions = getSelfReflectionDimensions(locale);
  const visible = orderVisibleSelfReflectionEvaluations(evaluations).slice(0, 2);

  if (visible.length === 0) {
    return evaluations.some(({ contextual }) => contextual)
      ? copy.openContext
      : copy.open;
  }

  const [first, second] = visible;
  const firstLabel = dimensions[first.dimension].label;
  if (!second) {
    return first.visibility === "clear"
      ? copy.oneClear(firstLabel)
      : copy.oneMultiple(firstLabel);
  }

  const secondLabel = dimensions[second.dimension].label;
  if (first.visibility === "clear" && second.visibility === "clear") {
    return copy.twoClear(firstLabel, secondLabel);
  }
  if (first.visibility === "clear") {
    return copy.clearMultiple(firstLabel, secondLabel);
  }
  return copy.twoMultiple(firstLabel, secondLabel);
}

export function buildSelfReflectionSummary(
  evaluations: readonly SelfReflectionDimensionEvaluation[],
  tensions: readonly SelfReflectionTensionResult[],
  selfImageSection: SelfReflectionResultSection | null,
  locale: Locale = "de",
): readonly string[] {
  const summary = [buildVisibleDimensionSummary(evaluations, locale)];
  const firstTension = tensions[0];

  if (firstTension) {
    summary.push(selfResultCopyByLocale[locale].tension(firstTension.title));
    summary.push(firstTension.text);
    return summary;
  }

  const visibleDimensionCount = evaluations.filter(({ visibility }) => visibility !== null).length;
  const selfImageAnswer = selfImageSection?.statements[0]?.evidence[0]?.answer;
  if (visibleDimensionCount < 2 && selfImageAnswer) {
    summary.push(selfResultCopyByLocale[locale].own(selfImageAnswer));
  }

  return summary;
}

export function formatSelfReflectionSelectionCount(
  selectedCount: number,
  maxSelections: number,
  locale: Locale = "de",
): string {
  return selfResultCopyByLocale[locale].selected(selectedCount, maxSelections);
}

function buildDimensionSections(
  answers: SelfReflectionAnswers,
  evaluations: readonly SelfReflectionDimensionEvaluation[],
  locale: Locale,
): SelfReflectionResultSection[] {
  const dimensions = getSelfReflectionDimensions(locale);
  return getSelfReflectionResultSections(locale).flatMap((section) => {
    const statements = orderVisibleSelfReflectionEvaluations(evaluations)
      .flatMap((evaluation) => {
        const definition = dimensions[evaluation.dimension];
        const text = section.id === "selfImage" ? undefined : definition.copy[section.id];
        const evidence = takeDistinctEvidence(getDimensionEvidence(
          answers,
          evaluation.dimension,
          section.roles,
          locale,
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

function buildSelfImageSection(answers: SelfReflectionAnswers, locale: Locale): SelfReflectionResultSection | null {
  const question = getSelfReflectionQuestions(locale).find(({ evidenceRole }) => evidenceRole === "selfImage");
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
    ? { id: "selfImage", title: selfResultCopyByLocale[locale].selfImage, statements }
    : null;
}

function selectedOptionSupportsPair(
  answers: SelfReflectionAnswers,
  dimensions: readonly [SelfReflectionDimensionId, SelfReflectionDimensionId],
  locale: Locale,
): boolean {
  return getSelfReflectionQuestions(locale).some((question) =>
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
  locale: Locale,
) {
  const evaluationByDimension = new Map(evaluations.map((evaluation) => [evaluation.dimension, evaluation]));

  return getSelfReflectionTensions(locale)
    .flatMap((tension, definitionIndex) => {
      const [leftDimension, rightDimension] = tension.dimensions;
      const left = evaluationByDimension.get(leftDimension);
      const right = evaluationByDimension.get(rightDimension);
      if (!left?.visibility || !right?.visibility) return [];

      const allEvidence = [
        ...getDimensionEvidence(answers, leftDimension, undefined, locale),
        ...getDimensionEvidence(answers, rightDimension, undefined, locale),
      ];
      const independentQuestions = new Set(allEvidence.map(({ questionId }) => questionId));
      if (independentQuestions.size < 3) return [];

      const evidence: SelfReflectionEvidence[] = [];
      for (const dimension of tension.dimensions) {
        const first = getDimensionEvidence(answers, dimension, undefined, locale)[0];
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
        explicitPair: selectedOptionSupportsPair(answers, tension.dimensions, locale),
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

export function buildSelfReflectionResult(answers: SelfReflectionAnswers, locale: Locale = "de"):
  | { status: "incomplete"; missingQuestionIds: readonly string[] }
  | { status: "complete"; result: SelfReflectionResult } {
  const missingQuestionIds = getMissingSelfReflectionQuestionIds(answers, locale);
  if (missingQuestionIds.length > 0) return { status: "incomplete", missingQuestionIds };

  const evaluations = calculateSelfReflectionScores(answers, locale);
  const selfImageSection = buildSelfImageSection(answers, locale);
  const sections = buildDimensionSections(answers, evaluations, locale);
  if (selfImageSection) sections.push(selfImageSection);
  const tensions = buildTensions(answers, evaluations, locale);

  return {
    status: "complete",
    result: {
      title: selfResultCopyByLocale[locale].title,
      description: selfResultCopyByLocale[locale].description,
      summary: buildSelfReflectionSummary(evaluations, tensions, selfImageSection, locale),
      sections,
      tensions,
    },
  };
}

function selectionInstruction(question: SelfReflectionQuestion, locale: Locale): string {
  const copy = selfResultCopyByLocale[locale];
  if (question.minSelections === question.maxSelections) {
    return question.minSelections === 1 ? copy.one : copy.exact(question.minSelections);
  }
  return copy.range(question.minSelections, question.maxSelections);
}

function isLastQuestionOfSection(questionIndex: number, sectionId: SelfReflectionSectionId, locale: Locale): boolean {
  const nextQuestion = getSelfReflectionQuestions(locale)[questionIndex + 1];
  return !nextQuestion || nextQuestion.sectionId !== sectionId;
}

export function selfReflectionJourneyReducer(
  state: SelfReflectionJourneyState,
  action: SelfReflectionJourneyAction,
  locale: Locale = "de",
): SelfReflectionJourneyState {
  const activeQuestions = getSelfReflectionQuestions(locale);
  if (action.type === "confirm-restart") return initialSelfReflectionState;
  if (action.type === "request-restart") return { ...state, restartPending: true };
  if (action.type === "cancel-restart") return { ...state, restartPending: false };
  if (action.type === "start") {
    return { ...state, phase: "journey", questionIndex: 0, validationMessage: null, restartPending: false };
  }
  if (action.type === "edit-section") {
    const questionIndex = activeQuestions.findIndex(({ sectionId }) => sectionId === action.sectionId);
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
    const question = activeQuestions[state.questionIndex];
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
          validationMessage: selfResultCopyByLocale[locale].max(question.maxSelections),
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
    const question = activeQuestions[state.questionIndex];
    const firstEditingIndex = state.editingSectionId
      ? activeQuestions.findIndex(({ sectionId }) => sectionId === state.editingSectionId)
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
    const question = activeQuestions[state.questionIndex];
    if (!question) return state;
    if (!isSelfReflectionQuestionComplete(question, state.answers[question.id])) {
      return { ...state, validationMessage: selectionInstruction(question, locale) };
    }

    const atJourneyEnd = state.questionIndex === activeQuestions.length - 1;
    const atEditedSectionEnd = state.editingSectionId
      ? isLastQuestionOfSection(state.questionIndex, state.editingSectionId, locale)
      : false;
    if (atJourneyEnd || atEditedSectionEnd) {
      if (getMissingSelfReflectionQuestionIds(state.answers, locale).length > 0) {
        return atJourneyEnd
          ? { ...state, validationMessage: selfResultCopyByLocale[locale].incomplete }
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
  if (selfReflectionQuestions.length !== 16) errors.push("Self Reflection must define exactly sixteen questions.");

  for (const section of selfReflectionSections) {
    const questions = selfReflectionQuestions.filter(({ sectionId }) => sectionId === section.id);
    const expectedQuestionCount = section.id === "conditions" ? 4 : 3;
    if (questions.length !== expectedQuestionCount) errors.push(`${section.id} must own exactly ${expectedQuestionCount} questions.`);
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
