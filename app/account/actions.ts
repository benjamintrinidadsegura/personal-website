"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAccountState, resolveAccount, type AccountState } from "@/lib/account/state";
import { processDisplayNameSetup } from "@/lib/account/profile";
import { isAllowedRequestOrigin } from "@/lib/echowall/security";
import { getSupabaseAuthStorageKey, legacyAdminCookieOptions } from "@/lib/supabase/auth-cookies";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import type { DisplayNameActionState } from "@/types/comments";
import { getLocale } from "@/lib/i18n/server";
import { localizeHref } from "@/lib/i18n/routing";
import { getAccountDictionary } from "@/data/i18n/account";

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
  const locale = await getLocale();
  const failure = { message: getAccountDictionary(locale).loginFailure };
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
    redirect(localizeHref("/", locale));
  }
  if (account.state.kind === "admin") {
    redirect(account.state.aal === "aal2" ? "/admin" : "/admin/mfa");
  }
  redirect(localizeHref("/", locale));
}

export async function logoutAction() {
  const locale = await getLocale();
  if (!(await validRequest())) redirect(localizeHref("/", locale));

  const supabase = await createSupabaseAuthServerClient();
  await supabase.auth.signOut();
  await clearLegacyAdminSession();
  redirect(localizeHref("/", locale));
}

export async function refreshAccountStateAction(): Promise<AccountState> {
  return getAccountState();
}

export async function setAccountDisplayNameAction(
  _state: DisplayNameActionState,
  formData: FormData,
): Promise<Exclude<DisplayNameActionState, null>> {
  const locale = await getLocale();
  let actorUserId: string | null = null;
  try {
    const auth = await createSupabaseAuthServerClient();
    const { data, error } = await auth.auth.getUser();
    if (!error && data.user) actorUserId = data.user.id;
  } catch {
    actorUserId = null;
  }

  return processDisplayNameSetup(
    formData.get("displayName"),
    actorUserId,
    await validRequest(),
    async (verifiedUserId, displayName) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("set_bts_account_display_name", {
        p_actor_user_id: verifiedUserId,
        p_display_name: displayName,
      });
      return !error && data === displayName;
    },
    locale,
  );
}
