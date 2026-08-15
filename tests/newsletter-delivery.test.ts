import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { processNewsletterDeliveryBatch, NEWSLETTER_SEND_BATCH_LIMIT, type ClaimedNewsletterDelivery, type NewsletterDeliveryDatabase } from "../lib/newsletter/delivery";
import { validateNewsletterEditionInput } from "../lib/newsletter/edition-validation";
import { createBrevoNewsletterSender } from "../lib/newsletter/provider";
import { createNewsletterEditionEmailContent } from "../lib/newsletter/template";
import { parseNewsletterProviderEvent, signNewsletterWebhook, verifyNewsletterWebhook } from "../lib/newsletter/webhook";
import type { NewsletterRuntimeConfiguration } from "../lib/newsletter/config";
import { newsletterDeliveryConfiguration } from "../lib/newsletter/config";

const ARTICLE_ID = "bd585729-695e-49b1-8aa2-00c1663978c1";
const SUBSCRIBER_ID = "96ee55b8-bb8c-4ee5-8b35-a22733ce31ee";
const DELIVERY_ID = "54403398-67d5-46f4-bf16-36bb10f9488c";
const NONCE = "4d6e3f70-a0e4-48bb-9174-5a5f88f2cb9c";
const NOW = Date.UTC(2026, 7, 19, 12, 0, 0);

function editionForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ writingArticleId: ARTICLE_ID, subject: "A thoughtful subject", preheader: "A concise preview", introduction: "A short hello.", ...overrides })) data.set(key, value);
  return data;
}

function claimed(overrides: Partial<ClaimedNewsletterDelivery> = {}): ClaimedNewsletterDelivery {
  return {
    deliveryId: DELIVERY_ID,
    subscriberId: SUBSCRIBER_ID,
    email: "reader@example.com",
    unsubscribeNonce: NONCE,
    subject: "A thoughtful subject",
    preheader: "A concise preview",
    introduction: "A short hello.",
    articleTitle: "The careful article",
    articleExcerpt: "A useful and sufficiently long article summary.",
    canonicalUrl: "https://bts.online/writing/the-careful-article",
    ...overrides,
  };
}

const providerConfiguration: NewsletterRuntimeConfiguration = {
  siteUrl: "https://bts.online",
  formTokenSecret: "form-secret",
  hashSecret: "hash-secret",
  provider: "brevo",
  providerApiKey: "provider-secret",
  fromEmail: "newsletter@bts.online",
  replyToEmail: "hello@bts.online",
  controllerAddress: "Verified controller address",
  consentVersion: "newsletter-consent-v1",
};

test("edition input accepts only a published Writing identifier and bounded plain text", () => {
  assert.equal(validateNewsletterEditionInput(editionForm()).success, true);
  for (const [field, value] of [
    ["writingArticleId", "draft"],
    ["subject", "x"],
    ["subject", `safe\nBcc: victim@example.com`],
    ["subject", "x".repeat(121)],
    ["preheader", "x".repeat(161)],
    ["introduction", "x".repeat(601)],
    ["introduction", "hello\u202eworld"],
  ]) assert.equal(validateNewsletterEditionInput(editionForm({ [field]: value })).success, false, field);
  assert.equal(validateNewsletterEditionInput(editionForm({ preheader: "", introduction: "" })).success, true);
});

test("delivery configuration fails closed when authenticated webhook ingestion is absent", () => {
  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: "test", SITE_URL: "https://bts.online", NEWSLETTER_PUBLIC_ENABLED: "true", NEWSLETTER_LEGAL_READY: "true",
    NEWSLETTER_CONTROLLER_ADDRESS: "Verified controller address", NEWSLETTER_PROVIDER: "brevo",
    NEWSLETTER_FROM_EMAIL: "newsletter@bts.online", NEWSLETTER_REPLY_TO_EMAIL: "hello@bts.online",
    NEWSLETTER_FORM_TOKEN_SECRET: "form-secret", NEWSLETTER_HASH_SECRET: "hash-secret",
    BREVO_API_KEY: "provider-secret", BREVO_TRACKING_DISABLED: "true",
  };
  assert.equal(newsletterDeliveryConfiguration(environment), null);
  assert.equal(newsletterDeliveryConfiguration({ ...environment, NEWSLETTER_WEBHOOK_SECRET: "w".repeat(32) })?.provider, "brevo");
});

