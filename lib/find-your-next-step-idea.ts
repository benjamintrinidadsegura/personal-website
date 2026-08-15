import { ideaQuestions, ideaSections } from "@/data/find-your-next-step-idea";
import type {
  IdeaAnswers,
  IdeaBuildResult,
  IdeaChoiceQuestion,
  IdeaJourneyAction,
  IdeaJourneyState,
  IdeaOption,
  IdeaQuestion,
  IdeaResultRole,
  IdeaSectionId,
} from "@/types/find-your-next-step-idea";

export const initialIdeaState: IdeaJourneyState = {
  phase: "intro",
  questionIndex: 0,
  answers: {},
  validationMessage: null,
  editingSectionId: null,
  restartPending: false,
};

function questionByRole(role: IdeaResultRole): IdeaQuestion {
  const question = ideaQuestions.find((candidate) => candidate.resultRole === role);
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

export function validateIdeaAnswer(question: IdeaQuestion, answers: IdeaAnswers): string | null {
  const answer = answers[question.id];
  if (question.format === "short-text") {
    const length = typeof answer === "string" ? normalizeText(answer).length : 0;
    if (length < question.minLength) return `Bitte formuliere mindestens ${question.minLength} Zeichen in deinen eigenen Worten.`;
    if (length > question.maxLength) return `Bitte kürze deine Antwort auf höchstens ${question.maxLength} Zeichen.`;
    return null;
  }

  const selected = selectedIdeaOptions(question, answers);
  if (selected.some(({ exclusive }) => exclusive) && selected.length !== 1) return "Diese Antwort kann nur allein gewählt werden.";
  if (selected.length < question.minSelections) {
    return question.minSelections === 1
      ? "Bitte wähle eine Antwort."
      : `Bitte wähle genau ${question.minSelections} Antworten.`;
  }
  if (selected.length > question.maxSelections) return `Bitte wähle höchstens ${question.maxSelections} Antworten.`;
  return null;
}

export function formatIdeaSelectionCount(selectedCount: number, maxSelections: number): string {
  return `${selectedCount} von ${maxSelections} ausgewählt`;
}

function textAnswer(role: IdeaResultRole, answers: IdeaAnswers): string {
  const question = questionByRole(role);
  const answer = answers[question.id];
  return typeof answer === "string" ? normalizeText(answer) : "";
}

function optionResults(role: IdeaResultRole, answers: IdeaAnswers): readonly string[] {
  const question = questionByRole(role);
  if (question.format === "short-text") return [];
  return selectedIdeaOptions(question, answers).map(({ resultText }) => resultText);
}

function completeQuestionIds(answers: IdeaAnswers): readonly string[] {
  return ideaQuestions.filter((question) => validateIdeaAnswer(question, answers) === null).map(({ id }) => id);
}

export function buildIdeaResult(answers: IdeaAnswers): IdeaBuildResult {
  const complete = new Set(completeQuestionIds(answers));
  const missingQuestionIds = ideaQuestions.filter(({ id }) => !complete.has(id)).map(({ id }) => id);
  if (missingQuestionIds.length > 0) return { status: "incomplete", missingQuestionIds };

  const snapshot = {
    idea: textAnswer("idea", answers),
    problem: textAnswer("problem", answers),
    audience: textAnswer("audience", answers),
    value: textAnswer("value", answers),
  };
  const evidenceStatus = optionResults("evidence", answers)[0] ?? "Die heutige Evidenzbasis ist noch nicht beschrieben.";
  const assumptions = optionResults("assumptions", answers);
  const constraints = optionResults("constraints", answers);
  const learningGoal = optionResults("learning-goal", answers)[0] ?? "was du als Nächstes besser verstehen möchtest";
  const experimentMode = optionResults("experiment-mode", answers)[0] ?? "Halte den nächsten Versuch klein und reversibel.";

  const evidenceQuestion = questionByRole("evidence");
  const evidenceId = evidenceQuestion.format === "short-text"
    ? ""
    : selectedIdeaOptions(evidenceQuestion, answers)[0]?.id ?? "";
  const strongerEvidence = evidenceId === "direct-observation" || evidenceId === "conversations";
  const known = strongerEvidence
    ? [evidenceStatus, `Das beschriebene Ausgangsproblem lautet derzeit: ${snapshot.problem}`]
    : [`Deine eigene aktuelle Formulierung der Idee lautet: ${snapshot.idea}`];
  const uncertain = [
    ...assumptions,
    ...(strongerEvidence ? [] : ["Wie weit deine bisherige Perspektive für andere Menschen trägt."]),
  ].slice(0, 3);

  return {
    status: "complete",
    result: {
      title: "Deine Idee als veränderbare Arbeitskarte",
      description:
        "Diese Karte trennt deine heutigen Formulierungen von offenen Annahmen. Sie ist ein Ausgangspunkt für Lernen, keine Bewertung oder Bestätigung der Idee.",
      snapshot,
      evidenceStatus,
      known,
      uncertain,
      assumptions,
      constraints,
      experiment: {
        title: "Ein kleiner Lernversuch",
        method: experimentMode,
        observe: `Achte dabei ausschließlich darauf, ${learningGoal}. Notiere Beobachtungen getrennt von deiner Interpretation.`,
        boundary: "Ein einzelner Versuch liefert Hinweise, aber weder Beweis noch Marktvalidierung. Stoppe oder ändere ihn, wenn eine von dir gesetzte Grenze berührt wird.",
      },
      nextStep: `Formuliere vor dem Start eine einzige offene Frage zu „${snapshot.problem}“. Plane dann nur den gewählten Lernversuch und entscheide danach selbst, ob du weitergehst, änderst oder stoppst.`,
      authorityNote:
        "Du behältst die interpretative Autorität: Jede Formulierung, Annahme und Schlussfolgerung darf von dir korrigiert, verworfen oder neu gewichtet werden. Es findet keine Verknüpfung mit Self, Career, Human Context oder deinem Account statt.",
    },
  };
}

function indexForSection(sectionId: IdeaSectionId): number {
  return ideaQuestions.findIndex((question) => question.sectionId === sectionId);
}

function lastIndexForSection(sectionId: IdeaSectionId): number {
  let index = -1;
  ideaQuestions.forEach((question, candidate) => {
    if (question.sectionId === sectionId) index = candidate;
  });
  return index;
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

export function ideaJourneyReducer(state: IdeaJourneyState, action: IdeaJourneyAction): IdeaJourneyState {
  if (action.type === "start") {
    return { ...state, phase: "journey", questionIndex: 0, validationMessage: null, restartPending: false };
  }
  if (action.type === "set-text") {
    const question = ideaQuestions.find(({ id }) => id === action.questionId);
    if (!question || question.format !== "short-text") return state;
    return {
      ...state,
      answers: { ...state.answers, [question.id]: action.value.slice(0, question.maxLength) },
      validationMessage: null,
    };
  }
  if (action.type === "toggle-option") {
    const question = ideaQuestions.find(({ id }) => id === action.questionId);
    if (!question || question.format === "short-text") return state;
    return { ...state, answers: toggleChoice(question, state.answers, action.optionId), validationMessage: null };
  }
  if (action.type === "edit-section") {
    const questionIndex = indexForSection(action.sectionId);
    if (questionIndex < 0) return state;
    return { ...state, phase: "journey", questionIndex, editingSectionId: action.sectionId, validationMessage: null, restartPending: false };
  }
  if (action.type === "continue") {
    if (state.phase !== "journey") return state;
    const question = ideaQuestions[state.questionIndex];
    const validationMessage = validateIdeaAnswer(question, state.answers);
    if (validationMessage) return { ...state, validationMessage };
    if (state.editingSectionId && state.questionIndex === lastIndexForSection(state.editingSectionId)) {
      return buildIdeaResult(state.answers).status === "complete"
        ? { ...state, phase: "result", editingSectionId: null, validationMessage: null }
        : { ...state, questionIndex: Math.min(state.questionIndex + 1, ideaQuestions.length - 1), editingSectionId: null, validationMessage: null };
    }
    if (state.questionIndex === ideaQuestions.length - 1) {
      return buildIdeaResult(state.answers).status === "complete"
        ? { ...state, phase: "result", editingSectionId: null, validationMessage: null }
        : state;
    }
    return { ...state, questionIndex: state.questionIndex + 1, validationMessage: null };
  }
  if (action.type === "back") {
    if (state.phase !== "journey") return state;
    if (state.editingSectionId && state.questionIndex === indexForSection(state.editingSectionId)) {
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

export function ideaSectionProgress(questionIndex: number) {
  const question = ideaQuestions[questionIndex];
  const currentSectionIndex = ideaSections.findIndex(({ id }) => id === question.sectionId);
  const sectionQuestions = ideaQuestions.filter(({ sectionId }) => sectionId === question.sectionId);
  const localQuestionNumber = sectionQuestions.findIndex(({ id }) => id === question.id) + 1;
  return { currentSectionIndex, sectionQuestions, localQuestionNumber };
}
