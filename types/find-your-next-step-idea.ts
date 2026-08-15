export type IdeaSectionId = "core" | "people-value" | "reality" | "experiment";

export type IdeaQuestionFormat = "short-text" | "single" | "multi" | "priority";

export type IdeaResultRole =
  | "idea"
  | "problem"
  | "audience"
  | "value"
  | "evidence"
  | "assumptions"
  | "constraints"
  | "learning-goal"
  | "experiment-mode";

export interface IdeaSection {
  id: IdeaSectionId;
  title: string;
  description: string;
}

export interface IdeaOption {
  id: string;
  label: string;
  resultText: string;
  exclusive?: boolean;
}

interface IdeaQuestionBase {
  id: string;
  sectionId: IdeaSectionId;
  prompt: string;
  context: string;
  resultRole: IdeaResultRole;
}

export interface IdeaTextQuestion extends IdeaQuestionBase {
  format: "short-text";
  minLength: number;
  maxLength: number;
  placeholder: string;
}

export interface IdeaChoiceQuestion extends IdeaQuestionBase {
  format: Exclude<IdeaQuestionFormat, "short-text">;
  minSelections: number;
  maxSelections: number;
  options: readonly IdeaOption[];
}

export type IdeaQuestion = IdeaTextQuestion | IdeaChoiceQuestion;

export type IdeaAnswer = string | readonly string[];
export type IdeaAnswers = Readonly<Record<string, IdeaAnswer>>;

export interface IdeaSnapshot {
  idea: string;
  problem: string;
  audience: string;
  value: string;
}

export interface IdeaExperiment {
  title: string;
  method: string;
  observe: string;
  boundary: string;
}

export interface IdeaResult {
  title: string;
  description: string;
  snapshot: IdeaSnapshot;
  evidenceStatus: string;
  known: readonly string[];
  uncertain: readonly string[];
  assumptions: readonly string[];
  constraints: readonly string[];
  experiment: IdeaExperiment;
  nextStep: string;
  authorityNote: string;
}

export type IdeaBuildResult =
  | { status: "complete"; result: IdeaResult }
  | { status: "incomplete"; missingQuestionIds: readonly string[] };

export interface IdeaJourneyState {
  phase: "intro" | "journey" | "result";
  questionIndex: number;
  answers: IdeaAnswers;
  validationMessage: string | null;
  editingSectionId: IdeaSectionId | null;
  restartPending: boolean;
}

export type IdeaJourneyAction =
  | { type: "start" }
  | { type: "set-text"; questionId: string; value: string }
  | { type: "toggle-option"; questionId: string; optionId: string }
  | { type: "continue" }
  | { type: "back" }
  | { type: "edit-section"; sectionId: IdeaSectionId }
  | { type: "request-restart" }
  | { type: "cancel-restart" }
  | { type: "confirm-restart" };
