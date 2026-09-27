import type { WritingShareFormat } from "@/types/writing";

export type QuoteSocialPostDensity = "short" | "medium" | "long" | "extended";

export type QuoteSocialPostFit = {
  attributionGap: string;
  bodySpacing: string;
  density: QuoteSocialPostDensity;
  fontSize: string;
  lineHeight: number;
  preferredCqw: number;
  scale: "short" | "medium" | "long";
  weightedLength: number;
};

const formatProfile: Record<WritingShareFormat, { baseCqw: number; maxRem: number; comfortableLength: number }> = {
  story: { baseCqw: 8.5, maxRem: 3.55, comfortableLength: 150 },
  portrait: { baseCqw: 7.6, maxRem: 3.15, comfortableLength: 115 },
  square: { baseCqw: 6.8, maxRem: 2.8, comfortableLength: 90 },
};

function quoteLength(text: string): number {
  const normalized = text.normalize("NFC").trim();
  const graphemeLength = typeof Intl.Segmenter === "function"
    ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(normalized)].length
    : Array.from(normalized).length;
  const explicitLineBreaks = normalized.match(/\n+/gu)?.length ?? 0;
  return graphemeLength + explicitLineBreaks * 18;
}

export function quoteSocialPostTextFit(text: string, format: WritingShareFormat): QuoteSocialPostFit {
  const profile = formatProfile[format];
  const weightedLength = quoteLength(text);
  const densityRatio = weightedLength / profile.comfortableLength;
  const sizeFactor = Math.max(0.46, Math.min(1, Math.sqrt(0.72 / Math.max(densityRatio, 0.72))));
  const preferredCqw = Number((profile.baseCqw * sizeFactor).toFixed(2));
  const maximumRem = Number((profile.maxRem * sizeFactor).toFixed(2));
  const lineHeight = Number((1.04 + (1 - sizeFactor) * 0.34).toFixed(3));
  const bodySpacing = `${Math.max(2.75, 6.5 * sizeFactor).toFixed(2)}cqw`;
  const attributionGap = `${Math.max(2, 4.5 * sizeFactor).toFixed(2)}cqw`;
  const density: QuoteSocialPostDensity = densityRatio <= 0.72
    ? "short"
    : densityRatio <= 1.15
      ? "medium"
      : densityRatio <= 2.2 ? "long" : "extended";

  return {
    attributionGap,
    bodySpacing,
    density,
    fontSize: `clamp(0.82rem, ${preferredCqw}cqw, ${maximumRem}rem)`,
    lineHeight,
    preferredCqw,
    scale: density === "short" ? "short" : density === "medium" ? "medium" : "long",
    weightedLength,
  };
}
