import type { RelationshipImportance } from "./life-alignment-relationship";

export type TeamPatternId = "owned-flexible" | "explicit" | "collaborative" | "individual" | "gradual" | "direct" | "feedback-repair" | "speed-quality" | "shared-execution" | "pressure-shift";
export interface TeamAnswerEvidence {
  questionId: string;
  value: 1 | 2 | 3 | 4 | 5;
  importance: RelationshipImportance;
}
export interface TeamSoloInsight {
  id: string;
  pattern: TeamPatternId;
  title: string;
  meaning: string;
  experiment: string;
  conversation: string;
  tension: boolean;
  evidence: readonly TeamAnswerEvidence[];
}
export interface TeamSoloInsights {
  version: "team-solo-insights-v1";
  complete: boolean;
  answeredRequired: number;
  required: number;
  answeredScenarios: number;
  insights: readonly TeamSoloInsight[];
  missingQuestionIds: readonly string[];
  midpointQuestionIds: readonly string[];
  unmatchedQuestionIds: readonly string[];
}
