import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { processEchoSubmission } from "../app/echowall/actions";
import {
  constantTimeEqual,
  createContextHash,
  createDeletionReference,
  createFormToken,
  verifyFormToken,
} from "../lib/echowall/security";
import { validateEchoSubmission } from "../lib/echowall/validation";
import type { RawEchoSubmission } from "../types/echowall";

const NOW = Date.UTC(2026, 6, 21, 12, 0, 0);
const FORM_SECRET = "form-secret-used-only-in-tests";
const IP_SECRET = "ip-secret-used-only-in-tests";

function validRaw(overrides: Partial<RawEchoSubmission> = {}): RawEchoSubmission {
  return {
    displayName: "Benjamin",
    message: "Eine sichere EchoWall Nachricht.",
    category: "thought",
    email: "person@example.com",
    consent: "true",
    website: "",
    formToken: createFormToken(FORM_SECRET, NOW - 4_000),
    ...overrides,
  };
}

const request = {
  origin: "http://localhost:3000",
  host: "localhost:3000",
  networkIdentifier: "192.0.2.1",
};

const secrets = {
  ipHashSecret: IP_SECRET,
  formTokenSecret: FORM_SECRET,
  siteUrl: "http://localhost:3000",
};

test("validation accepts exact lower and upper character boundaries", () => {
  assert.equal(validateEchoSubmission(validRaw({ displayName: "AB", message: "1234567890" })).success, true);
  assert.equal(validateEchoSubmission(validRaw({ displayName: "A".repeat(40), message: "x".repeat(500) })).success, true);
  assert.equal(validateEchoSubmission(validRaw({ displayName: "A", message: "1234567890" })).success, false);
  assert.equal(validateEchoSubmission(validRaw({ displayName: "A".repeat(41) })).success, false);
  assert.equal(validateEchoSubmission(validRaw({ message: "123456789" })).success, false);
  assert.equal(validateEchoSubmission(validRaw({ message: "x".repeat(501) })).success, false);
});

test("validation trims whitespace, normalizes NFC, and accepts Unicode and emoji", () => {
  const result = validateEchoSubmission(validRaw({
    displayName: "  Evgeny 👋  ",
    message: "  Cafe\u0301 und Entwicklung 🚀  ",
  }));
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.displayName, "Evgeny 👋");
    assert.equal(result.data.message, "Café und Entwicklung 🚀");
  }
  assert.equal(validateEchoSubmission(validRaw({ displayName: "   " })).success, false);
});

test("validation enforces categories, email length, consent, HTML, URLs, and controls", () => {
  for (const category of ["thought", "feedback", "reaction", "message"]) {
    assert.equal(validateEchoSubmission(validRaw({ category })).success, true);
  }
  assert.equal(validateEchoSubmission(validRaw({ category: "unknown" })).success, false);
  assert.equal(validateEchoSubmission(validRaw({ category: "" })).success, true);
  assert.equal(validateEchoSubmission(validRaw({ email: `${"a".repeat(242)}@example.com` })).success, true);
  assert.equal(validateEchoSubmission(validRaw({ email: `${"a".repeat(243)}@example.com` })).success, false);
  assert.equal(validateEchoSubmission(validRaw({ consent: "false" })).success, false);
  assert.equal(validateEchoSubmission(validRaw({ message: "Hallo <strong>Welt</strong>" })).success, false);
  assert.equal(validateEchoSubmission(validRaw({ message: "Besuche https://example.com" })).success, false);
  assert.equal(validateEchoSubmission(validRaw({ message: "Besuche example.com heute" })).success, false);
  assert.equal(validateEchoSubmission(validRaw({ message: "Kontroll\u0007zeichen hier" })).success, false);
  assert.equal(validateEchoSubmission(validRaw({ message: "**Markdown** bleibt normaler Text." })).success, true);
});

test("honeypot must exist and remain empty", () => {
  const filled = validateEchoSubmission(validRaw({ website: "bot" }));
  const missing = validateEchoSubmission(validRaw({ website: null }));
  assert.equal(filled.success, false);
  assert.equal(missing.success, false);
  if (!filled.success) assert.equal(filled.isHoneypot, true);
});

test("form tokens verify signatures, age, expiry, encoding, and manipulation", () => {
  const token = createFormToken(FORM_SECRET, NOW - 4_000);
  assert.equal(verifyFormToken(token, FORM_SECRET, NOW).valid, true);
  assert.deepEqual(verifyFormToken(createFormToken(FORM_SECRET, NOW - 1_000), FORM_SECRET, NOW), { valid: false, reason: "too-young" });
  assert.equal(verifyFormToken(createFormToken(FORM_SECRET, NOW - 7_200_001), FORM_SECRET, NOW).valid, false);
  assert.equal(verifyFormToken(`${token}x`, FORM_SECRET, NOW).valid, false);
  assert.equal(verifyFormToken("not-base64.not-a-signature", FORM_SECRET, NOW).valid, false);
  assert.equal(verifyFormToken(token, "wrong-secret", NOW).valid, false);
});

