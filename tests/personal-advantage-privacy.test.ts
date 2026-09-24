import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { personalAdvantageEvents } from "../lib/personal-advantage-analytics";
import {
  parsePersistedAdvantageState,
  personalAdvantageSchemaVersion,
  personalAdvantageStorageKey,
  serializeAdvantageState,
} from "../lib/personal-advantage-persistence";
import { canonicalBtsShareUrl } from "../lib/sharing/destinations";
import type { PersistedAdvantageState } from "../types/personal-advantage";

const state: PersistedAdvantageState = {
  schemaVersion: 1,
  phase: "questions",
  questionId: "q23",
  answers: {
    q1: { value: "system" },
    q21: { value: ["systems-thinking", "communication-clarity"] },
    q23: { value: "", freeText: "Private story that must remain page-memory only." },
  },
  probeAnswers: { "probe-1-systems-translation": "together" },
  calibration: { "systems-translation": "very-true" },
  updatedAt: "2026-09-24T10:00:00.000Z",
};

test("versioned local persistence strips optional free text and round-trips structured answers", () => {
  assert.equal(personalAdvantageSchemaVersion, 1);
  assert.equal(personalAdvantageStorageKey, "bts.personal-advantage.v1");
  const serialized = serializeAdvantageState(state);
  assert.doesNotMatch(serialized, /Private story/);
  assert.doesNotMatch(serialized, /freeText/);
  const restored = parsePersistedAdvantageState(serialized);
  assert.ok(restored);
  assert.deepEqual(restored.answers.q1, { value: "system" });
  assert.deepEqual(restored.answers.q21, { value: ["systems-thinking", "communication-clarity"] });
  assert.deepEqual(restored.answers.q23, { value: "" });
});

test("corrupt, oversized, obsolete, and unbounded persisted data fail safely", () => {
  assert.equal(parsePersistedAdvantageState(null), null);
  assert.equal(parsePersistedAdvantageState("{not-json"), null);
  assert.equal(parsePersistedAdvantageState("x".repeat(64_001)), null);
  assert.equal(parsePersistedAdvantageState(JSON.stringify({ ...state, schemaVersion: 2 })), null);
  const unsafe = JSON.stringify({ ...state, answers: { q1: { value: "not-an-option" }, unknown: { value: "x" } }, probeAnswers: { "../../bad": "x" } });
  const restored = parsePersistedAdvantageState(unsafe);
  assert.ok(restored);
  assert.deepEqual(restored.answers, {});
  assert.deepEqual(restored.probeAnswers, {});
});

test("analytics is payload-free and the share destination cannot carry result data", () => {
  assert.equal(personalAdvantageEvents.length, 9);
  assert.equal(new Set(personalAdvantageEvents).size, personalAdvantageEvents.length);
  const analyticsSource = readFileSync(new URL("../lib/personal-advantage-analytics.ts", import.meta.url), "utf8");
  assert.doesNotMatch(analyticsSource, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/);
  assert.match(analyticsSource, /detail: \{ name \}/);
  assert.doesNotMatch(analyticsSource, /answer(?:s)?\s*:/i);

  assert.equal(canonicalBtsShareUrl("/tools/personal-advantage"), "https://bts.online/tools/personal-advantage");
  assert.equal(canonicalBtsShareUrl("/tools/personal-advantage?result=secret"), null);
  assert.equal(canonicalBtsShareUrl("/tools/personal-advantage#private"), null);
});

test("the client journey has no runtime AI, remote answer submission, or hidden URL serialization", () => {
  const experience = readFileSync(new URL("../components/personal-advantage/personal-advantage-experience.tsx", import.meta.url), "utf8");
  const share = readFileSync(new URL("../components/personal-advantage/personal-advantage-share-dialog.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(experience, /fetch\(|axios|openai|anthropic|useSearchParams|URLSearchParams/i);
  assert.match(experience, /writeAdvantageState/);
  assert.match(experience, /clearAdvantageState/);
  assert.match(experience, /textNotPersisted/);
  assert.doesNotMatch(share, /map\.answers|freeText|probeAnswers|calibration/);
  assert.match(share, /safeSections/);
  assert.match(share, /ShareFileActions/);
  assert.match(share, /canonicalBtsShareUrl\("\/tools\/personal-advantage"\)/);
});
