"use server";

import { refresh, revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { verifyAdminAuthorization } from "@/lib/admin/authorization";
import { isAllowedRequestOrigin } from "@/lib/echowall/security";
import { createWritingSlugBase } from "@/lib/writing/slug";
import { parseWritingInput } from "@/lib/writing/validation";
import type { WritingActionState } from "@/types/writing";

async function authorizeWritingMutation() {
  const requestHeaders = await headers();
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl || !isAllowedRequestOrigin(requestHeaders.get("origin"), requestHeaders.get("host"), siteUrl)) return null;
  return verifyAdminAuthorization(true);
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

type WritingMutationResult =
  | { updatedAt: string; slug?: string; status: "draft" }
  | { updatedAt: string; slug: string; status: "published" };

function parseWritingMutationResult(data: unknown): WritingMutationResult | null {
  const row = Array.isArray(data) ? data[0] as { updated_at?: unknown; slug?: unknown; status?: unknown } | undefined : undefined;
  if (
    typeof row?.updated_at !== "string"
    || Number.isNaN(Date.parse(row.updated_at))
    || (row.status !== "draft" && row.status !== "published")
    || (row.slug !== null && row.slug !== undefined && typeof row.slug !== "string")
    || (row.status === "published" && (typeof row.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(row.slug)))
  ) return null;

  if (row.status === "published") return { updatedAt: row.updated_at, slug: row.slug as string, status: row.status };
  return { updatedAt: row.updated_at, slug: typeof row.slug === "string" ? row.slug : undefined, status: row.status };
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
    p_topics: input.topics,
  };
  const request = mode === "publish"
    ? authorization.supabase.rpc("publish_writing_article_v2", { ...parameters, p_slug_base: createWritingSlugBase(input.title) })
    : authorization.supabase.rpc("save_writing_draft_v2", parameters);
  const { data, error } = await request;
  const result = parseWritingMutationResult(data);
  if (error || !result || (mode === "save" && result.status !== "draft") || (mode === "publish" && result.status !== "published")) {
    const conflict = error?.message?.includes("WRITING_STALE_OR_MISSING") ?? false;
    return { ok: false, code: conflict ? "conflict" : "error", message: conflict ? "Conflict: this article changed elsewhere. Reload before continuing." : "Saving failed. Please try again." };
  }

  invalidateWritingStudio(articleId);
  if (result.status === "published") invalidatePublishedWriting(result.slug);
  return {
    ok: true,
    message: mode === "publish" ? "Published article updated." : "Draft saved.",
    updatedAt: result.updatedAt,
    slug: result.slug,
  };
}

export async function saveWritingAction(_state: WritingActionState, formData: FormData) {
  return persistWriting("save", formData);
}

export async function publishWritingAction(_state: WritingActionState, formData: FormData) {
  return persistWriting("publish", formData);
}
