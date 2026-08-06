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

export interface DiscoveryMatch {
  item: DiscoveryItem;
  score: number;
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
