export type NextStepJourneySlug = "self" | "career" | "problem" | "idea";

export type NextStepJourneyStatus = "Beta" | "In Development";

export type SelfReflectionSectionId =
  | "priorities"
  | "decisions"
  | "energy"
  | "conditions"
  | "self-view";

export type SelfReflectionDimensionId =
  | "agency"
  | "orientation"
  | "reliability"
  | "depth"
  | "variety"
  | "connection"
  | "recovery"
  | "growth"
  | "purpose"
  | "feedback";

export type SelfReflectionQuestionFormat = "single" | "multi" | "priority";

export type SelfReflectionEvidenceRole =
  | "priority"
  | "work"
  | "decision"
  | "energyGain"
  | "energyDrain"
  | "condition"
  | "selfImage"
  | "context"
  | "synthesis";

export type SelfReflectionVisibility = "multiple" | "clear";

export type SelfReflectionResultSectionId =
  | "importance"
  | "work"
  | "energyGain"
  | "energyDrain"
  | "conditions"
  | "selfImage";

export interface SelfReflectionSignal {
  dimension: SelfReflectionDimensionId;
  weight: 1 | 2;
}

export interface SelfReflectionOption {
  id: string;
  label: string;
  description?: string;
  signals?: readonly SelfReflectionSignal[];
  contextualDimensions?: readonly SelfReflectionDimensionId[];
  reflection?: string;
  exclusive?: boolean;
}

export interface SelfReflectionQuestion {
  id: string;
  sectionId: SelfReflectionSectionId;
  prompt: string;
  context?: string;
  format: SelfReflectionQuestionFormat;
  evidenceRole: SelfReflectionEvidenceRole;
  minSelections: number;
  maxSelections: number;
  options: readonly SelfReflectionOption[];
}

export interface SelfReflectionSection {
  id: SelfReflectionSectionId;
  title: string;
  description: string;
}

export interface SelfReflectionEvidence {
  questionId: string;
  optionId: string;
  sectionId: SelfReflectionSectionId;
  answer: string;
}

export interface SelfReflectionResultStatement {
  id: string;
  text: string;
  evidence: readonly SelfReflectionEvidence[];
  dimensionLabel?: string;
  visibility?: SelfReflectionVisibility;
  contextual?: boolean;
}

export interface SelfReflectionResultSection {
  id: SelfReflectionResultSectionId;
  title: string;
  statements: readonly SelfReflectionResultStatement[];
}

export interface SelfReflectionTensionResult {
  id: string;
  title: string;
  text: string;
  evidence: readonly SelfReflectionEvidence[];
}

export interface SelfReflectionResult {
  title: string;
  description: string;
  summary: readonly string[];
  sections: readonly SelfReflectionResultSection[];
  tensions: readonly SelfReflectionTensionResult[];
}

export type SelfReflectionAnswers = Readonly<Record<string, readonly string[]>>;

export interface SelfReflectionJourneyState {
  phase: "intro" | "journey" | "result";
  questionIndex: number;
  answers: SelfReflectionAnswers;
  validationMessage: string | null;
  editingSectionId: SelfReflectionSectionId | null;
  restartPending: boolean;
}

export type SelfReflectionJourneyAction =
  | { type: "start" }
  | { type: "toggle-option"; questionId: string; optionId: string }
  | { type: "continue" }
  | { type: "back" }
  | { type: "edit-section"; sectionId: SelfReflectionSectionId }
  | { type: "request-restart" }
  | { type: "cancel-restart" }
  | { type: "confirm-restart" };

export interface NextStepJourneyDiscoveryCopy {
  title?: string;
  category: string;
  tags: readonly string[];
  keywords: readonly string[];
}

export interface NextStepJourney {
  id: `tool-find-your-next-step-${NextStepJourneySlug}`;
  slug: NextStepJourneySlug;
  href: `/find-your-next-step/${NextStepJourneySlug}`;
  number: "01" | "02" | "03" | "04";
  title: string;
  description: string;
  expectations: readonly string[];
  analysisAreas: readonly string[];
  status: NextStepJourneyStatus;
  accent: string;
  discovery: NextStepJourneyDiscoveryCopy;
  professionalBoundary?: string;
}