test("constant comparison and HMAC context separation are stable", () => {
  assert.equal(constantTimeEqual("same", "same"), true);
  assert.equal(constantTimeEqual("same", "different"), false);
  const value = "same-value";
  const hashes = new Set([
    createContextHash("network", value, IP_SECRET),
    createContextHash("email", value, IP_SECRET),
    createContextHash("message", value, IP_SECRET),
  ]);
  assert.equal(hashes.size, 3);
  for (const hash of hashes) assert.equal(hash.includes(value), false);
});

test("deletion references are readable, unique, and contain no secret", () => {
  const first = createDeletionReference();
  const second = createDeletionReference();
  assert.match(first, /^ECHO-(?:[A-Z2-9]{4}-){7}[A-Z2-9]{4}$/u);
  assert.notEqual(first, second);
  assert.equal(first.includes(FORM_SECRET), false);
});

test("submission returns only controlled success data", async () => {
  let captured: Record<string, unknown> | null = null;
  const result = await processEchoSubmission(
    validRaw(),
    request,
    secrets,
    async (submission) => {
      captured = submission;
      return { echoId: "4ce0bb63-60c5-45f2-916d-7f930df832e6" };
    },
    NOW,
  );
  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result).sort(), ["deletionReference", "ok"]);
  assert.equal(JSON.stringify(result).includes("person@example.com"), false);
  assert.equal(JSON.stringify(result).includes("Eine sichere"), false);
  assert.equal(typeof (captured as Record<string, unknown> | null)?.networkHash, "string");
  assert.notEqual(
    (captured as Record<string, unknown> | null)?.formTokenHash,
    validRaw().formToken,
  );
});

test("submission returns controlled validation errors without private input", async () => {
  const result = await processEchoSubmission(
    validRaw({ message: "short", email: "private@example.com" }),
    request,
    secrets,
    async () => ({ echoId: "unexpected" }),
    NOW,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "INVALID_INPUT");
  assert.equal(JSON.stringify(result).includes("private@example.com"), false);
  assert.equal(JSON.stringify(result).includes("short"), false);
});

test("submission rejects honeypots and invalid origins before database access", async () => {
  let calls = 0;
  const database = async () => {
    calls += 1;
    return { echoId: "unexpected" };
  };
  assert.deepEqual(await processEchoSubmission(validRaw({ website: "bot" }), request, secrets, database, NOW), { ok: false, code: "INVALID_REQUEST" });
  assert.deepEqual(await processEchoSubmission(validRaw(), { ...request, origin: "https://evil.example" }, secrets, database, NOW), { ok: false, code: "INVALID_REQUEST" });
  assert.equal(calls, 0);
});

test("submission maps configuration, database, replay, rate, and duplicate failures", async () => {
  assert.deepEqual(await processEchoSubmission(validRaw(), request, null, async () => ({ echoId: null }), NOW), { ok: false, code: "SERVICE_UNAVAILABLE" });
  for (const [databaseCode, actionCode] of [
    ["ECHOWALL_TOKEN_REPLAY", "INVALID_FORM_TOKEN"],
    ["ECHOWALL_RATE_15", "RATE_LIMITED"],
    ["ECHOWALL_RATE_24", "RATE_LIMITED"],
    ["ECHOWALL_DUPLICATE", "DUPLICATE"],
    ["sensitive SQL detail", "SERVICE_UNAVAILABLE"],
  ] as const) {
    const result = await processEchoSubmission(validRaw(), request, secrets, async () => ({ echoId: null, errorCode: databaseCode }), NOW);
    assert.deepEqual(result, { ok: false, code: actionCode });
    assert.equal(JSON.stringify(result).includes("sensitive SQL detail"), false);
  }
});

test("submission catches database exceptions without returning private input", async () => {
  const result = await processEchoSubmission(validRaw(), request, secrets, async () => {
    throw new Error("SQL failed for person@example.com and included message text");
  }, NOW);
  assert.deepEqual(result, { ok: false, code: "SERVICE_UNAVAILABLE" });
  assert.equal(JSON.stringify(result).includes("person@example.com"), false);
});

