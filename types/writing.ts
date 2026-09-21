export const writingContentTypes = ["essay", "note"] as const;
export type WritingContentType = (typeof writingContentTypes)[number];

export const writingStatuses = ["draft", "published"] as const;
export type WritingStatus = (typeof writingStatuses)[number];

export const writingLanguages = ["de", "en", "es", "tr", "pl", "el", "ru"] as const;
export type WritingLanguage = (typeof writingLanguages)[number];

export const suggestedWritingTopics = ["People", "Work", "Building", "Life", "Ideas"] as const;

export type WritingTextStyles = {
  bold?: true;
  italic?: true;
};

export type WritingText = {
  type: "text";
  text: string;
  styles?: WritingTextStyles;
};

export type WritingLink = {
  type: "link";
  href: string;
  content: WritingText[];
};

export type WritingInlineContent = WritingText | WritingLink;

export const writingEditorialBlockTypes = ["keyThought", "pullQuote", "shareable"] as const;
export type WritingEditorialBlockType = (typeof writingEditorialBlockTypes)[number];

type WritingBlockIdentity = {
  id?: string;
};

export type WritingDocumentBlock =
  | (WritingBlockIdentity & { type: "paragraph" | "bulletListItem" | "numberedListItem" | "quote" | WritingEditorialBlockType; content: WritingInlineContent[]; children?: WritingDocumentBlock[] })
  | (WritingBlockIdentity & { type: "heading"; level: 2 | 3; content: WritingInlineContent[]; children?: WritingDocumentBlock[] })
  | (WritingBlockIdentity & { type: "divider"; children?: WritingDocumentBlock[] });

export type WritingDocumentV1 = {
  version: 1;
  blocks: WritingDocumentBlock[];
};

export type WritingField = "title" | "deck" | "excerpt" | "bodyJson" | "contentType" | "topics";

export interface WritingInput {
  title: string;
  deck: string;
  excerpt: string;
  body: string;
  bodyJson: WritingDocumentV1;
  contentType: WritingContentType;
  topics: string[];
}

export interface AdminWritingArticle extends Omit<WritingInput, "bodyJson"> {
  id: string;
  bodyJson: WritingDocumentV1 | null;
  slug: string | null;
  status: WritingStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface PublicWritingSummary {
  id: string;
  slug: string;
  title: string;
  deck: string;
  excerpt: string;
  contentType: WritingContentType;
  topics: string[];
  publishedAt: string;
  readingMinutes: number;
  language: WritingLanguage;
}

export interface PublicWritingArticle extends PublicWritingSummary {
  body: string;
  bodyJson: WritingDocumentV1 | null;
}

export const writingShareFormats = ["story", "portrait", "square"] as const;
export type WritingShareFormat = (typeof writingShareFormats)[number];

export const writingShareVariants = ["editorial", "marginNote", "statement"] as const;
export type WritingShareVariant = (typeof writingShareVariants)[number];

export type WritingShareSource = {
  articleId: string;
  articleSlug: string | null;
  articleTitle: string;
  authorName: string;
  blockId?: string;
  canonicalUrl: string | null;
  domain: string;
  language: WritingLanguage;
  text: string;
};

export type WritingShareContext = Omit<WritingShareSource, "blockId" | "text">;

export type WritingActionState = {
  ok: boolean;
  message: string;
  code?: "validation" | "conflict" | "error";
  updatedAt?: string;
  slug?: string;
  fieldErrors?: Partial<Record<WritingField, string>>;
} | null;
