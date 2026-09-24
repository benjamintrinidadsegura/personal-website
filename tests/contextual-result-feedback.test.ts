import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { processFeedbackSubmission } from "../app/feedback/actions";
import { resultFeedbackSubmissionFromFormData } from "../app/feedback/result-actions";
import { createFeedbackFormToken } from "../lib/feedback/security";
import { validateFeedbackSubmission } from "../lib/feedback/validation";

const NOW = Date.UTC(2026, 8, 24, 12, 0, 0);
const secrets = { hashSecret: "h".repeat(32), formTokenSecret: "f".repeat(32), siteUrl: "https://bts.online" };
const request = { origin: "https://bts.online", host: "bts.online", networkIdentifier: "203.0.113.42" };

function source(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

function rawResult(overrides: Record<string, unknown> = {}) {
  return {
    message: "",
    name: "",
    contactMethod: "",
    contactValue: "",
    sourceContext: "other",
    website: "",
    formToken: createFeedbackFormToken(secrets.formTokenSecret, NOW - 10_000),
    resultProduct: "money-profile",
    resultFit: "mostly",
    usefulnessCategory: "pattern",
    ...overrides,
  };
}

test("contextual result feedback validates a bounded optional comment and minimal typed context only", () => {
  const valid = validateFeedbackSubmission(rawResult(), "en");
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.message, "");
    assert.equal(valid.data.resultProduct, "money-profile");
    assert.equal(valid.data.resultFit, "mostly");
    assert.equal(valid.data.usefulnessCategory, "pattern");
    assert.equal(valid.data.name, null);
    assert.equal(valid.data.contactValue, null);
    assert.equal(valid.data.locale, "en");
    assert.equal("answers" in valid.data || "result" in valid.data, false);
  }
  assert.equal(validateFeedbackSubmission(rawResult({ resultFit: "" }), "en").success, false);
  assert.equal(validateFeedbackSubmission(rawResult({ resultProduct: "fyns" }), "en").success, false);
  assert.equal(validateFeedbackSubmission(rawResult({ usefulnessCategory: "profile-secret" }), "en").success, false);
  assert.equal(validateFeedbackSubmission(rawResult({ message: "x".repeat(1_201) }), "en").success, false);
  assert.equal(validateFeedbackSubmission(rawResult({ name: "Unexpected identity" }), "en").success, false);
});

test("strict result FormData parser accepts only the six expected fields", async () => {
  const form = new FormData();
  form.set("message", "Optional note");
  form.set("resultProduct", "personal-advantage");
  form.set("resultFit", "partly");
  form.set("usefulnessCategory", "tradeoffs");
  form.set("website", "");
  form.set("formToken", "token");
  const parsed = await resultFeedbackSubmissionFromFormData(form);
  assert.equal(parsed?.sourceContext, "other");
  assert.equal(parsed?.resultProduct, "personal-advantage");
  form.set("answers", "private");
  assert.equal(await resultFeedbackSubmissionFromFormData(form), null);
});

test("result feedback reuses the accepted token, origin, network hash and database process", async () => {
  let captured: Record<string, unknown> = {};
  const result = await processFeedbackSubmission(rawResult({ message: "Useful and calm." }), request, secrets, async (input) => { captured = input as unknown as Record<string, unknown>; return { accepted: true }; }, NOW, "en");
  assert.deepEqual(result, { ok: true });
  assert.equal(captured?.resultProduct, "money-profile");
  assert.equal(captured?.resultFit, "mostly");
  assert.equal(captured?.message, "Useful and calm.");
  assert.equal(typeof captured?.networkHash, "string");
  assert.equal("answers" in captured, false);
  assert.equal("fullResult" in captured, false);
});

test("the forward migration extends one private inbox with typed context and preserves least privilege", () => {
  const sql = source("../supabase/migrations/20260924000000_contextual_result_feedback.sql").toLowerCase();
  for (const required of [
    "alter table public.private_feedback", "feedback_result_product", "'personal-advantage'", "'money-profile'", "feedback_result_fit", "'mostly'", "'partly'", "'not_really'", "usefulness_category", "p_locale", "create function public.submit_private_feedback", "perform public.assert_bts_admin(true)", "to service_role", "to authenticated",
  ]) assert.equal(sql.includes(required), true, required);
  assert.equal((sql.match(/set search_path = pg_catalog, pg_temp/gu) ?? []).length, 3);
  assert.doesNotMatch(sql, /create policy|grant\s+(?:select|insert|update|delete|all)\s+on\s+table/iu);
  assert.doesNotMatch(sql, /to anon|assessment_answers|full_result|account_number|bank/iu);
});

test("feedback appears after results, is dismissible, optional, non-rescoring and failure-isolated", () => {
  const component = source("../components/feedback/result-feedback.tsx");
  const advantage = source("../components/personal-advantage/personal-advantage-experience.tsx");
  const money = source("../components/money-profile/money-profile-experience.tsx");
  assert.match(advantage, /advantage-onepager[\s\S]*ResultFeedback[\s\S]*product="personal-advantage"/u);
  assert.match(money, /money-onepager[\s\S]*ResultFeedback[\s\S]*product="money-profile"/u);
  assert.match(component, /resultFeedbackFits\.map/u);
  assert.match(component, /setDismissed\(true\)/u);
  assert.match(component, /showSensitiveFinancialWarning/u);
  assert.match(component, /sensitiveWarning/u);
  assert.match(component, /state && !state\.ok/u);
  assert.doesNotMatch(component, /deriveMoneyProfile|buildPersonalAdvantageMap|setResult|assessmentAnswers|fullResult/iu);
});

test("feedback observability and server paths never log private content or attach assessment payloads", () => {
  const combined = [source("../components/feedback/result-feedback.tsx"), source("../app/feedback/result-actions.ts"), source("../app/feedback/actions.ts")].join("\n");
  assert.doesNotMatch(combined, /console\.(?:log|error|warn)|assessmentAnswers|fullResult|profileFamily|stressResponse|moneyMeaning|financialFriction/iu);
  assert.doesNotMatch(combined, /analytics\([^)]*message|dispatchEvent\([^)]*message/iu);
});
