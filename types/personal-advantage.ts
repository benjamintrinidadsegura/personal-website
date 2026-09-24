export const advantageEvidenceClasses = [
  "self-perception",
  "preference",
  "behavioral",
  "external",
  "outcome",
  "cross-context",
] as const;

export type AdvantageEvidenceClass = (typeof advantageEvidenceClasses)[number];

export const advantageSignalDomains = [
  "sensemaking",
  "exploration",
  "creation",
  "human-understanding",
  "social-leverage",
  "execution",
  "precision",
  "adaptability",
  "leverage-assets",
] as const;

export type AdvantageSignalDomain = (typeof advantageSignalDomains)[number];
export type AdvantageConfidence = "emerging" | "supported" | "strong-pattern";
export type AdvantageSynergyType = "reinforcement" | "translation" | "bridge" | "amplification" | "distribution" | "constraint-transformation" | "distinctive-perspective";

export interface AdvantageSignal {
  id: string;
  domain: AdvantageSignalDomain;
  label: string;
  definition: string;
  contexts: readonly string[];
  overusePatterns: readonly string[];
  possibleMultipliers: readonly string[];
  tensions: readonly string[];
}

export interface AdvantageOptionEffect {
  signalId: string;
  direction?: "support" | "contradict";
  strength?: number;
  modifier?: "energy" | "experience" | "constraint" | "access" | "context";
}

export interface AdvantageQuestionOption {
  id: string;
  label: string;
  effects: readonly AdvantageOptionEffect[];
}

export type AdvantageQuestionType = "single" | "multi" | "text" | "adaptive-signals";

export interface AdvantageQuestionCondition {
  questionId: string;
  includesAny: readonly string[];
}

export interface AdvantageQuestion {
  id: `q${number}`;
  chapter: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  prompt: string;
  instruction?: string;
  type: AdvantageQuestionType;
  evidenceClass: AdvantageEvidenceClass;
  options: readonly AdvantageQuestionOption[];
  maxSelections?: number;
  optional?: boolean;
  freeTextLimit?: number;
  condition?: AdvantageQuestionCondition;
  privacy?: "ordinary" | "personal" | "sensitive";
}

export type AdvantageAnswerValue = string | readonly string[];

export interface AdvantageAnswer {
  value: AdvantageAnswerValue;
  freeText?: string;
  skipped?: boolean;
}

export type AdvantageAnswerSet = Readonly<Record<string, AdvantageAnswer>>;

export interface AdvantageEvidence {
  questionId: string;
  signalId: string;
  evidenceClass: AdvantageEvidenceClass;
  direction: "support" | "contradict";
  strength: number;
  modifier?: AdvantageOptionEffect["modifier"];
}

export interface AdvantageSignalProfile {
  signal: AdvantageSignal;
  support: number;
  contradiction: number;
  energy: number;
  evidenceClasses: readonly AdvantageEvidenceClass[];
  evidence: readonly AdvantageEvidence[];
  questionIds: readonly string[];
}

export interface AdvantageSynergyDefinition {
  id: string;
  label: string;
  signalIds: readonly string[];
  type: AdvantageSynergyType;
  synthesis: string;
  recognition: readonly string[];
  contexts: readonly string[];
  killers: readonly string[];
  shadow: string;
  counterweight: string;
  multiplier: string;
}

export interface AdvantageProbe {
  id: string;
  candidateId: string;
  archetype: "pair-interaction" | "sequence" | "missing-component" | "context-split" | "outcome-check" | "overuse" | "energy" | "social-proof" | "bridge-test" | "replacement-test";
  prompt: string;
  options: readonly { id: string; label: string; interaction: number; energy?: number; context?: string }[];
}

export type AdvantageProbeAnswers = Readonly<Record<string, string>>;
export type AdvantageCalibrationValue = "very-true" | "sometimes-true" | "not-really";
export type AdvantageCalibration = Readonly<Record<string, AdvantageCalibrationValue>>;

export interface AdvantageCandidate {
  id: string;
  label: string;
  signalIds: readonly string[];
  type: AdvantageSynergyType;
  source: "curated" | "composable";
  synthesis: string;
  evidenceStrength: number;
  interactionStrength: number;
  explanatoryPower: number;
  contextFit: number;
  energyAlignment: number;
  contradictionPenalty: number;
  calibrationModifier: number;
  confidence: AdvantageConfidence;
  eligibleForCore: boolean;
  evidenceClasses: readonly AdvantageEvidenceClass[];
  recognition: readonly string[];
  contexts: readonly string[];
  killers: readonly string[];
  shadow: string;
  counterweight: string;
  multiplier: string;
}

export interface PersonalAdvantageMap {
  version: 1;
  coreAdvantage: AdvantageCandidate;
  supportingAdvantages: readonly AdvantageCandidate[];
  emergingAdvantage?: AdvantageCandidate;
  stack: readonly { signalId: string; label: string; role: "core" | "amplifier" | "supporting" }[];
  hiddenAdvantages: readonly { label: string; explanation: string; experiment: string }[];
  amplifierEnvironments: readonly string[];
  killers: readonly string[];
  shadows: readonly string[];
  counterweights: readonly string[];
  missingMultiplier?: string;
  evidenceSummary: readonly { label: string; detail: string }[];
  playbook: {
    showsUp: readonly string[];
    powerfulWhen: readonly string[];
    tryThis: readonly string[];
    watchFor: readonly string[];
  };
  experiments: readonly string[];
  reminder: string;
}

export interface PersistedAdvantageState {
  schemaVersion: 1;
  phase: "questions" | "probes" | "calibration" | "reveal" | "result";
  questionId: string | null;
  answers: Record<string, AdvantageAnswer>;
  probeAnswers: Record<string, string>;
  calibration: Record<string, AdvantageCalibrationValue>;
  updatedAt: string;
  completedAt?: string;
}
