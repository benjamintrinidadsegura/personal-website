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
  | "feedback"
  | "making"
  | "care"
  | "expression"
  | "harmony"
  | "effectiveness";

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

export type CareerSectionId =
  | "attraction"
  | "activities"
  | "workstyle"
  | "reality"
  | "development";

export type CareerQuestionFormat = "single" | "multi" | "priority";

export type CareerQuestionPurpose =
  | "matching"
  | "constraints"
  | "qualification"
  | "next-step";

export type CareerActivitySignalId =
  | "develop-people"
  | "build-relationships"
  | "analyze-information"
  | "research-questions"
  | "explain-communicate"
  | "create-content"
  | "design-solutions"
  | "build-implement"
  | "organize-delivery"
  | "improve-systems"
  | "lead-decide";

export type CareerMotivationSignalId =
  | "human-progress"
  | "visible-usefulness"
  | "learning-mastery"
  | "creative-expression"
  | "commercial-momentum"
  | "stability-quality"
  | "ownership-change";

export type CareerEnvironmentSignalId =
  | "people-contact"
  | "collaboration"
  | "focus-time"
  | "clear-framework"
  | "autonomy"
  | "variety"
  | "steady-rhythm"
  | "open-exploration"
  | "feedback-exchange";

export type CareerSignalId =
  | CareerActivitySignalId
  | CareerMotivationSignalId
  | CareerEnvironmentSignalId;

export type CareerConstraintId =
  | "reduced-hours"
  | "remote-required"
  | "no-regular-travel"
  | "predictable-hours"
  | "income-continuity"
  | "low-physical-load";

export type CareerQualificationScope =
  | "short"
  | "several-months"
  | "formal-open"
  | "undecided";

export type CareerNextStepMode =
  | "conversation"
  | "role-comparison"
  | "mini-project"
  | "skill-test"
  | "work-observation";

export type CareerDirectionId =
  | "develop-people"
  | "relationships-influence"
  | "analysis-clarity"
  | "research-understanding"
  | "content-communication"
  | "product-experience"
  | "technical-practical"
  | "operations-improvement"
  | "initiative-leadership";

export type CareerFieldQualification = "open" | "upskill" | "substantial";

export interface CareerSignal {
  id: CareerSignalId;
  weight: 1 | 2;
}

export interface CareerQuestionOption {
  id: string;
  label: string;
  description?: string;
  signals?: readonly CareerSignal[];
  constraints?: readonly CareerConstraintId[];
  qualificationScope?: CareerQualificationScope;
  nextStepMode?: CareerNextStepMode;
  exclusive?: boolean;
}

export interface CareerQuestion {
  id: string;
  sectionId: CareerSectionId;
  prompt: string;
  context?: string;
  format: CareerQuestionFormat;
  purpose: CareerQuestionPurpose;
  minSelections: number;
  maxSelections: number;
  matchingWeight: 0 | 0.75 | 1 | 1.25;
  options: readonly CareerQuestionOption[];
}

export interface CareerSection {
  id: CareerSectionId;
  title: string;
  mapLabel: string;
  description: string;
}

export interface CareerDirectionProfileSignal {
  signalId: CareerSignalId;
  weight: 1 | 2;
}

export interface CareerFieldExample {
  label: string;
  qualification: CareerFieldQualification;
}

export interface CareerConstraintNoteDefinition {
  constraintId: CareerConstraintId;
  text: string;
}

export interface CareerJobTitleDefinition {
  id: string;
  title: string;
  description: string;
  directionIds: readonly CareerDirectionId[];
  hybridDirectionIds?: readonly [CareerDirectionId, CareerDirectionId];
  aliases?: readonly string[];
  qualificationNote?: string;
  constraintHints?: readonly CareerConstraintNoteDefinition[];
}

export interface CareerDirection {
  id: CareerDirectionId;
  title: string;
  description: string;
  rationale: string;
  profile: readonly CareerDirectionProfileSignal[];
  coreActivitySignals: readonly CareerActivitySignalId[];
  fields: readonly CareerFieldExample[];
  environments: readonly string[];
  qualificationNote?: string;
  constraintNotes: readonly CareerConstraintNoteDefinition[];
  conversationPrompt: string;
  microExperiment: string;
  skillExperiment: string;
  observationPrompt: string;
}

export interface CareerEvidence {
  questionId: string;
  optionId: string;
  sectionId: CareerSectionId;
  answer: string;
}

export interface CareerResultDirection {
  id: CareerDirectionId;
  title: string;
  description: string;
  why: string;
  evidence: readonly CareerEvidence[];
  fields: readonly string[];
  environments: readonly string[];
  qualificationNote?: string;
  constraintNotes: readonly string[];
}

export interface CareerCondition {
  id: string;
  kind: "constraint" | "preference" | "qualification";
  text: string;
}

export interface CareerTensionResult {
  id: string;
  title: string;
  text: string;
  evidence: readonly CareerEvidence[];
}

export interface CareerJobDirectionReference {
  id: CareerDirectionId;
  title: string;
  tier: "primary" | "additional";
}

export interface CareerResultJobTitle {
  id: string;
  title: string;
  description: string;
  directions: readonly CareerJobDirectionReference[];
  why: string;
  aliases: readonly string[];
  qualificationNote?: string;
  constraintNotes: readonly string[];
}

export interface CareerNextStep {
  mode: CareerNextStepMode;
  title: string;
  text: string;
}

export interface CareerResult {
  title: string;
  description: string;
  summary: readonly string[];
  primaryDirections: readonly CareerResultDirection[];
  additionalDirections: readonly CareerResultDirection[];
  jobTitles: readonly CareerResultJobTitle[];
  conditions: readonly CareerCondition[];
  tensions: readonly CareerTensionResult[];
  nextStep: CareerNextStep;
}

export type CareerAnswers = Readonly<Record<string, readonly string[]>>;

export interface CareerJourneyState {
  phase: "intro" | "journey" | "result";
  questionIndex: number;
  answers: CareerAnswers;
  validationMessage: string | null;
  editingSectionId: CareerSectionId | null;
  restartPending: boolean;
}

export type CareerJourneyAction =
  | { type: "start" }
  | { type: "toggle-option"; questionId: string; optionId: string }
  | { type: "continue" }
  | { type: "back" }
  | { type: "edit-section"; sectionId: CareerSectionId }
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
