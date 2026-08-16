export type PartnerParticipantId = "a" | "b";

export type PartnerDimensionId =
  | "connection"
  | "communication"
  | "reliability"
  | "shared-time"
  | "autonomy"
  | "responsibilities"
  | "finances"
  | "physical-intimacy";

export type PartnerExperience = "less-than-needed" | "workable" | "more-than-needed" | "mixed" | "unclear";
export type PartnerDesiredDirection = "less" | "similar" | "more" | "different" | "open";
export type PartnerImportance = "important" | "somewhat" | "not-central";
export type PartnerCertainty = "clear" | "unsure";
export type PartnerExpectationClarity =
  | "current-confirmed"
  | "assumed"
  | "discussed-before-current-unclear"
  | "currently-unclear"
  | "intentionally-open";
export type PartnerDifferenceStance = "discuss" | "acceptable" | "uncertain";
export type PartnerConstraint = "none" | "capacity" | "practical" | "external" | "unclear";

export interface PartnerDimensionDefinition {
  id: PartnerDimensionId;
  title: string;
  description: string;
  examples: readonly [string, string, string];
  sensitive?: boolean;
}

export interface PartnerDimensionAnswer {
  experience?: PartnerExperience;
  desiredDirection?: PartnerDesiredDirection;
  importance?: PartnerImportance;
  certainty?: PartnerCertainty;
  expectationClarity?: PartnerExpectationClarity;
  differenceStance?: PartnerDifferenceStance;
  constraint?: PartnerConstraint;
}

export interface PartnerParticipantAnswers {
  selectedDimensionIds: readonly PartnerDimensionId[];
  sensitiveOptIns: readonly PartnerDimensionId[];
  dimensions: Readonly<Partial<Record<PartnerDimensionId, PartnerDimensionAnswer>>>;
  comparisonConsent: boolean;
}

export interface PartnerJourneyState {
  phase: "intro" | "participant-a" | "handoff" | "participant-b" | "result";
  sectionIndex: number;
  participants: Readonly<Record<PartnerParticipantId, PartnerParticipantAnswers>>;
  participantASealed: boolean;
  validationMessage: string | null;
  restartPending: boolean;
}

export type PartnerJourneyAction =
  | { type: "start" }
  | { type: "toggle-sensitive-opt-in"; dimensionId: PartnerDimensionId }
  | { type: "toggle-dimension"; dimensionId: PartnerDimensionId }
  | { type: "set-dimension-answer"; dimensionId: PartnerDimensionId; field: keyof PartnerDimensionAnswer; value: NonNullable<PartnerDimensionAnswer[keyof PartnerDimensionAnswer]> }
  | { type: "set-comparison-consent"; value: boolean }
  | { type: "continue" }
  | { type: "back" }
  | { type: "seal-participant-a" }
  | { type: "begin-participant-b" }
  | { type: "finish-participant-b" }
  | { type: "request-restart" }
  | { type: "cancel-restart" }
  | { type: "confirm-restart" };

export type PartnerFindingCategory =
  | "shared-ground"
  | "different-expectations"
  | "direction-difference"
  | "uncertainty"
  | "accepted-difference"
  | "present-constraint"
  | "worth-discussing"
  | "not-assessed-by-both";

export interface PartnerEvidenceReference {
  participant: PartnerParticipantId;
  dimensionId: PartnerDimensionId;
  field: keyof PartnerDimensionAnswer | "selected";
  label: string;
}

export interface PartnerComparisonFinding {
  id: string;
  category: PartnerFindingCategory;
  categoryLabel: string;
  headline: string;
  explanation: string;
  everydayTranslation: string;
  everydayExamples: readonly string[];
  dimensionIds: readonly PartnerDimensionId[];
  questions: readonly string[];
  possibleNextSteps: readonly [string, string, string];
  whatCouldBeLearned: string;
  boundary: string;
  evidence: readonly PartnerEvidenceReference[];
}

export type PartnerSharedContextId =
  | "shared-ground"
  | "different-perspectives"
  | "open-questions"
  | "current-constraints"
  | "conversation-opportunities"
  | "not-yet-explored-together";

export interface PartnerSharedContextSignal {
  id: PartnerSharedContextId;
  label: string;
  headline: string;
  explanation: string;
  dimensionIds: readonly PartnerDimensionId[];
}

export interface PartnerDescriptiveMetrics {
  topicsSelectedByA: number;
  topicsSelectedByB: number;
  topicsAssessedByBoth: number;
  sharedDirections: number;
  differingDirections: number;
  openOrUncertainTopics: number;
  topicsWithPresentConstraints: number;
}

export interface PartnerTrackPerspective {
  experience: PartnerExperience;
  experienceLabel: string;
  desiredDirection: PartnerDesiredDirection;
  directionLabel: string;
  importance: PartnerImportance;
  importanceLabel: string;
  certainty: PartnerCertainty;
  certaintyLabel: string;
  expectationClarity: PartnerExpectationClarity;
  expectationClarityLabel: string;
  differenceStance: PartnerDifferenceStance;
  differenceStanceLabel: string;
  constraint: PartnerConstraint;
  constraintLabel: string;
}

export interface PartnerComparisonTrack {
  dimensionId: PartnerDimensionId;
  dimensionTitle: string;
  sensitive: boolean;
  participantA: PartnerTrackPerspective | null;
  participantB: PartnerTrackPerspective | null;
}

export type PartnerActionPathId =
  | "clarify-expectation"
  | "conversation"
  | "practical-arrangement"
  | "boundary"
  | "gather-information"
  | "reversible-change"
  | "accept-difference"
  | "leave-open"
  | "external-support";

export interface PartnerActionPath {
  id: PartnerActionPathId;
  title: string;
  why: string;
  approach: string;
  tradeoffs: string;
  reversibility: string;
  whatCouldBeLearned: string;
  evidenceFindingIds: readonly string[];
}

export interface PartnerExperiment {
  id: string;
  title: string;
  why: string;
  steps: readonly [string, string, string];
  observationQuestion: string;
  whatCouldBeLearned: string;
  stopBoundary: string;
  evidenceFindingIds: readonly string[];
}

export interface PartnerConversationTool {
  id: string;
  title: string;
  usefulWhen: string;
  steps: readonly [string, string, string];
  closingQuestion: string;
  safetyBoundary: string;
  evidenceFindingIds: readonly string[];
}

export interface PartnerComparisonResult {
  title: string;
  description: string;
  sharedOverview: readonly PartnerSharedContextSignal[];
  metrics: PartnerDescriptiveMetrics;
  tracks: readonly PartnerComparisonTrack[];
  findings: readonly PartnerComparisonFinding[];
  findingsByCategory: Readonly<Record<PartnerFindingCategory, readonly PartnerComparisonFinding[]>>;
  paths: readonly PartnerActionPath[];
  experiments: readonly PartnerExperiment[];
  conversationTools: readonly PartnerConversationTool[];
  sensitiveDimensionIds: readonly PartnerDimensionId[];
  disclaimer: string;
}
