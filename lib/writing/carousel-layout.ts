import type { WritingLanguage, WritingShareBlock, WritingShareBlockKind, WritingShareComposition, WritingShareFormat } from "@/types/writing";

/**
 * Export-pixel layout contract shared by pagination and the carousel cards.
 * Every value represents a real, reserved zone inside the 1080px export card.
 */
export const carouselLayoutByFormat = {
  story: {
    width: 1080,
    height: 1920,
    safeMargin: 54,
    headerHeight: 84,
    titleMaxHeight: 350,
    bodyWidth: 864,
    bodyHeight: 950,
    footerHeight: 108,
    indicatorWidth: 90,
    titleBodyGap: 48,
    bodyBottomSafety: 120,
  },
  portrait: {
    width: 1080,
    height: 1350,
    safeMargin: 46,
    headerHeight: 84,
    titleMaxHeight: 300,
    bodyWidth: 896,
    bodyHeight: 650,
    footerHeight: 108,
    indicatorWidth: 90,
    titleBodyGap: 44,
    bodyBottomSafety: 96,
  },
  square: {
    width: 1080,
    height: 1080,
    safeMargin: 34,
    headerHeight: 84,
    titleMaxHeight: 260,
    bodyWidth: 930,
    bodyHeight: 440,
    footerHeight: 108,
    indicatorWidth: 90,
    titleBodyGap: 30,
    bodyBottomSafety: 0,
  },
} as const satisfies Record<WritingShareFormat, {
  width: number;
  height: number;
  safeMargin: number;
  headerHeight: number;
  titleMaxHeight: number;
  bodyWidth: number;
  bodyHeight: number;
  footerHeight: number;
  indicatorWidth: number;
  titleBodyGap: number;
  bodyBottomSafety: number;
}>;

/**
 * Export-pixel typography contract used by both the paginator and rendered
 * article cards. Article body sizing must not depend on how much text happens
 * to land on an individual slide.
 */
export const carouselTypographyByComposition = {
  editorial: {
    bodyFontSize: 34, bodyLineHeight: 46, bodyWeight: 520,
    headingFontSize: 40, headingLineHeight: 50, headingWeight: 900,
    blockGap: 24, headingGap: 30, listGap: 14, quoteGap: 26,
  },
  marginNote: {
    bodyFontSize: 32, bodyLineHeight: 44, bodyWeight: 520,
    headingFontSize: 38, headingLineHeight: 48, headingWeight: 900,
    blockGap: 22, headingGap: 28, listGap: 13, quoteGap: 24,
  },
  statement: {
    bodyFontSize: 34, bodyLineHeight: 46, bodyWeight: 520,
    headingFontSize: 40, headingLineHeight: 50, headingWeight: 900,
    blockGap: 24, headingGap: 30, listGap: 14, quoteGap: 26,
  },
  socialPost: {
    bodyFontSize: 34, bodyLineHeight: 47, bodyWeight: 520,
    headingFontSize: 40, headingLineHeight: 50, headingWeight: 900,
    blockGap: 22, headingGap: 28, listGap: 13, quoteGap: 24,
  },
};

export function carouselExportLength(pixels: number): string {
  return `${pixels / 10.8}cqw`;
}

export function carouselListMarkerWidth(block: WritingShareBlock): number {
  return block.listStyle === "ordered" ? Math.max(36, String(block.listNumber ?? 1).length * 22 + 12) : 36;
}

const graphemeSegmenters = new Map<WritingLanguage, Intl.Segmenter>();