test("fixed email template escapes content and always includes easy unsubscribe and privacy links", () => {
  const content = createNewsletterEditionEmailContent({
    subject: "Safe subject",
    preheader: "<script>alert(1)</script>",
    introduction: `Hello <img src=x onerror=alert(1)>\nFriend`,
    articleTitle: "Article <title>",
    articleExcerpt: "Summary & context",
    canonicalUrl: "https://bts.online/writing/article?a=1&b=2",
    unsubscribeUrl: "https://bts.online/newsletter/unsubscribe?token=a&b=c",
    privacyUrl: "https://bts.online/privacy",
    controllerAddress: "Controller <address>",
  });
  assert.equal(content.htmlContent.includes("<script>"), false);
  assert.equal(content.htmlContent.includes("<img"), false);
  assert.equal(content.htmlContent.includes("&lt;img src=x onerror=alert(1)&gt;"), true);
  assert.equal(content.htmlContent.includes("&lt;title&gt;"), true);
  assert.equal(content.htmlContent.includes("Unsubscribe"), true);
  assert.equal(content.htmlContent.includes("Privacy"), true);
  assert.equal(content.textContent.includes("Unsubscribe: https://"), true);
  assert.equal(content.textContent.includes("Privacy: https://"), true);
  assert.equal(/tracking|utm_|pixel|google-analytics/iu.test(content.htmlContent), false);
  assert.equal(content.htmlContent.includes("<html lang=\"en\""), true);
  assert.equal(content.htmlContent.includes("<main"), true);
  assert.equal(content.htmlContent.includes("<article"), true);
  assert.equal(content.htmlContent.includes("<footer"), true);
});

test("Brevo delivery adapter is bounded, dependency-free and distinguishes accepted, rejected and ambiguous outcomes", async () => {
  let captured: RequestInit | null = null;
  const accepted = createBrevoNewsletterSender(providerConfiguration, (async (_url, init) => {
    captured = init ?? null;
    return Response.json({ messageId: "provider-message-1" }, { status: 201 });
  }) as typeof fetch);
  assert.deepEqual(await accepted({ ...claimed(), to: "reader@example.com", unsubscribeUrl: "https://bts.online/newsletter/unsubscribe?token=safe", privacyUrl: "https://bts.online/privacy", controllerAddress: "Verified controller address" }), { status: "accepted", messageReference: "provider-message-1" });
  const request = captured as RequestInit | null;
  const body = JSON.parse(String(request?.body)) as Record<string, unknown>;
  assert.equal(JSON.stringify(body).includes(DELIVERY_ID), true);
  assert.equal(JSON.stringify(body).includes("trackingPixel"), false);
  assert.ok(request?.signal);

  const rejected = createBrevoNewsletterSender(providerConfiguration, (async () => new Response(null, { status: 400 })) as typeof fetch);
  assert.deepEqual(await rejected({ ...claimed(), to: "reader@example.com", unsubscribeUrl: "https://bts.online/u", privacyUrl: "https://bts.online/privacy", controllerAddress: "Controller" }), { status: "rejected", code: "provider_http_400" });
  const uncertain = createBrevoNewsletterSender(providerConfiguration, (async () => new Response(null, { status: 500 })) as typeof fetch);
  assert.deepEqual((await uncertain({ ...claimed(), to: "reader@example.com", unsubscribeUrl: "https://bts.online/u", privacyUrl: "https://bts.online/privacy", controllerAddress: "Controller" })).status, "ambiguous");
  const malformedSuccess = createBrevoNewsletterSender(providerConfiguration, (async () => Response.json({}, { status: 201 })) as typeof fetch);
  assert.deepEqual((await malformedSuccess({ ...claimed(), to: "reader@example.com", unsubscribeUrl: "https://bts.online/u", privacyUrl: "https://bts.online/privacy", controllerAddress: "Controller" })).status, "ambiguous");

  let aborted = false;
  const timeout = createBrevoNewsletterSender(providerConfiguration, ((_url: URL | RequestInfo, init?: RequestInit) => new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => { aborted = true; reject(new DOMException("Aborted", "AbortError")); }, { once: true }))) as typeof fetch, 10);
  assert.deepEqual((await timeout({ ...claimed(), to: "reader@example.com", unsubscribeUrl: "https://bts.online/u", privacyUrl: "https://bts.online/privacy", controllerAddress: "Controller" })).status, "ambiguous");
  assert.equal(aborted, true);
});

