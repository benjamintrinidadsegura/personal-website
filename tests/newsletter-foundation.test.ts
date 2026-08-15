import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  processNewsletterConfirmation,
  processNewsletterSubscription,
  processNewsletterUnsubscribe,
} from "../app/newsletter/actions";
import {
  NEWSLETTER_FROM_EMAIL,
  NEWSLETTER_REPLY_TO_EMAIL,
  newsletterLifecycleConfiguration,
  newsletterRuntimeConfiguration,
} from "../lib/newsletter/config";
import { NEWSLETTER_CONSENT_VERSION, newsletterConsentCopy, newsletterPromise } from "../lib/newsletter/domain";
import {
  createBrevoConfirmationSender,
  createConfirmationEmailContent,
  NEWSLETTER_PROVIDER_TIMEOUT_MS,
} from "../lib/newsletter/provider";
import {
  createNewsletterEmailHash,
  createNewsletterFormToken,
  createNewsletterUnsubscribeToken,
  hashNewsletterConfirmationToken,
  reduceNewsletterNetworkIdentifier,
  verifyNewsletterUnsubscribeToken,
} from "../lib/newsletter/security";
import { validateNewsletterSubscription } from "../lib/newsletter/validation";
import type { RawNewsletterSubscription } from "../types/newsletter";

const NOW = Date.UTC(2026, 7, 18, 12, 0, 0);
const FORM_SECRET = "newsletter-form-secret-used-only-in-tests";
const HASH_SECRET = "newsletter-hash-secret-used-only-in-tests";
const SUBSCRIBER_ID = "96ee55b8-bb8c-4ee5-8b35-a22733ce31ee";
const NONCE = "4d6e3f70-a0e4-48bb-9174-5a5f88f2cb9c";
const CONFIRMATION_TOKEN = "A".repeat(43);

function validRaw(overrides: Partial<RawNewsletterSubscription> = {}): RawNewsletterSubscription {
  return {
    email: "reader@example.com",
    consent: "on",
    website: "",
    formToken: createNewsletterFormToken(FORM_SECRET, NOW - 4_000),
    ...overrides,
  };
}

const request = {
  origin: "http://localhost:3000",
  host: "localhost:3000",
  networkIdentifier: "192.0.2.42",
};

const secrets = {
  siteUrl: "http://localhost:3000",
  formTokenSecret: FORM_SECRET,
  hashSecret: HASH_SECRET,
  consentVersion: NEWSLETTER_CONSENT_VERSION,
} as const;

test("newsletter email validation is normalized, bounded, and header-safe", () => {
  const valid = validateNewsletterSubscription(validRaw({ email: "  Reader@Example.COM  " }));
  assert.equal(valid.success, true);
  if (valid.success) assert.equal(valid.data.email, "reader@example.com");
  for (const email of [
    "missing-at.example.com",
    "missing-domain@",
    "a@b",
    `${"a".repeat(243)}@example.com`,
    "reader@example.com\r\nBcc: victim@example.com",
    "reader\u202e@example.com",
  ]) assert.equal(validateNewsletterSubscription(validRaw({ email })).success, false, email);
  assert.equal(validateNewsletterSubscription(validRaw({ email: `${"a".repeat(242)}@example.com` })).success, true);
});

test("newsletter validation requires explicit consent, a token, and an empty honeypot", () => {
  assert.equal(validateNewsletterSubscription(validRaw({ consent: null })).success, false);
  assert.equal(validateNewsletterSubscription(validRaw({ formToken: null })).success, false);
  for (const website of ["bot", null]) {
    const result = validateNewsletterSubscription(validRaw({ website }));
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.isHoneypot, true);
  }
  assert.equal(newsletterConsentCopy.en.includes("unsubscribe at any time"), true);
  assert.equal(newsletterConsentCopy.de.includes("jederzeit abmelden"), true);
  assert.equal(newsletterPromise.en.includes("No fixed schedule, no spam."), true);
});