function graphemes(value: string, locale: WritingLanguage): string[] {
  if (typeof Intl.Segmenter === "function") {
    let segmenter = graphemeSegmenters.get(locale);
    if (!segmenter) { segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" }); graphemeSegmenters.set(locale, segmenter); }
    return [...segmenter.segment(value)].map(({ segment }) => segment);
  }
  return Array.from(value);
}

function glyphWidth(glyph: string, fontSize: number): number {
  if (/\s/u.test(glyph)) return fontSize * 0.28;
  if (/\p{Extended_Pictographic}/u.test(glyph)) return fontSize;
  if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(glyph)) return fontSize;
  if (/[MW@#%&]/u.test(glyph)) return fontSize * 0.82;
  if (/\p{Lu}/u.test(glyph)) return fontSize * 0.64;
  if (/\p{P}|\p{S}/u.test(glyph)) return fontSize * 0.38;
  return fontSize * 0.53;
}

export function estimatedLineCount(value: string, width: number, fontSize: number, locale: WritingLanguage, measure?: (text: string) => number): number {
  const widths = new Map<string, number>();
  return value.split("\n").reduce((total, line) => {
    let lines = 1;
    let current = 0;
    for (const word of line.match(/\S+/gu) ?? []) {
      let pixels = widths.get(word);
      if (pixels === undefined) { pixels = measure ? measure(word) : graphemes(word, locale).reduce((sum, glyph) => sum + glyphWidth(glyph, fontSize), 0); widths.set(word, pixels); }
      const gap = current ? measure ? measure(" ") : glyphWidth(" ", fontSize) : 0;
      if (current && current + gap + pixels > width) { lines += 1; current = 0; }
      // Match normal word wrapping, with anywhere wrapping for a single long token.
      lines += Math.max(0, Math.ceil(pixels / width) - 1);
      current = current + (current ? gap : 0) + (pixels > width ? pixels % width : pixels);
    }
    return total + lines;
  }, 0);
}

export function carouselTitleFontSize(title: string, locale: WritingLanguage): number {
  return graphemes(title, locale).length > 55 ? 46 : 57;
}

export function estimatedTitleHeight(title: string, format: WritingShareFormat, locale: WritingLanguage): number {
  const layout = carouselLayoutByFormat[format];
  const fontSize = carouselTitleFontSize(title, locale);
  const lineHeight = fontSize * 1.04;
  return Math.min(layout.titleMaxHeight, estimatedLineCount(title, layout.bodyWidth, fontSize, locale) * lineHeight);
}

export const writingSocialPostFontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

/** Reading limits are separate from the protected physical content region. Square keeps its accepted density. */
export const writingSocialPostReadabilityByFormat = {
  story: { maxBodyHeight: 1050, blockGap: 38, highlightGap: 56, maxWords: 90, maxBlocks: 8, paragraphMaxLines: 6, highlightBodyMaxLines: 6, preferredHighlightBodyBlocks: 1 },
  portrait: { maxBodyHeight: 800, blockGap: 30, highlightGap: 44, maxWords: 80, maxBlocks: 7, paragraphMaxLines: 7, highlightBodyMaxLines: 5, preferredHighlightBodyBlocks: 1 },
  square: null,
} as const;

let socialPostMeasureContext: CanvasRenderingContext2D | null | undefined;

function socialPostLineCount(text: string, width: number, fontSize: number, locale: WritingLanguage, weight: number, italic = false, letterSpacing = 0): number {
  // The composer runs in the browser. Measure its real font, including authored
  // bold/italic highlights, rather than assume that every glyph has one width.
  // Retain the deterministic conservative estimate for server rendering/tests.
  if (typeof document === "undefined") return estimatedLineCount(text, width, fontSize, locale);
  socialPostMeasureContext ??= document.createElement("canvas").getContext("2d");
  const context = socialPostMeasureContext;
  if (!context) return estimatedLineCount(text, width, fontSize, locale);
  context.font = `${italic ? "italic " : ""}${weight} ${fontSize}px ${writingSocialPostFontFamily}`;
  return estimatedLineCount(text, width, fontSize, locale, (value) => context.measureText(value).width + graphemes(value, locale).length * letterSpacing);
}

/** Social Post fills the space between fixed identity/footer zones. All values are export pixels. */
export function writingSocialPostLayout(format: WritingShareFormat, slideIndex: number, locale: WritingLanguage, articleTitle = "", article = false) {
  const layout = carouselLayoutByFormat[format];
  const gap = 24;
  // Canvas and surface each contribute one safe margin.
  const inset = layout.safeMargin * 2;
  const titleFontSize = carouselTitleFontSize(articleTitle, locale);
  const titleHeight = article && slideIndex === 0 && articleTitle
    ? socialPostLineCount(articleTitle, layout.bodyWidth, titleFontSize, locale, 950, false, -titleFontSize * 0.025) * titleFontSize * 1.04
    : 0;
  const identityTop = inset;
  const titleTop = identityTop + layout.headerHeight + gap;
  const bodyTop = titleTop + (titleHeight ? titleHeight + gap : 0);
  const footerTop = layout.height - inset - layout.footerHeight;
  const bodyBottom = footerTop - gap;
  const contentHeight = bodyBottom - bodyTop;
  // Thought cards retain their source reference below the semantic body.
  const referenceHeight = !article && articleTitle ? 106 : 0;
  return { gap, inset, identityTop, titleTop, titleHeight, bodyTop, bodyBottom, footerTop, contentHeight, referenceHeight, bodyHeight: contentHeight - referenceHeight, readability: writingSocialPostReadabilityByFormat[format] };
}

export type WritingSocialPostLayout = ReturnType<typeof writingSocialPostLayout>;

export function availableCarouselBodyHeight(format: WritingShareFormat, slideIndex: number, locale: WritingLanguage, articleTitle?: string, article = false, composition: WritingShareComposition = "editorial"): number {
  if (composition === "socialPost") return writingSocialPostLayout(format, slideIndex, locale, articleTitle, article).bodyHeight;
  const layout = carouselLayoutByFormat[format];
  if (!article) return layout.bodyHeight;
  const safeBodyHeight = layout.bodyHeight - layout.bodyBottomSafety;
  if (slideIndex > 0) return safeBodyHeight;
  return Math.max(safeBodyHeight * 0.38, safeBodyHeight - estimatedTitleHeight(articleTitle ?? "", format, locale) - layout.titleBodyGap);
}

export function estimatedBlockLineCount(text: string, kind: WritingShareBlockKind, format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, block?: WritingShareBlock): number {
  const layout = carouselLayoutByFormat[format];
  const typography = carouselTypographyByComposition[composition];
  const heading = kind === "heading";
  const fontSize = heading ? block?.headingLevel === 3 ? typography.bodyFontSize : typography.headingFontSize : typography.bodyFontSize;
  const inset = (block?.depth ?? 0) * 28 + (block?.editorialType ? 52 : kind === "quote" ? 32 : kind === "listItem" ? carouselListMarkerWidth(block ?? { kind, text }) + 12 : 0);
  const width = layout.bodyWidth - inset;
  const weight = heading ? typography.headingWeight : block?.editorialType === "keyThought" ? 700 : block?.editorialType === "shareable" ? 800 : typography.bodyWeight;
  return composition === "socialPost" ? socialPostLineCount(text, width, fontSize, locale, weight, kind === "quote" || block?.editorialType === "pullQuote") : estimatedLineCount(text, width, fontSize, locale);
}

export function estimatedBlockHeight(text: string, kind: WritingShareBlockKind, format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, block?: WritingShareBlock): number {
  const typography = carouselTypographyByComposition[composition];
  const lineHeight = kind === "heading" ? typography.headingLineHeight : typography.bodyLineHeight;
  const dividers = (block?.dividersBefore?.length ?? 0) + (block?.dividersAfter?.length ?? 0);
  const lines = estimatedBlockLineCount(text, kind, format, composition, locale, block);
  return lines * lineHeight + (block?.editorialType ? 48 : 0) + dividers * 42;
}

export function carouselBlockSpacing(kind: WritingShareBlockKind, previousKind: WritingShareBlockKind, composition: WritingShareComposition): number {
  const typography = carouselTypographyByComposition[composition];
  if (kind === "heading") return typography.headingGap;
  if (kind === "quote") return typography.quoteGap;
  if (kind === "listItem" && previousKind === "listItem") return typography.listGap;
  return typography.blockGap;
}

export function writingCarouselBlockSpacing(block: WritingShareBlock, previous: WritingShareBlock, format: WritingShareFormat, composition: WritingShareComposition): number {
  const reading = composition === "socialPost" ? writingSocialPostReadabilityByFormat[format] : null;
  if (!reading) return carouselBlockSpacing(block.kind, previous.kind, composition);
  if (block.editorialType || previous.editorialType) return reading.highlightGap;
  if (block.kind === "listItem" && previous.kind === "listItem") return carouselTypographyByComposition.socialPost.listGap;
  return reading.blockGap;
}

export function estimatedWordWidth(word: string, composition: WritingShareComposition, locale: WritingLanguage): number {
  const fontSize = carouselTypographyByComposition[composition].bodyFontSize;
  return graphemes(word, locale).reduce((total, glyph) => total + glyphWidth(glyph, fontSize), 0);
}
