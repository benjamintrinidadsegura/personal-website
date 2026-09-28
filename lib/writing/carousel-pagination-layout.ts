import {
  availableCarouselBodyHeight,
  carouselBlockSpacing,
  carouselLayoutByFormat,
  estimatedBlockHeight,
  estimatedWordWidth,
} from "@/lib/writing/carousel-layout";
import type {
  WritingCarouselBlock,
  WritingLanguage,
  WritingShareBlock,
  WritingShareBlockKind,
  WritingShareComposition,
  WritingShareFormat,
} from "@/types/writing";

export type CarouselSegment = {
  separatorBefore: "" | " " | "\n\n";
  text: string;
  blocks: WritingCarouselBlock[];
};
export type CarouselPaginationOptions = {
  articleTitle?: string;
  blocks?: readonly WritingShareBlock[];
  kind?: "article" | "thought";
  maxSlides?: number;
};
export type CarouselPaginationResult =
  | { status: "ready"; canonicalText: string; segments: CarouselSegment[] }
  | { status: "empty"; canonicalText: string; segments: [] }
  | { status: "tooLong"; canonicalText: string; maxSlides: number; requiredSlides: number | null; segments: [] };

type Unit = {
  blockIndex: number;
  kind: WritingShareBlockKind;
  separatorBefore: CarouselSegment["separatorBefore"];
  text: string;
};
type Page = { units: Unit[] };
type InternalBlock = WritingCarouselBlock & { blockIndex: number };

function normalize(value: string): string {
  return value.normalize("NFC").replace(/\r\n?/gu, "\n").split("\n").map((line) => line.trim().replace(/[\t ]+/gu, " ")).join("\n").replace(/\n{3,}/gu, "\n\n").trim();
}

function sentences(value: string, locale: WritingLanguage): string[] {
  if (typeof Intl.Segmenter === "function") return [...new Intl.Segmenter(locale, { granularity: "sentence" }).segment(value)].map(({ segment }) => segment.trim()).filter(Boolean);
  return value.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/gu)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [value];
}

function inferredKind(text: string): WritingShareBlockKind {
  if (/^(?:[-*•]|\d+[.)])\s+/u.test(text)) return "listItem";
  if (/^(?:>|[“„«])/u.test(text)) return "quote";
  if (/^#{1,3}\s+/u.test(text)) return "heading";
  return "paragraph";
}

function normalizedBlocks(canonicalText: string, blocks?: readonly WritingShareBlock[]): WritingShareBlock[] {
  if (blocks?.length) {
    const normalized = blocks.map(({ kind, text }) => ({ kind, text: normalize(text) })).filter(({ text }) => Boolean(text));
    if (normalized.map(({ text }) => text).join("\n\n") === canonicalText) return normalized;
  }
  return canonicalText.split(/\n{2}/u).map((text) => ({ kind: inferredKind(text), text }));
}

function textFor(units: readonly Unit[]): string {
  return units.map((unit, index) => `${index === 0 ? "" : unit.separatorBefore}${unit.text}`).join("");
}

function internalBlocksFor(units: readonly Unit[]): InternalBlock[] {
  const blocks: InternalBlock[] = [];
  for (const unit of units) {
    const previous = blocks.at(-1);
    if (previous?.blockIndex === unit.blockIndex) {
      previous.text += `${unit.separatorBefore}${unit.text}`;
      continue;
    }
    blocks.push({ blockIndex: unit.blockIndex, kind: unit.kind, separatorBefore: unit.separatorBefore, text: unit.text });
  }
  return blocks;
}

function blocksFor(units: readonly Unit[]): WritingCarouselBlock[] {
  return internalBlocksFor(units).map(({ kind, separatorBefore, text }) => ({ kind, separatorBefore, text }));
}