function databaseFixture(queue: ClaimedNewsletterDelivery[], eligibility: boolean[]) {
  const completions: Array<{ id: string; outcome: string; reference: string | null; failure: string | null }> = [];
  let claimIndex = 0;
  const database: NewsletterDeliveryDatabase = {
    claim: async () => queue[claimIndex++] ?? null,
    recheck: async () => eligibility.shift() ?? false,
    complete: async (id, outcome, reference, failure) => { completions.push({ id, outcome, reference, failure }); return true; },
    finish: async () => completions.some((item) => item.outcome === "failed" || item.outcome === "reconciliation_required") ? "failed" : "sent",
  };
  return { database, completions, claims: () => claimIndex };
}

test("delivery rechecks current consent, skips ineligible recipients and never sends pending/unsubscribed/suppressed rows", async () => {
  const fixture = databaseFixture([claimed(), claimed({ deliveryId: "26176a64-e7ab-444a-9eb7-968303bb59be" })], [false, true]);
  let sends = 0;
  const result = await processNewsletterDeliveryBatch(fixture.database, async () => { sends += 1; return { status: "accepted", messageReference: "accepted-1" }; }, providerConfiguration);
  assert.equal(sends, 1);
  assert.deepEqual(fixture.completions.map(({ outcome }) => outcome), ["skipped", "sent"]);
  assert.equal(result.state, "sent");
});

test("ambiguous provider failure is quarantined and stops the batch without blind retry", async () => {
  const fixture = databaseFixture([claimed(), claimed({ deliveryId: "26176a64-e7ab-444a-9eb7-968303bb59be" })], [true, true]);
  let sends = 0;
  const result = await processNewsletterDeliveryBatch(fixture.database, async () => { sends += 1; return { status: "ambiguous", code: "timeout_or_network" }; }, providerConfiguration);
  assert.equal(sends, 1);
  assert.equal(fixture.claims(), 1);
  assert.deepEqual(fixture.completions[0], { id: DELIVERY_ID, outcome: "reconciliation_required", reference: null, failure: "timeout_or_network" });
  assert.equal(result.state, "failed");
  assert.equal(NEWSLETTER_SEND_BATCH_LIMIT, 25);
});

test("an already-claimed or completed delivery is absent from retry input and therefore cannot be resent", async () => {
  const fixture = databaseFixture([], []);
  let sends = 0;
  const result = await processNewsletterDeliveryBatch(fixture.database, async () => { sends += 1; return { status: "accepted", messageReference: "unexpected" }; }, providerConfiguration);
  assert.equal(sends, 0);
  assert.equal(result.state, "sent");
});

test("webhook authentication is constant-time HMAC based, freshness-bounded and malformed-payload safe", () => {
  const secret = "a".repeat(64);
  const timestamp = String(Math.floor(NOW / 1_000));
  const body = JSON.stringify({ eventId: "event-1", event: "hardBounce", messageId: "provider-message-1", occurredAt: new Date(NOW).toISOString(), email: "must-not-be-stored@example.com" });
  const signature = signNewsletterWebhook(body, timestamp, secret);
  assert.equal(verifyNewsletterWebhook(body, timestamp, signature, secret, NOW), true);
  assert.equal(verifyNewsletterWebhook(`${body} `, timestamp, signature, secret, NOW), false);
  assert.equal(verifyNewsletterWebhook(body, String(Number(timestamp) - 301), signNewsletterWebhook(body, String(Number(timestamp) - 301), secret), secret, NOW), false);
  assert.equal(parseNewsletterProviderEvent("not-json"), null);
  assert.equal(parseNewsletterProviderEvent("x".repeat(32_769)), null);
  const event = parseNewsletterProviderEvent(body);
  assert.equal(event?.type, "hard_bounce");
  assert.equal(JSON.stringify(event).includes("must-not-be-stored@example.com"), false);
  for (const [raw, type] of [["complaint", "complaint"], ["unsubscribed", "unsubscribe"], ["error", "delivery_failure"], ["delivered", "delivered"]]) {
    const parsed = parseNewsletterProviderEvent(JSON.stringify({ eventId: `event-${raw}`, event: raw, messageId: "provider-message-1", occurredAt: new Date(NOW).toISOString() }));
    assert.equal(parsed?.type, type);
  }
});

