import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { accountDictionaries } from "../data/i18n/account";
import { locales } from "../lib/i18n/config";

import {
  accountAuthStorageKey,
  getSupabaseAuthStorageKey,
  isSupabaseAuthCookie,
} from "../lib/supabase/auth-cookies";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("account state is minimal, server-only, verified, and fail closed", () => {
  const state = source("../lib/account/state.ts");
  assert.equal(state.includes('import "server-only"'), true);
  assert.equal(state.includes("supabase.auth.getUser()"), true);
  assert.equal(state.includes('supabase.rpc("get_admin_context")'), true);
  assert.equal(state.includes("getAuthenticatorAssuranceLevel()"), true);
  assert.equal(state.includes('{ kind: "anonymous" }'), true);
  assert.equal(state.includes('{ kind: "authenticated" }'), true);
  assert.equal(state.includes('{ kind: "admin"; aal: "aal1" | "aal2" }'), true);
  assert.equal(state.includes("email:"), false);
  assert.equal(state.includes("userId:"), false);
  assert.match(state, /if \(contextError[^\n]+return authenticated/u);
  assert.match(state, /if \(assuranceError[^\n]+return authenticated/u);
  assert.match(state, /catch \{\s*return \{ kind: "anonymous" \}/u);
});

test("generic login permits existing normal users and exposes no registration or social flow", () => {
  const page = source("../app/account/login/page.tsx");
  const form = source("../components/account/account-login-form.tsx");
  const actions = source("../app/account/actions.ts");
  const combined = `${page}\n${form}`;

  assert.equal(page.includes("accountTitles[locale]"), true);
  assert.equal(combined.includes("getAccountDictionary(locale)"), true);
  for (const forbidden of ["Admin Login", "Studio Login", "Sign up", "Register", "OAuth", "magic link", "Google", "GitHub"]) {
    assert.equal(combined.includes(forbidden), false, forbidden);
  }
  assert.equal(actions.includes("signInWithPassword"), true);
  assert.equal(actions.includes("verifyAdminAuthorization"), false);
  assert.equal(actions.includes("await supabase.auth.signOut();\n    return failure"), false);
  assert.equal(actions.includes('redirect(localizeHref("/", locale))'), true);
  assert.equal(actions.includes('redirect(account.state.aal === "aal2" ? "/admin" : "/admin/mfa")'), true);
  for (const openRedirectName of ["next", "returnTo", "callbackUrl"]) {
    assert.equal(actions.includes(`formData.get("${openRedirectName}")`), false, openRedirectName);
  }
});

test("account entry exposes complete controlled copy in every V1 locale", () => {
  const englishKeys = Object.keys(accountDictionaries.en).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(accountDictionaries[locale]).sort(), englishKeys, locale);
    for (const value of Object.values(accountDictionaries[locale])) assert.ok(value.trim().length > 0, locale);
  }
});

test("account menu exposes exactly the approved adaptive states and no draft mutation", () => {
  const menu = source("../components/account/account-menu.tsx");
  assert.equal(menu.includes('account.kind === "anonymous"'), true);
  assert.equal(menu.includes('href={href("/account/login")}'), true);
  assert.equal(menu.includes('account.kind === "admin"'), true);
  assert.equal(menu.includes('account.aal === "aal1"'), true);
  assert.equal(menu.includes("copy.account.verifyStudio"), true);
  assert.equal(menu.includes('href="/admin"'), true);
  assert.equal(menu.includes('href="/admin/writing"'), true);
  assert.equal(menu.includes('href="/admin/echowall"'), true);
  assert.equal(menu.includes("copy.account.editArticle"), true);
  assert.equal(menu.includes("createWritingDraftAction"), false);
  assert.equal(menu.includes("New Writing"), false);
  assert.equal(menu.includes("email"), false);
  assert.equal(menu.includes("user.id"), false);
});

test("live refresh removes stale privilege immediately and fails closed", () => {
  const menu = source("../components/account/account-menu.tsx");
  assert.equal(menu.includes("refreshAccountStateAction()"), true);
  assert.equal(menu.includes('current.kind === "anonymous" ? current : { kind: "authenticated" }'), true);
  assert.match(menu, /catch \{\s*setAccount\(\{ kind: "anonymous" \}\)/u);
});

test("root cookies use a distinct storage key and legacy admin cookies migrate without ambiguity", () => {
  const cookies = source("../lib/supabase/auth-cookies.ts");
  const authServer = source("../lib/supabase/auth-server.ts");
  const middleware = source("../proxy.ts");

  assert.equal(accountAuthStorageKey, "bts-account-auth-token");
  assert.equal(getSupabaseAuthStorageKey("https://project-ref.supabase.co"), "sb-project-ref-auth-token");
  assert.equal(isSupabaseAuthCookie("sb-project-ref-auth-token", "sb-project-ref-auth-token"), true);
  assert.equal(isSupabaseAuthCookie("sb-project-ref-auth-token.3", "sb-project-ref-auth-token"), true);
  assert.equal(isSupabaseAuthCookie("sb-other-auth-token", "sb-project-ref-auth-token"), false);
  assert.match(cookies, /rootAuthCookieOptions[\s\S]*path: "\/"/u);
  assert.match(cookies, /legacyAdminCookieOptions[\s\S]*path: "\/admin"/u);
  for (const sourceText of [cookies, authServer, middleware]) {
    assert.equal(sourceText.includes('sameSite: "lax"') || sourceText.includes("authCookieOptions"), true);
    assert.equal(sourceText.includes("httpOnly: true") || sourceText.includes("authCookieOptions"), true);
  }
  assert.equal(cookies.includes('secure: process.env.NODE_ENV === "production"'), true);
  assert.equal(middleware.includes("legacySupabase.auth.getUser()"), true);
  assert.ok(middleware.indexOf("legacyResult.data.user") < middleware.indexOf("request.cookies.set(rootName"));
  assert.equal(middleware.includes("initialRootCookieNames"), true);
  assert.equal(middleware.includes("migratedRootNames"), true);
  assert.equal(middleware.includes("legacyAdminCookieOptions, maxAge: 0"), true);
  assert.notEqual(accountAuthStorageKey, getSupabaseAuthStorageKey("https://project-ref.supabase.co"));
});

test("logout is a same-origin POST server action", () => {
  const actions = source("../app/account/actions.ts");
  const menu = source("../components/account/account-menu.tsx");
  assert.equal(actions.startsWith('"use server"'), true);
  assert.equal(actions.includes("isAllowedRequestOrigin"), true);
  assert.equal(actions.includes("clearLegacyAdminSession()"), true);
  assert.match(actions, /export async function logoutAction\(\)[\s\S]*if \(!\(await validRequest\(\)\)\)/u);
  assert.equal(menu.includes("<form action={logoutAction}"), true);
  assert.equal(menu.includes('href="/logout"'), false);
});

test("admin pages rely on the global account menu for logout", () => {
  const menu = source("../components/account/account-menu.tsx");
  assert.equal(menu.includes("<form action={logoutAction}"), true);
  for (const path of ["../app/admin/page.tsx", "../app/admin/echowall/page.tsx"]) {
    const page = source(path);
    assert.equal(page.includes("logoutAction"), false, path);
    assert.equal(page.includes(">Logout<"), false, path);
  }
});

test("admin routing distinguishes anonymous, normal, AAL1, and AAL2 without loops", () => {
  const authorization = source("../lib/admin/authorization.ts");
  const loginCompatibility = source("../app/admin/login/page.tsx");
  assert.equal(authorization.includes('account.state.kind === "anonymous"'), true);
  assert.equal(authorization.includes('redirect("/account/login")'), true);
  assert.equal(authorization.includes('account.state.kind !== "admin"'), true);
  assert.equal(authorization.includes("notFound()"), true);
  assert.equal(authorization.includes('account.state.aal !== "aal2"'), true);
  assert.equal(authorization.includes('redirect("/admin/mfa")'), true);
  assert.equal(authorization.includes('data.user ? "/admin/mfa"'), false);
  assert.equal(loginCompatibility.includes('redirect("/account/login")'), true);
});

test("contextual edit authorizes before resolving a published slug", () => {
  const route = source("../app/admin/writing/by-slug/[slug]/page.tsx");
  const authorizeAt = route.indexOf("await requireAdminPage(true)");
  const resolveAt = route.indexOf("getPublishedWritingBySlug(slug)");
  assert.ok(authorizeAt >= 0 && resolveAt > authorizeAt);
  assert.equal(route.includes("/^[a-z0-9]+(?:-[a-z0-9]+)*$/u"), true);
  assert.equal((route.match(/notFound\(\)/gu) ?? []).length, 2);
  assert.equal(route.includes("article.id"), true);
  assert.equal(route.includes("list_writing_articles"), false);
});

test("desktop and mobile account controls preserve accessibility and menu exclusivity", () => {
  const menu = source("../components/account/account-menu.tsx");
  const header = source("../components/layout/header.tsx");
  for (const required of [
    "aria-label={copy.accountMenuOpen}",
    "aria-expanded={open}",
    'aria-controls="desktop-account-menu"',
    'event.key !== "Escape"',
    'document.addEventListener("pointerdown"',
    "trigger.current?.focus()",
    'querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus()',
  ]) assert.equal(menu.includes(required), true, required);
  assert.equal(menu.includes('id="mobile-account-title"'), true);
  assert.equal(menu.includes("min-h-11"), true);
  assert.equal(header.includes("<AccountMenu initialState={accountState} mobile active={open}"), true);
  assert.equal(header.includes("setAccountOpen(false)"), true);
  assert.equal(header.includes("onOpening={() => setOpenDropdown(null)}"), true);
  assert.equal(header.includes("getFocusable"), true);
  assert.equal(header.includes("acquireScrollLock()"), true);
});
