import { writingDocumentToPlainText, validateWritingDocument } from "@/lib/writing/document";
import { writingTranslationTargetLocales } from "@/lib/writing/openai-translation-leaf-contract";
import { writingLanguages, writingTranslationFailureCodes } from "@/types/writing";
import type {
  WritingLanguage,
  WritingTranslationFailureCode,
  WritingTranslationGenerationResult,
  WritingTranslationProvider,
  WritingTranslationRequest,
} from "@/types/writing";

export const WRITING_TRANSLATION_GENERATION_CONCURRENCY = 3;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type RpcError = { message?: string } | null;
export type WritingTranslationDatabase = {
  rpc(name: string, parameters: Record<string, unknown>): PromiseLike<{ data: unknown; error: RpcError }>;
};

type ClaimedTranslation = {
  claimId: string;
  request: WritingTranslationRequest;
};

function validLanguage(value: unknown): value is WritingLanguage {
  return writingLanguages.some((locale) => locale === value);
}

function parseClaim(value: unknown): ClaimedTranslation | null {
  const row = Array.isArray(value) ? value[0] as Record<string, unknown> | undefined : undefined;
  if (
    !row
    || typeof row.claim_id !== "string" || !UUID_PATTERN.test(row.claim_id)
    || typeof row.article_id !== "string" || !UUID_PATTERN.test(row.article_id)
    || !validLanguage(row.source_locale)
    || !validLanguage(row.target_locale)
    || row.source_locale === row.target_locale
    || typeof row.source_revision !== "number" || !Number.isSafeInteger(row.source_revision) || row.source_revision < 1
    || typeof row.title !== "string"
    || typeof row.deck !== "string"
    || typeof row.excerpt !== "string"
  ) return null;
  const document = validateWritingDocument(row.body_json);
  if (!document.success) return null;
  return {
    claimId: row.claim_id,
    request: {
      articleId: row.article_id,
      sourceLocale: row.source_locale,
      targetLocale: row.target_locale,
      sourceRevision: row.source_revision,
      content: { title: row.title, deck: row.deck, excerpt: row.excerpt, bodyJson: document.data },
      protectedTerms: ["BTSHQ.ONLINE", "btshq.online"],
    },
  };
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  execute: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await execute(values[index]);
    }
  }));
  return results;
}

function providerFailure(error: unknown): WritingTranslationFailureCode {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (writingTranslationFailureCodes.some((candidate) => candidate === code)) return code as WritingTranslationFailureCode;
  }
  return "invalid_structured_response";
}

async function failClaim(
  database: WritingTranslationDatabase,
  claim: ClaimedTranslation,
  failureCode: WritingTranslationFailureCode,
): Promise<void> {
  await database.rpc("fail_writing_translation_generation", {
    p_id: claim.request.articleId,
    p_locale: claim.request.targetLocale,
    p_source_revision: claim.request.sourceRevision,
    p_claim_id: claim.claimId,
    p_error_code: failureCode,
  });
}

async function generateLocale(
  database: WritingTranslationDatabase,
  provider: WritingTranslationProvider,
  articleId: string,
  sourceRevision: number,
  locale: WritingLanguage,
): Promise<WritingTranslationGenerationResult> {
  const claimed = await database.rpc("claim_writing_translation_generation", {
    p_id: articleId,
    p_locale: locale,
    p_source_revision: sourceRevision,
  });
  if (claimed.error) return { locale, status: "failed", failureCode: "persistence_conflict" };
  const claim = parseClaim(claimed.data);
  if (!claim) return { locale, status: "skipped" };

  let translated;
  try {
    translated = await provider.translate(claim.request, new AbortController().signal);
  } catch (error) {
    const failureCode = providerFailure(error);
    await failClaim(database, claim, failureCode);
    return { locale, status: "failed", failureCode };
  }

  const completed = await database.rpc("complete_writing_translation_generation", {
    p_id: claim.request.articleId,
    p_locale: claim.request.targetLocale,
    p_source_revision: claim.request.sourceRevision,
    p_claim_id: claim.claimId,
    p_title: translated.title,
    p_deck: translated.deck,
    p_excerpt: translated.excerpt,
    p_body: writingDocumentToPlainText(translated.bodyJson),
    p_body_json: translated.bodyJson,
  });
  if (completed.error || completed.data !== true) {
    await failClaim(database, claim, "persistence_conflict");
    return { locale, status: "failed", failureCode: "persistence_conflict" };
  }
  return { locale, status: "translated" };
}

export async function generateWritingTranslationsWithProvider({
  articleId,
  database,
  provider,
  sourceLocale,
  sourceRevision,
  targetLocales = writingTranslationTargetLocales(sourceLocale),
}: {
  articleId: string;
  database: WritingTranslationDatabase;
  provider: WritingTranslationProvider | null;
  sourceLocale: WritingLanguage;
  sourceRevision: number;
  targetLocales?: readonly WritingLanguage[];
}): Promise<WritingTranslationGenerationResult[]> {
  const safeTargets = [...new Set(targetLocales)].filter((locale) => locale !== sourceLocale && validLanguage(locale));
  if (!provider) return safeTargets.map((locale) => ({ locale, status: "failed", failureCode: "configuration_missing" }));
  return mapWithConcurrency(safeTargets, WRITING_TRANSLATION_GENERATION_CONCURRENCY, (locale) => generateLocale(database, provider, articleId, sourceRevision, locale));
}