test("newsletter tokens are purpose-bound and network identifiers are privacy-reduced", () => {
  assert.equal(reduceNewsletterNetworkIdentifier("192.0.2.42"), "192.0.2");
  assert.equal(reduceNewsletterNetworkIdentifier("2001:db8:1234:5678:aaaa:bbbb:cccc:dddd"), "2001:0db8:1234:5678::/64");
  assert.equal(reduceNewsletterNetworkIdentifier("not-an-ip"), null);
  const hash = createNewsletterEmailHash("reader@example.com", HASH_SECRET);
  assert.match(hash, /^[0-9a-f]{64}$/u);
  assert.equal(hash.includes("reader@example.com"), false);
  assert.notEqual(hash, hashNewsletterConfirmationToken(CONFIRMATION_TOKEN, HASH_SECRET));

  const unsubscribe = createNewsletterUnsubscribeToken(SUBSCRIBER_ID, NONCE, HASH_SECRET);
  assert.equal(typeof unsubscribe, "string");
  const verified = verifyNewsletterUnsubscribeToken(unsubscribe ?? "", HASH_SECRET);
  assert.deepEqual(verified, { valid: true, subscriberId: SUBSCRIBER_ID, nonce: NONCE });
  assert.equal(verifyNewsletterUnsubscribeToken(`${unsubscribe}x`, HASH_SECRET).valid, false);
  assert.equal(verifyNewsletterUnsubscribeToken(unsubscribe ?? "", "wrong-secret").valid, false);
  assert.equal((unsubscribe ?? "").includes("reader@example.com"), false);
});

test("runtime configuration fails closed until provider, tracking, sender, and legal gates are complete", () => {
  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    SITE_URL: "https://bts.online",
    NEWSLETTER_PUBLIC_ENABLED: "true",
    NEWSLETTER_LEGAL_READY: "true",
    NEWSLETTER_CONTROLLER_ADDRESS: "Verified controller address",
    NEWSLETTER_PROVIDER: "brevo",
    NEWSLETTER_FROM_EMAIL,
    NEWSLETTER_REPLY_TO_EMAIL,
    NEWSLETTER_FORM_TOKEN_SECRET: FORM_SECRET,
    NEWSLETTER_HASH_SECRET: HASH_SECRET,
    BREVO_API_KEY: "test-provider-key",
    BREVO_TRACKING_DISABLED: "true",
  };
  assert.equal(newsletterRuntimeConfiguration(environment)?.provider, "brevo");
  for (const key of [
    "NEWSLETTER_PUBLIC_ENABLED",
    "NEWSLETTER_LEGAL_READY",
    "NEWSLETTER_CONTROLLER_ADDRESS",
    "BREVO_API_KEY",
    "BREVO_TRACKING_DISABLED",
  ]) {
    const incomplete = { ...environment };
    delete incomplete[key];
    assert.equal(newsletterRuntimeConfiguration(incomplete), null, key);
  }
  assert.equal(newsletterRuntimeConfiguration({ ...environment, NEWSLETTER_FROM_EMAIL: "other@example.com" }), null);
  assert.deepEqual(newsletterLifecycleConfiguration({ NODE_ENV: "test", SITE_URL: "https://bts.online", NEWSLETTER_HASH_SECRET: HASH_SECRET }), {
    siteUrl: "https://bts.online",
    hashSecret: HASH_SECRET,
  });
});

test("subscription creates only hashed security metadata and returns enumeration-safe success", async () => {
  let databaseInput: Record<string, unknown> | null = null;
  let deliveredTo: string | null = null;
  const result = await processNewsletterSubscription(
    validRaw(),
    request,
    secrets,
    async (input) => {
      databaseInput = input;
      return { subscriberId: SUBSCRIBER_ID, shouldSend: true, confirmationExpiresAt: new Date(NOW + 86_400_000).toISOString() };
    },
    async (email) => { deliveredTo = email.to; return true; },
    NOW,
    () => CONFIRMATION_TOKEN,
  );
  assert.deepEqual(result, { ok: true });
  assert.equal(deliveredTo, "reader@example.com");
  const capturedInput = databaseInput as Record<string, unknown> | null;
  assert.equal(capturedInput?.email, "reader@example.com");
  for (const field of ["emailHash", "networkHash", "formTokenHash", "confirmationTokenHash"]) {
    assert.match(String(capturedInput?.[field]), /^[0-9a-f]{64}$/u, field);
  }
  assert.equal(JSON.stringify(result).includes("reader@example.com"), false);
});