test("admin moderation migration enforces the allowlist, aal2, locks, and exact grants", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/20260723000000_echowall_admin_moderation.sql", import.meta.url),
    "utf8",
  );
  for (const required of [
    "create table public.admin_users",
    "references auth.users",
    "enable row level security",
    "auth.uid()",
    "auth.jwt() ->> 'aal'",
    "for update",
    "get_admin_context",
    "list_echoes_for_moderation",
    "get_echo_private_contact",
    "get_echo_moderation_history",
    "moderate_echo",
  ]) assert.equal(sql.toLowerCase().includes(required), true, required);
  assert.equal(/grant\s+all/iu.test(sql), false);
  assert.equal(/grant\s+(select|insert|update|delete)\s+on\s+table/iu.test(sql), false);
  assert.equal(sql.includes("SUPABASE_SECRET_KEY"), false);
});

test("admin status machine contains all and only approved transitions", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/20260723000000_echowall_admin_moderation.sql", import.meta.url),
    "utf8",
  );
  const transitions = [
    ["pending", "approve", "approved"], ["pending", "reject", "rejected"],
    ["pending", "delete", "deleted"], ["approved", "hide", "hidden"],
    ["approved", "delete", "deleted"], ["hidden", "restore", "approved"],
    ["hidden", "delete", "deleted"], ["rejected", "delete", "deleted"],
  ];
  for (const [from, action, to] of transitions) {
    assert.match(sql, new RegExp(`v_current = '${from}' and v_action = '${action}' then '${to}'`, "u"));
  }
  assert.equal((sql.match(/when v_current = /gu) ?? []).length, transitions.length);
});

test("deleted recovery migration is private, audited, and never directly public", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/20260723010000_echowall_deleted_recovery.sql", import.meta.url),
    "utf8",
  );
  const normalized = sql.toLowerCase();
  for (const required of [
    "'deleted' and v_action = 'restore_deleted' then 'hidden'",
    "v_action in ('reject', 'hide', 'delete', 'restore_deleted')",
    "for update",
    "when v_action = 'restore_deleted' then null",
    "deleted_at = case when v_new = 'deleted' then v_now else null end",
    "from public, anon, authenticated",
    "to authenticated",
  ]) assert.equal(normalized.includes(required), true, required);
  assert.equal(normalized.includes("'deleted' and v_action = 'approve'"), false);
  assert.equal(/grant\s+all/iu.test(sql), false);
  assert.equal(/grant\s+(select|insert|update|delete)\s+on\s+table/iu.test(sql), false);
  assert.equal(normalized.includes("to service_role"), false);
});

test("public navigation keeps Projects and robust Pulse and EchoWall links", () => {
  const header = readFileSync(
    new URL("../components/layout/header.tsx", import.meta.url),
    "utf8",
  );
  assert.equal(header.includes('{ label: "Pulse", href: "/#pulse" }'), true);
  assert.match(header, /label: "Projects",\s+href: "\/#building"/u);
  assert.equal(header.includes('{ label: "EchoWall", href: "/echowall" }'), true);
  assert.equal(header.includes('href: "#pulse"'), false);
});

test("application hardening config sets only the approved global headers and body limit", () => {
  const config = readFileSync(
    new URL("../next.config.ts", import.meta.url),
    "utf8",
  );
  const lower = config.toLowerCase();

  for (const required of [
    'key: "x-content-type-options", value: "nosniff"',
    'key: "referrer-policy", value: "strict-origin-when-cross-origin"',
    'value: "camera=(), microphone=(), geolocation=()"',
    'key: "x-frame-options", value: "deny"',
    'key: "content-security-policy", value: "frame-ancestors \'none\';"',
    'bodysizelimit: "192kb"',
    'source: "/:path*"',
  ]) {
    assert.equal(lower.includes(required), true, required);
  }

  assert.equal(lower.includes("strict-transport-security"), false);
  assert.equal(lower.includes("script-src"), false);
  assert.equal(lower.includes("style-src"), false);
  assert.equal(lower.includes("img-src"), false);
  assert.equal(lower.includes("cross-origin-opener-policy"), false);
  assert.equal(lower.includes("cross-origin-embedder-policy"), false);
  assert.equal(lower.includes("cross-origin-resource-policy"), false);
  assert.equal(lower.includes("x-xss-protection"), false);
  assert.equal(lower.includes("allowedorigins"), false);

  const permissions = config.match(/key: "Permissions-Policy",\s*value: "([^"]+)"/u);
  assert.equal(permissions?.[1]?.includes("*"), false);
});

