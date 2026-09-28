"use server";

import { refresh, revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { verifyAdminAuthorization } from "@/lib/admin/authorization";
import { isAllowedRequestOrigin } from "@/lib/echowall/security";
import { getLocalizedPathname } from "@/lib/i18n/routing";
import { canonicalNewsletterSiteOrigin, prepareWritingNewsletterDraft, writingNewsletterStatusQuery } from "@/lib/newsletter/preparation";
import { writingTranslationProviderConfiguration } from "@/lib/writing/openai-translation-provider";
import { createWritingSlugBase } from "@/lib/writing/slug";
import { generateWritingTranslations, type WritingTranslationDatabase } from "@/lib/writing/translation-generation";
import { parseWritingTranslationImport } from "@/lib/writing/translations";
import { parseWritingInput } from "@/lib/writing/validation";
import { writingLanguages, type WritingActionState } from "@/types/writing";
import type { WritingNewsletterPreparation } from "@/types/newsletter";

async function authorizeWritingMutation() {
  const requestHeaders = await headers();
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl || !isAllowedRequestOrigin(requestHeaders.get("origin"), requestHeaders.get("host"), siteUrl)) return null;
  return verifyAdminAuthorization(true);
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

function validWritingSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 96 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value);
}

function validWritingLanguage(value: unknown): value is (typeof writingLanguages)[number] {
  return typeof value === "string" && writingLanguages.some((candidate) => candidate === value);
}

async function preparePublishedWritingNewsletter(
  requested: boolean,
  articleId: string,
  authorization: NonNullable<Awaited<ReturnType<typeof authorizeWritingMutation>>>,
): Promise<WritingNewsletterPreparation | undefined> {
  if (!requested) return undefined;
  const siteOrigin = canonicalNewsletterSiteOrigin(process.env.SITE_URL);
  const preparation = await prepareWritingNewsletterDraft(true, async () => {
    if (!siteOrigin) return { data: null, error: { message: "Newsletter configuration unavailable" } };
    const { data, error } = await authorization.supabase.rpc("prepare_writing_newsletter_edition", {
      p_writing_article_id: articleId,
      p_site_origin: siteOrigin,
    });
    return { data, error };
  });
  if (preparation && preparation.status !== "failed" && preparation.editionId) {
    revalidatePath("/admin/newsletter");
    revalidatePath(`/admin/newsletter/${preparation.editionId}`);
  }
  return preparation;
}

type WritingMutationResult =
  | { updatedAt: string; slug?: string; sourceRevision: number; status: "draft" }
  | { updatedAt: string; slug: string; sourceRevision: number; status: "published" };

function parseWritingMutationResult(data: unknown): WritingMutationResult | null {
  const row = Array.isArray(data) ? data[0] as { updated_at?: unknown; slug?: unknown; source_revision?: unknown; status?: unknown } | undefined : undefined;
  if (
    typeof row?.updated_at !== "string"
    || Number.isNaN(Date.parse(row.updated_at))
    || typeof row.source_revision !== "number"
    || !Number.isSafeInteger(row.source_revision)
    || row.source_revision < 1
    || (row.status !== "draft" && row.status !== "published")
    || (row.slug !== null && row.slug !== undefined && typeof row.slug !== "string")
    || (row.status === "published" && (typeof row.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(row.slug)))
  ) return null;

  if (row.status === "published") return { updatedAt: row.updated_at, slug: row.slug as string, sourceRevision: row.source_revision, status: row.status };
  return { updatedAt: row.updated_at, slug: typeof row.slug === "string" ? row.slug : undefined, sourceRevision: row.source_revision, status: row.status };
}

function invalidateWritingStudio(articleId: string) {
  revalidatePath("/admin/writing");
  revalidatePath(`/admin/writing/${articleId}`);
}

function invalidatePublishedWriting(slug: string) {
  updateTag("published-writing");
  revalidatePath("/", "layout");
  revalidatePath("/writing");
  revalidatePath(`/writing/${slug}`);
  revalidatePath("/sitemap.xml");
  refresh();
}

function scheduleAutomaticWritingTranslations({
  articleId,
  database,
  slug,
  sourceLocale,
  sourceRevision,
}: {
  articleId: string;
  database: WritingTranslationDatabase;
  slug: string;
  sourceLocale: (typeof writingLanguages)[number];
  sourceRevision: number;
}) {
  after(async () => {
    const results = await generateWritingTranslations({ articleId, database, sourceLocale, sourceRevision });
    if (results.some((result) => result.status === "translated")) {
      updateTag("published-writing");
      revalidatePath("/", "layout");
      revalidatePath("/writing");
      revalidatePath(`/writing/${slug}`);
      revalidatePath("/sitemap.xml");
      revalidatePath(`/admin/writing/${articleId}`);
    }
  });
}

export async function createWritingDraftAction() {
  const authorization = await authorizeWritingMutation();
  if (!authorization) redirect("/admin");
  const { data, error } = await authorization.supabase.rpc("create_writing_draft");
  if (error || !validUuid(data)) redirect("/admin/writing?error=create");
  redirect(`/admin/writing/${data}`);
}

