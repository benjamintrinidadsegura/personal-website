import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  accountAuthStorageKey,
  authCookieOptions,
  getSupabaseAuthStorageKey,
  isSupabaseAuthCookie,
  legacyAdminCookieOptions,
  rootAuthCookieOptions,
} from "@/lib/supabase/auth-cookies";
import { defaultLocale, isLocale, localeHeaderName } from "@/lib/i18n/config";
import { getRequestLocaleRouting, isLocaleAwarePublicPath } from "@/lib/i18n/routing";

type CookieItem = { name: string; value: string; options: CookieOptions };
type LocaleRouting = ReturnType<typeof getRequestLocaleRouting>;
const internalLocaleHeaderName = "x-bts-internal-rewrite-locale";

function createResponse(request: NextRequest, routing: LocaleRouting, shouldRewrite: boolean) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeHeaderName, routing.locale);
  if (shouldRewrite) requestHeaders.set(internalLocaleHeaderName, routing.locale);
  else requestHeaders.delete(internalLocaleHeaderName);
  const response = shouldRewrite
    ? NextResponse.rewrite(new URL(`${routing.internalPathname}${request.nextUrl.search}`, request.url), { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Language", routing.locale);
  return response;
}

function applyResponseHeaders(response: NextResponse, headers: Record<string, string>) {
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
}

export async function proxy(request: NextRequest) {
  const pathnameRouting = getRequestLocaleRouting(request.nextUrl.pathname);
  const propagatedLocale = request.headers.get(internalLocaleHeaderName);
  const isInternalLocaleRewrite = pathnameRouting.locale === defaultLocale
    && isLocale(propagatedLocale)
    && isLocaleAwarePublicPath(pathnameRouting.internalPathname);
  const localeRouting = isInternalLocaleRewrite
    ? { ...pathnameRouting, locale: propagatedLocale }
    : pathnameRouting;
  const shouldRewrite = !isInternalLocaleRewrite
    && pathnameRouting.locale !== defaultLocale
    && isLocaleAwarePublicPath(pathnameRouting.internalPathname);
  const securityPathname = localeRouting.internalPathname;
  if (localeRouting.canonicalRedirect) {
    const destination = request.nextUrl.clone();
    destination.pathname = localeRouting.canonicalRedirect;
    const response = NextResponse.redirect(destination, 308);
    response.headers.set("Content-Language", defaultLocale);
    return response;
  }

  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return createResponse(request, localeRouting, shouldRewrite);

  const initialRootCookieNames = request.cookies.getAll()
    .filter(({ name }) => isSupabaseAuthCookie(name, accountAuthStorageKey))
    .map(({ name }) => name);
  let response = createResponse(request, localeRouting, shouldRewrite);
  const setCookies = (items: CookieItem[], responseHeaders: Record<string, string>) => {
    for (const { name, value } of items) request.cookies.set(name, value);
    response = createResponse(request, localeRouting, shouldRewrite);
    for (const { name, value, options } of items) {
      response.cookies.set(name, value, { ...options, ...rootAuthCookieOptions });
    }
    applyResponseHeaders(response, responseHeaders);
  };

  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: authCookieOptions,
    cookies: { getAll: () => request.cookies.getAll(), setAll: setCookies },
  });
  let { data } = await supabase.auth.getUser();

  const legacyStorageKey = getSupabaseAuthStorageKey(url);
  const legacyCookies = legacyStorageKey
    ? request.cookies.getAll().filter(({ name }) => isSupabaseAuthCookie(name, legacyStorageKey))
    : [];

  if (!data.user && securityPathname.startsWith("/admin") && legacyStorageKey && legacyCookies.length > 0) {
    const setLegacyCookies = (items: CookieItem[], responseHeaders: Record<string, string>) => {
      for (const { name, value } of items) request.cookies.set(name, value);
      response = createResponse(request, localeRouting, shouldRewrite);
      for (const { name, value, options } of items) {
        response.cookies.set(name, value, { ...options, ...legacyAdminCookieOptions });
      }
      applyResponseHeaders(response, responseHeaders);
    };
    const legacySupabase = createServerClient(url, publishableKey, {
      cookieOptions: legacyAdminCookieOptions,
      cookies: { getAll: () => request.cookies.getAll(), setAll: setLegacyCookies },
    });
    const legacyResult = await legacySupabase.auth.getUser();

    if (legacyResult.data.user) {
      const refreshedLegacyCookies = request.cookies.getAll()
        .filter(({ name, value }) => value.length > 0 && isSupabaseAuthCookie(name, legacyStorageKey));
      const migratedRootNames = new Set<string>();
      for (const cookie of refreshedLegacyCookies) {
        const suffix = cookie.name.slice(legacyStorageKey.length);
        const rootName = `${accountAuthStorageKey}${suffix}`;
        migratedRootNames.add(rootName);
        request.cookies.set(rootName, cookie.value);
      }
      response = createResponse(request, localeRouting, shouldRewrite);
      for (const cookie of refreshedLegacyCookies) {
        const suffix = cookie.name.slice(legacyStorageKey.length);
        response.cookies.set(`${accountAuthStorageKey}${suffix}`, cookie.value, rootAuthCookieOptions);
      }
      for (const name of initialRootCookieNames) {
        if (!migratedRootNames.has(name)) {
          response.cookies.set(name, "", { ...rootAuthCookieOptions, maxAge: 0 });
        }
      }
      response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
      data = legacyResult.data;
    }
  }

  if (securityPathname.startsWith("/admin") && legacyStorageKey) {
    const cookiesToClear = request.cookies.getAll()
      .filter(({ name }) => isSupabaseAuthCookie(name, legacyStorageKey));
    for (const { name } of cookiesToClear) {
      response.cookies.set(name, "", { ...legacyAdminCookieOptions, maxAge: 0 });
    }
  }

  if (
    securityPathname.startsWith("/admin")
    && securityPathname !== "/admin/login"
    && !data.user
  ) {
    const redirectResponse = NextResponse.redirect(new URL("/account/login", request.url));
    for (const cookie of response.cookies.getAll()) redirectResponse.cookies.set(cookie);
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(header);
      if (value) redirectResponse.headers.set(header, value);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff2?|ttf)$).*)",
  ],
};