test("duplicate/confirmed requests do not trigger mail and provider failure does not enumerate state", async () => {
  let sends = 0;
  const noSend = await processNewsletterSubscription(
    validRaw(), request, secrets,
    async () => ({ subscriberId: SUBSCRIBER_ID, shouldSend: false, confirmationExpiresAt: null }),
    async () => { sends += 1; return true; }, NOW, () => CONFIRMATION_TOKEN,
  );
  assert.deepEqual(noSend, { ok: true });
  assert.equal(sends, 0);
  const providerFailure = await processNewsletterSubscription(
    validRaw(), request, secrets,
    async () => ({ subscriberId: SUBSCRIBER_ID, shouldSend: true, confirmationExpiresAt: new Date(NOW + 86_400_000).toISOString() }),
    async () => false, NOW, () => CONFIRMATION_TOKEN,
  );
  assert.deepEqual(providerFailure, { ok: true });
});

test("subscription rejects origin, honeypot, fast/invalid token, rate, replay, and malformed database output", async () => {
  let calls = 0;
  const database = async () => { calls += 1; return { subscriberId: SUBSCRIBER_ID, shouldSend: false, confirmationExpiresAt: null }; };
  assert.deepEqual(await processNewsletterSubscription(validRaw(), { ...request, origin: "https://evil.example" }, secrets, database, async () => true, NOW, () => CONFIRMATION_TOKEN), { ok: false, code: "INVALID_REQUEST" });
  assert.deepEqual(await processNewsletterSubscription(validRaw({ website: "bot" }), request, secrets, database, async () => true, NOW, () => CONFIRMATION_TOKEN), { ok: false, code: "INVALID_REQUEST" });
  assert.deepEqual(await processNewsletterSubscription(validRaw({ formToken: createNewsletterFormToken(FORM_SECRET, NOW - 1_000) }), request, secrets, database, async () => true, NOW, () => CONFIRMATION_TOKEN), { ok: false, code: "SUBMISSION_TOO_FAST" });
  assert.deepEqual(await processNewsletterSubscription(validRaw({ formToken: "invalid" }), request, secrets, database, async () => true, NOW, () => CONFIRMATION_TOKEN), { ok: false, code: "INVALID_FORM_TOKEN" });
  assert.equal(calls, 0);

  for (const [databaseCode, publicCode] of [
    ["NEWSLETTER_RATE_15", "RATE_LIMITED"],
    ["NEWSLETTER_RATE_24", "RATE_LIMITED"],
    ["NEWSLETTER_EMAIL_RATE_24", "RATE_LIMITED"],
    ["NEWSLETTER_TOKEN_REPLAY", "INVALID_FORM_TOKEN"],
    ["private database detail", "SERVICE_UNAVAILABLE"],
  ] as const) {
    const result = await processNewsletterSubscription(validRaw(), request, secrets, async () => ({ subscriberId: null, shouldSend: false, confirmationExpiresAt: null, errorCode: databaseCode }), async () => true, NOW, () => CONFIRMATION_TOKEN);
    assert.deepEqual(result, { ok: false, code: publicCode });
    assert.equal(JSON.stringify(result).includes("private database detail"), false);
  }
  assert.deepEqual(await processNewsletterSubscription(validRaw(), request, secrets, async () => ({ subscriberId: SUBSCRIBER_ID, shouldSend: true, confirmationExpiresAt: "bad" }), async () => true, NOW, () => CONFIRMATION_TOKEN), { ok: false, code: "SERVICE_UNAVAILABLE" });
});

