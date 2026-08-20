import {
  careerActivitySignalIds,
  careerConstraintIds,
  careerDirections,
  careerEnvironmentSignalIds,
  careerJobTitles,
  careerMotivationSignalIds,
  careerQuestions,
  careerSections,
  careerSignalIds,
  getCareerConstraintSummaryCopy,
  getCareerDirections,
  getCareerJobTitles,
  getCareerQuestions,
  getCareerSignalCopy,
  getCareerTensionDefinitions,
} from "@/data/find-your-next-step-career";
import { careerGeneratedCopy } from "@/data/find-your-next-step-career-generated-locales";
import type { CareerGeneratedCopy } from "@/data/find-your-next-step-career-generated-locales";
import type { Locale } from "@/lib/i18n/config";
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

const careerResultCopyByLocale: Record<Locale, CareerGeneratedCopy> = {
  de: {
    and: "und", title: "Deine Career Map", description: "Eine lokale Momentaufnahme möglicher beruflicher Erkundungsräume – keine Bewertung deiner Person und keine Entscheidung über einen Beruf.", selected: (n, m) => `${n} von ${m} ausgewählt`, one: "Wähle eine Antwort aus.", exact: (n) => `Wähle genau ${n} Antworten aus.`, range: (a, b) => `Wähle ${a} bis ${b} Antworten aus.`, maximum: (n) => `Du kannst höchstens ${n} Antworten auswählen.`, incomplete: "Beantworte bitte alle Fragen, bevor du deine Career Map öffnest.",
    whyOne: (a) => `In deiner Auswahl zeigt sich als Anknüpfungspunkt besonders: ${a}.`, whyTwo: (a, b) => `In deiner Auswahl zeigen sich besonders ${a} und ${b}.`, summaryTwo: (a, b) => `Deine Auswahl zieht dich besonders zu Arbeit hin, in der diese Tätigkeiten zusammenkommen: ${a} sowie ${b}.`, summaryOne: (a) => `In deiner Auswahl zeigt sich vorsichtig ein Interesse an dieser Tätigkeit: ${a}.`, summaryOpen: "Deine Auswahl öffnet mehrere berufliche Spuren, ohne dass ein einzelnes Tätigkeitsmuster klar dominiert.", contextTwo: (a, b) => `Dabei wirken ${a} und ${b} wichtig.`, contextOne: (a) => `Dabei wirkt ${a} als wiederkehrender Anknüpfungspunkt.`, constraint: (v) => `Für deine weitere Erkundung sollte diese Bedingung von Anfang an mitgedacht werden: ${v}.`,
    qualification: { short: "Du hast aktuell einen kurzen Qualifizierungsrahmen gewählt.", "several-months": "Mehrere Monate Qualifizierung sind für dich realistisch.", "formal-open": "Du kannst auch längere Qualifizierungswege grundsätzlich prüfen.", undecided: "Dein Qualifizierungsrahmen ist noch offen." }, jobHybrid: "Diese Rolle verbindet zwei deiner besonders sichtbaren Erkundungsspuren.", jobTwo: (a, b) => `Diese Rolle berührt die sichtbaren Spuren „${a}“ und „${b}“.`, jobOpen: "Dieser Titel ist ein offener Suchbegriff für deine weitere Recherche.", jobPrimary: (d) => `Dieser Suchbegriff konkretisiert deine sichtbare Spur „${d}“.`, jobAdditional: (d) => `Dieser Suchbegriff öffnet eine konkrete Recherche innerhalb der zusätzlich sichtbaren Spur „${d}“.`,
    next: { conversation: { title: "Führe ein Feldgespräch", generic: "Sprich über zwei konkrete Tätigkeiten.", withDirections: (a, b) => `Sprich mit einer Person aus „${a}“${b ? ` und einer aus „${b}“` : ""}.` }, "role-comparison": { title: "Vergleiche reale Aufgaben", generic: "Vergleiche Aufgaben statt Titel.", withDirections: (a, b) => `Vergleiche reale Aufgaben aus „${a}“${b ? ` und „${b}“` : ""}.` }, "mini-project": { title: "Teste ein Mini-Projekt", generic: "Probiere zwei kleine Arbeitsproben.", withDirections: (a, b) => `Teste eine kleine Arbeitsprobe für „${a}“${b ? ` und „${b}“` : ""}.` }, "skill-test": { title: "Teste einen Skill", generic: "Teste eine wiederkehrende Fähigkeit.", withDirections: (a, b) => `Teste eine typische Fähigkeit aus „${a}“${b ? ` und „${b}“` : ""}.` }, "work-observation": { title: "Beobachte einen Arbeitsablauf", generic: "Beobachte einen echten Arbeitsablauf.", withDirections: (a, b) => `Beobachte Arbeitsabläufe in „${a}“${b ? ` und „${b}“` : ""}.` } },
  },
  en: {
    and: "and", title: "Your Career Map", description: "A local snapshot of possible spaces for career exploration — not an assessment of you or a decision about a career.", selected: (n, m) => `${n} of ${m} selected`, one: "Choose one answer.", exact: (n) => `Choose exactly ${n} answers.`, range: (a, b) => `Choose between ${a} and ${b} answers.`, maximum: (n) => `You can select no more than ${n} answers.`, incomplete: "Please answer every question before opening your Career Map.",
    whyOne: (a) => `One connection point appears especially strongly in your choices: ${a}.`, whyTwo: (a, b) => `Your choices especially reflect ${a} and ${b}.`, summaryTwo: (a, b) => `Your choices draw you especially towards work that combines these activities: ${a} and ${b}.`, summaryOne: (a) => `Your choices tentatively show an interest in this activity: ${a}.`, summaryOpen: "Your choices open several career paths without one activity pattern clearly dominating.", contextTwo: (a, b) => `${a} and ${b} appear important in that context.`, contextOne: (a) => `${a} appears as a recurring connection point.`, constraint: (v) => `Your further exploration should include this condition from the beginning: ${v}.`,
    qualification: { short: "You selected a short qualification scope.", "several-months": "Several months of qualification are realistic for you.", "formal-open": "You can also consider longer qualification routes.", undecided: "Your qualification scope remains open." }, jobHybrid: "This role connects two of your especially visible exploration paths.", jobTwo: (a, b) => `This role touches the visible paths “${a}” and “${b}”.`, jobOpen: "This title is an open search term for further research.", jobPrimary: (d) => `This search term makes your visible path “${d}” more concrete.`, jobAdditional: (d) => `This search term opens concrete research within the additionally visible path “${d}”.`,
    next: { conversation: { title: "Have a field conversation", generic: "Discuss two concrete activities.", withDirections: (a, b) => `Speak with someone from “${a}”${b ? ` and someone from “${b}”` : ""}.` }, "role-comparison": { title: "Compare real tasks", generic: "Compare tasks rather than titles.", withDirections: (a, b) => `Compare real tasks in “${a}”${b ? ` and “${b}”` : ""}.` }, "mini-project": { title: "Try a mini-project", generic: "Try two small work samples.", withDirections: (a, b) => `Try a small work sample for “${a}”${b ? ` and “${b}”` : ""}.` }, "skill-test": { title: "Test a skill", generic: "Test a recurring skill.", withDirections: (a, b) => `Test a typical skill from “${a}”${b ? ` and “${b}”` : ""}.` }, "work-observation": { title: "Observe a workflow", generic: "Observe a real workflow.", withDirections: (a, b) => `Observe work in “${a}”${b ? ` and “${b}”` : ""}.` } },
  },
  ...careerGeneratedCopy,
};

