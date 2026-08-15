import { problemQuestions, problemSections } from "@/data/find-your-next-step-problem";
import type {
  ProblemAnswers,
  ProblemBoundary,
  ProblemEvidence,
  ProblemJourneyAction,
  ProblemJourneyState,
  ProblemNextStep,
  ProblemQuestion,
  ProblemResult,
  ProblemResultStatement,
  ProblemSectionId,
} from "@/types/find-your-next-step-problem";

export const initialProblemState: ProblemJourneyState = {
  phase: "intro",
  questionIndex: 0,
  answers: {},
  validationMessage: null,
  editingSectionId: null,
  restartPending: false,
};

function normalizedText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

export function isProblemQuestionComplete(
  question: ProblemQuestion,
  values: readonly string[] | undefined,
): boolean {
  if (!values || values.length !== 1 && question.format === "text") return false;
  if (question.format === "text") {
    const value = normalizedText(values[0] ?? "");
    return value.length >= 10 && value.length <= (question.maxLength ?? 280);
  }

  const selectedIds = new Set(values);
  if (selectedIds.size !== values.length) return false;
  if (values.length < question.minSelections || values.length > question.maxSelections) return false;
  const selectedOptions = values.map((id) => question.options.find((option) => option.id === id));
  if (selectedOptions.some((option) => !option)) return false;
  return !selectedOptions.some((option) => option?.exclusive) || values.length === 1;
}

export function getMissingProblemQuestionIds(answers: ProblemAnswers): string[] {
  return problemQuestions
    .filter((question) => !isProblemQuestionComplete(question, answers[question.id]))
    .map(({ id }) => id);
}

export function formatProblemSelectionCount(selectedCount: number, maxSelections: number): string {
  return `${selectedCount} von ${maxSelections} ausgewählt`;
}

function questionById(id: string): ProblemQuestion {
  const question = problemQuestions.find((candidate) => candidate.id === id);
  if (!question) throw new Error(`Unknown Problem question: ${id}`);
  return question;
}

function selectedId(answers: ProblemAnswers, questionId: string): string | null {
  return answers[questionId]?.[0] ?? null;
}

function evidenceFor(answers: ProblemAnswers, questionId: string, limit = 3): ProblemEvidence[] {
  const question = questionById(questionId);
  if (question.format === "text") {
    return isProblemQuestionComplete(question, answers[questionId])
      ? [{ questionId, optionId: "self-authored-note", answer: "Eigene kurze Beschreibung der gewünschten Veränderung" }]
      : [];
  }
  return (answers[questionId] ?? []).slice(0, limit).flatMap((optionId) => {
    const option = question.options.find(({ id }) => id === optionId);
    return option ? [{ questionId, optionId, answer: option.label }] : [];
  });
}

function optionLabel(answers: ProblemAnswers, questionId: string): string {
  return evidenceFor(answers, questionId, 1)[0]?.answer ?? "";
}

function buildBoundary(answers: ProblemAnswers): ProblemBoundary {
  const safety = selectedId(answers, "urgency-safety");
  if (safety === "safety-immediate" || safety === "safety-unsure") {
    return {
      level: "urgent",
      title: safety === "safety-immediate" ? "Sicherheit geht jetzt vor" : "Unsicherheit über Sicherheit ernst nehmen",
      text: "FYNS kann Gefahr nicht beurteilen. Nutze diese Auswertung nicht als Sicherheitsentscheidung. Wende dich jetzt an den örtlichen Notruf oder eine unmittelbar erreichbare geeignete Anlaufstelle; wenn möglich, beziehe eine vertraute Person ein.",
    };
  }

  const area = selectedId(answers, "situation-area");
  if (["area-health", "area-finance", "area-legal"].includes(area ?? "")) {
    return {
      level: "professional",
      title: "Fachliche Grenzen mitdenken",
      text: "Diese Situationsskizze ersetzt keine medizinische, psychologische, rechtliche oder finanzielle Beratung. Prüfe wichtige Entscheidungen mit einer dafür qualifizierten Stelle.",
    };
  }

  return {
    level: "standard",
    title: "Du behältst die Deutungshoheit",
    text: "Diese Skizze ordnet nur deine eigenen Angaben. Sie bewertet weder dich noch andere und kann relevante Informationen übersehen.",
  };
}

