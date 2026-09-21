import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  feedbackSubmissionFromFormData,
  processFeedbackSubmission,
} from "../app/feedback/actions";
import { getFeedbackCopy } from "../data/i18n/feedback";
import { globalDictionaries } from "../data/i18n/global";
import { getHqPulseCopy } from "../data/i18n/hq-pulse";
import { privacyDictionaries } from "../data/i18n/privacy";
import { humanPulseEditorial } from "../data/human-pulse";
import { getHqPulseTileSize, resolveHqPulseItems } from "../data/hq-pulse";
import {
  createFeedbackFormToken,
  createFeedbackNetworkHash,
  reduceFeedbackNetworkIdentifier,
} from "../lib/feedback/security";
import { validateFeedbackSubmission } from "../lib/feedback/validation";
import { locales } from "../lib/i18n/config";
import {
  feedbackContactMethods,
  feedbackContactValueMaximum,
  feedbackMessageMaximum,
  feedbackNameMaximum,
  feedbackSourceContexts,
  type RawFeedbackSubmission,
} from "../types/feedback";
import type { HqPulseItem } from "../types/hq-pulse";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const NOW = Date.UTC(2026, 8, 20, 12, 0, 0);
const secrets = {
  hashSecret: "feedback-hash-secret-for-tests",
  formTokenSecret: "feedback-form-secret-for-tests",
  siteUrl: "https://bts.online",
};
const request = {
  origin: "https://bts.online",
  host: "bts.online",
  networkIdentifier: "203.0.113.42",
};

function raw(overrides: Partial<RawFeedbackSubmission> = {}): RawFeedbackSubmission {
  return {
    message: "A useful thought with <script>alert('inert')</script> and a line\nbreak.",
    name: "",
    contactMethod: "",
    contactValue: "",
    sourceContext: "home",
    website: "",
    formToken: createFeedbackFormToken(secrets.formTokenSecret, NOW - 4_000),
    ...overrides,
  };
}

function event(overrides: Partial<HqPulseItem> = {}): HqPulseItem {
  return {
    id: "people-example",
    source: "people",
    type: "conversation",
    occurredAt: "2026-09-20T10:00:00.000Z",
    title: "A canonical conversation",
    summary: "Canonical public context.",
    href: "/people/example",
    provenance: { source: "people", entityId: "example", key: "people:example:published" },
    spotlightFormat: "Service Spotlight",
    ...overrides,
  };
}

test("Feedback validation keeps the form minimal, bounded, multilingual and plain-text", () => {
  const valid = validateFeedbackSubmission(raw());
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.name, null);
    assert.equal(valid.data.contactMethod, null);
    assert.equal(valid.data.contactValue, null);
    assert.equal(valid.data.sourceContext, "home");
    assert.match(valid.data.message, /<script>alert/u);
    assert.match(valid.data.message, /line\nbreak/u);
  }

  assert.equal(validateFeedbackSubmission(raw({ message: "   " })).success, false);
  assert.equal(validateFeedbackSubmission(raw({ message: "x".repeat(feedbackMessageMaximum + 1) })).success, false);
  assert.equal(validateFeedbackSubmission(raw({ name: "x".repeat(feedbackNameMaximum + 1) })).success, false);
  assert.equal(validateFeedbackSubmission(raw({ contactMethod: "email", contactValue: "" })).success, false);
  assert.equal(validateFeedbackSubmission(raw({ contactMethod: "", contactValue: "hello@example.com" })).success, false);
  assert.equal(validateFeedbackSubmission(raw({ contactMethod: "carrier-pigeon", contactValue: "Hill 4" })).success, false);
  assert.equal(validateFeedbackSubmission(raw({ contactMethod: "other", contactValue: "x".repeat(feedbackContactValueMaximum + 1) })).success, false);
  assert.equal(validateFeedbackSubmission(raw({ contactMethod: "email", contactValue: "safe@example.com\u202E" })).success, false);
  assert.equal(validateFeedbackSubmission(raw({ sourceContext: "https://bts.online/private?token=secret" })).success, false);
  assert.equal(validateFeedbackSubmission(raw({ website: "bot-filled" })).success, false);
  assert.deepEqual(feedbackSourceContexts, [
    "home", "writing", "fyns", "world-map", "life-alignment", "projects", "people", "discovery", "other",
  ]);
  assert.deepEqual(feedbackContactMethods, [
    "email", "linkedin", "instagram", "whatsapp", "phone", "other",
  ]);
  for (const method of feedbackContactMethods) {
    const contact = validateFeedbackSubmission(raw({
      contactMethod: method,
      contactValue: method === "other" ? "@someone elsewhere" : `${method}-contact`,
    }));
    assert.equal(contact.success, true, method);
  }
});