const careerQuotationCopy: Record<Locale, { open: string; close: string; fallbackDirection: string; fallbackJob: string }> = {
  de: { open: "„", close: "“", fallbackDirection: "einer deiner sichtbaren Richtungen", fallbackJob: "einen passenden Jobtitel" }, en: { open: "“", close: "”", fallbackDirection: "one of your visible directions", fallbackJob: "a suitable job title" }, es: { open: "«", close: "»", fallbackDirection: "una de tus direcciones visibles", fallbackJob: "un puesto adecuado" }, tr: { open: "“", close: "”", fallbackDirection: "görünür yönlerinden biri", fallbackJob: "uygun bir iş unvanı" }, pl: { open: "„", close: "”", fallbackDirection: "jeden z widocznych kierunków", fallbackJob: "odpowiednią nazwę stanowiska" }, el: { open: "«", close: "»", fallbackDirection: "μία από τις ορατές κατευθύνσεις σου", fallbackJob: "έναν κατάλληλο τίτλο εργασίας" }, ru: { open: "«", close: "»", fallbackDirection: "одно из видимых направлений", fallbackJob: "подходящее название должности" },
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

export function getMissingCareerQuestionIds(answers: CareerAnswers, locale: Locale = "de"): string[] {
  return getCareerQuestions(locale)
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
  locale: Locale = "de",
): readonly CareerDirectionEvaluation[] {
  const questions = getCareerQuestions(locale);
  return getCareerDirections(locale).map((direction) => {
    let weightedContribution = 0;
    let availableWeight = 0;
    const evidence: WeightedCareerEvidence[] = [];
    const evidenceQuestions = new Set<string>();
    const evidenceSections = new Set<CareerSectionId>();
    const coreActivityQuestions = new Set<string>();

    for (const question of questions) {
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

function selectedConstraints(answers: CareerAnswers, locale: Locale): Set<CareerConstraintId> {
  const constraints = new Set<CareerConstraintId>();
  for (const question of getCareerQuestions(locale)) {
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      for (const constraint of option?.constraints ?? []) constraints.add(constraint);
    }
  }
  return constraints;
}

function selectedQualificationScope(answers: CareerAnswers, locale: Locale): CareerQualificationScope {
  for (const question of getCareerQuestions(locale)) {
    for (const optionId of answers[question.id] ?? []) {
      const scope = question.options.find(({ id }) => id === optionId)?.qualificationScope;
      if (scope) return scope;
    }
  }
  return "undecided";
}

function selectedNextStepMode(answers: CareerAnswers, locale: Locale): CareerNextStepMode {
  for (const question of getCareerQuestions(locale)) {
    for (const optionId of answers[question.id] ?? []) {
      const mode = question.options.find(({ id }) => id === optionId)?.nextStepMode;
      if (mode) return mode;
    }
  }
  return "role-comparison";
}

function takeDirectionEvidence(evaluation: CareerDirectionEvaluation, limit = 4, locale: Locale = "de"): CareerEvidence[] {
  const questions = getCareerQuestions(locale);
  const remaining = [...evaluation.evidence].sort((left, right) => {
    if (left.contribution !== right.contribution) return right.contribution - left.contribution;
    const leftQuestionIndex = questions.findIndex(({ id }) => id === left.questionId);
    const rightQuestionIndex = questions.findIndex(({ id }) => id === right.questionId);
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
      const leftQuestionIndex = questions.findIndex(({ id }) => id === left.questionId);
      const rightQuestionIndex = questions.findIndex(({ id }) => id === right.questionId);
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

function directionWhy(direction: CareerDirection, answers: CareerAnswers, locale: Locale): string {
  const questions = getCareerQuestions(locale);
  const signalCopy = getCareerSignalCopy(locale);
  const profileWeights = new Map(direction.profile.map(({ signalId, weight }) => [signalId, weight]));
  const support = new Map<CareerSignalId, { contribution: number; questions: Set<string> }>();

  for (const question of questions) {
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
    .map(([signalId]) => signalCopy[signalId].evidence);

  if (strongest.length === 0) return direction.rationale;
  const copy = careerResultCopyByLocale[locale];
  return strongest.length === 1 ? copy.whyOne(strongest[0]) : copy.whyTwo(strongest[0], strongest[1]);
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

function qualificationNote(direction: CareerDirection, scope: CareerQualificationScope, locale: Locale): string | undefined {
  if (!direction.qualificationNote) return undefined;
  return `${careerResultCopyByLocale[locale].qualification[scope]} ${direction.qualificationNote}`;
}

function buildResultDirection(
  evaluation: CareerDirectionEvaluation,
  answers: CareerAnswers,
  constraints: ReadonlySet<CareerConstraintId>,
  scope: CareerQualificationScope,
  locale: Locale,
): CareerResultDirection {
  const direction = getCareerDirections(locale).find(({ id }) => id === evaluation.directionId) as CareerDirection;
  return {
    id: direction.id,
    title: direction.title,
    description: direction.description,
    why: directionWhy(direction, answers, locale),
    evidence: takeDirectionEvidence(evaluation, 4, locale),
    fields: orderedFields(direction, scope),
    environments: direction.environments,
    qualificationNote: qualificationNote(direction, scope, locale),
    constraintNotes: direction.constraintNotes
      .filter(({ constraintId }) => constraints.has(constraintId))
      .map(({ text }) => text),
  };
}

function selectedSignalEvidence(answers: CareerAnswers, locale: Locale): Map<CareerSignalId, CareerEvidence[]> {
  const bySignal = new Map<CareerSignalId, CareerEvidence[]>();
  for (const question of getCareerQuestions(locale)) {
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

export function buildCareerSummary(answers: CareerAnswers, constraints: ReadonlySet<CareerConstraintId> = new Set(), locale: Locale = "de"): readonly string[] {
  const questions = getCareerQuestions(locale);
  const signalCopy = getCareerSignalCopy(locale);
  const signalTotals = new Map<CareerSignalId, { score: number; questions: Set<string> }>();
  for (const question of questions) {
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
  const copy = careerResultCopyByLocale[locale];

  if (activities.length >= 2) {
    summary.push(copy.summaryTwo(signalCopy[activities[0]].summary, signalCopy[activities[1]].summary));
  } else if (activities.length === 1) {
    summary.push(copy.summaryOne(signalCopy[activities[0]].summary));
  } else {
    summary.push(copy.summaryOpen);
  }

  const contextParts = [
    motivations[0] ? signalCopy[motivations[0]].summary : null,
    environments[0] ? signalCopy[environments[0]].summary : null,
  ].filter((value): value is string => Boolean(value));
  if (contextParts.length === 2) summary.push(copy.contextTwo(contextParts[0], contextParts[1]));
  else if (contextParts.length === 1) summary.push(copy.contextOne(contextParts[0]));

  const firstConstraint = careerConstraintIds.find((constraintId) => constraints.has(constraintId));
  if (firstConstraint) {
    summary.push(copy.constraint(getCareerConstraintSummaryCopy(locale)[firstConstraint]));
  }
  return summary.slice(0, 3);
}

function buildConditions(answers: CareerAnswers, locale: Locale): CareerCondition[] {
  const conditions: CareerCondition[] = [];
  for (const question of getCareerQuestions(locale)) {
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
  locale: Locale,
): CareerTensionResult[] {
  const questions = getCareerQuestions(locale);
  const evidenceBySignal = selectedSignalEvidence(answers, locale);
  const constraintEvidence = new Map<CareerConstraintId, CareerEvidence>();
  for (const question of questions) {
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      if (!option) continue;
      for (const constraintId of option.constraints ?? []) {
        constraintEvidence.set(constraintId, { questionId: question.id, optionId: option.id, sectionId: question.sectionId, answer: option.label });
      }
    }
  }

  return getCareerTensionDefinitions(locale).flatMap((definition) => {
    const leftEvidence = definition.leftSignals.flatMap((signalId) => evidenceBySignal.get(signalId) ?? []);
    const rightSignalEvidence = definition.rightSignals.flatMap((signalId) => evidenceBySignal.get(signalId) ?? []);
    const rightConstraintEvidence = definition.rightConstraints
      .filter((constraintId) => constraints.has(constraintId))
      .flatMap((constraintId) => constraintEvidence.get(constraintId) ?? []);
    const qualificationMatches = "qualificationScope" in definition && definition.qualificationScope === scope;
    const rightSupported = rightSignalEvidence.length > 0 || rightConstraintEvidence.length > 0 || qualificationMatches;
    if (leftEvidence.length === 0 || !rightSupported) return [];

    const qualificationQuestion = questions.find(({ purpose }) => purpose === "qualification");
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

function directionName(direction: CareerDirection | undefined, locale: Locale = "de"): string {
  const copy = careerQuotationCopy[locale];
  return direction ? `${copy.open}${direction.title}${copy.close}` : copy.fallbackDirection;
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
  locale: Locale = "de",
): readonly CareerJobTitleDefinition[] {
  const jobTitles = getCareerJobTitles(locale);
  const primaryIds = new Set(primaryDirectionIds);
  const additionalIds = new Set(additionalDirectionIds);
  const selectedIds = new Set<string>();

  if (primaryDirectionIds.length === 0) {
    const additionalCandidates = jobTitles.filter((job) =>
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
      const next = jobTitles.find((job) =>
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

  const primaryCandidates = jobTitles.filter((job) =>
    job.directionIds.some((directionId) => primaryIds.has(directionId)),
  );
  selected.push(...roundRobinCareerJobs(
    primaryDirectionIds,
    primaryCandidates,
    selectedIds,
    Math.max(0, 6 - selected.length),
  ));

  const additionalOnlyCandidates = jobTitles.filter((job) =>
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
  locale: Locale,
): string | undefined {
  if (!definition.qualificationNote) return undefined;
  return `${careerResultCopyByLocale[locale].qualification[scope]} ${definition.qualificationNote}`;
}

function buildCareerJobWhy(
  definition: CareerJobTitleDefinition,
  directions: CareerResultJobTitle["directions"],
  locale: Locale,
): string {
  const copy = careerResultCopyByLocale[locale];
  if (directions.length >= 2 && definition.hybridDirectionIds) return copy.jobHybrid;
  if (directions.length >= 2) return copy.jobTwo(directions[0].title, directions[1].title);
  const direction = directions[0];
  if (!direction) return copy.jobOpen;
  return direction.tier === "primary" ? copy.jobPrimary(direction.title) : copy.jobAdditional(direction.title);
}

function buildCareerResultJobTitles(
  primaryDirections: readonly CareerResultDirection[],
  additionalDirections: readonly CareerResultDirection[],
  constraints: ReadonlySet<CareerConstraintId>,
  scope: CareerQualificationScope,
  locale: Locale,
): CareerResultJobTitle[] {
  const careerDirections = getCareerDirections(locale);
  const primaryIds = new Set(primaryDirections.map(({ id }) => id));
  const definitions = selectCareerJobDefinitions(
    primaryDirections.map(({ id }) => id),
    additionalDirections.map(({ id }) => id),
    locale,
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
      why: buildCareerJobWhy(definition, directions, locale),
      aliases,
      qualificationNote: jobQualificationNote(definition, scope, locale),
      constraintNotes: (definition.constraintHints ?? [])
        .filter(({ constraintId }) => constraints.has(constraintId))
        .map(({ text }) => text),
    };
  });
}

function quotedJobTitles(jobTitles: readonly CareerResultJobTitle[], limit: number, locale: Locale): string {
  const quote = careerQuotationCopy[locale];
  const titles = jobTitles.slice(0, limit).map(({ title }) => `${quote.open}${title}${quote.close}`);
  if (titles.length <= 1) return titles[0] ?? quote.fallbackJob;
  return `${titles.slice(0, -1).join(", ")} ${careerResultCopyByLocale[locale].and} ${titles.at(-1)}`;
}

function buildCareerNextStepEnglish(
  answers: CareerAnswers,
  visibleEvaluations: readonly CareerDirectionEvaluation[],
  jobTitles: readonly CareerResultJobTitle[],
): CareerNextStep {
  const mode = selectedNextStepMode(answers, "en");
  const directions = getCareerDirections("en");
  const first = directions.find(({ id }) => id === visibleEvaluations[0]?.directionId);
  const second = directions.find(({ id }) => id === visibleEvaluations[1]?.directionId);
  if (jobTitles.length > 0 && mode === "role-comparison") return { mode, title: "Compare concrete job titles through real tasks", text: `Search for ${quotedJobTitles(jobTitles, 3, "en")} and compare six job descriptions only by activities, conditions and entry requirements — not first by employer or title.` };
  if (jobTitles.length > 0 && mode === "conversation") return { mode, title: "Have a conversation about concrete roles", text: `Use ${quotedJobTitles(jobTitles, 2, "en")} as search terms to find someone to speak with. Ask about typical activities, working rhythm, entry routes, difficult aspects and a realistic start.` };
  if (jobTitles.length > 0 && mode === "work-observation") return { mode, title: "Observe concrete workflows", text: `Use ${quotedJobTitles(jobTitles, 2, "en")} as a starting point and ask someone to show you a typical workflow.` };
  if (!first) {
    const generic: Record<CareerNextStepMode, CareerNextStep> = { conversation: { mode, title: "Discuss two concrete activities", text: "Choose two activities from your answers and speak with someone who knows both from their work." }, "role-comparison": { mode, title: "Compare tasks rather than titles", text: "Compare six job descriptions and mark recurring activities, conditions and entry requirements." }, "mini-project": { mode, title: "Try two small work samples", text: "Simulate two selected activities for 45 minutes each, then note interest, energy and open learning questions." }, "skill-test": { mode, title: "Test a recurring skill", text: "Choose an activity that appears repeatedly and complete a small practical exercise." }, "work-observation": { mode, title: "Observe a real workflow", text: "Ask someone to show you a typical workflow and watch activities, interruptions, contact and conditions." } };
    return generic[mode];
  }
  const compare = Boolean(second && (mode === "role-comparison" || Math.abs(visibleEvaluations[0].score - visibleEvaluations[1].score) <= 0.07));
  if (mode === "conversation") return compare ? { mode, title: "Have two comparable field conversations", text: `Speak with one person from ${directionName(first, "en")} and one from ${directionName(second, "en")} using the same questions.` } : { mode, title: `Speak with someone from ${directionName(first, "en")}`, text: first.conversationPrompt };
  if (mode === "role-comparison") return compare ? { mode, title: "Compare two directions through real tasks", text: `Compare six job descriptions from ${directionName(first, "en")} and ${directionName(second, "en")} by tasks, conditions and entry requirements.` } : { mode, title: `Compare roles in ${directionName(first, "en")}`, text: "Read six job descriptions and mark recurring activities, conditions and entry requirements." };
  if (mode === "mini-project") return compare ? { mode, title: "Try two short comparative experiments", text: `Plan one 45-minute mini-experiment for ${directionName(first, "en")} and one for ${directionName(second, "en")} and compare your observations.` } : { mode, title: `Try ${directionName(first, "en")} in practice`, text: first.microExperiment };
  if (mode === "skill-test") return compare ? { mode, title: "Compare two typical skills", text: `Test one small practical task from ${directionName(first, "en")} and one from ${directionName(second, "en")} and observe curiosity, concentration and willingness to learn.` } : { mode, title: `Test a skill from ${directionName(first, "en")}`, text: first.skillExperiment };
  return compare ? { mode, title: "Observe two different working realities", text: `Ask one person from each direction to show you a typical workflow and compare activities, contact, focus, rhythm and entry requirements.` } : { mode, title: `Observe everyday work in ${directionName(first, "en")}`, text: first.observationPrompt };
}

function buildCareerNextStepExtended(
  answers: CareerAnswers,
  visibleEvaluations: readonly CareerDirectionEvaluation[],
  locale: Exclude<Locale, "de" | "en">,
): CareerNextStep {
  const mode = selectedNextStepMode(answers, locale);
  const directions = getCareerDirections(locale);
  const first = directions.find(({ id }) => id === visibleEvaluations[0]?.directionId);
  const second = directions.find(({ id }) => id === visibleEvaluations[1]?.directionId);
  const template = careerResultCopyByLocale[locale].next[mode];
  return { mode, title: template.title, text: first ? template.withDirections(first.title, second?.title) : template.generic };
}

function buildCareerNextStepGerman(
  answers: CareerAnswers,
  visibleEvaluations: readonly CareerDirectionEvaluation[],
  jobTitles: readonly CareerResultJobTitle[],
): CareerNextStep {
  const locale = "de" as const;
  const mode = selectedNextStepMode(answers, locale);
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
      text: `Suche zum Beispiel nach ${quotedJobTitles(jobTitles, 3, locale)} und vergleiche insgesamt sechs Stellenanzeigen ausschließlich nach Tätigkeiten, Bedingungen und Zugangsvoraussetzungen – nicht zuerst nach Arbeitgeber oder Titelwirkung.`,
    };
  }
  if (jobTitles.length > 0 && mode === "conversation") {
    return {
      mode,
      title: "Führe ein Gespräch zu konkreten Rollen",
      text: `Nutze ${quotedJobTitles(jobTitles, 2, locale)} als Suchbegriffe, um Gesprächspartner zu finden. Frage nach typischen Tätigkeiten, Arbeitsrhythmus, Zugang, schwierigen Seiten und einem realistischen Einstieg.`,
    };
  }
  if (jobTitles.length > 0 && mode === "work-observation") {
    return {
      mode,
      title: "Beobachte konkrete Arbeitsabläufe",
      text: `Nutze ${quotedJobTitles(jobTitles, 2, locale)} als Ausgangspunkt und bitte eine Person, dir einen typischen Arbeitsablauf zu zeigen. Achte auf Tätigkeiten, Unterbrechungen, Menschenkontakt und Rahmenbedingungen.`,
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

type CareerNextStepBuilder = (answers: CareerAnswers, visibleEvaluations: readonly CareerDirectionEvaluation[], jobTitles: readonly CareerResultJobTitle[]) => CareerNextStep;
const careerNextStepFactories: Record<Locale, CareerNextStepBuilder> = {
  de: buildCareerNextStepGerman,
  en: buildCareerNextStepEnglish,
  es: (answers, evaluations) => buildCareerNextStepExtended(answers, evaluations, "es"),
  tr: (answers, evaluations) => buildCareerNextStepExtended(answers, evaluations, "tr"),
  pl: (answers, evaluations) => buildCareerNextStepExtended(answers, evaluations, "pl"),
  el: (answers, evaluations) => buildCareerNextStepExtended(answers, evaluations, "el"),
  ru: (answers, evaluations) => buildCareerNextStepExtended(answers, evaluations, "ru"),
};

export function buildCareerNextStep(
  answers: CareerAnswers,
  visibleEvaluations: readonly CareerDirectionEvaluation[],
  jobTitles: readonly CareerResultJobTitle[] = [],
  locale: Locale = "de",
): CareerNextStep {
  return careerNextStepFactories[locale](answers, visibleEvaluations, jobTitles);
}

export function buildCareerResult(answers: CareerAnswers, locale: Locale = "de"):
  | { status: "incomplete"; missingQuestionIds: readonly string[] }
  | { status: "complete"; result: CareerResult } {
  const missingQuestionIds = getMissingCareerQuestionIds(answers, locale);
  if (missingQuestionIds.length > 0) return { status: "incomplete", missingQuestionIds };

  const evaluations = calculateCareerDirectionEvaluations(answers, locale);
  const primaryEvaluations = evaluations.filter(isPrimaryEvaluation).slice(0, 3);
  const primaryIds = new Set(primaryEvaluations.map(({ directionId }) => directionId));
  const additionalEvaluations = evaluations
    .filter((evaluation) => !primaryIds.has(evaluation.directionId) && isAdditionalEvaluation(evaluation))
    .slice(0, 3);
  const constraints = selectedConstraints(answers, locale);
  const scope = selectedQualificationScope(answers, locale);
  const visibleEvaluations = [...primaryEvaluations, ...additionalEvaluations].sort(compareCareerEvaluations);
  const primaryDirections = primaryEvaluations.map((evaluation) => buildResultDirection(evaluation, answers, constraints, scope, locale));
  const additionalDirections = additionalEvaluations.map((evaluation) => buildResultDirection(evaluation, answers, constraints, scope, locale));
  const jobTitles = buildCareerResultJobTitles(primaryDirections, additionalDirections, constraints, scope, locale);

  return {
    status: "complete",
    result: {
      title: careerResultCopyByLocale[locale].title,
      description: careerResultCopyByLocale[locale].description,
      summary: buildCareerSummary(answers, constraints, locale),
      primaryDirections,
      additionalDirections,
      jobTitles,
      conditions: buildConditions(answers, locale),
      tensions: buildTensions(answers, constraints, scope, locale),
      nextStep: buildCareerNextStep(answers, visibleEvaluations, jobTitles, locale),
    },
  };
}

export function formatCareerSelectionCount(selectedCount: number, maxSelections: number, locale: Locale = "de"): string {
  return careerResultCopyByLocale[locale].selected(selectedCount, maxSelections);
}

function selectionInstruction(question: CareerQuestion, locale: Locale): string {
  const copy = careerResultCopyByLocale[locale];
  if (question.minSelections === question.maxSelections) {
    return question.minSelections === 1 ? copy.one : copy.exact(question.minSelections);
  }
  return copy.range(question.minSelections, question.maxSelections);
}

function isLastQuestionOfCareerSection(questionIndex: number, sectionId: CareerSectionId, locale: Locale): boolean {
  const nextQuestion = getCareerQuestions(locale)[questionIndex + 1];
  return !nextQuestion || nextQuestion.sectionId !== sectionId;
}

export function careerJourneyReducer(
  state: CareerJourneyState,
  action: CareerJourneyAction,
  locale: Locale = "de",
): CareerJourneyState {
  const questions = getCareerQuestions(locale);
  if (action.type === "confirm-restart") return initialCareerState;
  if (action.type === "request-restart") return { ...state, restartPending: true };
  if (action.type === "cancel-restart") return { ...state, restartPending: false };
  if (action.type === "start") {
    return { ...state, phase: "journey", questionIndex: 0, validationMessage: null, restartPending: false };
  }
  if (action.type === "edit-section") {
    const questionIndex = questions.findIndex(({ sectionId }) => sectionId === action.sectionId);
    if (questionIndex < 0) return state;
    return { ...state, phase: "journey", questionIndex, validationMessage: null, editingSectionId: action.sectionId, restartPending: false };
  }
  if (action.type === "toggle-option") {
    if (state.phase !== "journey") return state;
    const question = questions[state.questionIndex];
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
        return { ...state, validationMessage: careerResultCopyByLocale[locale].maximum(question.maxSelections) };
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
      ? questions.findIndex(({ sectionId }) => sectionId === state.editingSectionId)
      : -1;
    if (state.editingSectionId && state.questionIndex === firstEditingIndex) {
      return { ...state, phase: "result", editingSectionId: null, validationMessage: null };
    }
    if (state.questionIndex === 0) return { ...state, phase: "intro", questionIndex: 0, validationMessage: null };
    return { ...state, questionIndex: state.questionIndex - 1, validationMessage: null };
  }
  if (action.type === "continue") {
    if (state.phase !== "journey") return state;
    const question = questions[state.questionIndex];
    if (!question) return state;
    if (!isCareerQuestionComplete(question, state.answers[question.id])) {
      return { ...state, validationMessage: selectionInstruction(question, locale) };
    }

    const atJourneyEnd = state.questionIndex === questions.length - 1;
    const atEditedSectionEnd = state.editingSectionId
      ? isLastQuestionOfCareerSection(state.questionIndex, state.editingSectionId, locale)
      : false;
    if (atJourneyEnd || atEditedSectionEnd) {
      if (getMissingCareerQuestionIds(state.answers, locale).length > 0) {
        return atJourneyEnd
          ? { ...state, validationMessage: careerResultCopyByLocale[locale].incomplete }
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
