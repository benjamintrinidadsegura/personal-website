import type { WritingContentType, WritingDocumentBlock, WritingDocumentV1 } from "@/types/writing";

export type WritingSnapshotContent = {
  title: string;
  deck: string;
  excerpt: string;
  contentType: WritingContentType;
  topics: string[];
  document: WritingDocumentV1;
};

function semanticBlock(block: WritingDocumentBlock): object {
  const children = block.children?.map(semanticBlock);
  if (block.type === "divider") return { type: block.type, ...(children?.length ? { children } : {}) };
  if (block.type === "heading") return { type: block.type, level: block.level, content: block.content, ...(children?.length ? { children } : {}) };
  return { type: block.type, content: block.content, ...(children?.length ? { children } : {}) };
}

// BlockNote can regenerate block IDs while mounting or switching preview modes.
// IDs are anchors, not authored content; they must not create false loss warnings.
export function writingSnapshotFingerprint(snapshot: WritingSnapshotContent): string {
  return JSON.stringify({
    title: snapshot.title,
    deck: snapshot.deck,
    excerpt: snapshot.excerpt,
    contentType: snapshot.contentType,
    topics: snapshot.topics,
    document: { version: snapshot.document.version, blocks: snapshot.document.blocks.map(semanticBlock) },
  });
}

export function isWritingSnapshotDirty(currentFingerprint: string, persistedFingerprint: string): boolean {
  return currentFingerprint !== persistedFingerprint;
}

export function writingNavigationLeavesDocument(currentHref: string, destinationHref: string): boolean {
  try {
    const current = new URL(currentHref);
    const destination = new URL(destinationHref, current);
    return destination.origin !== current.origin || destination.pathname !== current.pathname || destination.search !== current.search;
  } catch {
    return true;
  }
}
