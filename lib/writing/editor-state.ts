import { isSafeWritingLink, MAX_WRITING_BLOCKS, MAX_WRITING_DEPTH, MAX_WRITING_TEXT_LENGTH, validateWritingDocument, type WritingDocumentValidationResult } from "@/lib/writing/document";
import { writingEditorialBlockTypes } from "@/types/writing";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class EditorValidationError extends Error {}

function unsupported(path: string, reason: string): never {
  throw new EditorValidationError(`${path}: ${reason} Your complete editor content is retained; nothing has been removed.`);
}

type Counters = { blocks: number; text: number };
function readEditorInline(value: unknown, path: string, counters: Counters): unknown[] {
  if (!Array.isArray(value)) unsupported(path, "Expected inline content.");
  return value.map((item, index) => {
    const location = `${path}[${index + 1}]`;
    if (!isRecord(item) || typeof item.type !== "string") unsupported(location, "Unsupported inline node.");
    if (item.type === "text") {
      if (typeof item.text !== "string" || !isRecord(item.styles)) unsupported(location, "Invalid text or styles.");
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(item.text)) unsupported(`${location}.text`, "Unsupported control character.");
      counters.text += Array.from(item.text).length;
      if (counters.text > MAX_WRITING_TEXT_LENGTH) unsupported(`${location}.text`, `Document exceeds ${MAX_WRITING_TEXT_LENGTH} characters.`);
      for (const [key, enabled] of Object.entries(item.styles)) {
        if (!["bold", "italic"].includes(key) || (enabled !== true && enabled !== false)) unsupported(`${location}.styles.${key}`, "This text style cannot be saved in Writing.");
      }
      for (const key of Object.keys(item)) if (!["type", "text", "styles"].includes(key)) unsupported(`${location}.${key}`, "Unsupported text property.");
      const styleKeys = Object.entries(item.styles).filter(([, enabled]) => enabled === true).map(([key]) => key);
      const styles = Object.fromEntries(styleKeys.map((key) => [key, true]));
      return Object.keys(styles).length > 0 ? { type: "text", text: item.text, styles } : { type: "text", text: item.text };
    }
    if (item.type === "link" && typeof item.href === "string" && Array.isArray(item.content)) {
      if (!isSafeWritingLink(item.href)) unsupported(`${location}.href`, "Use a safe http(s), local or fragment link.");
      for (const key of Object.keys(item)) if (!["type", "href", "content"].includes(key)) unsupported(`${location}.${key}`, "Unsupported link property.");
      const content = readEditorInline(item.content, `${location}.content`, counters);
      if (content.some((child) => !isRecord(child) || child.type !== "text")) unsupported(location, "Links may contain text only.");
      return { type: "link", href: item.href, content };
    }
    return unsupported(location, "Unsupported inline node.");
  });
}

function checkEditorProps(value: unknown, type: string, path: string, listNumber: number): void {
  if (!isRecord(value)) unsupported(path, "Invalid block properties.");
  if (type === "heading" && value.level !== 2 && value.level !== 3) unsupported(`${path}.level`, "Writing supports heading levels 2 and 3.");
  const hasDefaultProps = ["paragraph", "heading", "bulletListItem", "numberedListItem", "quote"].includes(type);
  for (const [key, setting] of Object.entries(value)) {
    // BlockNote's explicit default list start is lossless only when it matches
    // the authored sequence. A restart/custom start must never be discarded.
    if (type === "numberedListItem" && key === "start" && (setting === undefined || setting === listNumber)) continue;
    if (type === "heading" && key === "level" && (setting === 2 || setting === 3)) continue;
    if (hasDefaultProps && ["backgroundColor", "textColor"].includes(key) && setting === "default") continue;
    if (hasDefaultProps && key === "textAlignment" && setting === "left") continue;
    unsupported(`${path}.${key}`, key === "start" ? "Custom list starts/restarts cannot yet be saved in Writing." : "This block property cannot yet be saved in Writing.");
  }
}

function readEditorBlocks(value: unknown, path: string, depth: number, counters: Counters): unknown[] {
  if (!Array.isArray(value)) unsupported(path, "Expected blocks.");
  if (value.length && depth > MAX_WRITING_DEPTH) unsupported(path, `Nesting exceeds ${MAX_WRITING_DEPTH} levels.`);
  let listNumber = 0;
  return value.map((item, index) => {
    const location = `${path}[${index + 1}]`;
    if (!isRecord(item) || typeof item.type !== "string") unsupported(location, "Unsupported block.");
    if (!["paragraph", "heading", "bulletListItem", "numberedListItem", "quote", "divider", ...writingEditorialBlockTypes].includes(item.type)) unsupported(`${location}.type`, "Unsupported block type.");
    const blockPath = `${location} (${item.type})`;
    counters.blocks += 1;
    if (counters.blocks > MAX_WRITING_BLOCKS) unsupported(blockPath, `Document exceeds ${MAX_WRITING_BLOCKS} blocks.`);
    if (typeof item.id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/u.test(item.id)) unsupported(`${blockPath}.id`, "Invalid block ID.");
    for (const key of Object.keys(item)) if (!["id", "type", "props", "content", "children"].includes(key)) unsupported(`${blockPath}.${key}`, "Unsupported block property.");
    listNumber = item.type === "numberedListItem" ? listNumber + 1 : 0;
    checkEditorProps(item.props, item.type, `${blockPath}.props`, listNumber);
    const identity = { id: item.id };
    const children = readEditorBlocks(item.children, `${blockPath}.children`, depth + 1, counters);
    const childValue = children.length > 0 ? { children } : {};
    if (item.type === "divider") {
      if (item.content !== undefined && (!Array.isArray(item.content) || item.content.length > 0)) unsupported(`${blockPath}.content`, "A divider cannot contain text.");
      return { ...identity, type: "divider", ...childValue };
    }
    const content = readEditorInline(item.content, `${blockPath}.content`, counters);
    return item.type === "heading"
      ? { ...identity, type: "heading", level: (item.props as Record<string, unknown>).level, content, ...childValue }
      : { ...identity, type: item.type, content, ...childValue };
  });
}

export function blockNoteToWritingDocument(value: unknown): WritingDocumentValidationResult {
  try {
    const blocks = readEditorBlocks(value, "Block", 1, { blocks: 0, text: 0 });
    return validateWritingDocument({ version: 1, blocks });
  } catch (error) {
    if (error instanceof EditorValidationError) return { success: false, message: error.message };
    return { success: false, message: "The editor could not be validated. Your raw content is retained; saving is blocked." };
  }
}

export type WritingEditorState = { raw: unknown; validation: WritingDocumentValidationResult };

export function captureWritingEditorState(raw: unknown): WritingEditorState {
  // Capture before validation, including unsupported properties and nodes.
  const captured = structuredClone(raw);
  return { raw: captured, validation: blockNoteToWritingDocument(captured) };
}
