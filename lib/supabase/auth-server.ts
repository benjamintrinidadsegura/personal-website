import "server-only";

import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { cookies } from "next/headers";

import { authCookieOptions, rootAuthCookieOptions } from "@/lib/supabase/auth-cookies";

export class SupabaseAuthConfigurationError extends Error {
  constructor() {
    super("Account authentication is not configured.");
    this.name = "SupabaseAuthConfigurationError";
  }
}

export const accountCookieOptions: CookieOptionsWithName = authCookieOptions;

export async function createSupabaseAuthServerClient() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new SupabaseAuthConfigurationError();

  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookieOptions: accountCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, { ...options, ...rootAuthCookieOptions });
          }
        } catch {
          // Server Components cannot write cookies. proxy.ts performs refreshes.
        }
      },
    },
  });
}
