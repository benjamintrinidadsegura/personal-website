"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAccountState, resolveAccount, type AccountState } from "@/lib/account/state";
import { isAllowedRequestOrigin } from "@/lib/echowall/security";
import { getSupabaseAuthStorageKey, legacyAdminCookieOptions } from "@/lib/supabase/auth-cookies";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export type AuthActionState = { message: string } | null;

async function validRequest() {
  const requestHeaders = await headers();
  const siteUrl = process.env.SITE_URL;
  return Boolean(siteUrl && isAllowedRequestOrigin(
    requestHeaders.get("origin"),
    requestHeaders.get("host"),
    siteUrl,
  ));
}

async function clearLegacyAdminSession() {
  const url = process.env.SUPABASE_URL;
  const storageKey = url ? getSupabaseAuthStorageKey(url) : null;
  if (!storageKey) return;

  const cookieStore = await cookies();
  const names = [storageKey, ...Array.from({ length: 8 }, (_, index) => `${storageKey}.${index}`)];
  for (const name of names) {
    cookieStore.set(name, "", { ...legacyAdminCookieOptions, maxAge: 0 });
  }
}

export async function loginAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const failure = { message: "Anmeldung nicht möglich." };
  if (!(await validRequest())) return failure;

  const email = formData.get("email");
  const password = formData.get("password");
  if (
    typeof email !== "string"
    || typeof password !== "string"
    || email.length > 254
    || password.length < 8
    || password.length > 256
  ) return failure;

  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return failure;
  await clearLegacyAdminSession();

  let account: Awaited<ReturnType<typeof resolveAccount>>;
  try {
    account = await resolveAccount(supabase);
  } catch {
    redirect("/");
  }
  if (account.state.kind === "admin") {
    redirect(account.state.aal === "aal2" ? "/admin" : "/admin/mfa");
  }
  redirect("/");
}

export async function logoutAction() {
  if (!(await validRequest())) redirect("/");

  const supabase = await createSupabaseAuthServerClient();
  await supabase.auth.signOut();
  await clearLegacyAdminSession();
  redirect("/");
}

export async function refreshAccountStateAction(): Promise<AccountState> {
  return getAccountState();
}