test("robots metadata route is canonical-production-only and blocks all admin routes", () => {
  const robots = readFileSync(
    new URL("../app/robots.ts", import.meta.url),
    "utf8",
  );
  const lower = robots.toLowerCase();

  for (const required of [
    'process.env.node_env !== "production"',
    "process.env.site_url",
    'url.protocol !== "https:"',
    "url.hostname !== siteconfig.domain",
    'disallow: "/admin"',
    'disallow: "/"',
    'new url("/sitemap.xml", siteurl)',
    "robots.txt ist kein zugriffsschutz",
    "auth, allowlist, rolle, aktivstatus und aal2",
  ]) {
    assert.equal(lower.includes(required), true, required);
  }

  assert.equal(lower.includes("localhost"), false);
  assert.equal(lower.includes("vercel.app"), false);
  assert.equal(lower.includes("netlify.app"), false);
  assert.equal(robots.includes("SUPABASE_SECRET_KEY"), false);
});

test("robots and sitemap fail closed and expose only canonical production routes", async () => {
  const previousSiteUrl = process.env.SITE_URL;
  const previousNodeEnv = process.env.NODE_ENV;

  try {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
      enumerable: true,
      writable: true,
    });
    const { default: createRobots } = await import("../app/robots");
    const { createSitemap } = await import("../app/sitemap");

    const isBlocked = async () => {
      const result = createRobots();
      const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
      return rules.some((rule) => rule.disallow === "/") &&
        result.host === undefined && result.sitemap === undefined &&
        createSitemap([]).length === 0;
    };

    for (const siteUrl of [undefined, "not-a-url", "https://preview.invalid"]) {
      if (siteUrl === undefined) delete process.env.SITE_URL;
      else process.env.SITE_URL = siteUrl;
      assert.equal(await isBlocked(), true, siteUrl ?? "missing SITE_URL");
    }

    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      configurable: true,
      enumerable: true,
      writable: true,
    });
    process.env.SITE_URL = "https://bts.online";
    assert.equal(await isBlocked(), true, "development");

    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
      enumerable: true,
      writable: true,
    });
    process.env.SITE_URL = "https://bts.online";
    const productionRobots = createRobots();
    const productionRules = Array.isArray(productionRobots.rules)
      ? productionRobots.rules
      : [productionRobots.rules];
    assert.equal(productionRules.some(
      (rule) => rule.allow === "/" && rule.disallow === "/admin",
    ), true);
    assert.equal(typeof productionRobots.host, "string");
    assert.equal(typeof productionRobots.sitemap, "string");

    const entries = createSitemap([]).map(({ url }) => new URL(url).pathname);

    assert.deepEqual(entries, [
      "/",
      "/echowall",
      "/writing",
      "/newsletter",
      "/privacy",
      "/find-your-next-step",
      "/find-your-next-step/self",
      "/find-your-next-step/career",
      "/find-your-next-step/problem",
      "/find-your-next-step/idea",
      "/projects/goatrecrutainer",
      "/projects/ratecom",
      "/projects/hobbyswap",
      "/projects/streamory",
      "/projects/byc",
      "/projects/bts-online",
      "/goatrecrutainer/career-spotlight",
      "/goatrecrutainer/career-spotlight/evgeny-vinokurov",
    ]);
    assert.equal(entries.some((route) => route.startsWith("/admin")), false);
    assert.equal(entries.includes("/projects/influsa"), false);
  } finally {
    if (previousSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previousSiteUrl;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: previousNodeEnv,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }

  const source = readFileSync(
    new URL("../app/sitemap.ts", import.meta.url),
    "utf8",
  );
  assert.equal(source.includes("getPublishedWriting"), true);
  assert.equal(source.includes("lastModified"), false);
  assert.equal(source.includes("changeFrequency"), false);
  assert.equal(source.includes("priority"), false);
});

test("hardening preserves admin noindex, approved-only public reads, and server-only secrets", () => {
  for (const path of [
    "../app/admin/login/page.tsx",
    "../app/admin/mfa/page.tsx",
    "../app/admin/echowall/page.tsx",
  ]) {
    const page = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/u);
  }

  const query = readFileSync(
    new URL("../lib/echowall/queries.ts", import.meta.url),
    "utf8",
  );
  assert.equal(query.includes('.eq("status", "approved")'), true);
  assert.equal(query.includes('.not("approved_at", "is", null)'), true);

  const envExample = readFileSync(
    new URL("../.env.example", import.meta.url),
    "utf8",
  );
  for (const serverOnlyName of [
    "SUPABASE_SECRET_KEY",
    "ECHOWALL_IP_HASH_SECRET",
    "ECHOWALL_FORM_TOKEN_SECRET",
    "DATABASE_URL",
  ]) {
    assert.equal(envExample.includes(`NEXT_PUBLIC_${serverOnlyName}`), false);
  }
});
