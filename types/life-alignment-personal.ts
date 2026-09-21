import type { LocalizedText } from "@/types/life-alignment-relationship";

export type PersonalAlignmentModuleId = "career" | "life-vision";
export type PersonalAlignmentValue = 1 | 2 | 3 | 4 | 5;
export type PersonalAlignmentSignal = "strong" | "attention" | "tension" | "background";

export interface PersonalDimensionDefinition {
  id: string;
  title: LocalizedText;
  prompt: LocalizedText;
  lowLabel: LocalizedText;
  highLabel: LocalizedText;
}

export interface PersonalModuleDefinition {
  id: PersonalAlignmentModuleId;
  version: string;
  title: LocalizedText;
  description: LocalizedText;
  dimensions: readonly PersonalDimensionDefinition[];
}

export interface PersonalAlignmentAnswer {
  current: PersonalAlignmentValue;
  importance: PersonalAlignmentValue;
}

export type PersonalAlignmentAnswerSet = Readonly<Record<string, PersonalAlignmentAnswer | undefined>>;

export interface PersonalDimensionResult {
  dimensionId: string;
  title: string;
  current: PersonalAlignmentValue;
  importance: PersonalAlignmentValue;
  signal: PersonalAlignmentSignal;
}

export interface PersonalAlignmentResult {
  moduleId: PersonalAlignmentModuleId;
  moduleVersion: string;
  dimensions: readonly PersonalDimensionResult[];
  strongSignals: readonly PersonalDimensionResult[];
  tensions: readonly PersonalDimensionResult[];
  worthExploring: readonly PersonalDimensionResult[];
  nextReflection: string;
}

export interface PersonalRoundSnapshot {
  id: string;
  moduleId: PersonalAlignmentModuleId;
  roundNumber: number;
  completedAt: string;
  result: PersonalAlignmentResult;
}
