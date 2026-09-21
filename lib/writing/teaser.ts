import { writingBlockToPlainText } from "@/lib/writing/document";
import type { WritingDocumentV1 } from "@/types/writing";

function clean(value: string): string {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

function fitTeaser(value: string): string | null {
  const normalized = clean(value);
  if (characterLength(normalized) < 10) return null;
  if (characterLength(normalized) <= 320) return normalized;
  const characters = Array.from(normalized).slice(0, 320).join("");
  const sentence = characters.match(/^(.{10,300}?[.!?])(?:\s|$)/u)?.[1];
  if (sentence) return sentence.trim();
  const boundary = characters.lastIndexOf(" ");
  return `${(boundary >= 10 ? characters.slice(0, boundary) : characters.slice(0, 317)).trimEnd()}…`;
}

export function deriveWritingTeaser(deck: string, document: WritingDocumentV1): string | null {
  const fromDeck = fitTeaser(deck);
  if (fromDeck) return fromDeck;
  for (const block of document.blocks) {
    if (block.type === "divider") continue;
    const candidate = fitTeaser(writingBlockToPlainText(block));
    if (candidate) return candidate;
  }
  return null;
}
