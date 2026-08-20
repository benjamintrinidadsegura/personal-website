import { getIdeaQuestions, getIdeaSections } from "@/data/find-your-next-step-idea";
import { ideaGeneratedCopy } from "@/data/find-your-next-step-idea-locales";
import type { IdeaGeneratedCopy } from "@/data/find-your-next-step-idea-locales";
import type { Locale } from "@/lib/i18n/config";
import type {
  IdeaAnswers,
  IdeaBuildResult,
  IdeaChoiceQuestion,
  IdeaJourneyAction,
  IdeaJourneyState,
  IdeaOption,
  IdeaQuestion,
  IdeaResultRole,
} from "@/types/find-your-next-step-idea";

export const initialIdeaState: IdeaJourneyState = {
  phase: "intro",
  questionIndex: 0,
  answers: {},
  validationMessage: null,
  editingSectionId: null,
  restartPending: false,
};

type IdeaResultCopy = Omit<IdeaGeneratedCopy, "labels" | "disclaimer" | "shareDisclaimer" | "openQuestion">;
const ideaResultCopyByLocale: Record<Locale, IdeaResultCopy> = {
  de: { min: (n) => `Bitte formuliere mindestens ${n} Zeichen in deinen eigenen Worten.`, max: (n) => `Bitte kürze deine Antwort auf höchstens ${n} Zeichen.`, exclusive: "Diese Antwort kann nur allein gewählt werden.", one: "Bitte wähle eine Antwort.", exact: (n) => `Bitte wähle genau ${n} Antworten.`, range: (a, b) => `Bitte wähle ${a} bis ${b} Antworten.`, selectionMax: (n) => `Bitte wähle höchstens ${n} Antworten.`, selected: (n, max) => `${n} von ${max} ausgewählt`, missingEvidence: "Die heutige Evidenzbasis ist noch nicht beschrieben.", learningFallback: "was du als Nächstes besser verstehen möchtest", experimentFallback: "Halte den nächsten Versuch klein und reversibel.", problemKnown: (text) => `Das beschriebene Ausgangsproblem lautet derzeit: ${text}`, ideaKnown: (text) => `Deine eigene aktuelle Formulierung der Idee lautet: ${text}`, reachOpen: "Wie weit deine bisherige Perspektive für andere Menschen trägt.", title: "Deine Idee als veränderbare Arbeitskarte", description: "Diese Karte trennt deine heutigen Formulierungen von offenen Annahmen. Sie ist ein Ausgangspunkt für Lernen, keine Bewertung oder Bestätigung der Idee.", experimentTitle: "Ein kleiner Lernversuch", observe: (goal) => `Achte dabei ausschließlich darauf, ${goal}. Notiere Beobachtungen getrennt von deiner Interpretation.`, boundary: "Ein einzelner Versuch liefert Hinweise, aber weder Beweis noch Marktvalidierung. Stoppe oder ändere ihn, wenn eine von dir gesetzte Grenze berührt wird.", nextStep: (problem) => `Formuliere vor dem Start eine einzige offene Frage zu „${problem}“. Plane dann nur den gewählten Lernversuch und entscheide danach selbst, ob du weitergehst, änderst oder stoppst.`, authority: "Du behältst die interpretative Autorität: Jede Formulierung, Annahme und Schlussfolgerung darf von dir korrigiert, verworfen oder neu gewichtet werden. Es findet keine Verknüpfung mit Self, Career, Human Context oder deinem Account statt." },
  en: { min: (n) => `Please write at least ${n} characters in your own words.`, max: (n) => `Please shorten your answer to no more than ${n} characters.`, exclusive: "This answer can only be selected on its own.", one: "Please choose one answer.", exact: (n) => `Please choose exactly ${n} answers.`, range: (a, b) => `Please choose between ${a} and ${b} answers.`, selectionMax: (n) => `Please choose no more than ${n} answers.`, selected: (n, max) => `${n} of ${max} selected`, missingEvidence: "Today’s evidence base has not yet been described.", learningFallback: "what you want to understand better next", experimentFallback: "Keep the next experiment small and reversible.", problemKnown: (text) => `The starting problem is currently described as: ${text}`, ideaKnown: (text) => `Your own current description of the idea is: ${text}`, reachOpen: "How far your current perspective applies to other people.", title: "Your idea as an editable working map", description: "This map separates today’s wording from open assumptions. It is a starting point for learning, not an assessment or validation of the idea.", experimentTitle: "A small learning experiment", observe: (goal) => `Focus only on ${goal}. Record observations separately from your interpretation.`, boundary: "One experiment offers indications, not proof or market validation. Stop or change it if it reaches a boundary you have set.", nextStep: (problem) => `Before you begin, write one open question about “${problem}”. Plan only the selected learning experiment, then decide for yourself whether to continue, change direction or stop.`, authority: "You retain interpretive authority: you may correct, discard or reweight every statement, assumption and conclusion. Nothing is connected to Self, Career, Human Context or your account." },
  ...ideaGeneratedCopy,
};