function buildSituationStatements(answers: ProblemAnswers): ProblemResultStatement[] {
  const area = optionLabel(answers, "situation-area");
  const pressure = optionLabel(answers, "urgency-pressure");
  const effect = optionLabel(answers, "experience-effect");
  return [
    {
      id: "situation-focus",
      title: "Fokus dieser Klärung",
      text: `Du ordnest die Situation zunächst im Bereich „${area}“ ein. Das ist ein Ausgangspunkt, keine abschließende Kategorie.`,
      evidence: evidenceFor(answers, "situation-area"),
    },
    {
      id: "situation-pressure",
      title: "Zeitlicher Rahmen",
      text: pressure,
      evidence: evidenceFor(answers, "urgency-pressure"),
    },
    {
      id: "situation-experience",
      title: "Bisherige Wirkung",
      text: effect,
      evidence: evidenceFor(answers, "experience-effect"),
    },
  ];
}

function buildResourceStatements(answers: ProblemAnswers): ProblemResultStatement[] {
  const influence = optionLabel(answers, "experience-influence");
  const support = evidenceFor(answers, "next-support");
  const tried = evidenceFor(answers, "experience-tried");
  return [
    {
      id: "resource-influence",
      title: "Eigener Einfluss",
      text: influence,
      evidence: evidenceFor(answers, "experience-influence"),
    },
    {
      id: "resource-support",
      title: "Erreichbare Unterstützung",
      text: support.some(({ optionId }) => optionId === "support-none")
        ? "Du siehst im Moment keine der genannten Unterstützungen als sicher erreichbar. Das ist eine wichtige Grenze, keine persönliche Schwäche."
        : `Du hast ${support.length === 1 ? "eine erreichbare Möglichkeit" : `${support.length} erreichbare Möglichkeiten`} markiert.`,
      evidence: support,
    },
    {
      id: "resource-experience",
      title: "Was du bereits eingebracht hast",
      text: tried.some(({ optionId }) => optionId === "tried-none")
        ? "Du startest ohne einen bisherigen Lösungsversuch. Der nächste Schritt darf deshalb besonders klein bleiben."
        : `Du hast bereits ${tried.length === 1 ? "einen Ansatz" : `${tried.length} Ansätze`} ausprobiert oder vorbereitet.`,
      evidence: tried,
    },
  ];
}

function buildQuestionsToCarry(answers: ProblemAnswers): string[] {
  const influence = selectedId(answers, "experience-influence");
  const effect = selectedId(answers, "experience-effect");
  const support = new Set(answers["next-support"] ?? []);
  const questions = [
    "Welche Information würde die Situation tatsächlich verändern – und welche wäre nur beruhigend, ohne weiterzuhelfen?",
  ];
  if (influence === "influence-shared" || influence === "influence-low") {
    questions.push("Was liegt in deinem Einfluss, und wofür braucht es eine Entscheidung, Zustimmung oder Unterstützung von außen?");
  } else {
    questions.push("Welcher kleine Teil liegt sicher in deinem Einfluss und lässt sich ohne große Folgewirkung prüfen?");
  }
  if (effect === "effect-none" || effect === "effect-unclear") {
    questions.push("Was müsste ein nächster Versuch anders machen, damit du überhaupt erkennen kannst, ob er hilft?");
  } else if (support.has("support-involved")) {
    questions.push("Was soll die beteiligte Person nach einem Gespräch klarer verstehen als vorher?");
  } else {
    questions.push("Woran würdest du nach dem nächsten Schritt erkennen, ob mehr Klarheit entstanden ist?");
  }
  return questions.slice(0, 3);
}

const nextStepByMode: Readonly<Record<string, Omit<ProblemNextStep, "evidence">>> = {
  "mode-facts": {
    title: "Drei offene Fakten benennen",
    text: "Notiere höchstens drei Fragen, deren Antworten deine Entscheidung wirklich verändern würden. Suche anschließend nur für die wichtigste Frage eine verlässliche Quelle.",
  },
  "mode-talk": {
    title: "Ein Gespräch mit einem klaren Ziel vorbereiten",
    text: "Formuliere vorab in einem Satz, was nach dem Gespräch klarer sein soll, und welche eine Frage du unbedingt stellen möchtest.",
  },
  "mode-small-step": {
    title: "Einen kleinen reversiblen Versuch wählen",
    text: "Wähle einen Schritt, den du ohne große Folgewirkung testen kannst. Lege vorher fest, woran du erkennst, ob er nützlich war.",
  },
  "mode-professional": {
    title: "Eine qualifizierte Anlaufstelle auswählen",
    text: "Suche eine Stelle, deren Zuständigkeit zu deinem konkreten Problem passt. Bereite die wichtigsten Fakten und deine zentrale Frage für den Erstkontakt vor.",
  },
  "mode-pause": {
    title: "Eine begrenzte Pause vereinbaren",
    text: "Lege einen konkreten Zeitpunkt fest, an dem du die Situation erneut ansiehst. Nutze die Pause zur Entlastung, nicht zum unbegrenzten Aufschieben.",
  },
};