test("confirmation and unsubscribe lifecycle is POST-controlled, idempotent, and generic", async () => {
  assert.deepEqual(await processNewsletterConfirmation(CONFIRMATION_TOKEN, true, HASH_SECRET, async () => ({ status: "confirmed" })), { ok: true, status: "confirmed" });
  assert.deepEqual(await processNewsletterConfirmation(CONFIRMATION_TOKEN, true, HASH_SECRET, async () => ({ status: "already_confirmed" })), { ok: true, status: "already_confirmed" });
  assert.deepEqual(await processNewsletterConfirmation("bad", true, HASH_SECRET, async () => ({ status: "unexpected" })), { ok: false, code: "INVALID_REQUEST" });
  assert.deepEqual(await processNewsletterConfirmation(CONFIRMATION_TOKEN, false, HASH_SECRET, async () => ({ status: "unexpected" })), { ok: false, code: "INVALID_REQUEST" });
  assert.deepEqual(await processNewsletterConfirmation(CONFIRMATION_TOKEN, true, HASH_SECRET, async () => ({ status: "invalid" })), { ok: false, code: "INVALID_OR_EXPIRED" });

  const token = createNewsletterUnsubscribeToken(SUBSCRIBER_ID, NONCE, HASH_SECRET) ?? "";
  assert.deepEqual(await processNewsletterUnsubscribe(token, true, HASH_SECRET, async () => ({ status: "unsubscribed" })), { ok: true, status: "unsubscribed" });
  assert.deepEqual(await processNewsletterUnsubscribe(token, true, HASH_SECRET, async () => ({ status: "already_unsubscribed" })), { ok: true, status: "already_unsubscribed" });
  assert.deepEqual(await processNewsletterUnsubscribe(`${token}x`, true, HASH_SECRET, async () => ({ status: "unexpected" })), { ok: false, code: "INVALID_OR_EXPIRED" });
});

test("Brevo adapter is bounded, dependency-free, and creates inert confirmation content", async () => {
  assert.equal(NEWSLETTER_PROVIDER_TIMEOUT_MS, 5_000);
  const content = createConfirmationEmailContent({
    to: "reader@example.com",
    confirmationUrl: "https://bts.online/newsletter/confirm?token=<unsafe>&next=\"x\"",
    expiresAt: new Date(NOW + 86_400_000).toISOString(),
  });
  assert.equal(content.htmlContent.includes("<unsafe>"), false);
  assert.equal(content.htmlContent.includes("&lt;unsafe&gt;"), true);
  assert.equal(/<img|pixel|utm_|google-analytics/iu.test(content.htmlContent), false);
  assert.equal(content.textContent.includes("reader@example.com"), false);

  let captured: RequestInit | null = null;
  const configuration = newsletterRuntimeConfiguration({
    NODE_ENV: "test",
    SITE_URL: "https://bts.online",
    NEWSLETTER_PUBLIC_ENABLED: "true",
    NEWSLETTER_LEGAL_READY: "true",
    NEWSLETTER_CONTROLLER_ADDRESS: "Verified controller address",
    NEWSLETTER_PROVIDER: "brevo",
    NEWSLETTER_FROM_EMAIL,
    NEWSLETTER_REPLY_TO_EMAIL,
    NEWSLETTER_FORM_TOKEN_SECRET: FORM_SECRET,
    NEWSLETTER_HASH_SECRET: HASH_SECRET,
    BREVO_API_KEY: "test-provider-key",
    BREVO_TRACKING_DISABLED: "true",
  });
  assert.ok(configuration);
  const sender = createBrevoConfirmationSender(configuration, (async (_url, init) => {
    captured = init ?? null;
    return new Response("{}", { status: 201 });
  }) as typeof fetch);
  assert.equal(await sender({ to: "reader@example.com", confirmationUrl: "https://bts.online/newsletter/confirm?token=safe", expiresAt: new Date(NOW + 86_400_000).toISOString() }), true);
  const capturedRequest = captured as RequestInit | null;
  const body = JSON.parse(String(capturedRequest?.body)) as Record<string, unknown>;
  assert.deepEqual(body.sender, { name: "bts.online", email: NEWSLETTER_FROM_EMAIL });
  assert.deepEqual(body.replyTo, { name: "Benjamin Trinidad Segura", email: NEWSLETTER_REPLY_TO_EMAIL });
  assert.equal("trackingPixel" in body, false);
  assert.ok(capturedRequest?.signal);

  let observedAbort = false;
  const stalled = createBrevoConfirmationSender(configuration, ((_url: URL | RequestInfo, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => {
      observedAbort = true;
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  })) as typeof fetch, 10);
  assert.equal(await stalled({ to: "reader@example.com", confirmationUrl: "https://bts.online/newsletter/confirm?token=safe", expiresAt: new Date(NOW + 86_400_000).toISOString() }), false);
  assert.equal(observedAbort, true);
});

