import type {
  WritingDocumentBlock,
  WritingDocumentV1,
  WritingInlineContent,
  WritingText,
  WritingTextStyles,
} from "@/types/writing";

export const WRITING_DOCUMENT_VERSION = 1;
export const MAX_WRITING_DOCUMENT_BYTES = 128 * 1024;
export const MAX_WRITING_BLOCKS = 500;
export const MAX_WRITING_DEPTH = 4;
export const MAX_WRITING_TEXT_LENGTH = 24_000;
export const MAX_WRITING_LINK_LENGTH = 2_048;

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;
const SAFE_RELATIVE_LINK = /^(?:\/(?:$|[^/])|#)/u;
const UNSAFE_SCHEME_PREFIX = /^(?:javascript|data|file|blob)\s*:/iu;

export type WritingDocumentValidationResult =
  | { success: true; data: WritingDocumentV1; plainText: string }
  | { success: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

export function isSafeWritingLink(href: string): boolean {
  if (!href || characterLength(href) > MAX_WRITING_LINK_LENGTH || href.trim() !== href || CONTROL_CHARACTERS.test(href)) return false;
  const compact = href.replace(/[\u0000-\u0020\u007F]+/gu, "");
  if (UNSAFE_SCHEME_PREFIX.test(compact)) return false;
  if (SAFE_RELATIVE_LINK.test(href)) return !href.startsWith("//");
  try {
    const url = new URL(href);
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

function parseStyles(value: unknown): WritingTextStyles | undefined | null {
  if (value === undefined) return undefined;
  if (!isRecord(value) || !hasOnlyKeys(value, ["bold", "italic"])) return null;
  const styles: WritingTextStyles = {};
  if (value.bold !== undefined) {
    if (value.bold !== true) return null;
    styles.bold = true;
  }
  if (value.italic !== undefined) {
    if (value.italic !== true) return null;
    styles.italic = true;
  }
  return Object.keys(styles).length > 0 ? styles : undefined;
}

function parseText(value: unknown): WritingText | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["type", "text", "styles"]) || value.type !== "text" || typeof value.text !== "string" || CONTROL_CHARACTERS.test(value.text)) return null;
  const styles = parseStyles(value.styles);
  if (styles === null) return null;
  return styles ? { type: "text", text: value.text.normalize("NFC"), styles } : { type: "text", text: value.text.normalize("NFC") };
}

function parseInline(value: unknown): WritingInlineContent | null {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  if (value.type === "text") return parseText(value);
  if (value.type !== "link" || !hasOnlyKeys(value, ["type", "href", "content"]) || typeof value.href !== "string" || !isSafeWritingLink(value.href) || !Array.isArray(value.content)) return null;
  const content = value.content.map(parseText);
  if (content.some((item) => item === null)) return null;
  return { type: "link", href: value.href, content: content as WritingText[] };
}

type ParseCounters = { blocks: number; text: number };

function parseBlocks(value: unknown, depth: number, counters: ParseCounters): WritingDocumentBlock[] | null {
  if (!Array.isArray(value) || depth > MAX_WRITING_DEPTH) return null;
  const blocks: WritingDocumentBlock[] = [];
  for (const candidate of value) {
    counters.blocks += 1;
    if (counters.blocks > MAX_WRITING_BLOCKS || !isRecord(candidate) || typeof candidate.type !== "string") return null;
    const allowedKeys = candidate.type === "heading" ? ["type", "level", "content", "children"] : candidate.type === "divider" ? ["type", "children"] : ["type", "content", "children"];
    if (!hasOnlyKeys(candidate, allowedKeys)) return null;
    const children = candidate.children === undefined ? undefined : parseBlocks(candidate.children, depth + 1, counters);
    if (candidate.children !== undefined && children === null) return null;
    const withChildren = children && children.length > 0 ? { children } : {};
    if (candidate.type === "divider") {
      blocks.push({ type: "divider", ...withChildren });
      continue;
    }
    if (!["paragraph", "heading", "bulletListItem", "numberedListItem", "quote"].includes(candidate.type) || !Array.isArray(candidate.content)) return null;
    const content = candidate.content.map(parseInline);
    if (content.some((item) => item === null)) return null;
    for (const item of content as WritingInlineContent[]) {
      counters.text += item.type === "text" ? characterLength(item.text) : item.content.reduce((sum, text) => sum + characterLength(text.text), 0);
      if (counters.text > MAX_WRITING_TEXT_LENGTH) return null;
    }
    if (candidate.type === "heading") {
      if (candidate.level !== 2 && candidate.level !== 3) return null;
      blocks.push({ type: "heading", level: candidate.level, content: content as WritingInlineContent[], ...withChildren });
    } else {
      blocks.push({ type: candidate.type as "paragraph" | "bulletListItem" | "numberedListItem" | "quote", content: content as WritingInlineContent[], ...withChildren });
    }
  }
  return blocks;
}

function inlineText(content: WritingInlineContent[]): string {
  return content.map((item) => item.type === "text" ? item.text : item.content.map((text) => text.text).join("")).join("");
}

function blockText(block: WritingDocumentBlock): string[] {
  const own = block.type === "divider" ? [] : [inlineText(block.content)];
  return [...own, ...(block.children ?? []).flatMap(blockText)];
}

export function writingDocumentToPlainText(document: WritingDocumentV1): string {
  return document.blocks.flatMap(blockText).map((text) => text.trim()).filter(Boolean).join("\n\n");
}

export function validateWritingDocument(value: unknown): WritingDocumentValidationResult {
  let json: string;
  try {
    json = JSON.stringify(value);
  } catch {
    return { success: false, message: "Das Dokument ist nicht gültig." };
  }
  if (new TextEncoder().encode(json).byteLength > MAX_WRITING_DOCUMENT_BYTES) return { success: false, message: "Das Dokument ist zu groß." };
  if (!isRecord(value) || !hasOnlyKeys(value, ["version", "blocks"]) || value.version !== WRITING_DOCUMENT_VERSION) return { success: false, message: "Das Dokumentformat wird nicht unterstützt." };
  const blocks = parseBlocks(value.blocks, 1, { blocks: 0, text: 0 });
  if (!blocks || blocks.length === 0) return { success: false, message: "Das Dokument benötigt mindestens einen Block." };
  const data: WritingDocumentV1 = { version: 1, blocks };
  return { success: true, data, plainText: writingDocumentToPlainText(data) };
}

export function parseWritingDocumentJson(value: string): WritingDocumentValidationResult {
  try {
    return validateWritingDocument(JSON.parse(value));
  } catch {
    return { success: false, message: "Das Dokument ist nicht gültig." };
  }
}

export function legacyBodyToWritingDocument(body: string): WritingDocumentV1 {
  const paragraphs = body.split(/\n{2,}/u).map((paragraph) => paragraph.trim()).filter(Boolean);
  return {
    version: 1,
    blocks: (paragraphs.length > 0 ? paragraphs : [""]).map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : [],
    })),
  };
}
