import type { CookieOptions, CookieOptionsWithName } from "@supabase/ssr";

export const accountAuthStorageKey = "bts-account-auth-token";

export const rootAuthCookieOptions: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
};

export const authCookieOptions: CookieOptionsWithName = {
  ...rootAuthCookieOptions,
  name: accountAuthStorageKey,
};

export const legacyAdminCookieOptions: CookieOptions = {
  path: "/admin",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
};

export function getSupabaseAuthStorageKey(url: string): string | null {
  try {
    const projectReference = new URL(url).hostname.split(".")[0];
    return projectReference ? `sb-${projectReference}-auth-token` : null;
  } catch {
    return null;
  }
}

export function isSupabaseAuthCookie(name: string, storageKey: string): boolean {
  return name === storageKey || new RegExp(`^${escapeRegExp(storageKey)}\\.\\d+$`, "u").test(name);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
