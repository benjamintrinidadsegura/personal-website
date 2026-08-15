"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { verifyAdminAuthorization } from "@/lib/admin/authorization";
import { newsletterDeliveryConfiguration, newsletterLifecycleConfiguration } from "@/lib/newsletter/config";
import { processNewsletterDeliveryBatch, type ClaimedNewsletterDelivery } from "@/lib/newsletter/delivery";
import { validNewsletterVersion, validateNewsletterEditionInput } from "@/lib/newsletter/edition-validation";
import { createBrevoNewsletterSender } from "@/lib/newsletter/provider";
import { createNewsletterEmailHash } from "@/lib/newsletter/security";
import { isAllowedRequestOrigin } from "@/lib/security/submission";
import type { NewsletterEditionActionState } from "@/types/newsletter";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

async function authorizeNewsletterMutation() {
  const requestHeaders = await headers();
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl || !isAllowedRequestOrigin(requestHeaders.get("origin"), requestHeaders.get("host"), siteUrl)) return null;
  return verifyAdminAuthorization(true);
}

function canonicalSiteOrigin(): string | null {
  try {
    const url = new URL(process.env.SITE_URL ?? "");
    if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function createNewsletterEditionAction(
  _state: NewsletterEditionActionState,
  formData: FormData,
): Promise<NewsletterEditionActionState> {
  const authorization = await authorizeNewsletterMutation();
  if (!authorization) return { ok: false, code: "error", message: "Action not allowed." };
  const validation = validateNewsletterEditionInput(formData);
  if (!validation.success) return { ok: false, code: "validation", message: "Review the edition details.", fieldErrors: validation.fieldErrors };
  const siteOrigin = canonicalSiteOrigin();
  if (!siteOrigin) return { ok: false, code: "configuration", message: "Newsletter configuration is unavailable." };
  const { data, error } = await authorization.supabase.rpc("create_newsletter_edition", {
    p_writing_article_id: validation.data.writingArticleId,
    p_subject: validation.data.subject,
    p_preheader: validation.data.preheader,
    p_introduction: validation.data.introduction,
    p_site_origin: siteOrigin,
  });
  if (error || typeof data !== "string" || !UUID_PATTERN.test(data)) {
    const draft = error?.message?.includes("NEWSLETTER_WRITING_NOT_PUBLISHED") ?? false;
    return { ok: false, code: draft ? "conflict" : "error", message: draft ? "That Writing article is no longer published." : "Edition creation failed safely." };
  }
  revalidatePath("/admin/newsletter");
  redirect(`/admin/newsletter/${data}`);
}

function mapClaim(row: unknown): ClaimedNewsletterDelivery | null {
  const value = Array.isArray(row) ? row[0] as Record<string, unknown> | undefined : undefined;
  if (!value) return null;
  const fields = ["delivery_id", "subscriber_id", "email", "unsubscribe_nonce", "subject", "preheader", "introduction", "article_title", "article_excerpt", "canonical_url"];
  if (!fields.every((field) => typeof value[field] === "string")) return null;
  return {
    deliveryId: value.delivery_id as string,
    subscriberId: value.subscriber_id as string,
    email: value.email as string,
    unsubscribeNonce: value.unsubscribe_nonce as string,
    subject: value.subject as string,
    preheader: value.preheader as string,
    introduction: value.introduction as string,
    articleTitle: value.article_title as string,
    articleExcerpt: value.article_excerpt as string,
    canonicalUrl: value.canonical_url as string,
  };
}

export async function sendNewsletterEditionAction(formData: FormData): Promise<void> {
  const authorization = await authorizeNewsletterMutation();
  if (!authorization) redirect("/admin");
  const editionId = formData.get("editionId");
  const expectedVersion = Number(formData.get("expectedVersion"));
  const confirmation = formData.get("confirmation");
  if (typeof editionId !== "string" || !UUID_PATTERN.test(editionId) || !validNewsletterVersion(expectedVersion) || confirmation !== "SEND") {
    redirect(`/admin/newsletter/${typeof editionId === "string" && UUID_PATTERN.test(editionId) ? editionId : ""}?send=invalid`);
  }
  const configuration = newsletterDeliveryConfiguration();
  if (!configuration) redirect(`/admin/newsletter/${editionId}?send=configuration`);
  const begin = await authorization.supabase.rpc("begin_newsletter_send", {
    p_edition_id: editionId,
    p_expected_version: expectedVersion,
  });
  if (begin.error) {
    const reason = begin.error.message.includes("NEWSLETTER_STALE_OR_MISSING") ? "conflict"
      : begin.error.message.includes("NEWSLETTER_NO_ELIGIBLE_RECIPIENTS") ? "empty" : "failed";
    redirect(`/admin/newsletter/${editionId}?send=${reason}`);
  }

  const database = {
    claim: async () => {
      const result = await authorization.supabase.rpc("claim_newsletter_delivery", { p_edition_id: editionId });
      if (result.error) throw new Error("newsletter claim failed");
      return mapClaim(result.data);
    },
    recheck: async (deliveryId: string) => {
      const result = await authorization.supabase.rpc("recheck_newsletter_delivery_eligibility", { p_delivery_id: deliveryId });
      return !result.error && result.data === true;
    },
    complete: async (deliveryId: string, outcome: "sent" | "failed" | "skipped" | "reconciliation_required", messageReference: string | null, failureCode: string | null) => {
      const result = await authorization.supabase.rpc("complete_newsletter_delivery", {
        p_delivery_id: deliveryId,
        p_outcome: outcome,
        p_provider_message_reference: messageReference,
        p_failure_code: failureCode,
      });
      return !result.error && result.data === true;
    },
    finish: async () => {
      const result = await authorization.supabase.rpc("finish_newsletter_send", { p_edition_id: editionId });
      return result.error || !["sending", "sent", "failed"].includes(String(result.data))
        ? null : result.data as "sending" | "sent" | "failed";
    },
  };
  let state: "sending" | "sent" | "failed" | null;
  try {
    state = (await processNewsletterDeliveryBatch(database, createBrevoNewsletterSender(configuration), configuration)).state;
  } catch {
    redirect(`/admin/newsletter/${editionId}?send=failed`);
  }
  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/${editionId}`);
  redirect(`/admin/newsletter/${editionId}?send=${state ?? "failed"}`);
}

export type NewsletterSupportState = {
  ok: boolean;
  message: string;
  record?: { email: string | null; status: string; requestedAt: string; confirmedAt: string | null; updatedAt: string };
} | null;

export async function lookupNewsletterSubscriberAction(_state: NewsletterSupportState, formData: FormData): Promise<NewsletterSupportState> {
  const authorization = await authorizeNewsletterMutation();
  const configuration = newsletterLifecycleConfiguration();
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")).normalize("NFC").trim().toLowerCase() : "";
  if (!authorization || !configuration || email.length < 3 || email.length > 254 || /[\r\n]/u.test(email)) return { ok: false, message: "Exact-address lookup unavailable." };
  const hash = createNewsletterEmailHash(email, configuration.hashSecret);
  const { data, error } = await authorization.supabase.rpc("lookup_newsletter_subscriber", { p_email_hash: hash });
  const row = Array.isArray(data) ? data[0] as Record<string, unknown> | undefined : undefined;
  if (error) return { ok: false, message: "Exact-address lookup unavailable." };
  if (!row) return { ok: true, message: "No matching subscription record." };
  return {
    ok: true,
    message: "Exact match found.",
    record: {
      email: typeof row.email === "string" ? row.email : null,
      status: String(row.status),
      requestedAt: String(row.requested_at),
      confirmedAt: typeof row.confirmed_at === "string" ? row.confirmed_at : null,
      updatedAt: String(row.updated_at),
    },
  };
}

export async function suppressNewsletterSubscriberAction(formData: FormData): Promise<void> {
  const authorization = await authorizeNewsletterMutation();
  const configuration = newsletterLifecycleConfiguration();
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")).normalize("NFC").trim().toLowerCase() : "";
  if (!authorization || !configuration || formData.get("confirmation") !== "SUPPRESS" || email.length < 3 || email.length > 254 || /[\r\n]/u.test(email)) {
    redirect("/admin/newsletter?support=invalid");
  }
  const { data, error } = await authorization.supabase.rpc("suppress_newsletter_subscriber", {
    p_email_hash: createNewsletterEmailHash(email, configuration.hashSecret),
  });
  revalidatePath("/admin/newsletter");
  redirect(`/admin/newsletter?support=${error ? "failed" : data === "suppressed" ? "suppressed" : "not-eligible"}`);
}