test("the Server Action rejects unexpected fields instead of accepting an open payload", async () => {
  const form = new FormData();
  form.set("message", "Useful feedback");
  form.set("name", "");
  form.set("contactMethod", "");
  form.set("contactValue", "");
  form.set("sourceContext", "home");
  form.set("website", "");
  form.set("formToken", "token");
  assert.ok(await feedbackSubmissionFromFormData(form));
  form.set("status", "archived");
  assert.equal(await feedbackSubmissionFromFormData(form), null);
});

test("Feedback request processing enforces origin, purpose-bound token, reduced-network throttling and private output", async () => {
  let databaseInput: Record<string, unknown> | null = null;
  const result = await processFeedbackSubmission(
    raw(),
    request,
    secrets,
    async (input) => {
      databaseInput = input;
      return { accepted: true };
    },
    NOW,
    "en",
  );
  assert.deepEqual(result, { ok: true });
  assert.equal(Object.keys(result).includes("feedbackId"), false);
  assert.ok(databaseInput);
  const capturedInput = databaseInput as unknown as Record<string, unknown>;
  assert.equal(capturedInput.name, null);
  assert.equal(capturedInput.contactMethod, null);
  assert.equal(capturedInput.contactValue, null);
  assert.equal(capturedInput.sourceContext, "home");
  assert.match(String(capturedInput.networkHash), /^[0-9a-f]{64}$/u);
  assert.match(String(capturedInput.formTokenHash), /^[0-9a-f]{64}$/u);

  assert.equal(reduceFeedbackNetworkIdentifier("203.0.113.42"), "203.0.113");
  assert.equal(reduceFeedbackNetworkIdentifier("2001:db8:abcd:1234:5678:90ab:cdef:1234"), "2001:0db8:abcd:1234::/64");
  assert.equal(reduceFeedbackNetworkIdentifier("not-an-ip"), null);
  assert.notEqual(createFeedbackNetworkHash("203.0.113.42", secrets.hashSecret), "203.0.113.42");

  const invalidOrigin = await processFeedbackSubmission(raw(), { ...request, origin: "https://evil.example" }, secrets, async () => ({ accepted: true }), NOW);
  assert.deepEqual(invalidOrigin, { ok: false, code: "INVALID_REQUEST" });
  const tooFast = await processFeedbackSubmission(
    raw({ formToken: createFeedbackFormToken(secrets.formTokenSecret, NOW) }),
    request,
    secrets,
    async () => ({ accepted: true }),
    NOW,
  );
  assert.deepEqual(tooFast, { ok: false, code: "SUBMISSION_TOO_FAST" });
  const limited = await processFeedbackSubmission(raw(), request, secrets, async () => ({ accepted: false, errorCode: "FEEDBACK_RATE_15" }), NOW);
  assert.deepEqual(limited, { ok: false, code: "RATE_LIMITED" });
  const unavailable = await processFeedbackSubmission(raw(), request, null, async () => ({ accepted: true }), NOW);
  assert.deepEqual(unavailable, { ok: false, code: "SERVICE_UNAVAILABLE" });
});

test("public Feedback copy, Header label and factual Privacy disclosure cover all seven locales", () => {
  for (const locale of locales) {
    const feedback = getFeedbackCopy(locale);
    assert.ok(feedback.title.length > 5, locale);
    assert.ok(feedback.messageLabel.length > 5, locale);
    assert.ok(feedback.successTitle.length > 4, locale);
    assert.ok(feedback.privacy.length > 40, locale);
    assert.equal(Object.keys(feedback.contactMethods).length, 6, locale);
    assert.ok(globalDictionaries[locale].nav.feedback.length > 2, locale);
    assert.ok(privacyDictionaries[locale].feedback.storage.length > 100, locale);
    assert.ok(privacyDictionaries[locale].feedback.access.length > 100, locale);
    assert.ok(privacyDictionaries[locale].feedback.retention.length > 100, locale);
    assert.match(privacyDictionaries[locale].feedback.access, /marketing|newsletter|bülten|μάρκετινγκ|рассылк|маркетинг/iu, locale);
    assert.ok(getHqPulseCopy(locale).participationMarker.length > 3, locale);
    assert.ok(getHqPulseCopy(locale).openLoops.length > 3, locale);
  }
});

