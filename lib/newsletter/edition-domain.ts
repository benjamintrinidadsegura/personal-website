import { newsletterEditionStates, type NewsletterEdition, type NewsletterEditionState } from "@/types/newsletter";

type UnknownRow = Record<string, unknown>;

function validDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function optionalDate(value: unknown): value is string | null {
  return value === null || validDate(value);
}

function validState(value: unknown): value is NewsletterEditionState {
  return newsletterEditionStates.some((state) => state === value);
}

function count(value: unknown): value is number {
  return (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
    || (typeof value === "string" && /^\d+$/u.test(value) && Number.isSafeInteger(Number(value)));
}

export function mapNewsletterEdition(row: UnknownRow): NewsletterEdition | null {
  if (
    typeof row.id !== "string" || typeof row.writing_article_id !== "string"
    || typeof row.article_title !== "string" || typeof row.article_excerpt !== "string"
    || typeof row.canonical_url !== "string" || typeof row.subject !== "string"
    || typeof row.preheader !== "string" || typeof row.introduction !== "string"
    || !validState(row.state) || !count(row.version) || row.version < 1
    || !validDate(row.created_at) || !optionalDate(row.send_started_at) || !optionalDate(row.sent_at)
    || !count(row.recipient_count) || !count(row.sent_count)
    || !count(row.failed_count) || !count(row.reconciliation_count)
  ) return null;
  try {
    const canonicalUrl = new URL(row.canonical_url);
    if (canonicalUrl.protocol !== "https:" && canonicalUrl.hostname !== "localhost") return null;
  } catch {
    return null;
  }
  return {
    id: row.id,
    writingArticleId: row.writing_article_id,
    articleTitle: row.article_title,
    articleExcerpt: row.article_excerpt,
    canonicalUrl: row.canonical_url,
    subject: row.subject,
    preheader: row.preheader,
    introduction: row.introduction,
    state: row.state,
    version: Number(row.version),
    createdAt: row.created_at,
    sendStartedAt: row.send_started_at,
    sentAt: row.sent_at,
    recipientCount: Number(row.recipient_count),
    sentCount: Number(row.sent_count),
    failedCount: Number(row.failed_count),
    reconciliationCount: Number(row.reconciliation_count),
  };
}
