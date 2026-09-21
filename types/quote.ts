import type { FynsCharacterId } from "@/data/find-your-next-step-characters";
import type { Locale } from "@/lib/i18n/config";
import type { AlignmentSignal, LifeAlignmentSnapshotGroupId } from "@/types/life-alignment";
import type { PartnerFindingCategory } from "@/types/life-alignment-partner";
import type { RelationshipModuleId, RelationshipResultCategory } from "@/types/life-alignment-relationship";

export type QuoteOrigin = "bts-original" | "public-domain";
export type QuoteStatus = "active" | "draft" | "retired";
export type QuoteSurface = "daily" | "life-alignment" | "fyns";
export type QuoteProduct = "general" | "life-alignment" | "fyns";
export type QuoteTheme =
  | "action"
  | "attention"
  | "belonging"
  | "boundaries"
  | "change"
  | "clarity"
  | "courage"
  | "growth"
  | "meaning"
  | "relationships"
  | "rest"
  | "self-trust";
export type QuoteTone = "gentle" | "grounded" | "challenging" | "hopeful" | "reflective";
export type QuoteMood = "uncertain" | "stretched" | "steady" | "curious" | "ready" | "connected";

export interface QuoteVariant {
  text: string;
  attribution?: string;
  source?: string;
}

export interface QuoteRecord {
  id: `btsq-${string}`;
  variants: Readonly<Record<Locale, QuoteVariant>>;
  origin: QuoteOrigin;
  themes: readonly QuoteTheme[];
  tones: readonly QuoteTone[];
  moods: readonly QuoteMood[];
  products: readonly QuoteProduct[];
  semanticFamily: string;
  dailyEligible: boolean;
  shareEligible: boolean;
  status: QuoteStatus;
  weight?: number;
  activeFrom?: string;
  activeUntil?: string;
  lifeAlignment?: {
    moduleIds?: readonly RelationshipModuleId[];
    snapshotGroups?: readonly LifeAlignmentSnapshotGroupId[];
    signals?: readonly AlignmentSignal[];
    partnerCategories?: readonly PartnerFindingCategory[];
    relationshipCategories?: readonly RelationshipResultCategory[];
  };
  fyns?: {
    journeys?: readonly ("self" | "career" | "idea" | "problem")[];
    characterIds?: readonly FynsCharacterId[];
    dimensions?: readonly string[];
  };
}

export interface QuoteSelectionContext {
  locale: Locale;
  surface: QuoteSurface;
  dateKey?: string;
  seed?: string;
  themes?: readonly QuoteTheme[];
  excludeIds?: readonly string[];
  excludeFamilies?: readonly string[];
  lifeAlignment?: {
    moduleId?: RelationshipModuleId | "self";
    snapshotGroup?: LifeAlignmentSnapshotGroupId;
    signal?: AlignmentSignal;
    partnerCategories?: readonly PartnerFindingCategory[];
    relationshipCategories?: readonly RelationshipResultCategory[];
  };
  fyns?: {
    journey: "self" | "career" | "idea" | "problem";
    characterIds?: readonly FynsCharacterId[];
    dimensions?: readonly string[];
  };
}

export interface SelectedQuote {
  id: QuoteRecord["id"];
  text: string;
  attribution: string;
  source?: string;
  origin: QuoteOrigin;
  themes: readonly QuoteTheme[];
  semanticFamily: string;
  shareEligible: boolean;
  fallbackLevel: "specific" | "product" | "theme" | "general";
  eligibleCount: number;
}
