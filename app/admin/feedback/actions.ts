"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { verifyAdminAuthorization } from "@/lib/admin/authorization";
import { isAllowedRequestOrigin } from "@/lib/feedback/security";
import {
  feedbackStatuses,
  type FeedbackAdminAction,
  type FeedbackAdminActionResult,
  type FeedbackStatus,
} from "@/types/feedback";

const actionFields = new Set(["feedbackId", "action", "expectedStatus", "confirmation"]);
const feedbackActions: FeedbackAdminAction[] = ["mark_read", "archive", "delete"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

async function authorizeAction() {
  const requestHeaders = await headers();
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl || !isAllowedRequestOrigin(requestHeaders.get("origin"), requestHeaders.get("host"), siteUrl)) return null;
  return verifyAdminAuthorization(true);
}

export async function manageFeedbackAction(
  _previousState: FeedbackAdminActionResult | null,
  formData: FormData,
): Promise<FeedbackAdminActionResult> {
  const keys = [...formData.keys()];
  if (
    keys.length !== actionFields.size
    || new Set(keys).size !== actionFields.size
    || keys.some((key) => !actionFields.has(key))
  ) return { ok: false, message: "Invalid action." };

  const feedbackId = formData.get("feedbackId");
  const action = formData.get("action");
  const expectedStatus = formData.get("expectedStatus");
  const confirmation = formData.get("confirmation");
  if (
    typeof feedbackId !== "string"
    || !uuidPattern.test(feedbackId)
    || typeof action !== "string"
    || !feedbackActions.includes(action as FeedbackAdminAction)
    || typeof expectedStatus !== "string"
    || !feedbackStatuses.includes(expectedStatus as FeedbackStatus)
    || typeof confirmation !== "string"
    || (action === "delete" && confirmation !== "DELETE")
  ) return { ok: false, message: "Invalid action." };

  const authorization = await authorizeAction();
  if (!authorization) return { ok: false, message: "Action not available." };

  const { data, error } = await authorization.supabase.rpc("manage_private_feedback", {
    p_feedback_id: feedbackId,
    p_action: action,
    p_expected_status: expectedStatus,
  });
  if (error || typeof data !== "string") {
    return { ok: false, message: "The action could not be completed. Refresh the page and try again." };
  }

  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${feedbackId}`);
  if (action === "delete") redirect("/admin/feedback?result=deleted");

  return {
    ok: true,
    message: action === "mark_read" ? "Marked as read." : "Archived.",
    newStatus: data as FeedbackStatus,
  };
}