function buildNextStep(answers: ProblemAnswers, boundary: ProblemBoundary): ProblemNextStep {
  const evidence = evidenceFor(answers, "next-mode");
  if (boundary.level === "urgent") {
    return {
      title: "Jetzt geeignete Hilfe erreichen",
      text: "Überspringe weitere Selbstklärung. Kontaktiere den örtlichen Notruf oder eine unmittelbar erreichbare geeignete Anlaufstelle; wenn möglich, bitte eine vertraute Person, bei dir zu bleiben oder den Kontakt mit dir herzustellen.",
      evidence: evidenceFor(answers, "urgency-safety"),
    };
  }
  const mode = selectedId(answers, "next-mode") ?? "mode-facts";
  return { ...(nextStepByMode[mode] ?? nextStepByMode["mode-facts"]), evidence };
}

export function buildProblemResult(answers: ProblemAnswers):
  | { status: "incomplete"; missingQuestionIds: readonly string[] }
  | { status: "complete"; result: ProblemResult } {
  const missingQuestionIds = getMissingProblemQuestionIds(answers);
  if (missingQuestionIds.length > 0) return { status: "incomplete", missingQuestionIds };

  const boundary = buildBoundary(answers);
  const pressure = selectedId(answers, "urgency-pressure");
  const influence = selectedId(answers, "experience-influence");
  const userNote = normalizedText(answers["situation-change"]?.[0] ?? "") || null;
  const summary = [
    boundary.level === "urgent"
      ? "Deine Angabe zur unmittelbaren Sicherheit steht vor jeder weiteren Einordnung."
      : pressure === "pressure-now"
        ? "Du beschreibst kurzfristigen Handlungsdruck; der nächste Schritt sollte deshalb klein und klar begrenzt sein."
        : "Du hast das Problem in Situation, Dringlichkeit, Erfahrung und nächste Bewegung gegliedert.",
    influence === "influence-low"
      ? "Dein direkter Einfluss wirkt derzeit begrenzt; Unterstützung und Zuständigkeiten sind deshalb besonders wichtig."
      : "Die Skizze trennt deinen möglichen Beitrag von Entscheidungen und Bedingungen außerhalb deiner Kontrolle.",
  ];

  return {
    status: "complete",
    result: {
      title: "Deine Situationsskizze",
      description: "Eine lokale Momentaufnahme deiner eigenen Angaben – keine Diagnose, Risikobewertung oder professionelle Beratung.",
      summary,
      boundary,
      situation: buildSituationStatements(answers),
      resources: buildResourceStatements(answers),
      questionsToCarry: buildQuestionsToCarry(answers),
      nextStep: buildNextStep(answers, boundary),
      userNote,
    },
  };
}

function selectionInstruction(question: ProblemQuestion): string {
  if (question.format === "text") return `Schreibe 10 bis ${question.maxLength ?? 280} Zeichen.`;
  if (question.minSelections === question.maxSelections) {
    return question.minSelections === 1 ? "Wähle eine Antwort aus." : `Wähle genau ${question.minSelections} Antworten aus.`;
  }
  return `Wähle ${question.minSelections} bis ${question.maxSelections} Antworten aus.`;
}

function isLastQuestionOfSection(questionIndex: number, sectionId: ProblemSectionId): boolean {
  const nextQuestion = problemQuestions[questionIndex + 1];
  return !nextQuestion || nextQuestion.sectionId !== sectionId;
}