test("approved German Human Pulse copy replaces the rejected phrases without changing the English source", () => {
  assert.equal(
    humanPulseEditorial.next.de?.text,
    "Dinge bauen, die ich selbst gerne hätte. Festhalten, was ich dabei lerne. Und Menschen kennenlernen, denen ich sonst nie begegnet wäre.",
  );
  assert.equal(getHqPulseCopy("de").participationMarker, "Teil der Reise");
  assert.equal(getHqPulseCopy("de").openLoops, "Mach mit");
  assert.equal(getHqPulseCopy("de").openLoopsDescription, "Ideen, Feedback, Geschichten oder Lust, etwas gemeinsam zu bauen? Hier kannst du Teil davon werden.");
  assert.notEqual(getHqPulseCopy("de").openLoops, "Offene Wege");
  assert.notEqual(getHqPulseCopy("de").participationMarker, "Menschlicher Kontext");
  assert.equal(
    humanPulseEditorial.next.en?.text,
    "Keep building the things I wish existed, write down what I learn along the way, and meet more of the people I wouldn't have met otherwise.",
  );
});

test("Mosaic sizing is semantic, deterministic and independent of chronology or popularity", () => {
  const writing = event({
    id: "writing-example",
    source: "writing",
    type: "publication",
    href: "/writing/example",
    provenance: { source: "writing", entityId: "example", key: "writing:example:published" },
    spotlightFormat: undefined,
  });
  const career = event({ spotlightFormat: "Career Spotlight" });
  const conversation = event({ spotlightFormat: "Spotlight Conversation" });
  const service = event({ spotlightFormat: "Service Spotlight" });
  assert.equal(getHqPulseTileSize(writing), "featured");
  assert.equal(getHqPulseTileSize(career), "featured");
  assert.equal(getHqPulseTileSize(conversation), "standard");
  assert.equal(getHqPulseTileSize(service), "compact");
  assert.equal(getHqPulseTileSize({ ...service, occurredAt: "2000-01-01T00:00:00.000Z" }), "compact");
  assert.deepEqual(resolveHqPulseItems([service, { ...career, id: "newer", occurredAt: "2026-09-21T10:00:00.000Z", provenance: { ...career.provenance, key: "people:newer:published" } }]).map(({ id }) => id), ["newer", "people-example"]);

  const component = source("../components/sections/hq-pulse.tsx");
  const domain = source("../data/hq-pulse.ts");
  assert.match(component, /data-pulse-size/u);
  assert.match(component, /md:grid-cols-2 xl:grid-cols-4/u);
  assert.match(component, /timeline\.map/u);
  assert.doesNotMatch(component, /grid-flow-dense|\border(?:-w+)?:order-|nth-child/u);
  assert.doesNotMatch(domain, /Math\.random|engagementScore|clickCount|popularityScore/u);
});

test("homepage Feedback UI stays one low-friction private surface with accessible states", () => {
  const page = source("../app/page.tsx");
  const section = source("../components/sections/feedback.tsx");
  const form = source("../components/feedback/feedback-form.tsx");
  const header = source("../components/layout/header.tsx");
  assert.match(page, /<Feedback \/>[\s\S]*<Contact \/>/u);
  assert.match(section, /id="feedback"/u);
  assert.match(header, /localizedHref\("\/#feedback"\)/u);
  assert.match(form, /<textarea/u);
  assert.match(form, /name="message"/u);
  assert.match(form, /name="name"/u);
  assert.match(form, /name="contactMethod"/u);
  assert.match(form, /name="contactValue"/u);
  assert.match(form, /contactMethod \?/u);
  assert.match(form, /feedbackContactMethods\.map/u);
  assert.match(form, /name="sourceContext" value="home"/u);
  assert.match(form, /aria-live="polite"/u);
  assert.match(form, /focus-visible/u);
  assert.doesNotMatch(form, /name="(?:email|phone|subject|attachment)"/u);
});

