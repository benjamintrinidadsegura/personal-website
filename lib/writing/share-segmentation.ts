import { paginateWritingCarousel } from "@/lib/writing/carousel-pagination";
import type { CarouselPaginationOptions, CarouselSegment } from "@/lib/writing/carousel-pagination";
import type { WritingLanguage, WritingShareComposition, WritingShareFormat } from "@/types/writing";

export { writingCarouselIsComplete, writingShareCapacity } from "@/lib/writing/carousel-pagination";

export const MAX_WRITING_SHARE_CARDS = 50;

export type WritingThoughtSegment = CarouselSegment;

export type WritingSegmentationResult =
  | { status: "ready"; canonicalText: string; segments: WritingThoughtSegment[] }
  | { status: "empty"; canonicalText: string; segments: [] }
  | { status: "tooLong"; canonicalText: string; maxSlides: number; requiredSlides: number | null; segments: [] };

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

export function segmentWritingThought(
  value: string,
  format: WritingShareFormat,
  variant: WritingShareComposition,
  locale: WritingLanguage,
  options: CarouselPaginationOptions = {},
): WritingSegmentationResult {
  return paginateWritingCarousel(value, format, variant, locale, options, MAX_WRITING_SHARE_CARDS);
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
