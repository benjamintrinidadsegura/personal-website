import { getProblemQuestions, problemQuestions, problemSections } from "@/data/find-your-next-step-problem";
import { problemGeneratedCopy, type ProblemGeneratedCopy } from "@/data/find-your-next-step-problem-locales";
import type { Locale } from "@/lib/i18n/config";
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

export function getMissingProblemQuestionIds(answers: ProblemAnswers, locale: Locale = "de"): string[] {
  return getProblemQuestions(locale)
    .filter((question) => !isProblemQuestionComplete(question, answers[question.id]))
    .map(({ id }) => id);
}

export function formatProblemSelectionCount(selectedCount: number, maxSelections: number, locale: Locale = "de"): string {
  return problemPresentationByLocale[locale].selected(selectedCount, maxSelections);
}

function questionById(id: string, locale: Locale): ProblemQuestion {
  const question = getProblemQuestions(locale).find((candidate) => candidate.id === id);
  if (!question) throw new Error(`Unknown Problem question: ${id}`);
  return question;
}

function selectedId(answers: ProblemAnswers, questionId: string): string | null {
  return answers[questionId]?.[0] ?? null;
}

function evidenceFor(answers: ProblemAnswers, questionId: string, limit = 3, locale: Locale = "de"): ProblemEvidence[] {
  const question = questionById(questionId, locale);
  if (question.format === "text") {
    return isProblemQuestionComplete(question, answers[questionId])
      ? [{ questionId, optionId: "self-authored-note", answer: problemPresentationByLocale[locale].ownNote }]
      : [];
  }
  return (answers[questionId] ?? []).slice(0, limit).flatMap((optionId) => {
    const option = question.options.find(({ id }) => id === optionId);
    return option ? [{ questionId, optionId, answer: option.label }] : [];
  });
}

function optionLabel(answers: ProblemAnswers, questionId: string, locale: Locale): string {
  return evidenceFor(answers, questionId, 1, locale)[0]?.answer ?? "";
}

function buildBoundary(answers: ProblemAnswers, locale: Locale): ProblemBoundary {
  const safety = selectedId(answers, "urgency-safety");
  const copy = problemPresentationByLocale[locale].boundary;
  if (safety === "safety-immediate" || safety === "safety-unsure") {
    return {
      level: "urgent",
      title: safety === "safety-immediate" ? copy.immediate : copy.uncertain,
      text: copy.dangerText,
    };
  }

  const area = selectedId(answers, "situation-area");
  if (["area-health", "area-finance", "area-legal"].includes(area ?? "")) {
    return {
      level: "professional",
      title: copy.professional,
      text: copy.professionalText,
    };
  }

  return {
    level: "standard",
    title: copy.authority,
    text: copy.authorityText,
  };
}

function buildSituationStatements(answers: ProblemAnswers, locale: Locale): ProblemResultStatement[] {
  const area = optionLabel(answers, "situation-area", locale);
  const pressure = optionLabel(answers, "urgency-pressure", locale);
  const effect = optionLabel(answers, "experience-effect", locale);
  const copy = problemPresentationByLocale[locale].headings;
  return [
    {
      id: "situation-focus",
      title: copy.focus,
      text: copy.focusText(area),
      evidence: evidenceFor(answers, "situation-area", 3, locale),
    },
    {
      id: "situation-pressure",
      title: copy.time,
      text: pressure,
      evidence: evidenceFor(answers, "urgency-pressure", 3, locale),
    },
    {
      id: "situation-experience",
      title: copy.effect,
      text: effect,
      evidence: evidenceFor(answers, "experience-effect", 3, locale),
    },
  ];
}

