import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export type AccountState =
  | { kind: "anonymous" }
  | { kind: "authenticated" }
  | { kind: "admin"; aal: "aal1" | "aal2" };

export type ResolvedAccount = {
  state: AccountState;
  user: User | null;
  supabase: SupabaseClient;
};

export async function resolveAccount(
  suppliedClient?: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>,
): Promise<ResolvedAccount> {
  const supabase = suppliedClient ?? await createSupabaseAuthServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { state: { kind: "anonymous" }, user: null, supabase };
  }

  const authenticated: ResolvedAccount = {
    state: { kind: "authenticated" },
    user: userData.user,
    supabase,
  };
  const { data: context, error: contextError } = await supabase.rpc("get_admin_context");
  if (contextError || !Array.isArray(context) || context.length !== 1) return authenticated;

  const row = context[0] as { role?: unknown; is_active?: unknown };
  if (row.role !== "admin" || row.is_active !== true) return authenticated;

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const aal = assurance?.currentLevel;
  if (assuranceError || (aal !== "aal1" && aal !== "aal2")) return authenticated;
  const resolvedAal: "aal1" | "aal2" = aal === "aal2" ? "aal2" : "aal1";

  return {
    state: { kind: "admin", aal: resolvedAal },
    user: userData.user,
    supabase,
  };
}

export async function getAccountState(): Promise<AccountState> {
  try {
    return (await resolveAccount()).state;
  } catch {
    return { kind: "anonymous" };
  }
}
