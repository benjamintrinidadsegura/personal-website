export type LifeVisionSectionId = "frame" | "direction" | "protect" | "context" | "constraints" | "paths";

export type LifeVisionAreaId =
  | "work-contribution"
  | "relationships"
  | "community"
  | "wellbeing"
  | "rest-play"
  | "security"
  | "learning-creativity"
  | "home-place";

export type LifeVisionHorizon = "one-two-years" | "three-five-years" | "open-horizon";
export type LifeVisionEmphasis = "less" | "similar" | "more" | "different" | "uncertain" | "intentionally-open";
export type LifeVisionProtectionId = "health-capacity" | "close-relationships" | "financial-floor" | "time-autonomy" | "belonging" | "integrity" | "rest" | "curiosity";
export type LifeVisionSource = "intrinsic" | "social" | "inherited" | "constraint-driven" | "uncertain";
export type LifeVisionConstraintId = "time" | "energy" | "care" | "money" | "place-access" | "commitment" | "other-people" | "missing-information" | "none";
export type LifeVisionTradeoffStance = "explore" | "accept-for-now" | "protect-both" | "uncertain" | "no-current-tension";
export type LifeVisionExplorationMode = "direct-change" | "reduce-load" | "gather-information" | "conversation" | "boundary" | "build-capacity" | "explore-alternatives" | "accept-for-now" | "reversible-experiment" | "external-support";

export interface LifeVisionAnswers {
  horizon: LifeVisionHorizon | null;
  selectedAreaIds: readonly LifeVisionAreaId[];
  emphasisByArea: Readonly<Partial<Record<LifeVisionAreaId, LifeVisionEmphasis>>>;
  protectedAreaIds: readonly LifeVisionAreaId[];
  protectionIds: readonly LifeVisionProtectionId[];
  sourcesByArea: Readonly<Partial<Record<LifeVisionAreaId, readonly LifeVisionSource[]>>>;
  constraintIds: readonly LifeVisionConstraintId[];
  competingAreaIds: readonly LifeVisionAreaId[];
  tradeoffStance: LifeVisionTradeoffStance | null;
  explorationModes: readonly LifeVisionExplorationMode[];
}

export interface LifeVisionJourneyState {
  phase: "intro" | "journey" | "result";
  sectionIndex: number;
  answers: LifeVisionAnswers;
  validationMessage: string | null;
  restartPending: boolean;
}

export type LifeVisionAction =
  | { type: "start" }
  | { type: "set-horizon"; value: LifeVisionHorizon }
  | { type: "toggle-area"; areaId: LifeVisionAreaId }
  | { type: "set-emphasis"; areaId: LifeVisionAreaId; value: LifeVisionEmphasis }
  | { type: "toggle-protected-area"; areaId: LifeVisionAreaId }
  | { type: "toggle-protection"; protectionId: LifeVisionProtectionId }
  | { type: "toggle-source"; areaId: LifeVisionAreaId; value: LifeVisionSource }
  | { type: "toggle-constraint"; constraintId: LifeVisionConstraintId }
  | { type: "toggle-competing-area"; areaId: LifeVisionAreaId }
  | { type: "set-tradeoff"; value: LifeVisionTradeoffStance }
  | { type: "toggle-exploration"; value: LifeVisionExplorationMode }
  | { type: "continue" }
  | { type: "back" }
  | { type: "edit-section"; sectionIndex: number }
  | { type: "request-restart" }
  | { type: "cancel-restart" }
  | { type: "confirm-restart" };

export type LifeVisionSignal = "direction" | "protected" | "open" | "uncertain" | "constrained" | "competing" | "accepted";

export interface LifeVisionAreaResult {
  id: LifeVisionAreaId;
  title: string;
  emphasis: LifeVisionEmphasis;
  emphasisLabel: string;
  protected: boolean;
  sourceLabels: readonly string[];
  signals: readonly LifeVisionSignal[];
}

export interface LifeVisionEvidence {
  label: string;
  detail: string;
}

export interface LifeVisionInsight {
  id: string;
  title: string;
  finding: string;
  why: string;
  illustrativeExample: string;
  evidence: readonly LifeVisionEvidence[];
}

export interface LifeVisionPathTool {
  title: string;
  use: string;
}

export interface LifeVisionActionPath {
  mode: LifeVisionExplorationMode;
  title: string;
  whyItMayFit: string;
  firstStep: string;
  tradeoff: string;
  learningQuestion: string;
  reversibility: string;
  tools: readonly LifeVisionPathTool[];
  evidence: readonly LifeVisionEvidence[];
}

export type LifeVisionDirectionLaneId = "protect" | "move-toward" | "reduce" | "keep-open";

export interface LifeVisionDirectionLane {
  id: LifeVisionDirectionLaneId;
  title: string;
  description: string;
  areaIds: readonly LifeVisionAreaId[];
}

export interface LifeVisionDirectionMap {
  lanes: readonly LifeVisionDirectionLane[];
  constraintLabels: readonly string[];
  tradeoffLabel: string;
  sourceSignals: readonly { areaTitle: string; labels: readonly string[] }[];
}

export interface LifeVisionVisualSnapshot {
  headline: string;
  description: string;
  directionSummary: string;
  protectionSummary: string;
  contextSummary: string;
}

export interface LifeVisionClosingOrientation {
  headline: string;
  orientation: string;
  questions: readonly string[];
  evidence: readonly LifeVisionEvidence[];
}

export interface LifeVisionResult {
  title: string;
  description: string;
  horizonLabel: string;
  areas: readonly LifeVisionAreaResult[];
  protectedLabels: readonly string[];
  constraintLabels: readonly string[];
  competingAreas: readonly LifeVisionAreaResult[];
  tradeoffLabel: string;
  visualSnapshot: LifeVisionVisualSnapshot;
  directionMap: LifeVisionDirectionMap;
  insights: readonly LifeVisionInsight[];
  actionPaths: readonly LifeVisionActionPath[];
  closingOrientation: LifeVisionClosingOrientation;
}
