import {
  availableCarouselBodyHeight,
  carouselLayoutByFormat,
  estimatedBlockHeight,
  estimatedBlockLineCount,
  estimatedWordWidth,
  writingCarouselBlockSpacing,
  writingSocialPostReadabilityByFormat,
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
  separatorBefore: string;
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

type Unit = WritingShareBlock & {
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

function sentences(value: string, locale: WritingLanguage): { text: string; separatorBefore: string }[] {
  const raw = typeof Intl.Segmenter === "function"
    ? [...new Intl.Segmenter(locale, { granularity: "sentence" }).segment(value)].map(({ segment, index }) => ({ segment, index }))
    : [...value.matchAll(/[^.!?。！？]*[.!?。！？]+|[^.!?。！？]+$/gu)].map((match) => ({ segment: match[0], index: match.index }));
  let end = 0;
  return raw.flatMap(({ segment, index }) => {
    const text = segment.trim();
    if (!text) return [];
    const start = index + segment.indexOf(text);
    const separatorBefore = value.slice(end, start);
    end = start + text.length;
    return [{ text, separatorBefore }];
  });
}

function inferredKind(text: string): WritingShareBlockKind {
  if (/^(?:[-*•]|\d+[.)])\s+/u.test(text)) return "listItem";
  if (/^(?:>|[“„«])/u.test(text)) return "quote";
  if (/^#{1,3}\s+/u.test(text)) return "heading";
  return "paragraph";
}

function normalizedBlocks(canonicalText: string, blocks?: readonly WritingShareBlock[]): WritingShareBlock[] {
  if (blocks?.length) {
    const normalized = blocks.map((block) => ({ ...block, text: normalize(block.text) })).filter(({ text }) => Boolean(text));
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
      previous.dividersAfter = unit.dividersAfter;
      continue;
    }
    blocks.push({ ...unit });
  }
  return blocks;
}

function blocksFor(units: readonly Unit[]): WritingCarouselBlock[] {
  return internalBlocksFor(units).map(({ blockIndex, ...block }) => { void blockIndex; return block; });
}

function pageHeight(units: readonly Unit[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage): number {
  return internalBlocksFor(units).reduce((height, block, index, blocks) => height
    + estimatedBlockHeight(block.text, block.kind, format, composition, locale, block)
    + (index > 0 ? writingCarouselBlockSpacing(block, blocks[index - 1], format, composition) : 0), 0);
}

function availableHeight(format: WritingShareFormat, composition: WritingShareComposition, slideIndex: number, locale: WritingLanguage, options: CarouselPaginationOptions): number {
  const physicalHeight = availableCarouselBodyHeight(format, slideIndex, locale, options.articleTitle, options.kind === "article", composition);
  const reading = composition === "socialPost" ? writingSocialPostReadabilityByFormat[format] : null;
  return reading ? Math.min(physicalHeight, reading.maxBodyHeight) : physicalHeight;
}

function blocksFitReadability(blocks: readonly WritingShareBlock[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage): boolean {
  const reading = composition === "socialPost" ? writingSocialPostReadabilityByFormat[format] : null;
  if (!reading) return true;
  if (blocks.length > reading.maxBlocks || blocks.reduce((words, block) => words + (block.text.match(/\S+/gu)?.length ?? 0), 0) > reading.maxWords) return false;
  // Authored line breaks already interrupt a text wall; cap uninterrupted wrapped runs.
  if (blocks.some((block) => block.kind === "paragraph" && !block.editorialType && block.text.split("\n").some((line) => estimatedBlockLineCount(line, block.kind, format, composition, locale, block) > reading.paragraphMaxLines))) return false;
  const highlights = blocks.filter((block) => block.editorialType);
  if (highlights.length > 1) return false;
  if (!highlights.length) return true;
  const ordinary = blocks.filter((block) => !block.editorialType && block.kind !== "heading");
  const highlightIndex = blocks.findIndex((block) => block.editorialType);
  const before = blocks.slice(0, highlightIndex).some((block) => !block.editorialType && block.kind !== "heading");
  const after = blocks.slice(highlightIndex + 1).some((block) => !block.editorialType && block.kind !== "heading");
  // Context may precede OR follow a highlight; never surround it with body copy.
  return !(before && after)
    && ordinary.reduce((lines, block) => lines + estimatedBlockLineCount(block.text, block.kind, format, composition, locale, block), 0) <= reading.highlightBodyMaxLines;
}

function pageFits(units: readonly Unit[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, slideIndex: number, options: CarouselPaginationOptions): boolean {
  return pageHeight(units, format, composition, locale) <= availableHeight(format, composition, slideIndex, locale, options)
    && blocksFitReadability(internalBlocksFor(units), format, composition, locale);
}

function textFitsEmptyPage(text: string, block: WritingShareBlock, format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions): boolean {
  return estimatedBlockHeight(text, block.kind, format, composition, locale, block) <= Math.min(availableHeight(format, composition, 0, locale, options), availableHeight(format, composition, 1, locale, options))
    && blocksFitReadability([{ ...block, text }], format, composition, locale);
}

function containsOversizedWord(text: string, format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage): boolean {
  return (text.match(/\S+/gu) ?? []).some((word) => estimatedWordWidth(word, composition, locale) > carouselLayoutByFormat[format].bodyWidth);
}

function splitByWords(sentence: string, blockIndex: number, block: WritingShareBlock, separatorBefore: Unit["separatorBefore"], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions) {
  const units: Unit[] = [];
  let current = "";
  let separator = separatorBefore;
  let oversizedWord = false;
  const flush = () => {
    if (!current) return;
    units.push({ ...block, blockIndex, separatorBefore: separator, text: current });
    current = "";
  };
  let end = 0;
  for (const match of sentence.matchAll(/\S+/gu)) {
    const word = match[0];
    const gap = sentence.slice(end, match.index);
    end = match.index + word.length;
    if (estimatedWordWidth(word, composition, locale) > carouselLayoutByFormat[format].bodyWidth) {
      flush();
      oversizedWord = true;
      units.push({ ...block, blockIndex, separatorBefore: units.length ? gap : separator, text: word });
      continue;
    }
    if (!current && units.length) separator = gap;
    const candidate = current ? `${current}${gap}${word}` : word;
    if (textFitsEmptyPage(candidate, block, format, composition, locale, options)) current = candidate;
    else { flush(); separator = gap; current = word; }
  }
  flush();
  return { oversizedWord, units };
}

function unitsForBlock(block: WritingShareBlock, blockIndex: number, separatorBefore: Unit["separatorBefore"], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions) {
  // Keep authored paragraphs whole within Story/Feed reading budgets. Square
  // retains its accepted sentence packing; oversized blocks still split losslessly.
  const sentencePacking = composition === "socialPost" && format === "square" && block.kind === "paragraph" && !block.editorialType;
  if (!sentencePacking && !containsOversizedWord(block.text, format, composition, locale) && textFitsEmptyPage(block.text, block, format, composition, locale, options)) {
    return { oversizedWord: false, units: [{ ...block, blockIndex, separatorBefore }] satisfies Unit[] };
  }
  const units: Unit[] = [];
  let oversizedWord = false;
  sentences(block.text, locale).forEach(({ text: sentence, separatorBefore: gap }, index) => {
    const separator = index === 0 ? separatorBefore : gap;
    if (!containsOversizedWord(sentence, format, composition, locale) && textFitsEmptyPage(sentence, block, format, composition, locale, options)) units.push({ ...block, blockIndex, separatorBefore: separator, text: sentence });
    else {
      const split = splitByWords(sentence, blockIndex, block, separator, format, composition, locale, options);
      oversizedWord ||= split.oversizedWord;
      units.push(...split.units);
    }
  });
  units.forEach((unit, index) => {
    if (index > 0) { delete unit.dividersBefore; unit.continuation = true; }
    if (index < units.length - 1) delete unit.dividersAfter;
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

/** Choose boundaries within reading limits without stranding tiny body-only pages around highlights. */
function paginateReadingPages(units: readonly Unit[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions): Page[] {
  const reading = writingSocialPostReadabilityByFormat[format];
  if (!reading) return paginate(units, format, composition, locale, options);
  type Choice = { pages: Page[]; penalty: number };
  const choices: (Choice | undefined)[] = Array(units.length + 1);
  choices[units.length] = { pages: [], penalty: 0 };
  for (let start = units.length - 1; start >= 0; start -= 1) {
    const candidate: Unit[] = [];
    for (let end = start; end < units.length; end += 1) {
      candidate.push(units[end]);
      const slideIndex = start === 0 ? 0 : 1;
      if (!pageFits(candidate, format, composition, locale, slideIndex, options)) break;
      // Keep a heading with its following content, as in the existing paginator.
      if (units[end].kind === "heading" && end < units.length - 1) continue;
      const tail = choices[end + 1];
      if (!tail) continue;
      const blocks = internalBlocksFor(candidate);
      const highlight = blocks.some((block) => block.editorialType);
      const ordinaryCount = blocks.filter((block) => !block.editorialType && block.kind !== "heading").length;
      const fill = pageHeight(candidate, format, composition, locale) / availableHeight(format, composition, slideIndex, locale, options);
      const penalty = tail.penalty + (highlight ? ordinaryCount === 0 ? 0.15 : Math.max(0, ordinaryCount - reading.preferredHighlightBodyBlocks) : (1 - fill) ** 2 * (end === units.length - 1 ? 0.25 : 1));
      const pages = [{ units: [...candidate] }, ...tail.pages];
      const best = choices[start];
      if (!best || pages.length < best.pages.length || (pages.length === best.pages.length && penalty < best.penalty - 0.0001)) choices[start] = { pages, penalty };
    }
  }
  // An oversized authored heading/next-block pair may not fit together even
  // though each unit fits safely. Preserve the existing per-unit fallback.
  return choices[0]?.pages ?? paginate(units, format, composition, locale, options);
}

function balance(pages: Page[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, options: CarouselPaginationOptions): Page[] {
  for (let sweep = 0; sweep < 2; sweep += 1) {
    for (let rightIndex = pages.length - 1; rightIndex > 0; rightIndex -= 1) {
      const leftIndex = rightIndex - 1;
      const combined = [...pages[leftIndex].units, ...pages[rightIndex].units];
      let bestBoundary = pages[leftIndex].units.length;
      const score = (left: Unit[], right: Unit[]) => {
        const leftFill = pageHeight(left, format, composition, locale) / availableHeight(format, composition, leftIndex, locale, options);
        const rightFill = pageHeight(right, format, composition, locale) / availableHeight(format, composition, rightIndex, locale, options);
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
    + estimatedBlockHeight(block.text, block.kind, format, composition, locale, block)
    + (index > 0 ? writingCarouselBlockSpacing(block, blocks[index - 1], format, composition) : 0), 0);
}

export function writingCarouselSegmentFits(blocks: readonly WritingCarouselBlock[], format: WritingShareFormat, composition: WritingShareComposition, locale: WritingLanguage, slideIndex: number, options: CarouselPaginationOptions): boolean {
  return estimatedCarouselBlocksHeight(blocks, format, composition, locale) <= availableHeight(format, composition, slideIndex, locale, options)
    && blocksFitReadability(blocks, format, composition, locale);
}

export function writingShareCapacity(format: WritingShareFormat, variant: WritingShareComposition): number {
  return availableHeight(format, variant, 1, "en", {});
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
  const maxSlides = options.maxSlides ?? defaultMaxSlides;
  if (availableHeight(format, composition, 0, locale, options) <= 0) return { status: "tooLong", canonicalText, maxSlides, requiredSlides: null, segments: [] };
  const units: Unit[] = [];
  let oversizedWord = false;
  normalizedBlocks(canonicalText, options.blocks).forEach((block, index) => {
    const split = unitsForBlock(block, index, index === 0 ? "" : "\n\n", format, composition, locale, options);
    oversizedWord ||= split.oversizedWord;
    units.push(...split.units);
  });
  if (oversizedWord) return { status: "tooLong", canonicalText, maxSlides, requiredSlides: null, segments: [] };
  const packed = composition === "socialPost" && writingSocialPostReadabilityByFormat[format]
    ? paginateReadingPages(units, format, composition, locale, options)
    : paginate(units, format, composition, locale, options);
  // Social Post uses full top-aligned content regions; equalising adjacent pages
  // introduces avoidable whitespace. Keep Editorial's existing balancing.
  const pages = enforceFinalFit(composition === "socialPost" ? packed : balance(packed, format, composition, locale, options), format, composition, locale, options);
  if (pages.length > maxSlides) return { status: "tooLong", canonicalText, maxSlides, requiredSlides: pages.length, segments: [] };
  const segments = pages.map((page) => ({ separatorBefore: page.units[0]?.separatorBefore ?? "", text: textFor(page.units), blocks: blocksFor(page.units) }));
  if (!writingCarouselIsComplete(canonicalText, segments)) throw new Error("Writing carousel completeness invariant failed.");
  return { status: "ready", canonicalText, segments };
}
