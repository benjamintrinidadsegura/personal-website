export type DiscoveryGroup = "Projects" | "Insights" | "Tools" | "People" | "Pages";

export type DiscoveryStatus = "Live" | "Beta" | "In Development" | "Coming Soon";

/**
 * Reserved semantic dimensions for later Discovery Engine versions.
 * Discovery Engine v1 deliberately does not search these fields yet.
 */
export interface DiscoveryDimensions {
  intent?: string[];
  goals?: string[];
  problems?: string[];
  useCases?: string[];
  habitats?: string[];
  personality?: string[];
}

export interface DiscoveryItem {
  id: string;
  group: DiscoveryGroup;
  title: string;
  description: string;
  category: string;
  tags: string[];
  keywords: string[];
  status: DiscoveryStatus;
  /** Only set when the destination is known to exist. */
  href?: string;
  dimensions?: DiscoveryDimensions;
}

export type ActiveDiscoveryDimension = "intent" | "goals" | "problems" | "useCases";

export type DiscoveryMatchSource =
  | "title"
  | "category"
  | "tag"
  | "keyword"
  | ActiveDiscoveryDimension
  | "description";

export type DiscoveryMatchKind = "direct" | "synonym" | "relationship";

export type DiscoveryReasonLabel = "Passt zu" | "Gefunden über" | "Relevant für";

export interface DiscoveryMatchReason {
  source: DiscoveryMatchSource;
  /** The complete, original value of the field that matched. */
  value: string;
  /** The query, synonym, or relationship term found in the source value. */
  matchedTerm: string;
  kind: DiscoveryMatchKind;
  label: DiscoveryReasonLabel;
  /** Short, engine-owned copy that presentation components may render directly. */
  displayValue: string;
}

export interface DiscoveryMatch {
  item: DiscoveryItem;
  score: number;
  reasons: DiscoveryMatchReason[];
}

export interface DiscoverySynonymAlias {
  value: string;
  match: "token" | "phrase" | "whole-query";
}

export interface DiscoverySynonymGroup {
  id: string;
  canonical: string;
  aliases: DiscoverySynonymAlias[];
}

export interface DiscoveryRelationship {
  id: string;
  query: string;
  terms: string[];
}

export interface GuidedDiscoveryPrompt {
  id: string;
  label: string;
  query: string;
}

export interface AdaptiveDiscoveryGroup {
  group: DiscoveryGroup;
  matches: DiscoveryMatch[];
  remainingCount: number;
}

export interface AdaptiveDiscoveryView {
  topMatch: DiscoveryMatch | null;
  groups: AdaptiveDiscoveryGroup[];
}
