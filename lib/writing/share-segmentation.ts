import type { WritingLanguage, WritingShareComposition, WritingShareFormat } from "@/types/writing";

export const MAX_WRITING_SHARE_CARDS = 4;

export type WritingThoughtSegment = {
  separatorBefore: "" | " " | "\n\n";
  text: string;
};

export type WritingSegmentationResult =
  | { status: "ready"; canonicalText: string; segments: WritingThoughtSegment[] }
  | { status: "empty" | "tooLong"; canonicalText: string; segments: [] };

const capacityByFormat: Record<WritingShareFormat, Record<WritingShareComposition, number>> = {
  story: { editorial: 360, marginNote: 310, statement: 260, socialPost: 320 },
  portrait: { editorial: 170, marginNote: 150, statement: 120, socialPost: 160 },
  square: { editorial: 150, marginNote: 130, statement: 100, socialPost: 125 },
};

export function normalizeWritingThought(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\r\n?/gu, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/[\t ]+/gu, " "))
    .join("\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function graphemes(value: string, locale: WritingLanguage): string[] {
  if (typeof Intl.Segmenter === "function") {
    return [...new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(value)].map(({ segment }) => segment);
  }
  return Array.from(value);
}

function lengthOf(value: string, locale: WritingLanguage): number {
  return graphemes(value, locale).length;
}

function sentenceParts(value: string, locale: WritingLanguage): string[] {
  if (typeof Intl.Segmenter === "function") {
    return [...new Intl.Segmenter(locale, { granularity: "sentence" }).segment(value)]
      .map(({ segment }) => segment.trim())
      .filter(Boolean);
  }
  return value.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/gu)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [value];
}

type Unit = WritingThoughtSegment;

function splitOversizedSentence(sentence: string, separatorBefore: Unit["separatorBefore"], capacity: number, locale: WritingLanguage): Unit[] {
  const words = sentence.match(/\S+/gu) ?? [];
  const units: Unit[] = [];
  let current = "";
  let firstSeparator = separatorBefore;

  const flush = () => {
    if (!current) return;
    units.push({ separatorBefore: firstSeparator, text: current });
    current = "";
    firstSeparator = " ";
  };

  for (const word of words) {
    if (lengthOf(word, locale) > capacity) {
      flush();
      const clusters = graphemes(word, locale);
      for (let index = 0; index < clusters.length; index += capacity) {
        units.push({ separatorBefore: firstSeparator, text: clusters.slice(index, index + capacity).join("") });
        firstSeparator = "";
      }
      firstSeparator = " ";
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (lengthOf(candidate, locale) <= capacity) current = candidate;
    else {
      flush();
      current = word;
    }
  }
  flush();
  return units;
}

function thoughtUnits(canonicalText: string, capacity: number, locale: WritingLanguage): Unit[] {
  const units: Unit[] = [];
  const paragraphs = canonicalText.split(/\n{2}/u);
  paragraphs.forEach((paragraph, paragraphIndex) => {
    sentenceParts(paragraph, locale).forEach((sentence, sentenceIndex) => {
      const separatorBefore: Unit["separatorBefore"] = paragraphIndex === 0 && sentenceIndex === 0
        ? ""
        : sentenceIndex === 0 ? "\n\n" : " ";
      if (lengthOf(sentence, locale) <= capacity) units.push({ separatorBefore, text: sentence });
      else units.push(...splitOversizedSentence(sentence, separatorBefore, capacity, locale));
    });
  });
  return units;
}

export function segmentWritingThought(
  value: string,
  format: WritingShareFormat,
  variant: WritingShareComposition,
  locale: WritingLanguage,
): WritingSegmentationResult {
  const canonicalText = normalizeWritingThought(value);
  if (!canonicalText) return { status: "empty", canonicalText, segments: [] };
  const capacity = capacityByFormat[format][variant];
  const units = thoughtUnits(canonicalText, capacity, locale);
  const segments: WritingThoughtSegment[] = [];
  let current: WritingThoughtSegment | null = null;

  for (const unit of units) {
    const candidate = current ? `${current.text}${unit.separatorBefore}${unit.text}` : unit.text;
    if (current && lengthOf(candidate, locale) <= capacity) {
      current.text = candidate;
      continue;
    }
    if (current) segments.push(current);
    current = { separatorBefore: unit.separatorBefore, text: unit.text };
    if (segments.length >= MAX_WRITING_SHARE_CARDS) return { status: "tooLong", canonicalText, segments: [] };
  }
  if (current) segments.push(current);
  if (segments.length > MAX_WRITING_SHARE_CARDS) return { status: "tooLong", canonicalText, segments: [] };
  return { status: "ready", canonicalText, segments };
}

export function reconstructWritingThought(segments: WritingThoughtSegment[]): string {
  return segments.map((segment) => `${segment.separatorBefore}${segment.text}`).join("");
}

export function writingShareTextScale(text: string, variant: WritingShareComposition, locale: WritingLanguage): "short" | "medium" | "long" {
  const length = lengthOf(text, locale);
  const shortBoundary = variant === "statement" ? 70 : 100;
  const longBoundary = variant === "statement" ? 190 : 300;
  return length <= shortBoundary ? "short" : length >= longBoundary ? "long" : "medium";
}