async function persistWriting(mode: "save" | "publish", formData: FormData): Promise<WritingActionState> {
  const authorization = await authorizeWritingMutation();
  if (!authorization) return { ok: false, code: "error", message: "Action not allowed." };
  const articleId = formData.get("articleId");
  const expectedUpdatedAt = formData.get("expectedUpdatedAt");
  if (!validUuid(articleId) || typeof expectedUpdatedAt !== "string" || Number.isNaN(Date.parse(expectedUpdatedAt))) {
    return { ok: false, code: "conflict", message: "Conflict: reload this article before continuing." };
  }

  const validation = parseWritingInput(formData, mode === "publish" ? "publish" : "draft");
  if (!validation.success) return { ok: false, code: "validation", message: "Please review your input.", fieldErrors: validation.fieldErrors };
  const input = validation.data;
  const parameters = {
    p_id: articleId,
    p_expected_updated_at: expectedUpdatedAt,
    p_title: input.title,
    p_deck: input.deck,
    p_excerpt: input.excerpt,
    p_body: input.body,
    p_body_json: input.bodyJson,
    p_content_type: input.contentType,
    p_source_locale: input.sourceLocale,
    p_topics: input.topics,
  };
  const request = mode === "publish"
    ? authorization.supabase.rpc("publish_writing_article_v3", { ...parameters, p_slug_base: createWritingSlugBase(input.title) })
    : authorization.supabase.rpc("save_writing_draft_v3", parameters);
  const { data, error } = await request;
  const result = parseWritingMutationResult(data);
  if (error || !result || (mode === "save" && result.status !== "draft") || (mode === "publish" && result.status !== "published")) {
    const conflict = error?.message?.includes("WRITING_STALE_OR_MISSING") ?? false;
    return { ok: false, code: conflict ? "conflict" : "error", message: conflict ? "Conflict: this article changed elsewhere. Reload before continuing." : "Saving failed. Please try again." };
  }

  const newsletterPreparation = result.status === "published"
    ? await preparePublishedWritingNewsletter(formData.get("prepareNewsletter") === "on", articleId, authorization)
    : undefined;
  if (result.status === "published") {
    scheduleAutomaticWritingTranslations({
      articleId,
      database: authorization.supabase as unknown as WritingTranslationDatabase,
      slug: result.slug,
      sourceLocale: input.sourceLocale,
      sourceRevision: result.sourceRevision,
    });
  }
  invalidateWritingStudio(articleId);
  if (result.status === "published") invalidatePublishedWriting(result.slug);
  return {
    ok: true,
    message: mode === "publish" ? "Published article updated." : "Draft saved.",
    updatedAt: result.updatedAt,
    slug: result.slug,
    sourceRevision: result.sourceRevision,
    newsletterPreparation,
  };
}

export async function saveWritingAction(_state: WritingActionState, formData: FormData) {
  return persistWriting("save", formData);
}

export async function publishWritingAction(_state: WritingActionState, formData: FormData) {
  return persistWriting("publish", formData);
}

function redirectToPublishedWritingWithNewsletterStatus(
  slug: string,
  locale: (typeof writingLanguages)[number],
  preparation: WritingNewsletterPreparation,
): never {
  const query = writingNewsletterStatusQuery(preparation);
  redirect(`${getLocalizedPathname(`/writing/${slug}`, locale)}${query ? `?${query}` : ""}`);
}

export async function retryWritingNewsletterPreparationAction(formData: FormData) {
  const articleId = formData.get("articleId");
  const expectedSlug = formData.get("expectedSlug");
  const locale = formData.get("locale");
  if (!validUuid(articleId) || !validWritingSlug(expectedSlug) || !validWritingLanguage(locale)) {
    redirect("/admin/writing");
  }

  const authorization = await authorizeWritingMutation();
  if (!authorization) redirect(getLocalizedPathname(`/writing/${expectedSlug}`, locale));
  const preparation = await preparePublishedWritingNewsletter(true, articleId, authorization);
  redirectToPublishedWritingWithNewsletterStatus(preparation?.articleSlug ?? expectedSlug, locale, preparation ?? { status: "failed" });
}

function writingDetailRedirect(articleId: string, parameter: string): never {
  redirect(`/admin/writing/${articleId}?${parameter}`);
}

