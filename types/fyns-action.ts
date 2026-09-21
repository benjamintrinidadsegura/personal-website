import type { FynsCharacterId } from "@/data/find-your-next-step-characters";
import type { Locale } from "@/lib/i18n/config";
import type { SelfReflectionDimensionId } from "@/types/find-your-next-step";

export type FynsActionJourney = "self" | "career" | "problem" | "idea";
export type FynsActionKind = "reflection" | "experiment" | "conversation" | "decision" | "environment" | "boundary" | "practice" | "exploration" | "stretch";
export type FynsActionHorizon = "now" | "this-week" | "explore" | "stretch" | "reflect";
export type FynsActionState = "not-started" | "trying" | "reflected";

export interface FynsActionVariant {
  title: string;
  body: string;
  reflection: string;
}

export interface FynsActionRecord {
  id: `fynsa-${string}`;
  variants: Readonly<Record<Locale, FynsActionVariant>>;
  kind: FynsActionKind;
  horizon: FynsActionHorizon;
  semanticFamily: string;
  priority: number;
  characterIds?: readonly FynsCharacterId[];
  dimensions?: readonly SelfReflectionDimensionId[];
  characterPairs?: readonly string[];
  journeys?: readonly FynsActionJourney[];
  resultSignals?: readonly string[];
  tensionOnly?: boolean;
  safeGeneral?: boolean;
}

export interface FynsActionContext {
  locale: Locale;
  journey: FynsActionJourney;
  seed?: string;
  characterIds?: readonly FynsCharacterId[];
  dimensions?: readonly SelfReflectionDimensionId[];
  tensionIds?: readonly string[];
  resultSignals?: readonly string[];
  excludeIds?: readonly string[];
  excludeFamilies?: readonly string[];
  unsupported?: boolean;
}

export interface SelectedFynsAction extends FynsActionVariant {
  id: FynsActionRecord["id"];
  kind: FynsActionKind;
  horizon: FynsActionHorizon;
  semanticFamily: string;
  fallbackLevel: "constellation" | "character" | "dimension" | "result" | "journey" | "general";
  eligibleCount: number;
}