test("migration creates a private least-privilege inbox, fail-closed throttling and constrained admin lifecycle", () => {
  const sql = source("../supabase/migrations/20260920000000_private_feedback.sql").toLowerCase();
  for (const required of [
    "create table public.private_feedback",
    "create table public.feedback_submission_limits",
    "message text not null",
    "name text",
    "source_context public.feedback_source_context not null",
    "status public.feedback_status not null default 'new'",
    "force row level security",
    "public.assert_bts_admin(true)",
    "create or replace function public.submit_private_feedback",
    "create or replace function public.list_private_feedback",
    "create or replace function public.get_private_feedback",
    "create or replace function public.manage_private_feedback",
    "feedback_rate_15",
    "feedback_rate_24",
    "to service_role",
    "to authenticated",
    "when v_current = 'new' and v_action = 'mark_read'",
    "when v_current in ('new', 'read') and v_action = 'archive'",
    "delete from public.private_feedback",
  ]) assert.equal(sql.includes(required), true, required);

  assert.equal((sql.match(/set search_path = pg_catalog, pg_temp/gu) ?? []).length, 4);
  assert.equal((sql.match(/force row level security/gu) ?? []).length, 2);
  assert.doesNotMatch(sql, /create policy/u);
  assert.doesNotMatch(sql, /grant\s+(select|insert|update|delete|all)\s+on\s+table/iu);
  assert.doesNotMatch(sql, /grant execute on function public\.submit_private_feedback\([^)]*\)\s+to (?:anon|authenticated);/iu);
  assert.doesNotMatch(sql, /\bip_address\b|\buser_agent\b|\breferrer\b|message_hash/u);
  assert.doesNotMatch(sql, /commit\s*;/u);
});

test("the forward contact migration is nullable, paired, private and preserves the rate identity", () => {
  const sql = source("../supabase/migrations/20260921000000_private_feedback_contact.sql").toLowerCase();
  for (const required of [
    "create type public.feedback_contact_method as enum",
    "'email'",
    "'linkedin'",
    "'instagram'",
    "'whatsapp'",
    "'phone'",
    "'other'",
    "add column contact_method",
    "add column contact_value",
    "private_feedback_contact_pair_check",
    "char_length(contact_value) between 1 and 240",
    "p_contact_method public.feedback_contact_method",
    "p_contact_value text",
    "feedback.contact_method",
    "feedback.contact_value",
    "to service_role",
    "to authenticated",
  ]) assert.equal(sql.includes(required), true, required);
  assert.match(sql, /\(contact_method is null and contact_value is null\)[\s\S]*\(contact_method is not null and contact_value is not null\)/u);
  assert.equal((sql.match(/p_network_hash/gu) ?? []).length > 5, true);
  assert.doesNotMatch(sql, /grant execute on function public\.submit_private_feedback\([^;]*\) to (?:anon|authenticated);/u);
  assert.doesNotMatch(sql, /\burl\b|analytics|newsletter|marketing|message_hash/u);
  assert.doesNotMatch(sql, /alter table public\.private_feedback\s+(?:drop|rename)|delete from public\.private_feedback|truncate/u);
});

test("existing AAL2 Studio is reused with bounded list/detail, inert text and intentional delete confirmation", () => {
  const home = source("../app/admin/page.tsx");
  const list = source("../app/admin/feedback/page.tsx");
  const detail = source("../app/admin/feedback/[id]/page.tsx");
  const actions = source("../app/admin/feedback/actions.ts");
  const controls = source("../components/admin/feedback-actions.tsx");
  const config = source("../next.config.ts");
  const sitemap = source("../app/sitemap.ts");

  assert.match(home, /href: "\/admin\/feedback"/u);
  assert.match(list, /requireAdminPage\(true\)/u);
  assert.match(list, /p_limit: 50/u);
  assert.match(detail, /requireAdminPage\(true\)/u);
  assert.match(actions, /verifyAdminAuthorization\(true\)/u);
  assert.match(actions, /isAllowedRequestOrigin/u);
  assert.match(controls, /<dialog/u);
  assert.match(controls, /Type DELETE to confirm/u);
  assert.match(detail, /whitespace-pre-wrap break-words/u);
  assert.match(list, />Contact</u);
  assert.match(detail, />Contact</u);
  assert.match(detail, /contactDisplay\(feedback\)/u);
  assert.doesNotMatch(detail, /href=\{?feedback\.contact_value|mailto:|tel:/u);
  assert.doesNotMatch(detail, /dangerouslySetInnerHTML/u);
  assert.match(config, /source: "\/admin\/:path\*"[\s\S]*private, no-store/u);
  assert.doesNotMatch(sitemap, /admin\/feedback/u);
});

test("Feedback paths contain no content logging, tracking vendor, public receipt or client service key", () => {
  const combined = [
    source("../app/feedback/actions.ts"),
    source("../components/feedback/feedback-form.tsx"),
    source("../components/sections/feedback.tsx"),
    source("../app/admin/feedback/actions.ts"),
    source("../app/admin/feedback/page.tsx"),
    source("../app/admin/feedback/[id]/page.tsx"),
  ].join("\n");
  assert.doesNotMatch(combined, /console\.(?:log|error|warn)|dangerouslySetInnerHTML|SUPABASE_SECRET_KEY|feedbackId.*return|captcha|recaptcha|hcaptcha|analytics|webhook/iu);
});
