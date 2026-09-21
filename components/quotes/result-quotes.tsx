"use client";

import { QuoteExperience } from "@/components/quotes/quote-experience";
import type { FynsCharacterConstellation } from "@/lib/find-your-next-step-constellation";
import type { LifeAlignmentResult } from "@/types/life-alignment";
import type { PartnerComparisonResult } from "@/types/life-alignment-partner";
import type { RelationshipModuleId, RelationshipSoloResult, RelationshipSharedResult } from "@/types/life-alignment-relationship";
import type { QuoteTheme } from "@/types/quote";

function lifeThemes(result: LifeAlignmentResult): readonly QuoteTheme[] {
  if (result.focus.signal === "supportive" || result.focus.signal === "steady" || result.focus.signal === "accepted") return ["self-trust", "rest"];
  if (result.focus.signal === "constrained") return ["boundaries", "change"];
  if (result.focus.signal === "tension") return ["change", "courage"];
  return ["clarity", "self-trust"];
}

export function LifeAlignmentResultQuote({ result }: { result: LifeAlignmentResult }) {
  const snapshotGroup = result.snapshot.find(({ areas }) => areas.some(({ id }) => id === result.focus.id))?.id;
  return <QuoteExperience context={{ surface: "life-alignment", themes: lifeThemes(result), lifeAlignment: { moduleId: "self", signal: result.focus.signal, snapshotGroup } }} safeSharePath="/life-alignment/self" />;
}

export function PartnerResultQuote({ result }: { result: PartnerComparisonResult }) {
  return <QuoteExperience context={{ surface: "life-alignment", themes: ["relationships", "clarity"], lifeAlignment: { moduleId: "partner", partnerCategories: result.findings.map(({ category }) => category) } }} safeSharePath="/life-alignment/partner" />;
}

export function RelationshipResultQuote({ moduleId, result }: { moduleId: RelationshipModuleId; result: RelationshipSoloResult | RelationshipSharedResult }) {
  const relationshipCategories = result.kind === "shared" ? result.insights.map(({ category }) => category) : undefined;
  return <QuoteExperience context={{ surface: "life-alignment", themes: ["relationships", "belonging"], lifeAlignment: { moduleId, relationshipCategories } }} safeSharePath={`/life-alignment/${moduleId}`} />;
}

export function FynsCharacterResultQuote({ constellation }: { constellation: FynsCharacterConstellation }) {
  return <QuoteExperience context={{ surface: "fyns", themes: ["self-trust", "growth"], fyns: { journey: "self", characterIds: [constellation.dominant, ...constellation.supporting].map(({ id }) => id), dimensions: [constellation.dominant, ...constellation.supporting].map(({ sourceDimension }) => sourceDimension) } }} safeSharePath="/find-your-next-step/self" variant="fyns" />;
}