export async function generateWritingTranslationsAction(formData: FormData) {
  const articleId = formData.get("articleId");
  const sourceLocale = formData.get("sourceLocale");
  const sourceRevisionValue = formData.get("sourceRevision");
  const targetLocale = formData.get("targetLocale");
  if (!validUuid(articleId)) redirect("/admin/writing?translationGenerationError=invalid");
  if (!validWritingLanguage(sourceLocale)) writingDetailRedirect(articleId, "translationGenerationError=locale");
  if (typeof sourceRevisionValue !== "string" || !/^\d+$/u.test(sourceRevisionValue)) writingDetailRedirect(articleId, "translationGenerationError=revision");
  const sourceRevision = Number(sourceRevisionValue);
  if (!Number.isSafeInteger(sourceRevision) || sourceRevision < 1) writingDetailRedirect(articleId, "translationGenerationError=revision");
  if (targetLocale !== "all" && !validWritingLanguage(targetLocale)) writingDetailRedirect(articleId, "translationGenerationError=locale");
  if (targetLocale === sourceLocale) writingDetailRedirect(articleId, "translationGenerationError=locale");

  const authorization = await authorizeWritingMutation();
  if (!authorization) writingDetailRedirect(articleId, "translationGenerationError=unauthorized");
  if (!writingTranslationProviderConfiguration().configured) writingDetailRedirect(articleId, "translationGenerationError=configuration_missing");
  const results = await generateWritingTranslations({
    articleId,
    database: authorization.supabase as unknown as WritingTranslationDatabase,
    sourceLocale,
    sourceRevision,
    ...(targetLocale === "all" ? {} : { targetLocales: [targetLocale] }),
  });
  const translated = results.filter((result) => result.status === "translated").length;
  const failed = results.filter((result) => result.status === "failed");
  updateTag("published-writing");
  revalidatePath("/", "layout");
  revalidatePath("/writing");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/admin/writing/${articleId}`);
  if (failed.length > 0) {
    writingDetailRedirect(articleId, `translationGenerated=${translated}&translationGenerationError=${failed[0].failureCode ?? "provider"}`);
  }
  writingDetailRedirect(articleId, `translationGenerated=${translated}`);
}

export async function importWritingTranslationAction(formData: FormData) {
  const articleId = formData.get("articleId");
  const locale = formData.get("locale");
  const sourceRevisionValue = formData.get("sourceRevision");
  if (!validUuid(articleId)) redirect("/admin/writing?translationError=invalid");
  if (typeof locale !== "string" || !writingLanguages.some((candidate) => candidate === locale)) writingDetailRedirect(articleId, "translationError=locale");
  if (typeof sourceRevisionValue !== "string" || !/^\d+$/u.test(sourceRevisionValue)) writingDetailRedirect(articleId, "translationError=revision");
  const sourceRevision = Number(sourceRevisionValue);
  if (!Number.isSafeInteger(sourceRevision) || sourceRevision < 1) writingDetailRedirect(articleId, "translationError=revision");
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") writingDetailRedirect(articleId, "translationError=payload");
  const parsed = parseWritingTranslationImport(rawPayload);
  if (!parsed.success) writingDetailRedirect(articleId, "translationError=payload");

  const authorization = await authorizeWritingMutation();
  if (!authorization) writingDetailRedirect(articleId, "translationError=unauthorized");
  const { data } = parsed;
  const { error } = await authorization.supabase.rpc("apply_writing_translation", {
    p_id: articleId,
    p_locale: locale,
    p_source_revision: sourceRevision,
    p_title: data.title,
    p_deck: data.deck,
    p_excerpt: data.excerpt,
    p_body: data.body,
    p_body_json: data.bodyJson,
    p_manually_edited: true,
  });
  if (error) writingDetailRedirect(articleId, error.message.includes("STALE_SOURCE") ? "translationError=stale" : "translationError=save");

  updateTag("published-writing");
  revalidatePath("/", "layout");
  revalidatePath("/writing");
  revalidatePath("/sitemap.xml");
  invalidateWritingStudio(articleId);
  writingDetailRedirect(articleId, `translationImported=${locale}`);
}

type DeleteWritingResult = { deleted_id?: unknown; deleted_slug?: unknown; deleted_status?: unknown };

export async function deleteWritingArticleAction(formData: FormData) {
  const articleId = formData.get("articleId");
  const expectedUpdatedAt = formData.get("expectedUpdatedAt");
  const expectedTitle = formData.get("expectedTitle");
  if (!validUuid(articleId) || typeof expectedUpdatedAt !== "string" || Number.isNaN(Date.parse(expectedUpdatedAt)) || typeof expectedTitle !== "string") {
    redirect("/admin/writing?deleteError=invalid");
  }
  const authorization = await authorizeWritingMutation();
  if (!authorization) writingDetailRedirect(articleId, "deleteError=unauthorized");
  const { data, error } = await authorization.supabase.rpc("delete_writing_article", {
    p_id: articleId,
    p_expected_updated_at: expectedUpdatedAt,
    p_expected_title: expectedTitle,
  });
  const row = Array.isArray(data) ? data[0] as DeleteWritingResult | undefined : undefined;
  if (error || !row || row.deleted_id !== articleId || (row.deleted_slug !== null && typeof row.deleted_slug !== "string") || (row.deleted_status !== "draft" && row.deleted_status !== "published")) {
    writingDetailRedirect(articleId, error?.message.includes("STALE") ? "deleteError=stale" : error?.message.includes("NOT_FOUND") ? "deleteError=missing" : "deleteError=failed");
  }

  invalidateWritingStudio(articleId);
  if (row.deleted_status === "published" && typeof row.deleted_slug === "string") invalidatePublishedWriting(row.deleted_slug);
  redirect("/admin/writing?deleted=1");
}