function pageHeight(units: readonly Unit[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage): number {
  return internalBlocksFor(units).reduce((height, block, index, blocks) => height
    + estimatedBlockHeight(block.text, block.kind, format, composition, locale)
    + (index > 0 ? carouselBlockSpacing(block.kind, blocks[index - 1].kind, composition) : 0), 0);
}

function availableHeight(format: WritingShareFormat, slideIndex: number, locale: WritingLanguage, options: CarouselPaginationOptions): number {
  return availableCarouselBodyHeight(format, slideIndex, locale, options.articleTitle, options.kind === "article");
}

function pageFits(units: readonly Unit[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, slideIndex: number, options: CarouselPaginationOptions): boolean {
  return pageHeight(units, format, composition, locale) <= availableHeight(format, slideIndex, locale, options);
}

function textFitsEmptyPage(text: string, kind: WritingShareBlockKind, format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions): boolean {
  return estimatedBlockHeight(text, kind, format, composition, locale) <= Math.min(availableHeight(format, 0, locale, options), availableHeight(format, 1, locale, options));
}

function containsOversizedWord(text: string, format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage): boolean {
  return (text.match(/\S+/gu) ?? []).some((word) => estimatedWordWidth(word, composition, locale) > carouselLayoutByFormat[format].bodyWidth);
}

function splitByWords(sentence: string, blockIndex: number, kind: WritingShareBlockKind, separatorBefore: Unit["separatorBefore"], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions) {
  const units: Unit[] = [];
  let current = "";
  let separator = separatorBefore;
  let oversizedWord = false;
  const flush = () => {
    if (!current) return;
    units.push({ blockIndex, kind, separatorBefore: separator, text: current });
    current = "";
    separator = " ";
  };
  for (const word of sentence.match(/\S+/gu) ?? []) {
    if (estimatedWordWidth(word, composition, locale) > carouselLayoutByFormat[format].bodyWidth) {
      flush();
      oversizedWord = true;
      units.push({ blockIndex, kind, separatorBefore: separator, text: word });
      separator = " ";
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (textFitsEmptyPage(candidate, kind, format, composition, locale, options)) current = candidate;
    else { flush(); current = word; }
  }
  flush();
  return { oversizedWord, units };
}

function unitsForBlock(block: WritingShareBlock, blockIndex: number, separatorBefore: Unit["separatorBefore"], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions) {
  if (!containsOversizedWord(block.text, format, composition, locale) && textFitsEmptyPage(block.text, block.kind, format, composition, locale, options)) {
    return { oversizedWord: false, units: [{ blockIndex, kind: block.kind, separatorBefore, text: block.text }] satisfies Unit[] };
  }
  const units: Unit[] = [];
  let oversizedWord = false;
  sentences(block.text, locale).forEach((sentence, index) => {
    const separator = index === 0 ? separatorBefore : " ";
    if (!containsOversizedWord(sentence, format, composition, locale) && textFitsEmptyPage(sentence, block.kind, format, composition, locale, options)) units.push({ blockIndex, kind: block.kind, separatorBefore: separator, text: sentence });
    else {
      const split = splitByWords(sentence, blockIndex, block.kind, separator, format, composition, locale, options);
      oversizedWord ||= split.oversizedWord;
      units.push(...split.units);
    }
  });
  return { oversizedWord, units };
}

function paginate(units: readonly Unit[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions): Page[] {
  const pages: Page[] = [];
  let current: Unit[] = [];
  const push = () => { if (current.length) pages.push({ units: current }); current = []; };
  for (const unit of units) {
    if (pageFits([...current, unit], format, composition, locale, pages.length, options)) { current.push(unit); continue; }
    if (current.at(-1)?.kind === "heading" && current.length > 1) {
      const heading = current.pop();
      push();
      if (heading) current.push(heading);
      if (pageFits([...current, unit], format, composition, locale, pages.length, options)) { current.push(unit); continue; }
    }
    push();
    current.push(unit);
  }
  push();
  return pages;
}

function balance(pages: Page[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions): Page[] {
  for (let sweep = 0; sweep < 2; sweep += 1) {
    for (let rightIndex = pages.length - 1; rightIndex > 0; rightIndex -= 1) {
      const leftIndex = rightIndex - 1;
      const combined = [...pages[leftIndex].units, ...pages[rightIndex].units];
      let bestBoundary = pages[leftIndex].units.length;
      const score = (left: Unit[], right: Unit[]) => {
        const leftFill = pageHeight(left, format, composition, locale) / availableHeight(format, leftIndex, locale, options);
        const rightFill = pageHeight(right, format, composition, locale) / availableHeight(format, rightIndex, locale, options);
        return Math.abs(leftFill - rightFill) + (right.length === 1 && rightFill < 0.3 ? 0.8 : 0) + (left.at(-1)?.kind === "heading" ? 1.5 : 0);
      };
      let bestScore = score(pages[leftIndex].units, pages[rightIndex].units);
      for (let boundary = 1; boundary < combined.length; boundary += 1) {
        const left = combined.slice(0, boundary);
        const right = combined.slice(boundary);
        if (!pageFits(left, format, composition, locale, leftIndex, options) || !pageFits(right, format, composition, locale, rightIndex, options)) continue;
        const candidateScore = score(left, right);
        if (candidateScore + 0.05 < bestScore) { bestBoundary = boundary; bestScore = candidateScore; }
      }
      pages[leftIndex] = { units: combined.slice(0, bestBoundary) };
      pages[rightIndex] = { units: combined.slice(bestBoundary) };
    }
  }
  return pages;
}

/**
 * A final deterministic fit guard. Balancing is allowed to improve page
 * rhythm, but no balanced page is accepted until its semantic blocks fit the
 * exact body zone used by the renderer. Overflowing tail units move forward
 * and are measured again at their new slide index.
 */
function enforceFinalFit(pages: Page[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions): Page[] {
  const guarded = pages.map(({ units }) => ({ units: [...units] }));
  for (let index = 0; index < guarded.length; index += 1) {
    while (!pageFits(guarded[index].units, format, composition, locale, index, options)) {
      if (guarded[index].units.length <= 1) throw new Error("Writing carousel unit exceeds the renderable body zone.");
      const moved = guarded[index].units.pop();
      if (!moved) break;
      if (guarded[index + 1]) guarded[index + 1].units.unshift(moved);
      else guarded.push({ units: [moved] });
    }
  }
  return guarded;
}

export function estimatedCarouselBlocksHeight(blocks: readonly WritingCarouselBlock[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage): number {
  return blocks.reduce((height, block, index) => height
    + estimatedBlockHeight(block.text, block.kind, format, composition, locale)
    + (index > 0 ? carouselBlockSpacing(block.kind, blocks[index - 1].kind, composition) : 0), 0);
}

export function writingCarouselSegmentFits(blocks: readonly WritingCarouselBlock[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, slideIndex: number, options: CarouselPaginationOptions): boolean {
  return estimatedCarouselBlocksHeight(blocks, format, composition, locale) <= availableHeight(format, slideIndex, locale, options);
}

export function writingShareCapacity(format: WritingShareFormat, variant: WritingShareComposition): number {
  void variant;
  return carouselLayoutByFormat[format].bodyHeight;
}

export function reconstructCarousel(segments: readonly CarouselSegment[]): string {
  return segments.map((segment) => `${segment.separatorBefore}${segment.text}`).join("");
}

export function writingCarouselIsComplete(canonicalText: string, segments: readonly CarouselSegment[]): boolean {
  return reconstructCarousel(segments) === canonicalText;
}

export function paginateWritingCarousel(value: string, format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions, defaultMaxSlides: number): CarouselPaginationResult {
  const canonicalText = normalize(value);
  if (!canonicalText) return { status: "empty", canonicalText, segments: [] };
  const units: Unit[] = [];
  let oversizedWord = false;
  normalizedBlocks(canonicalText, options.blocks).forEach((block, index) => {
    const split = unitsForBlock(block, index, index === 0 ? "" : "\n\n", format, composition, locale, options);
    oversizedWord ||= split.oversizedWord;
    units.push(...split.units);
  });
  const maxSlides = options.maxSlides ?? defaultMaxSlides;
  if (oversizedWord) return { status: "tooLong", canonicalText, maxSlides, requiredSlides: null, segments: [] };
  const pages = enforceFinalFit(balance(paginate(units, format, composition, locale, options), format, composition, locale, options), format, composition, locale, options);
  if (pages.length > maxSlides) return { status: "tooLong", canonicalText, maxSlides, requiredSlides: pages.length, segments: [] };
  const segments = pages.map((page) => ({ separatorBefore: page.units[0]?.separatorBefore ?? "", text: textFor(page.units), blocks: blocksFor(page.units) }));
  if (!writingCarouselIsComplete(canonicalText, segments)) throw new Error("Writing carousel completeness invariant failed.");
  return { status: "ready", canonicalText, segments };
}
