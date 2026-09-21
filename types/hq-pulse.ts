export const hqPulseSources = ["writing", "projects", "people", "world-map", "discovery"] as const;
export type HqPulseSource = (typeof hqPulseSources)[number];

export const hqPulseTileSizes = ["featured", "standard", "compact"] as const;
export type HqPulseTileSize = (typeof hqPulseTileSizes)[number];

export const hqPulseSourceClassifications = [
  "EVENT_CAPABLE",
  "CURRENT_STATE_ONLY",
  "NO_ELIGIBLE_DATA",
  "BLOCKED_BY_SOURCE_DATA",
] as const;
export type HqPulseSourceClassification = (typeof hqPulseSourceClassifications)[number];

export type HqPulseProvenance = {
  source: HqPulseSource;
  entityId: string;
  key: string;
};

export interface HqPulseItem {
  id: string;
  source: HqPulseSource;
  type: "publication" | "conversation";
  occurredAt: string;
  title: string;
  summary: string;
  href: string;
  provenance: HqPulseProvenance;
  locationLabel?: string;
  spotlightFormat?: "Career Spotlight" | "Service Spotlight" | "Spotlight Conversation";
}

export interface HqPulseCurrentState {
  id: string;
  source: Exclude<HqPulseSource, "writing" | "people">;
  entityId: string;
  title: string;
  summary: string;
  href: string;
  status?: string;
  template?: "world-map-public-context" | "discovery-available";
}

export const openLoopTypes = [
  "idea",
  "feedback",
  "collaboration",
  "interview",
  "team-up",
  "expertise-help",
] as const;
export type OpenLoopType = (typeof openLoopTypes)[number];

export const openLoopStatuses = ["active", "closed", "archived"] as const;
export type OpenLoopStatus = (typeof openLoopStatuses)[number];

export interface OpenLoop {
  id: string;
  type: OpenLoopType;
  status: OpenLoopStatus;
  title: string;
  context: string;
  order: number;
  publishedAt?: string;
  cta?: { label: string; href: string };
}

export interface HumanPulseEntry {
  id: string;
  label: string;
  text: string;
}

export interface HumanPulseContent {
  rightNow: readonly HumanPulseEntry[];
  onMyMind: HumanPulseEntry | null;
  next: HumanPulseEntry | null;
  openLoops: readonly OpenLoop[];
  updatedAt?: string;
}

export interface HqPulseViewModel {
  human: HumanPulseContent;
  timeline: readonly HqPulseItem[];
  timelineEligibleCount: number;
  timelineLimit: number;
  currentStates: readonly HqPulseCurrentState[];
  sourceClassifications: Readonly<Record<HqPulseSource, HqPulseSourceClassification>>;
}