test("delivery migration enforces published snapshots, least privilege, AAL2, send-once concurrency and suppression", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260819000000_newsletter_delivery.sql", import.meta.url), "utf8");
  const normalized = sql.toLowerCase();
  for (const required of [
    "create table public.newsletter_editions", "create table public.newsletter_deliveries", "create table public.newsletter_provider_events",
    "article.status = 'published'", "newsletter_writing_not_published", "protect_newsletter_edition_snapshot", "newsletter_edition_immutable",
    "unique (edition_id, subscriber_id)", "for update skip locked", "newsletter_stale_or_missing", "p_expected_version",
    "subscriber.status = 'confirmed'", "recheck_newsletter_delivery_eligibility", "subscriber.status = 'suppressed'",
    "provider_event_id text not null unique", "return 'replay'", "hard_bounce", "complaint", "unsubscribe",
    "public.assert_bts_admin(true)", "on delete set null", "enable row level security", "to service_role",
  ]) assert.equal(normalized.includes(required), true, required);
  assert.equal(normalized.includes("author_id ="), false);
  assert.equal(normalized.includes("role = 'author'"), false);
  assert.equal(/grant\s+(select|insert|update|delete)\s+on\s+table/iu.test(sql), false);
  assert.equal(/grant\s+all/iu.test(sql), false);
  assert.equal((normalized.match(/set search_path = pg_catalog, pg_temp/gu) ?? []).length >= 14, true);
  assert.equal(normalized.includes("select * from public.newsletter_subscribers"), false);
  assert.equal(normalized.includes("update public.writing_articles"), false);
  assert.equal(normalized.includes("insert into public.newsletter_subscribers"), false);
  assert.equal(normalized.includes("status = 'confirmed'"), true);
});

test("delivery runtime repair is additive and removes invalid qualified special expressions", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260819010000_newsletter_delivery_runtime_fix.sql", import.meta.url), "utf8");
  const normalized = sql.toLowerCase();
  assert.equal(normalized.includes("create or replace function public.begin_newsletter_send"), true);
  assert.equal(normalized.includes("create or replace function public.recheck_newsletter_delivery_eligibility"), true);
  assert.equal(normalized.includes("pg_catalog.coalesce"), false);
  assert.equal((normalized.match(/set search_path = pg_catalog, pg_temp/gu) ?? []).length, 2);
  assert.equal(normalized.includes("public.assert_bts_admin(true)"), true);
  assert.equal(normalized.includes("to authenticated"), true);
  assert.equal(normalized.includes("alter table"), false);
  assert.equal(normalized.includes("drop table"), false);
});

test("Studio exposes only exact-address support and isolates newsletter failures from Writing", () => {
  const page = readFileSync(new URL("../app/admin/newsletter/page.tsx", import.meta.url), "utf8");
  const edition = readFileSync(new URL("../app/admin/newsletter/[id]/page.tsx", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../app/admin/newsletter/actions.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/newsletter/provider/brevo/route.ts", import.meta.url), "utf8");
  for (const source of [page, edition]) {
    assert.equal(source.includes("dangerouslySetInnerHTML"), false);
    assert.equal(source.includes("SUPABASE_SECRET_KEY"), false);
    assert.equal(source.includes("BREVO_API_KEY"), false);
  }
  assert.equal(page.includes("Exact-address lookup only"), true);
  assert.equal(page.includes("subscriber directory"), true);
  assert.equal(page.includes("Promise.allSettled"), true);
  assert.equal(edition.includes("No remote images · no tracking"), true);
  assert.equal(actions.includes("verifyAdminAuthorization(true)"), true);
  assert.equal(actions.includes("manual confirm"), false);
  assert.equal(route.includes("console."), false);
  assert.equal(route.includes("request.text()"), true);
  assert.equal(route.includes("x-bts-newsletter-signature"), true);
});
