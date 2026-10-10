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

import { isSafeWritingLink } from "@/lib/writing/document";
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

export type WritingEditorBlock = PartialBlock<
  typeof writingEditorSchema.blockSchema,
  typeof writingEditorSchema.inlineContentSchema,
  typeof writingEditorSchema.styleSchema
>;

export { blockNoteToWritingDocument, captureWritingEditorState, type WritingEditorState } from "@/lib/writing/editor-state";

function toEditorText(text: WritingText) {
  return { type: "text" as const, text: text.text, styles: { bold: text.styles?.bold === true, italic: text.styles?.italic === true } };
}

function toEditorInline(content: WritingInlineContent[]) {
  return content.map((item) => item.type === "text"
    ? toEditorText(item)
    : { type: "link" as const, href: item.href, content: item.content.map(toEditorText) });
}

function toEditorBlock(block: WritingDocumentBlock): WritingEditorBlock {
  const children = block.children?.map(toEditorBlock);
  const identity = block.id ? { id: block.id } : {};
  if (block.type === "divider") return { ...identity, type: "divider", children };
  if (block.type === "heading") return { ...identity, type: "heading", props: { level: block.level }, content: toEditorInline(block.content), children };
  return { ...identity, type: block.type, content: toEditorInline(block.content), children };
}

export function writingDocumentToBlockNote(document: WritingDocumentV1): WritingEditorBlock[] {
  return document.blocks.map(toEditorBlock);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reject incompatible backups before asking BlockNote to replace any nodes. */
export function canRestoreWritingEditorRaw(raw: unknown): raw is WritingEditorBlock[] {
  const inline = (value: unknown): boolean => Array.isArray(value) && value.every((item) => {
    if (!isRecord(item)) return false;
    if (item.type === "link") return Object.keys(item).every((key) => ["type", "href", "content"].includes(key)) && typeof item.href === "string" && isSafeWritingLink(item.href) && inline(item.content) && (item.content as unknown[]).every((child) => isRecord(child) && child.type === "text");
    return item.type === "text" && typeof item.text === "string" && isRecord(item.styles)
      && Object.keys(item).every((key) => ["type", "text", "styles"].includes(key))
      && Object.entries(item.styles).every(([key, value]) => ["bold", "italic"].includes(key) && typeof value === "boolean");
  });
  const blocks = (value: unknown, depth: number): boolean => depth <= 32 && Array.isArray(value) && value.every((block) => {
    if (!isRecord(block) || typeof block.id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/u.test(block.id) || typeof block.type !== "string" || !isRecord(block.props)) return false;
    if (!Object.keys(block).every((key) => ["id", "type", "props", "content", "children"].includes(key))) return false;
    if (!Object.hasOwn(writingEditorSchema.blockSchema, block.type)) return false;
    const config = writingEditorSchema.blockSchema[block.type as keyof typeof writingEditorSchema.blockSchema];
    if (!config) return false;
    const props = config.propSchema as Record<string, { default: unknown; type?: string; values?: readonly unknown[] }>;
    // A full raw backup must not acquire missing properties through defaults.
    // Undefined optional list starts are the exception: JSON omits those.
    if (!Object.entries(props).every(([key, spec]) => spec.default === undefined || (Object.hasOwn(block.props as object, key) && (block.props as Record<string, unknown>)[key] !== undefined))) return false;
    if (!Object.entries(block.props).every(([key, value]) => Object.hasOwn(props, key)
      && ((value === undefined && props[key].default === undefined) || (typeof value === (props[key].type ?? typeof props[key].default) && (!props[key].values || props[key].values.includes(value)))))) return false;
    return (config.content === "none" ? block.content === undefined || (Array.isArray(block.content) && block.content.length === 0) : inline(block.content)) && blocks(block.children, depth + 1);
  });
  return Array.isArray(raw) && raw.length > 0 && blocks(raw, 0);
}
