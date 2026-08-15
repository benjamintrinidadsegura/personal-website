export type ProblemSectionId = "situation" | "urgency" | "experience" | "next-step";

export type ProblemQuestionFormat = "single" | "multi" | "text";

export interface ProblemSection {
  id: ProblemSectionId;
  title: string;
  description: string;
}

export interface ProblemOption {
  id: string;
  label: string;
  exclusive?: boolean;
}

export interface ProblemQuestion {
  id: string;
  sectionId: ProblemSectionId;
  prompt: string;
  context?: string;
  format: ProblemQuestionFormat;
  minSelections: number;
  maxSelections: number;
  maxLength?: number;
  options: readonly ProblemOption[];
}

export type ProblemAnswers = Readonly<Record<string, readonly string[]>>;

export interface ProblemEvidence {
  questionId: string;
  optionId: string;
  answer: string;
}

export interface ProblemResultStatement {
  id: string;
  title: string;
  text: string;
  evidence: readonly ProblemEvidence[];
}

export interface ProblemBoundary {
  level: "standard" | "professional" | "urgent";
  title: string;
  text: string;
}

export interface ProblemNextStep {
  title: string;
  text: string;
  evidence: readonly ProblemEvidence[];
}

export interface ProblemResult {
  title: string;
  description: string;
  summary: readonly string[];
  boundary: ProblemBoundary;
  situation: readonly ProblemResultStatement[];
  resources: readonly ProblemResultStatement[];
  questionsToCarry: readonly string[];
  nextStep: ProblemNextStep;
  userNote: string | null;
}

export interface ProblemJourneyState {
  phase: "intro" | "journey" | "result";
  questionIndex: number;
  answers: ProblemAnswers;
  validationMessage: string | null;
  editingSectionId: ProblemSectionId | null;
  restartPending: boolean;
}

export type ProblemJourneyAction =
  | { type: "start" }
  | { type: "toggle-option"; questionId: string; optionId: string }
  | { type: "set-text"; questionId: string; value: string }
  | { type: "continue" }
  | { type: "back" }
  | { type: "edit-section"; sectionId: ProblemSectionId }
  | { type: "request-restart" }
  | { type: "cancel-restart" }
  | { type: "confirm-restart" };
