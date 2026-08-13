import "server-only";

import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { resolveAccount, type ResolvedAccount } from "@/lib/account/state";

type AdminAuthorization = {
  user: User;
  supabase: ResolvedAccount["supabase"];
  aal: "aal1" | "aal2";
};

export async function verifyAdminAuthorization(
  requireAal2 = true,
): Promise<AdminAuthorization | null> {
  try {
    const account = await resolveAccount();
    if (account.state.kind !== "admin" || !account.user) return null;
    if (requireAal2 && account.state.aal !== "aal2") return null;
    return { ...account, user: account.user, aal: account.state.aal };
  } catch {
    return null;
  }
}

export async function requireAdminPage(requireAal2 = true) {
  let account: Awaited<ReturnType<typeof resolveAccount>>;
  try {
    account = await resolveAccount();
  } catch {
    redirect("/account/login");
  }

  if (account.state.kind === "anonymous") redirect("/account/login");
  if (account.state.kind !== "admin" || !account.user) notFound();
  if (requireAal2 && account.state.aal !== "aal2") redirect("/admin/mfa");

  return { ...account, user: account.user, aal: account.state.aal };
}