test("newsletter migration is additive, private, transactional, and uses audited definer boundaries", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260818000000_newsletter_subscription_foundation.sql", import.meta.url), "utf8");
  const normalized = sql.toLowerCase();
  for (const required of [
    "create table public.newsletter_consent_versions",
    "create table public.newsletter_subscribers",
    "create table public.newsletter_subscription_events",
    "create table public.newsletter_abuse_events",
    "request_newsletter_subscription",
    "confirm_newsletter_subscription",
    "unsubscribe_newsletter_subscription",
    "cleanup_expired_newsletter_data",
    "newsletter-consent-v1",
    "new writing and occasional updates from the digital hq. no fixed schedule, no spam.",
    "enable row level security",
    "pg_catalog.pg_advisory_xact_lock",
    "for update",
    "newsletter_token_replay",
    "newsletter_rate_15",
    "newsletter_rate_24",
    "newsletter_email_rate_24",
    "interval '24 hours'",
    "interval '48 hours'",
    "interval '7 days'",
    "notify pgrst, 'reload schema'",
  ]) assert.equal(normalized.includes(required), true, required);
  assert.equal((normalized.match(/security definer/gu) ?? []).length, 4);
  assert.equal((normalized.match(/set search_path = pg_catalog, pg_temp/gu) ?? []).length, 4);
  assert.equal(/set search_path\s*=.*public/iu.test(sql), false);
  assert.equal(/set search_path\s*=.*extensions/iu.test(sql), false);
  assert.equal(/grant\s+all/iu.test(sql), false);
  assert.equal(/grant\s+(select|insert|update|delete)\s+on\s+table/iu.test(sql), false);
  assert.equal((normalized.match(/to service_role/gu) ?? []).length, 4);
  assert.equal(/to\s+(anon|authenticated)/iu.test(sql.replaceAll("from public, anon, authenticated, service_role", "")), false);
  assert.equal(normalized.includes("alter table public.writing_"), false);
  assert.equal(normalized.includes("auth.users"), false);
  assert.equal(normalized.includes("bts_account"), false);
});

test("public UI keeps account consent separate and token pages private", () => {
  const form = readFileSync(new URL("../components/newsletter/newsletter-form.tsx", import.meta.url), "utf8");
  const confirmPage = readFileSync(new URL("../app/newsletter/confirm/page.tsx", import.meta.url), "utf8");
  const unsubscribePage = readFileSync(new URL("../app/newsletter/unsubscribe/page.tsx", import.meta.url), "utf8");
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  const writingPage = readFileSync(new URL("../app/writing/[slug]/page.tsx", import.meta.url), "utf8");
  assert.equal(form.includes("It is not linked to BTS Account"), true);
  assert.equal(form.includes('type="checkbox"'), true);
  assert.equal(form.includes("checked="), false);
  assert.equal(form.includes("Double opt-in is required"), true);
  assert.equal(confirmPage.includes("Opening this page alone does not subscribe you"), true);
  assert.equal(confirmPage.includes("robots: { index: false, follow: false }"), true);
  assert.equal(unsubscribePage.includes("does not require a BTS Account"), true);
  assert.equal(config.includes('value: "no-referrer"'), true);
  assert.equal(writingPage.includes("<NewsletterCta />"), true);
  assert.equal(writingPage.includes("issueNewsletterFormToken"), false);
  assert.equal(writingPage.includes("createBrevoConfirmationSender"), false);
  for (const source of [form, confirmPage, unsubscribePage]) {
    assert.equal(source.includes("dangerouslySetInnerHTML"), false);
    assert.equal(source.includes("SUPABASE_SECRET_KEY"), false);
    assert.equal(source.includes("BREVO_API_KEY"), false);
  }
});
