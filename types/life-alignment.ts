export type LifeAlignmentSectionId = "areas" | "reality" | "direction" | "context" | "focus";

export type LifeAreaId =
  | "work"
  | "close-relationships"
  | "community"
  | "wellbeing"
  | "rest-play"
  | "security"
  | "growth-creativity"
  | "home-environment"
  | "custom-1"
  | "custom-2";

export type CurrentEmphasis = "little" | "workable" | "a-lot" | "unclear";
export type CapacityEffect = "supportive" | "mixed" | "draining" | "unclear";
export type DesiredDirection = "less" | "keep" | "more" | "different" | "uncertain";
export type TradeoffStatus = "explore-change" | "accepted-now" | "currently-fixed" | "uncertain";
export type AuthoritySource = "intrinsic" | "social" | "inherited" | "constraint-driven" | "uncertain";
export type EntanglementStatus = "current" | "historical" | "both" | "unsure" | "not-applicable";
export type ExperimentMode = "observe" | "protect" | "conversation" | "fact" | "reversible" | "pause";
export type LifeConstraintId =
  | "time-attention"
  | "energy-capacity"
  | "care-responsibility"
  | "income-commitment"
  | "location-access"
  | "formal-obligation"
  | "external-dependency"
  | "uncertain"
  | "none";

export interface LifeAreaDefinition {
  id: Exclude<LifeAreaId, "custom-1" | "custom-2">;
  title: string;
  description: string;
  highStakes?: boolean;
}

export interface LifeAreaAnswer {
  currentEmphasis?: CurrentEmphasis;
  capacityEffect?: CapacityEffect;
  desiredDirection?: DesiredDirection;
}

export interface LifeAlignmentAnswers {
  selectedAreaIds: readonly LifeAreaId[];
  customLabels: Readonly<Record<"custom-1" | "custom-2", string>>;
  priorityAreaIds: readonly LifeAreaId[];
  areas: Readonly<Partial<Record<LifeAreaId, LifeAreaAnswer>>>;
  constraints: readonly LifeConstraintId[];
  focusAreaId: LifeAreaId | null;
  tradeoffStatus: TradeoffStatus | null;
  authoritySources: readonly AuthoritySource[];
  entanglementStatus: EntanglementStatus | null;
  focusIntention: string;
  experimentMode: ExperimentMode | null;
}

export interface LifeAlignmentJourneyState {
  phase: "intro" | "journey" | "result";
  sectionIndex: number;
  answers: LifeAlignmentAnswers;
  validationMessage: string | null;
  restartPending: boolean;
}

export type LifeAlignmentAction =
  | { type: "start" }
  | { type: "toggle-area"; areaId: LifeAreaId }
  | { type: "set-custom-label"; areaId: "custom-1" | "custom-2"; value: string }
  | { type: "toggle-priority"; areaId: LifeAreaId }
  | { type: "set-area-answer"; areaId: LifeAreaId; field: keyof LifeAreaAnswer; value: CurrentEmphasis | CapacityEffect | DesiredDirection }
  | { type: "toggle-constraint"; constraintId: LifeConstraintId }
  | { type: "set-focus"; areaId: LifeAreaId }
  | { type: "set-tradeoff"; value: TradeoffStatus }
  | { type: "toggle-authority"; value: AuthoritySource }
  | { type: "set-entanglement"; value: EntanglementStatus }
  | { type: "set-focus-intention"; value: string }
  | { type: "set-experiment"; value: ExperimentMode }
  | { type: "continue" }
  | { type: "back" }
  | { type: "edit-section"; sectionIndex: number }
  | { type: "request-restart" }
  | { type: "cancel-restart" }
  | { type: "confirm-restart" };

export type AlignmentSignal = "supportive" | "tension" | "constrained" | "accepted" | "uncertain" | "steady";

export interface LifeAlignmentAreaResult {
  id: LifeAreaId;
  title: string;
  importantNow: boolean;
  currentEmphasis: CurrentEmphasis;
  currentLabel: string;
  capacityEffect: CapacityEffect;
  capacityLabel: string;
  desiredDirection: DesiredDirection;
  directionLabel: string;
  signal: AlignmentSignal;
  signalLabel: string;
}

export interface LifeAlignmentExperiment {
  title: string;
  action: string;
  observe: string;
  boundary: string;
}

export type LifeAlignmentSnapshotGroupId = "support" | "change" | "open" | "steady";

export interface LifeAlignmentSnapshotGroup {
  id: LifeAlignmentSnapshotGroupId;
  label: string;
  description: string;
  areas: readonly LifeAlignmentAreaResult[];
}

export interface LifeAlignmentEvidence {
  source: string;
  detail: string;
  areaId?: LifeAreaId;
}

export interface LifeAlignmentInsight {
  id: string;
  eyebrow: string;
  title: string;
  explanation: string;
  everydayInterpretation: string;
  evidence: readonly LifeAlignmentEvidence[];
}

export interface LifeAlignmentActionPath {
  id: string;
  title: string;
  why: string;
  firstStep: string;
  example: string;
  learning: string;
  tradeoff: string;
  reversible: boolean;
  evidence: readonly LifeAlignmentEvidence[];
}

export interface LifeAlignmentMicroTool {
  id: string;
  title: string;
  duration: string;
  purpose: string;
  steps: readonly string[];
  prompt: string;
}

export interface LifeAlignmentClosingOrientation {
  title: string;
  body: string;
  reminders: readonly string[];
}

export interface LifeAlignmentResult {
  title: string;
  description: string;
  summary: readonly string[];
  areas: readonly LifeAlignmentAreaResult[];
  supportiveAreas: readonly LifeAlignmentAreaResult[];
  drainingAreas: readonly LifeAlignmentAreaResult[];
  tensionAreas: readonly LifeAlignmentAreaResult[];
  uncertainAreas: readonly LifeAlignmentAreaResult[];
  constraints: readonly string[];
  focus: LifeAlignmentAreaResult;
  tradeoffLabel: string;
  authorityLabels: readonly string[];
  entanglementLabel: string;
  focusIntention: string | null;
  experiment: LifeAlignmentExperiment;
  snapshot: readonly LifeAlignmentSnapshotGroup[];
  insights: readonly LifeAlignmentInsight[];
  actionPaths: readonly LifeAlignmentActionPath[];
  tools: readonly LifeAlignmentMicroTool[];
  closing: LifeAlignmentClosingOrientation;
  highStakesBoundary: boolean;
}