function questionByRole(role: IdeaResultRole, locale: Locale): IdeaQuestion {
  const question = getIdeaQuestions(locale).find((candidate) => candidate.resultRole === role);
  if (!question) throw new Error(`Missing Idea question for role: ${role}`);
  return question;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

export function selectedIdeaOptions(question: IdeaChoiceQuestion, answers: IdeaAnswers): readonly IdeaOption[] {
  const answer = answers[question.id];
  if (!Array.isArray(answer)) return [];
  const selected = new Set(answer);
  return question.options.filter(({ id }) => selected.has(id));
}

export function validateIdeaAnswer(question: IdeaQuestion, answers: IdeaAnswers, locale: Locale = "de"): string | null {
  const copy = ideaResultCopyByLocale[locale];
  const answer = answers[question.id];
  if (question.format === "short-text") {
    const length = typeof answer === "string" ? normalizeText(answer).length : 0;
    if (length < question.minLength) return copy.min(question.minLength);
    if (length > question.maxLength) return copy.max(question.maxLength);
    return null;
  }

  const selected = selectedIdeaOptions(question, answers);
  if (selected.some(({ exclusive }) => exclusive) && selected.length !== 1) return copy.exclusive;
  if (selected.length < question.minSelections) {
    return question.minSelections === 1 ? copy.one : copy.exact(question.minSelections);
  }
  if (selected.length > question.maxSelections) return copy.selectionMax(question.maxSelections);
  return null;
}

export function formatIdeaSelectionCount(selectedCount: number, maxSelections: number, locale: Locale = "de"): string {
  return ideaResultCopyByLocale[locale].selected(selectedCount, maxSelections);
}

function textAnswer(role: IdeaResultRole, answers: IdeaAnswers, locale: Locale): string {
  const question = questionByRole(role, locale);
  const answer = answers[question.id];
  return typeof answer === "string" ? normalizeText(answer) : "";
}

function optionResults(role: IdeaResultRole, answers: IdeaAnswers, locale: Locale): readonly string[] {
  const question = questionByRole(role, locale);
  if (question.format === "short-text") return [];
  return selectedIdeaOptions(question, answers).map(({ resultText }) => resultText);
}

function completeQuestionIds(answers: IdeaAnswers, locale: Locale): readonly string[] {
  return getIdeaQuestions(locale).filter((question) => validateIdeaAnswer(question, answers, locale) === null).map(({ id }) => id);
}

export function buildIdeaResult(answers: IdeaAnswers, locale: Locale = "de"): IdeaBuildResult {
  const localizedQuestions = getIdeaQuestions(locale);
  const complete = new Set(completeQuestionIds(answers, locale));
  const missingQuestionIds = localizedQuestions.filter(({ id }) => !complete.has(id)).map(({ id }) => id);
  if (missingQuestionIds.length > 0) return { status: "incomplete", missingQuestionIds };
  const copy = ideaResultCopyByLocale[locale];

  const snapshot = {
    idea: textAnswer("idea", answers, locale),
    problem: textAnswer("problem", answers, locale),
    audience: textAnswer("audience", answers, locale),
    value: textAnswer("value", answers, locale),
  };
  const evidenceStatus = optionResults("evidence", answers, locale)[0] ?? copy.missingEvidence;
  const assumptions = optionResults("assumptions", answers, locale);
  const constraints = optionResults("constraints", answers, locale);
  const learningGoal = optionResults("learning-goal", answers, locale)[0] ?? copy.learningFallback;
  const experimentMode = optionResults("experiment-mode", answers, locale)[0] ?? copy.experimentFallback;

  const evidenceQuestion = questionByRole("evidence", locale);
  const evidenceId = evidenceQuestion.format === "short-text"
    ? ""
    : selectedIdeaOptions(evidenceQuestion, answers)[0]?.id ?? "";
  const strongerEvidence = evidenceId === "direct-observation" || evidenceId === "conversations";
  const known = strongerEvidence
    ? [evidenceStatus, copy.problemKnown(snapshot.problem)]
    : [copy.ideaKnown(snapshot.idea)];
  const uncertain = [
    ...assumptions,
    ...(strongerEvidence ? [] : [copy.reachOpen]),
  ].slice(0, 3);

  return {
    status: "complete",
    result: {
      title: copy.title,
      description: copy.description,
      snapshot,
      evidenceStatus,
      known,
      uncertain,
      assumptions,
      constraints,
      experiment: {
        title: copy.experimentTitle,
        method: experimentMode,
        observe: copy.observe(learningGoal),
        boundary: copy.boundary,
      },
      nextStep: copy.nextStep(snapshot.problem),
      authorityNote: copy.authority,
    },
  };
}

function toggleChoice(question: IdeaChoiceQuestion, answers: IdeaAnswers, optionId: string): IdeaAnswers {
  const option = question.options.find(({ id }) => id === optionId);
  if (!option) return answers;
  const current = selectedIdeaOptions(question, answers).map(({ id }) => id);
  if (current.includes(optionId)) return { ...answers, [question.id]: current.filter((id) => id !== optionId) };
  if (option.exclusive) return { ...answers, [question.id]: [optionId] };
  const withoutExclusive = current.filter((id) => !question.options.find((candidate) => candidate.id === id)?.exclusive);
  if (question.format === "single") return { ...answers, [question.id]: [optionId] };
  if (withoutExclusive.length >= question.maxSelections) return answers;
  return { ...answers, [question.id]: [...withoutExclusive, optionId] };
}

export function ideaJourneyReducer(state: IdeaJourneyState, action: IdeaJourneyAction, locale: Locale = "de"): IdeaJourneyState {
  const localizedQuestions = getIdeaQuestions(locale);
  if (action.type === "start") {
    return { ...state, phase: "journey", questionIndex: 0, validationMessage: null, restartPending: false };
  }
  if (action.type === "set-text") {
    const question = localizedQuestions.find(({ id }) => id === action.questionId);
    if (!question || question.format !== "short-text") return state;
    return {
      ...state,
      answers: { ...state.answers, [question.id]: action.value.slice(0, question.maxLength) },
      validationMessage: null,
    };
  }
  if (action.type === "toggle-option") {
    const question = localizedQuestions.find(({ id }) => id === action.questionId);
    if (!question || question.format === "short-text") return state;
    return { ...state, answers: toggleChoice(question, state.answers, action.optionId), validationMessage: null };
  }
  if (action.type === "edit-section") {
    const questionIndex = localizedQuestions.findIndex((question) => question.sectionId === action.sectionId);
    if (questionIndex < 0) return state;
    return { ...state, phase: "journey", questionIndex, editingSectionId: action.sectionId, validationMessage: null, restartPending: false };
  }
  if (action.type === "continue") {
    if (state.phase !== "journey") return state;
    const question = localizedQuestions[state.questionIndex];
    const validationMessage = validateIdeaAnswer(question, state.answers, locale);
    if (validationMessage) return { ...state, validationMessage };
    const localizedLastIndex = state.editingSectionId
      ? localizedQuestions.reduce((last, candidate, index) => candidate.sectionId === state.editingSectionId ? index : last, -1)
      : -1;
    if (state.editingSectionId && state.questionIndex === localizedLastIndex) {
      return buildIdeaResult(state.answers, locale).status === "complete"
        ? { ...state, phase: "result", editingSectionId: null, validationMessage: null }
        : { ...state, questionIndex: Math.min(state.questionIndex + 1, localizedQuestions.length - 1), editingSectionId: null, validationMessage: null };
    }
    if (state.questionIndex === localizedQuestions.length - 1) {
      return buildIdeaResult(state.answers, locale).status === "complete"
        ? { ...state, phase: "result", editingSectionId: null, validationMessage: null }
        : state;
    }
    return { ...state, questionIndex: state.questionIndex + 1, validationMessage: null };
  }
  if (action.type === "back") {
    if (state.phase !== "journey") return state;
    if (state.editingSectionId && state.questionIndex === localizedQuestions.findIndex((question) => question.sectionId === state.editingSectionId)) {
      return { ...state, phase: "result", editingSectionId: null, validationMessage: null };
    }
    if (state.questionIndex === 0) return { ...state, phase: "intro", validationMessage: null };
    return { ...state, questionIndex: state.questionIndex - 1, validationMessage: null };
  }
  if (action.type === "request-restart") return { ...state, restartPending: true };
  if (action.type === "cancel-restart") return { ...state, restartPending: false };
  if (action.type === "confirm-restart") return initialIdeaState;
  return state;
}

export function ideaSectionProgress(questionIndex: number, locale: Locale = "de") {
  const localizedQuestions = getIdeaQuestions(locale);
  const localizedSections = getIdeaSections(locale);
  const question = localizedQuestions[questionIndex];
  const currentSectionIndex = localizedSections.findIndex(({ id }) => id === question.sectionId);
  const sectionQuestions = localizedQuestions.filter(({ sectionId }) => sectionId === question.sectionId);
  const localQuestionNumber = sectionQuestions.findIndex(({ id }) => id === question.id) + 1;
  return { currentSectionIndex, sectionQuestions, localQuestionNumber };
}
