"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isAllowedRequestOrigin } from "@/lib/echowall/security";
import { verifyAdminAuthorization } from "@/lib/admin/authorization";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export type AuthActionState = { message: string } | null;
export type MfaActionState =
  | { message: string; factorId?: string; qrCode?: string }
  | null;

async function validRequest() {
  const requestHeaders = await headers();
  const siteUrl = process.env.SITE_URL;
  return Boolean(siteUrl && isAllowedRequestOrigin(
    requestHeaders.get("origin"),
    requestHeaders.get("host"),
    siteUrl,
  ));
}

export async function loginAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const failure = { message: "Anmeldung nicht möglich." };
  if (!(await validRequest())) return failure;
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" ||
      email.length > 254 || password.length < 8 || password.length > 256) return failure;

  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return failure;

  const authorization = await verifyAdminAuthorization(false);
  if (!authorization) {
    await supabase.auth.signOut();
    return failure;
  }
  redirect(authorization.aal === "aal2" ? "/admin/echowall" : "/admin/mfa");
}

export async function logoutAction() {
  if (!(await validRequest())) redirect("/admin/login");
  const supabase = await createSupabaseAuthServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function enrollMfaAction(): Promise<MfaActionState> {
  if (!(await validRequest()) || !(await verifyAdminAuthorization(false))) {
    return { message: "MFA konnte nicht vorbereitet werden." };
  }
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "bts.online EchoWall Admin",
  });
  if (error || !data.totp?.qr_code) return { message: "MFA konnte nicht vorbereitet werden." };
  return { message: "Authenticator einrichten.", factorId: data.id, qrCode: data.totp.qr_code };
}

export async function verifyMfaAction(
  _state: MfaActionState,
  formData: FormData,
): Promise<MfaActionState> {
  if (!(await validRequest()) || !(await verifyAdminAuthorization(false))) {
    return { message: "Bestätigung nicht möglich." };
  }
  const factorId = formData.get("factorId");
  const code = formData.get("code");
  if (typeof factorId !== "string" || typeof code !== "string" || !/^\d{6}$/u.test(code)) {
    return { message: "Bestätigung nicht möglich." };
  }
  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { message: "Bestätigung nicht möglich." };
  redirect("/admin/echowall");
}
