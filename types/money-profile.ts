export const moneyDimensionIds = [
  "security-orientation",
  "freedom-orientation",
  "present-enjoyment",
  "future-orientation",
  "planning-structure",
  "financial-avoidance",
  "control-need",
  "spending-impulsivity",
  "risk-comfort",
  "status-symbolism",
  "financial-self-efficacy",
  "money-stress-reactivity",
] as const;

export type MoneyDimensionId = (typeof moneyDimensionIds)[number];

export const moneyEvidenceClasses = [
  "self-perception",
  "scenario-evidence",
  "behavioral-evidence",
  "repeated-friction",
  "stress-evidence",
] as const;

export type MoneyEvidenceClass = (typeof moneyEvidenceClasses)[number];

export const moneyMeaningIds = [
  "safety",
  "freedom",
  "possibility",
  "enjoyment",
  "responsibility",
  "control",
  "success",
  "belonging",
  "care-for-others",
  "peace",
  "status",
  "choice",
] as const;

export type MoneyMeaningId = (typeof moneyMeaningIds)[number];

export const moneyStressResponseIds = [
  "avoid",
  "control",
  "restrict",
  "soothe-spend",
  "freeze",
  "act",
] as const;

export type MoneyStressResponseId = (typeof moneyStressResponseIds)[number];

export const moneyProfileFamilyIds = [
  "protector",
  "freedom-seeker",
  "builder",
  "optimizer",
  "enjoyer",
  "distance-keeper",
  "balancer",
] as const;

export type MoneyProfileFamilyId = (typeof moneyProfileFamilyIds)[number];
export type MoneyConfidenceMode = "clear-pattern" | "mixed-profile" | "context-dependent" | "money-map";
export type MoneyCalibrationValue = "very-true" | "partly" | "not-really";

export interface MoneyDimension {
  id: MoneyDimensionId;
  label: string;
  definition: string;
  potentialStrength: string;
  potentialTradeOff: string;
}

export interface MoneyDimensionEffect {
  dimensionId: MoneyDimensionId;
  direction?: "support" | "contradict";
  strength?: number;
}

export interface MoneyQuestionOption {
  id: string;
  label: string;
  effects?: readonly MoneyDimensionEffect[];
  meanings?: readonly MoneyMeaningId[];
  stressResponses?: readonly MoneyStressResponseId[];
  frictions?: readonly string[];
  tags?: readonly string[];
}

export type MoneyQuestionType = "single" | "multi" | "scale" | "calibration";

export interface MoneyQuestionCondition {
  allDimensions: readonly MoneyDimensionId[];
}

export interface MoneyQuestion {
  id: `m${number}`;
  chapter: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  prompt: string;
  instruction?: string;
  type: MoneyQuestionType;
  evidenceClass: MoneyEvidenceClass;
  options: readonly MoneyQuestionOption[];
  maxSelections?: number;
  optional?: boolean;
  condition?: MoneyQuestionCondition;
}

export interface MoneyAnswer {
  value: string | readonly string[];
  skipped?: boolean;
}

export type MoneyAnswerSet = Readonly<Record<string, MoneyAnswer>>;
export type MoneyCalibration = Readonly<Record<string, MoneyCalibrationValue>>;

export interface MoneyEvidence {
  questionId: string;
  optionId: string;
  dimensionId: MoneyDimensionId;
  evidenceClass: MoneyEvidenceClass;
  direction: "support" | "contradict";
  strength: number;
}

export interface MoneyDimensionResult {
  dimension: MoneyDimension;
  support: number;
  contradiction: number;
  net: number;
  supported: boolean;
  evidence: readonly MoneyEvidence[];
  questionIds: readonly string[];
  evidenceClasses: readonly MoneyEvidenceClass[];
}

export interface MoneyStressProfile {
  primary: MoneyStressResponseId | null;
  secondary: MoneyStressResponseId | null;
  support: Readonly<Record<MoneyStressResponseId, number>>;
  evidenceQuestionIds: readonly string[];
  baselineShift: readonly string[];
}

export interface MoneyTensionDefinition {
  id: string;
  dimensionIds: readonly MoneyDimensionId[];
  insight: string;
  tradeOff: string;
  helpfulStructures: readonly string[];
}

export interface MoneyTension extends MoneyTensionDefinition {
  evidenceQuestionIds: readonly string[];
}

export interface MoneyProfileFamily {
  id: MoneyProfileFamilyId;
  label: string;
  dimensionIds: readonly MoneyDimensionId[];
  meaningIds: readonly MoneyMeaningId[];
  strength: string;
  tradeOff: string;
  helpfulDirection: string;
}

export interface MoneyProfileCandidate {
  family: MoneyProfileFamily;
  score: number;
  eligible: boolean;
  evidenceQuestionIds: readonly string[];
  evidenceClasses: readonly MoneyEvidenceClass[];
}

export type MoneyInterventionEffort = "low" | "medium";

export interface MoneyIntervention {
  id: string;
  label: string;
  concept: string;
  helpsWith: readonly string[];
  badFitFor: readonly string[];
  stressFit: readonly MoneyStressResponseId[];
  effort: MoneyInterventionEffort;
  whyItMayHelp: string;
}

export interface MatchedMoneyIntervention extends MoneyIntervention {
  fitReason: string;
  priority: number;
}

export interface MoneyCalibrationHypothesis {
  id: string;
  text: string;
  familyIds: readonly MoneyProfileFamilyId[];
  evidenceQuestionIds: readonly string[];
}

export interface MoneyProfileResult {
  version: 1;
  confidenceMode: MoneyConfidenceMode;
  primaryProfile: MoneyProfileFamily | null;
  secondaryProfile: MoneyProfileFamily | null;
  dimensions: readonly MoneyDimensionResult[];
  meanings: readonly { id: MoneyMeaningId; label: string; score: number }[];
  baseline: {
    headline: string;
    description: string;
  };
  stress: MoneyStressProfile & { description: string };
  tensions: readonly MoneyTension[];
  strengths: readonly string[];
  blindSpots: readonly string[];
  triggers: readonly string[];
  interventions: readonly MatchedMoneyIntervention[];
  nextSteps: readonly string[];
  experiment: string;
  playbook: {
    atMyBest: string;
    underStress: string;
    watchFor: readonly string[];
    whatHelps: readonly string[];
    myNextMove: string;
  };
  frictionIds: readonly string[];
  calibrationHypotheses: readonly MoneyCalibrationHypothesis[];
}

export interface PersistedMoneyProfileState {
  schemaVersion: 1;
  phase: "questions" | "calibration" | "reveal" | "result";
  questionId: string | null;
  answers: Record<string, MoneyAnswer>;
  calibration: Record<string, MoneyCalibrationValue>;
  updatedAt: string;
  completedAt?: string;
}
