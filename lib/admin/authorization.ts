import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

type AdminAuthorization = {
  user: User;
  supabase: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>;
  aal: "aal1" | "aal2";
};

export async function verifyAdminAuthorization(
  requireAal2 = true,
): Promise<AdminAuthorization | null> {
  const supabase = await createSupabaseAuthServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data: context, error: contextError } = await supabase.rpc("get_admin_context");
  if (contextError || !Array.isArray(context) || context.length !== 1) return null;

  const row = context[0] as { role?: unknown; is_active?: unknown };
  if (row.role !== "admin" || row.is_active !== true) return null;

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const aal = assurance?.currentLevel;
  if (assuranceError || (aal !== "aal1" && aal !== "aal2")) return null;
  if (requireAal2 && aal !== "aal2") return null;

  return { user: userData.user, supabase, aal: aal as "aal1" | "aal2" };
}

export async function requireAdminPage(requireAal2 = true) {
  const authorization = await verifyAdminAuthorization(requireAal2);
  if (!authorization) {
    const supabase = await createSupabaseAuthServerClient();
    const { data } = await supabase.auth.getUser();
    redirect(data.user ? "/admin/mfa" : "/admin/login");
  }
  return authorization;
}
