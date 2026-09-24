"use server";

import { headers } from "next/headers";

import { processFeedbackSubmission } from "@/app/feedback/actions";
import { getLocale } from "@/lib/i18n/server";
import type { FeedbackActionState, RawFeedbackSubmission, SubmitFeedbackResult } from "@/types/feedback";

const resultFeedbackFields = new Set([
  "message",
  "resultProduct",
  "resultFit",
  "usefulnessCategory",
  "website",
  "formToken",
]);

function configuration() {
  const hashSecret = process.env.ECHOWALL_IP_HASH_SECRET;
  const formTokenSecret = process.env.ECHOWALL_FORM_TOKEN_SECRET;
  const siteUrl = process.env.SITE_URL;
  return hashSecret && formTokenSecret && siteUrl ? { hashSecret, formTokenSecret, siteUrl } : null;
}

export async function resultFeedbackSubmissionFromFormData(formData: FormData): Promise<RawFeedbackSubmission | null> {
  const keys = [...formData.keys()];
  if (keys.length !== resultFeedbackFields.size || new Set(keys).size !== resultFeedbackFields.size || keys.some((key) => !resultFeedbackFields.has(key))) return null;
  return {
    message: formData.get("message"),
    name: "",
    contactMethod: "",
    contactValue: "",
    sourceContext: "other",
    website: formData.get("website"),
    formToken: formData.get("formToken"),
    resultProduct: formData.get("resultProduct"),
    resultFit: formData.get("resultFit"),
    usefulnessCategory: formData.get("usefulnessCategory"),
  };
}

export async function submitResultFeedbackAction(
  _previousState: FeedbackActionState,
  formData: FormData,
): Promise<SubmitFeedbackResult> {
  const raw = await resultFeedbackSubmissionFromFormData(formData);
  if (!raw) return { ok: false, code: "INVALID_REQUEST" };
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const locale = await getLocale();
  return processFeedbackSubmission(
    raw,
    {
      origin: requestHeaders.get("origin"),
      host: requestHeaders.get("host"),
      networkIdentifier: requestHeaders.get("x-real-ip")?.trim() || forwardedFor || null,
    },
    configuration(),
    async (input) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("submit_private_feedback", {
        p_message: input.message || null,
        p_name: input.name,
        p_contact_method: input.contactMethod,
        p_contact_value: input.contactValue,
        p_source_context: input.sourceContext,
        p_result_product: input.resultProduct,
        p_result_fit: input.resultFit,
        p_usefulness_category: input.usefulnessCategory,
        p_locale: input.locale,
        p_network_hash: input.networkHash,
        p_form_token_hash: input.formTokenHash,
      });
      return { accepted: data === true, errorCode: error?.message };
    },
    Date.now(),
    locale,
  );
}
