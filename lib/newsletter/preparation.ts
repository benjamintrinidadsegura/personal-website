import {
  writingNewsletterPreparationStatuses,
  type WritingNewsletterPreparation,
  type WritingNewsletterPreparationStatus,
} from "@/types/newsletter";
import { parseSiteUrl } from "@/lib/site-url-validation";

type RpcResult = { data: unknown; error: { message?: string } | null };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function isNewsletterEditionId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function parseWritingNewsletterPreparationStatus(value: unknown): WritingNewsletterPreparationStatus | null {
  return typeof value === "string" && writingNewsletterPreparationStatuses.some((status) => status === value) ? value as WritingNewsletterPreparationStatus : null;
}

export function canonicalNewsletterSiteOrigin(value: string | undefined): string | null {
  return parseSiteUrl(value)?.origin ?? null;
}

export function writingNewsletterStatusQuery(preparation: WritingNewsletterPreparation | undefined): string {
  if (!preparation) return "";
  const parameters = new URLSearchParams({ newsletter: preparation.status });
  if (preparation.editionId) parameters.set("newsletterEdition", preparation.editionId);
  return parameters.toString();
}

function parsePreparationResult(data: unknown): WritingNewsletterPreparation | null {
  const row = Array.isArray(data) ? data[0] as Record<string, unknown> | undefined : undefined;
  if (!row || !isNewsletterEditionId(row.edition_id) || typeof row.article_slug !== "string" || !SLUG_PATTERN.test(row.article_slug)) return null;
  const editionState = row.edition_state;
  const outcome = row.outcome;
  if (editionState === "draft" && (outcome === "created" || outcome === "reused_draft")) {
    return { status: outcome, editionId: row.edition_id, editionState, articleSlug: row.article_slug };
  }
  if (editionState === "sending" && outcome === "existing_sending") {
    return { status: outcome, editionId: row.edition_id, editionState, articleSlug: row.article_slug };
  }
  if (editionState === "sent" && outcome === "existing_sent") {
    return { status: outcome, editionId: row.edition_id, editionState, articleSlug: row.article_slug };
  }
  if (editionState === "failed" && outcome === "existing_failed") {
    return { status: outcome, editionId: row.edition_id, editionState, articleSlug: row.article_slug };
  }
  return null;
}

export async function prepareWritingNewsletterDraft(
  requested: boolean,
  execute: () => Promise<RpcResult>,
): Promise<WritingNewsletterPreparation | undefined> {
  if (!requested) return undefined;
  try {
    const result = await execute();
    if (result.error) return { status: "failed" };
    return parsePreparationResult(result.data) ?? { status: "failed" };
  } catch {
    return { status: "failed" };
  }
}
