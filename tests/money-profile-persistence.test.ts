import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { moneyProfileEvents } from "../lib/money-profile-analytics";
import {
  moneyProfileStorageKey,
  parsePersistedMoneyProfileState,
  serializeMoneyProfileState,
} from "../lib/money-profile-persistence";

function source(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

test("Money Profile persistence is versioned, bounded and restores structured answers", () => {
  const state = {
    schemaVersion: 1 as const,
    phase: "questions" as const,
    questionId: "m8",
    answers: { m1: { value: ["security", "freedom"] }, m7: { value: "wait" }, m8: { value: "neither" } },
    calibration: {},
    updatedAt: "2026-09-24T10:00:00.000Z",
  };
  const serialized = serializeMoneyProfileState(state);
  assert.deepEqual(parsePersistedMoneyProfileState(serialized), state);
  assert.equal(moneyProfileStorageKey, "bts.money-profile.v1");
  assert.equal(parsePersistedMoneyProfileState("not-json"), null);
  assert.equal(parsePersistedMoneyProfileState(JSON.stringify({ ...state, schemaVersion: 2 })), null);
  assert.equal(parsePersistedMoneyProfileState("x".repeat(48_001)), null);
});

test("corrupt answers and stale conditional branches fail closed without losing valid progress", () => {
  const parsed = parsePersistedMoneyProfileState(JSON.stringify({
    schemaVersion: 1,
    phase: "questions",
    questionId: "m39",
    answers: {
      m1: { value: ["security", "not-a-real-option", "security"] },
      m39: { value: "security" },
      m999: { value: "secret" },
    },
    calibration: { "bad key": "very-true", "hypothesis-security-present": "partly" },
    updatedAt: "2026-09-24T10:00:00.000Z",
  }));
  assert.ok(parsed);
  assert.deepEqual(parsed.answers.m1?.value, ["security"]);
  assert.equal(parsed.answers.m39, undefined);
  assert.equal(parsed.answers.m999, undefined);
  assert.notEqual(parsed.questionId, "m39");
  assert.deepEqual(parsed.calibration, { "hypothesis-security-present": "partly" });
});

test("Money Profile contains no free-text answer field and analytics are payload-free", () => {
  const questions = source("../data/money-profile-questions.ts");
  const persistence = source("../lib/money-profile-persistence.ts");
  const analytics = source("../lib/money-profile-analytics.ts");
  assert.doesNotMatch(questions, /type:\s*"text"/u);
  assert.doesNotMatch(persistence, /freeText|income|accountBalance|netWorth|debtAmount|creditScore|bank/iu);
  assert.deepEqual(moneyProfileEvents, [
    "money_profile_started", "money_profile_chapter_completed", "money_profile_resumed", "money_profile_completed", "money_profile_result_viewed", "money_profile_onepager_opened", "money_profile_share_opened", "money_profile_share_completed", "money_profile_experiment_selected", "money_profile_feedback_opened", "money_profile_feedback_submitted",
  ]);
  assert.match(analytics, /detail: \{ name \}/u);
  const executableAnalytics = analytics.replace(/\/\*\*[\s\S]*?\*\//gu, "");
  assert.doesNotMatch(executableAnalytics, /answers|dimensions|profileFamily|stressResponse|moneyMeaning|friction|freeText/iu);
});

test("Money implementation contains no finance-data, bank, social or runtime-AI SDK", () => {
  const combined = [
    source("../lib/money-profile-engine.ts"),
    source("../components/money-profile/money-profile-experience.tsx"),
    source("../components/money-profile/money-profile-share-dialog.tsx"),
    source("../app/tools/money-profile/page.tsx"),
  ].join("\n");
  assert.doesNotMatch(combined, /plaid|tink|finicity|yodlee|stripe|openai|anthropic|facebook sdk|linkedin sdk|whatsapp sdk/iu);
  assert.doesNotMatch(combined, /fetch\(|axios|XMLHttpRequest|WebSocket/iu);
});
