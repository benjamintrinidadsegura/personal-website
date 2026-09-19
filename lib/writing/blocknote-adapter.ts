import {
  BlockNoteSchema,
  createBlockConfig,
  createBlockSpec,
  createHeadingBlockSpec,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
  type PartialBlock,
} from "@blocknote/core";

import { validateWritingDocument, type WritingDocumentValidationResult } from "@/lib/writing/document";
import type { WritingDocumentBlock, WritingDocumentV1, WritingInlineContent, WritingText } from "@/types/writing";

function editorialBlockDom(tagName: "p" | "blockquote", className: string) {
  const dom = document.createElement(tagName);
  dom.className = className;
  return { dom, contentDOM: dom };
}

const keyThoughtBlock = createBlockSpec(
  createBlockConfig(() => ({ type: "keyThought" as const, propSchema: {}, content: "inline" as const })),
  {
    render: () => editorialBlockDom("p", "bn-writing-key-thought"),
    toExternalHTML: () => editorialBlockDom("p", "bn-writing-key-thought"),
    parse: (element) => element.classList.contains("bn-writing-key-thought") ? {} : undefined,
  },
)();

const pullQuoteBlock = createBlockSpec(
  createBlockConfig(() => ({ type: "pullQuote" as const, propSchema: {}, content: "inline" as const })),
  {
    render: () => editorialBlockDom("blockquote", "bn-writing-pull-quote"),
    toExternalHTML: () => editorialBlockDom("blockquote", "bn-writing-pull-quote"),
    parse: (element) => element.classList.contains("bn-writing-pull-quote") ? {} : undefined,
  },
)();

const shareableBlock = createBlockSpec(
  createBlockConfig(() => ({ type: "shareable" as const, propSchema: {}, content: "inline" as const })),
  {
    render: () => editorialBlockDom("p", "bn-writing-shareable"),
    toExternalHTML: () => editorialBlockDom("p", "bn-writing-shareable"),
    parse: (element) => element.classList.contains("bn-writing-shareable") ? {} : undefined,
  },
)();

export const writingEditorSchema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
    heading: createHeadingBlockSpec({ levels: [2, 3], defaultLevel: 2, allowToggleHeadings: false }),
    bulletListItem: defaultBlockSpecs.bulletListItem,
    numberedListItem: defaultBlockSpecs.numberedListItem,
    quote: defaultBlockSpecs.quote,
    divider: defaultBlockSpecs.divider,
    keyThought: keyThoughtBlock,
    pullQuote: pullQuoteBlock,
    shareable: shareableBlock,
  },
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: {
    bold: defaultStyleSpecs.bold,
    italic: defaultStyleSpecs.italic,
  },
});

type EditorBlock = PartialBlock<
  typeof writingEditorSchema.blockSchema,
  typeof writingEditorSchema.inlineContentSchema,
  typeof writingEditorSchema.styleSchema
>;

function toEditorText(text: WritingText) {
  return { type: "text" as const, text: text.text, styles: { bold: text.styles?.bold === true, italic: text.styles?.italic === true } };
}

function toEditorInline(content: WritingInlineContent[]) {
  return content.map((item) => item.type === "text"
    ? toEditorText(item)
    : { type: "link" as const, href: item.href, content: item.content.map(toEditorText) });
}

function toEditorBlock(block: WritingDocumentBlock): EditorBlock {
  const children = block.children?.map(toEditorBlock);
  const identity = block.id ? { id: block.id } : {};
  if (block.type === "divider") return { ...identity, type: "divider", children };
  if (block.type === "heading") return { ...identity, type: "heading", props: { level: block.level }, content: toEditorInline(block.content), children };
  return { ...identity, type: block.type, content: toEditorInline(block.content), children };
}

export function writingDocumentToBlockNote(document: WritingDocumentV1): EditorBlock[] {
  return document.blocks.map(toEditorBlock);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readEditorInline(value: unknown): unknown[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((item) => {
    if (!isRecord(item) || typeof item.type !== "string") return null;
    if (item.type === "text") {
      if (typeof item.text !== "string" || !isRecord(item.styles)) return null;
      const styleKeys = Object.entries(item.styles).filter(([, enabled]) => enabled === true).map(([key]) => key);
      if (styleKeys.some((key) => key !== "bold" && key !== "italic")) return null;
      const styles = Object.fromEntries(styleKeys.map((key) => [key, true]));
      return Object.keys(styles).length > 0 ? { type: "text", text: item.text, styles } : { type: "text", text: item.text };
    }
    if (item.type === "link" && typeof item.href === "string" && Array.isArray(item.content)) {
      const content = readEditorInline(item.content);
      if (!content || content.some((child) => !isRecord(child) || child.type !== "text")) return null;
      return { type: "link", href: item.href, content };
    }
    return null;
  });
}

function hasUnsupportedProps(value: unknown, heading: boolean): boolean {
  if (!isRecord(value)) return true;
  return Object.entries(value).some(([key, setting]) => {
    if (heading && key === "level") return setting !== 2 && setting !== 3;
    if (key === "backgroundColor") return setting !== "default";
    if (key === "textColor") return setting !== "default";
    if (key === "textAlignment") return setting !== "left";
    return true;
  });
}

function readEditorBlocks(value: unknown): unknown[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((item) => {
    if (!isRecord(item) || typeof item.type !== "string" || !Array.isArray(item.children)) return null;
    if (typeof item.id !== "string") return null;
    const identity = { id: item.id };
    const children = readEditorBlocks(item.children);
    if (!children || children.some((child) => child === null)) return null;
    const childValue = children.length > 0 ? { children } : {};
    if (item.type === "divider") return { ...identity, type: "divider", ...childValue };
    if (!["paragraph", "heading", "bulletListItem", "numberedListItem", "quote", "keyThought", "pullQuote", "shareable"].includes(item.type) || hasUnsupportedProps(item.props, item.type === "heading")) return null;
    const content = readEditorInline(item.content);
    if (!content || content.some((inline) => inline === null)) return null;
    return item.type === "heading"
      ? { ...identity, type: "heading", level: (item.props as Record<string, unknown>).level, content, ...childValue }
      : { ...identity, type: item.type, content, ...childValue };
  });
}

export function blockNoteToWritingDocument(value: unknown): WritingDocumentValidationResult {
  const blocks = readEditorBlocks(value);
  if (!blocks || blocks.some((block) => block === null)) return { success: false, message: "The editor contains unsupported content or formatting." };
  return validateWritingDocument({ version: 1, blocks });
}
