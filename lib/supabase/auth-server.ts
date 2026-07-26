import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export class SupabaseAuthConfigurationError extends Error {
  constructor() {
    super("Admin authentication is not configured.");
    this.name = "SupabaseAuthConfigurationError";
  }
}

export const adminCookieOptions: CookieOptions = {
  path: "/admin",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
};

export async function createSupabaseAuthServerClient() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new SupabaseAuthConfigurationError();

  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookieOptions: adminCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, { ...options, ...adminCookieOptions });
          }
        } catch {
          // Server Components cannot write cookies. proxy.ts performs refreshes.
        }
      },
    },
  });
}