export function problemJourneyReducer(
  state: ProblemJourneyState,
  action: ProblemJourneyAction,
): ProblemJourneyState {
  if (action.type === "confirm-restart") return initialProblemState;
  if (action.type === "request-restart") return { ...state, restartPending: true };
  if (action.type === "cancel-restart") return { ...state, restartPending: false };
  if (action.type === "start") return { ...state, phase: "journey", questionIndex: 0, validationMessage: null };
  if (action.type === "edit-section") {
    const questionIndex = problemQuestions.findIndex(({ sectionId }) => sectionId === action.sectionId);
    if (questionIndex < 0) return state;
    return { ...state, phase: "journey", questionIndex, validationMessage: null, editingSectionId: action.sectionId, restartPending: false };
  }
  if (action.type === "set-text") {
    if (state.phase !== "journey") return state;
    const question = problemQuestions[state.questionIndex];
    if (!question || question.id !== action.questionId || question.format !== "text") return state;
    const value = action.value.slice(0, question.maxLength ?? 280);
    return { ...state, answers: { ...state.answers, [question.id]: [value] }, validationMessage: null };
  }
  if (action.type === "toggle-option") {
    if (state.phase !== "journey") return state;
    const question = problemQuestions[state.questionIndex];
    if (!question || question.id !== action.questionId || question.format === "text") return state;
    const option = question.options.find(({ id }) => id === action.optionId);
    if (!option) return state;
    const current = [...(state.answers[question.id] ?? [])];
    const alreadySelected = current.includes(option.id);
    let selected: string[];
    if (question.format === "single") selected = [option.id];
    else if (alreadySelected) selected = current.filter((id) => id !== option.id);
    else if (option.exclusive) selected = [option.id];
    else {
      const withoutExclusive = current.filter((id) => !question.options.find((candidate) => candidate.id === id)?.exclusive);
      if (withoutExclusive.length >= question.maxSelections) {
        return { ...state, validationMessage: `Du kannst höchstens ${question.maxSelections} Antworten auswählen.` };
      }
      selected = [...withoutExclusive, option.id];
    }
    const order = new Map(question.options.map((candidate, index) => [candidate.id, index]));
    selected.sort((left, right) => (order.get(left) ?? 0) - (order.get(right) ?? 0));
    return { ...state, answers: { ...state.answers, [question.id]: selected }, validationMessage: null };
  }
  if (action.type === "back") {
    if (state.phase !== "journey") return state;
    const firstEditingIndex = state.editingSectionId
      ? problemQuestions.findIndex(({ sectionId }) => sectionId === state.editingSectionId)
      : -1;
    if (state.editingSectionId && state.questionIndex === firstEditingIndex) {
      return { ...state, phase: "result", editingSectionId: null, validationMessage: null };
    }
    if (state.questionIndex === 0) return { ...state, phase: "intro", validationMessage: null };
    return { ...state, questionIndex: state.questionIndex - 1, validationMessage: null };
  }
  if (action.type === "continue") {
    if (state.phase !== "journey") return state;
    const question = problemQuestions[state.questionIndex];
    if (!question) return state;
    if (!isProblemQuestionComplete(question, state.answers[question.id])) {
      return { ...state, validationMessage: selectionInstruction(question) };
    }
    const atEnd = state.questionIndex === problemQuestions.length - 1;
    const atEditedSectionEnd = state.editingSectionId
      ? isLastQuestionOfSection(state.questionIndex, state.editingSectionId)
      : false;
    if (atEnd || atEditedSectionEnd) {
      if (getMissingProblemQuestionIds(state.answers).length > 0) {
        return atEnd
          ? { ...state, validationMessage: "Beantworte bitte alle Fragen, bevor du deine Situationsskizze öffnest." }
          : { ...state, questionIndex: state.questionIndex + 1, editingSectionId: null, validationMessage: null };
      }
      return { ...state, phase: "result", editingSectionId: null, validationMessage: null };
    }
    return { ...state, questionIndex: state.questionIndex + 1, validationMessage: null };
  }
  return state;
}

export function validateProblemData(): string[] {
  const errors: string[] = [];
  const sectionIds = new Set(problemSections.map(({ id }) => id));
  const questionIds = new Set<string>();
  const optionIds = new Set<string>();
  if (problemSections.length !== 4) errors.push("Problem must define exactly four sections.");
  if (problemQuestions.length !== 9) errors.push("Problem must define exactly nine interactions.");
  const expectedCounts = [2, 2, 3, 2];
  problemSections.forEach((section, index) => {
    if (problemQuestions.filter(({ sectionId }) => sectionId === section.id).length !== expectedCounts[index]) {
      errors.push(`Unexpected question count for ${section.id}.`);
    }
  });
  for (const question of problemQuestions) {
    if (!sectionIds.has(question.sectionId)) errors.push(`Unknown section: ${question.id}`);
    if (questionIds.has(question.id)) errors.push(`Duplicate question: ${question.id}`);
    questionIds.add(question.id);
    if (question.format === "text") {
      if (question.options.length !== 0 || !question.maxLength || question.maxLength > 500) errors.push(`Invalid text question: ${question.id}`);
    } else if (question.options.length === 0) errors.push(`Question has no options: ${question.id}`);
    for (const option of question.options) {
      if (optionIds.has(option.id)) errors.push(`Duplicate option: ${option.id}`);
      optionIds.add(option.id);
    }
  }
  return errors;
}