function buildResourceStatements(answers: ProblemAnswers, locale: Locale): ProblemResultStatement[] {
  const influence = optionLabel(answers, "experience-influence", locale);
  const support = evidenceFor(answers, "next-support", 3, locale);
  const tried = evidenceFor(answers, "experience-tried", 3, locale);
  const copy = problemPresentationByLocale[locale];
  return [
    {
      id: "resource-influence",
      title: copy.headings.influence,
      text: influence,
      evidence: evidenceFor(answers, "experience-influence", 3, locale),
    },
    {
      id: "resource-support",
      title: copy.headings.support,
      text: support.some(({ optionId }) => optionId === "support-none")
        ? copy.supportNone
        : copy.supportCount(support.length),
      evidence: support,
    },
    {
      id: "resource-experience",
      title: copy.headings.tried,
      text: tried.some(({ optionId }) => optionId === "tried-none")
        ? copy.triedNone
        : copy.triedCount(tried.length),
      evidence: tried,
    },
  ];
}

function buildQuestionsToCarry(answers: ProblemAnswers, locale: Locale): string[] {
  const influence = selectedId(answers, "experience-influence");
  const effect = selectedId(answers, "experience-effect");
  const support = new Set(answers["next-support"] ?? []);
  const copy = problemPresentationByLocale[locale].reflectionQuestions;
  const questions = [copy[0]];
  if (influence === "influence-shared" || influence === "influence-low") {
    questions.push(copy[1]);
  } else {
    questions.push(copy[2]);
  }
  if (effect === "effect-none" || effect === "effect-unclear") {
    questions.push(copy[3]);
  } else if (support.has("support-involved")) {
    questions.push(copy[4]);
  } else {
    questions.push(copy[5]);
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

const nextStepByModeEn: typeof nextStepByMode = {
  "mode-facts": { title: "Name three open facts", text: "Write down no more than three questions whose answers would genuinely change your decision. Then find one reliable source for the most important question only." },
  "mode-talk": { title: "Prepare a conversation with a clear purpose", text: "Beforehand, write one sentence describing what should be clearer after the conversation and the one question you most need to ask." },
  "mode-small-step": { title: "Choose a small, reversible experiment", text: "Choose a step you can test without major consequences. Decide in advance what would tell you whether it was useful." },
  "mode-professional": { title: "Choose a qualified source of support", text: "Find a service or professional whose remit fits your concrete problem. Prepare the most important facts and your central question for the first contact." },
  "mode-pause": { title: "Agree a bounded pause", text: "Set a specific time to look at the situation again. Use the pause to reduce pressure, not to postpone indefinitely." },
};

type ProblemPresentationCopy = Omit<ProblemGeneratedCopy, "export">;

const problemPresentationByLocale: Record<Locale, ProblemPresentationCopy> = {
  de: {
    selected: (selected, max) => `${selected} von ${max} ausgewählt`,
    ownNote: "Eigene kurze Beschreibung der gewünschten Veränderung",
    boundary: {
      immediate: "Sicherheit geht jetzt vor",
      uncertain: "Unsicherheit über Sicherheit ernst nehmen",
      dangerText: "FYNS kann Gefahr nicht beurteilen. Nutze diese Auswertung nicht als Sicherheitsentscheidung. Wende dich jetzt an den örtlichen Notruf oder eine unmittelbar erreichbare geeignete Anlaufstelle; wenn möglich, beziehe eine vertraute Person ein.",
      professional: "Fachliche Grenzen mitdenken",
      professionalText: "Diese Situationsskizze ersetzt keine medizinische, psychologische, rechtliche oder finanzielle Beratung. Prüfe wichtige Entscheidungen mit einer dafür qualifizierten Stelle.",
      authority: "Du behältst die Deutungshoheit",
      authorityText: "Diese Skizze ordnet nur deine eigenen Angaben. Sie bewertet weder dich noch andere und kann relevante Informationen übersehen.",
    },
    headings: {
      focus: "Fokus dieser Klärung",
      focusText: (area) => `Du ordnest die Situation zunächst im Bereich „${area}“ ein. Das ist ein Ausgangspunkt, keine abschließende Kategorie.`,
      time: "Zeitlicher Rahmen",
      effect: "Bisherige Wirkung",
      influence: "Eigener Einfluss",
      support: "Erreichbare Unterstützung",
      tried: "Was du bereits eingebracht hast",
      title: "Deine Situationsskizze",
      description: "Eine lokale Momentaufnahme deiner eigenen Angaben – keine Diagnose, Risikobewertung oder professionelle Beratung.",
    },
    supportNone: "Du siehst im Moment keine der genannten Unterstützungen als sicher erreichbar. Das ist eine wichtige Grenze, keine persönliche Schwäche.",
    supportCount: (count) => `Du hast ${count === 1 ? "eine erreichbare Möglichkeit" : `${count} erreichbare Möglichkeiten`} markiert.`,
    triedNone: "Du startest ohne einen bisherigen Lösungsversuch. Der nächste Schritt darf deshalb besonders klein bleiben.",
    triedCount: (count) => `Du hast bereits ${count === 1 ? "einen Ansatz" : `${count} Ansätze`} ausprobiert oder vorbereitet.`,
    reflectionQuestions: [
      "Welche Information würde die Situation tatsächlich verändern – und welche wäre nur beruhigend, ohne weiterzuhelfen?",
      "Was liegt in deinem Einfluss, und wofür braucht es eine Entscheidung, Zustimmung oder Unterstützung von außen?",
      "Welcher kleine Teil liegt sicher in deinem Einfluss und lässt sich ohne große Folgewirkung prüfen?",
      "Was müsste ein nächster Versuch anders machen, damit du überhaupt erkennen kannst, ob er hilft?",
      "Was soll die beteiligte Person nach einem Gespräch klarer verstehen als vorher?",
      "Woran würdest du nach dem nächsten Schritt erkennen, ob mehr Klarheit entstanden ist?",
    ],
    nextSteps: nextStepByMode,
    emergencyStep: {
      title: "Jetzt geeignete Hilfe erreichen",
      text: "Überspringe weitere Selbstklärung. Kontaktiere den örtlichen Notruf oder eine unmittelbar erreichbare geeignete Anlaufstelle; wenn möglich, bitte eine vertraute Person, bei dir zu bleiben oder den Kontakt mit dir herzustellen.",
    },
    validation: {
      text: (max) => `Schreibe 10 bis ${max} Zeichen.`,
      one: "Wähle eine Antwort aus.",
      exact: (count) => `Wähle genau ${count} Antworten aus.`,
      range: (min, max) => `Wähle ${min} bis ${max} Antworten aus.`,
      max: (max) => `Du kannst höchstens ${max} Antworten auswählen.`,
      incomplete: "Beantworte bitte alle Fragen, bevor du deine Situationsskizze öffnest.",
    },
    summary: {
      urgent: "Deine Angabe zur unmittelbaren Sicherheit steht vor jeder weiteren Einordnung.",
      pressure: "Du beschreibst kurzfristigen Handlungsdruck; der nächste Schritt sollte deshalb klein und klar begrenzt sein.",
      normal: "Du hast das Problem in Situation, Dringlichkeit, Erfahrung und nächste Bewegung gegliedert.",
      lowInfluence: "Dein direkter Einfluss wirkt derzeit begrenzt; Unterstützung und Zuständigkeiten sind deshalb besonders wichtig.",
      sharedInfluence: "Die Skizze trennt deinen möglichen Beitrag von Entscheidungen und Bedingungen außerhalb deiner Kontrolle.",
    },
  },
  en: {
    selected: (selected, max) => `${selected} of ${max} selected`,
    ownNote: "Your own short description of the change you want",
    boundary: {
      immediate: "Safety comes first now",
      uncertain: "Take uncertainty about safety seriously",
      dangerText: "FYNS cannot assess danger. Do not use this result as a safety decision. Contact your local emergency services or another appropriate source of immediate help now; if possible, involve someone you trust.",
      professional: "Keep professional boundaries in view",
      professionalText: "This situation sketch is not a substitute for medical, psychological, legal or financial advice. Review important decisions with an appropriately qualified professional.",
      authority: "You retain interpretive authority",
      authorityText: "This sketch only organises your own answers. It judges neither you nor anyone else and may overlook relevant information.",
    },
    headings: {
      focus: "Focus of this review",
      focusText: (area) => `You are initially placing the situation in “${area}”. This is a starting point, not a final category.`,
      time: "Time frame",
      effect: "Effect so far",
      influence: "Your influence",
      support: "Available support",
      tried: "What you have already tried",
      title: "Your situation sketch",
      description: "A local snapshot of your own answers — not a diagnosis, risk assessment or professional advice.",
    },
    supportNone: "None of the listed forms of support feels reliably available right now. That is an important boundary, not a personal failing.",
    supportCount: (count) => `You marked ${count} ${count === 1 ? "available option" : "available options"}.`,
    triedNone: "You are starting without a previous attempt. The next step can therefore remain particularly small.",
    triedCount: (count) => `You have already tried or prepared ${count} ${count === 1 ? "approach" : "approaches"}.`,
    reflectionQuestions: [
      "Which information would genuinely change the situation — and which would only feel reassuring without helping you move forward?",
      "What is within your influence, and what requires a decision, consent or support from elsewhere?",
      "Which small part is safely within your influence and can be tested without major consequences?",
      "What would a next attempt need to do differently for you to tell whether it helps?",
      "What should the person involved understand more clearly after a conversation?",
      "After the next step, what would show you that greater clarity has emerged?",
    ],
    nextSteps: nextStepByModeEn,
    emergencyStep: {
      title: "Reach appropriate help now",
      text: "Skip further self-review. Contact your local emergency services or another appropriate source of immediate help; if possible, ask someone you trust to stay with you or help you make contact.",
    },
    validation: {
      text: (max) => `Write between 10 and ${max} characters.`,
      one: "Choose one answer.",
      exact: (count) => `Choose exactly ${count} answers.`,
      range: (min, max) => `Choose between ${min} and ${max} answers.`,
      max: (max) => `You can choose no more than ${max} answers.`,
      incomplete: "Please answer every question before opening your situation sketch.",
    },
    summary: {
      urgent: "Your answer about immediate safety takes priority over every other interpretation.",
      pressure: "You describe short-term pressure to act, so the next step should be small and clearly bounded.",
      normal: "You have separated the problem into situation, urgency, experience and a next move.",
      lowInfluence: "Your direct influence currently appears limited, making support and clear responsibilities particularly important.",
      sharedInfluence: "The sketch separates your possible contribution from decisions and conditions outside your control.",
    },
  },
  es: problemGeneratedCopy.es,
  tr: problemGeneratedCopy.tr,
  pl: problemGeneratedCopy.pl,
  el: problemGeneratedCopy.el,
  ru: problemGeneratedCopy.ru,
};

function buildNextStep(answers: ProblemAnswers, boundary: ProblemBoundary, locale: Locale): ProblemNextStep {
  const evidence = evidenceFor(answers, "next-mode", 3, locale);
  const copy = problemPresentationByLocale[locale];
  if (boundary.level === "urgent") {
    return {
      title: copy.emergencyStep.title,
      text: copy.emergencyStep.text,
      evidence: evidenceFor(answers, "urgency-safety", 3, locale),
    };
  }
  const mode = selectedId(answers, "next-mode") ?? "mode-facts";
  return { ...(copy.nextSteps[mode] ?? copy.nextSteps["mode-facts"]), evidence };
}

export function buildProblemResult(answers: ProblemAnswers, locale: Locale = "de"):
  | { status: "incomplete"; missingQuestionIds: readonly string[] }
  | { status: "complete"; result: ProblemResult } {
  const missingQuestionIds = getMissingProblemQuestionIds(answers, locale);
  if (missingQuestionIds.length > 0) return { status: "incomplete", missingQuestionIds };

  const boundary = buildBoundary(answers, locale);
  const pressure = selectedId(answers, "urgency-pressure");
  const influence = selectedId(answers, "experience-influence");
  const userNote = normalizedText(answers["situation-change"]?.[0] ?? "") || null;
  const copy = problemPresentationByLocale[locale];
  const summary = [
    boundary.level === "urgent" ? copy.summary.urgent : pressure === "pressure-now" ? copy.summary.pressure : copy.summary.normal,
    influence === "influence-low" ? copy.summary.lowInfluence : copy.summary.sharedInfluence,
  ];

  return {
    status: "complete",
    result: {
      title: copy.headings.title,
      description: copy.headings.description,
      summary,
      boundary,
      situation: buildSituationStatements(answers, locale),
      resources: buildResourceStatements(answers, locale),
      questionsToCarry: buildQuestionsToCarry(answers, locale),
      nextStep: buildNextStep(answers, boundary, locale),
      userNote,
    },
  };
}

function selectionInstruction(question: ProblemQuestion, locale: Locale): string {
  const copy = problemPresentationByLocale[locale].validation;
  if (question.format === "text") return copy.text(question.maxLength ?? 280);
  if (question.minSelections === question.maxSelections) {
    return question.minSelections === 1 ? copy.one : copy.exact(question.minSelections);
  }
  return copy.range(question.minSelections, question.maxSelections);
}

export function problemJourneyReducer(
  state: ProblemJourneyState,
  action: ProblemJourneyAction,
  locale: Locale = "de",
): ProblemJourneyState {
  const localizedQuestions = getProblemQuestions(locale);
  if (action.type === "confirm-restart") return initialProblemState;
  if (action.type === "request-restart") return { ...state, restartPending: true };
  if (action.type === "cancel-restart") return { ...state, restartPending: false };
  if (action.type === "start") return { ...state, phase: "journey", questionIndex: 0, validationMessage: null };
  if (action.type === "edit-section") {
    const questionIndex = localizedQuestions.findIndex(({ sectionId }) => sectionId === action.sectionId);
    if (questionIndex < 0) return state;
    return { ...state, phase: "journey", questionIndex, validationMessage: null, editingSectionId: action.sectionId, restartPending: false };
  }
  if (action.type === "set-text") {
    if (state.phase !== "journey") return state;
    const question = localizedQuestions[state.questionIndex];
    if (!question || question.id !== action.questionId || question.format !== "text") return state;
    const value = action.value.slice(0, question.maxLength ?? 280);
    return { ...state, answers: { ...state.answers, [question.id]: [value] }, validationMessage: null };
  }
  if (action.type === "toggle-option") {
    if (state.phase !== "journey") return state;
    const question = localizedQuestions[state.questionIndex];
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
        return { ...state, validationMessage: problemPresentationByLocale[locale].validation.max(question.maxSelections) };
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
      ? localizedQuestions.findIndex(({ sectionId }) => sectionId === state.editingSectionId)
      : -1;
    if (state.editingSectionId && state.questionIndex === firstEditingIndex) {
      return { ...state, phase: "result", editingSectionId: null, validationMessage: null };
    }
    if (state.questionIndex === 0) return { ...state, phase: "intro", validationMessage: null };
    return { ...state, questionIndex: state.questionIndex - 1, validationMessage: null };
  }
  if (action.type === "continue") {
    if (state.phase !== "journey") return state;
    const question = localizedQuestions[state.questionIndex];
    if (!question) return state;
    if (!isProblemQuestionComplete(question, state.answers[question.id])) {
      return { ...state, validationMessage: selectionInstruction(question, locale) };
    }
    const atEnd = state.questionIndex === localizedQuestions.length - 1;
    const atEditedSectionEnd = state.editingSectionId
      ? !localizedQuestions[state.questionIndex + 1] || localizedQuestions[state.questionIndex + 1].sectionId !== state.editingSectionId
      : false;
    if (atEnd || atEditedSectionEnd) {
      if (getMissingProblemQuestionIds(state.answers, locale).length > 0) {
        return atEnd
          ? { ...state, validationMessage: problemPresentationByLocale[locale].validation.incomplete }
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
