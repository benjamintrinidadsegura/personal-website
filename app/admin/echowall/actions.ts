"use server";

import { updateTag, revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { verifyAdminAuthorization } from "@/lib/admin/authorization";
import { isAllowedRequestOrigin } from "@/lib/echowall/security";
import type { AdminActionResult, EchoModerationEvent, EchoStatus, ModerationAction } from "@/types/echowall";

async function authorizeAction() {
  const requestHeaders = await headers();
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl || !isAllowedRequestOrigin(requestHeaders.get("origin"), requestHeaders.get("host"), siteUrl)) return null;
  return verifyAdminAuthorization(true);
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

export async function moderateEchoAction(formData: FormData): Promise<AdminActionResult> {
  const authorization = await authorizeAction();
  if (!authorization) return { ok: false, message: "Aktion nicht möglich." };
  const echoId = formData.get("echoId");
  const action = formData.get("action");
  const expectedStatus = formData.get("expectedStatus");
  const reasonValue = formData.get("reason");
  const confirmation = formData.get("confirmation");
  const actions: ModerationAction[] = ["approve", "reject", "hide", "restore", "delete", "restore_deleted"];
  const statuses: EchoStatus[] = ["pending", "approved", "rejected", "hidden", "deleted"];
  if (!validUuid(echoId) || typeof action !== "string" || !actions.includes(action as ModerationAction) ||
      typeof expectedStatus !== "string" || !statuses.includes(expectedStatus as EchoStatus) || typeof reasonValue !== "string" ||
      (action === "delete" && confirmation !== "DELETE")) return { ok: false, message: "Ungültige Eingabe." };
  const reason = reasonValue.trim();
  if (reason.length > 500 || (["reject", "hide", "delete", "restore_deleted"].includes(action) && reason.length < 5)) return { ok: false, message: "Bitte einen Grund mit 5 bis 500 Zeichen angeben." };

  const { data, error } = await authorization.supabase.rpc("moderate_echo", {
    p_echo_id: echoId,
    p_action: action,
    p_expected_status: expectedStatus,
    p_reason: reason || null,
  });
  if (error || !Array.isArray(data) || data.length !== 1) return { ok: false, message: "Aktion konnte nicht abgeschlossen werden. Bitte Ansicht aktualisieren." };
  const row = data[0] as { new_status?: EchoStatus; public_changed?: boolean };
  if (row.public_changed) {
    updateTag("approved-echoes");
    revalidatePath("/echowall");
    revalidatePath("/");
  }
  revalidatePath("/admin/echowall");
  return { ok: true, publicChanged: row.public_changed === true, newStatus: row.new_status };
}

export async function revealPrivateContact(echoId: string) {
  const authorization = await authorizeAction();
  if (!authorization || !validUuid(echoId)) return { ok: false as const, message: "Kontakt nicht verfügbar." };
  const { data, error } = await authorization.supabase.rpc("get_echo_private_contact", { p_echo_id: echoId });
  if (error || !Array.isArray(data)) return { ok: false as const, message: "Kontakt nicht verfügbar." };
  const email = (data[0] as { email?: unknown } | undefined)?.email;
  return typeof email === "string" ? { ok: true as const, email } : { ok: false as const, message: "Kein privater Kontakt hinterlegt." };
}

export async function loadModerationHistory(echoId: string) {
  const authorization = await authorizeAction();
  if (!authorization || !validUuid(echoId)) return { ok: false as const, message: "Historie nicht verfügbar." };
  const { data, error } = await authorization.supabase.rpc("get_echo_moderation_history", { p_echo_id: echoId });
  return error || !Array.isArray(data)
    ? { ok: false as const, message: "Historie nicht verfügbar." }
    : { ok: true as const, events: data as EchoModerationEvent[] };
}
