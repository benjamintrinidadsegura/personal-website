import { moneyQuestionById } from "@/data/money-profile-questions";
import { getVisibleMoneyQuestions, reconcileMoneyAnswers } from "@/lib/money-profile-engine";
import type { MoneyAnswer, MoneyCalibrationValue, PersistedMoneyProfileState } from "@/types/money-profile";

export const moneyProfileStorageKey = "bts.money-profile.v1";
export const moneyProfileSchemaVersion = 1 as const;
const maximumStorageCharacters = 48_000;
const phases = new Set<PersistedMoneyProfileState["phase"]>(["questions", "calibration", "reveal", "result"]);
const calibrationValues = new Set<MoneyCalibrationValue>(["very-true", "partly", "not-really"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeAnswers(value: unknown): Record<string, MoneyAnswer> {
  if (!isRecord(value)) return {};
  const visibleIds = new Set<string>(getVisibleMoneyQuestions({}).map(({ id }) => id));
  const pending: Record<string, MoneyAnswer> = {};
  for (const [questionId, rawAnswer] of Object.entries(value)) {
    if (!/^m(?:[1-9]|[1-3][0-9]|4[01])$/u.test(questionId) || !isRecord(rawAnswer)) continue;
    const question = moneyQuestionById.get(questionId as `m${number}`);
    if (!question) continue;
    const allowed = new Set(question.options.map(({ id }) => id));
    if (rawAnswer.skipped === true) { pending[questionId] = { value: "", skipped: true }; continue; }
    const rawValue = rawAnswer.value;
    if (typeof rawValue === "string" && allowed.has(rawValue)) pending[questionId] = { value: rawValue };
    if (Array.isArray(rawValue)) {
      const safe = [...new Set(rawValue.filter((item): item is string => typeof item === "string" && allowed.has(item)))].slice(0, question.maxSelections ?? 1);
      pending[questionId] = { value: safe };
    }
  }
  // Recompute conditional visibility from the recovered evidence and discard stale branches.
  const reconciled = reconcileMoneyAnswers(pending);
  for (const id of Object.keys(reconciled)) visibleIds.add(id);
  return Object.fromEntries(Object.entries(reconciled).filter(([id]) => visibleIds.has(id)));
}

export function parsePersistedMoneyProfileState(raw: string | null): PersistedMoneyProfileState | null {
  if (!raw || raw.length > maximumStorageCharacters) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.schemaVersion !== 1 || !phases.has(value.phase as PersistedMoneyProfileState["phase"])) return null;
    if (typeof value.updatedAt !== "string" || Number.isNaN(Date.parse(value.updatedAt))) return null;
    const answers = sanitizeAnswers(value.answers);
    const validQuestionIds = new Set(getVisibleMoneyQuestions(answers).map(({ id }) => id));
    const questionId = value.questionId === null
      ? null
      : typeof value.questionId === "string" && validQuestionIds.has(value.questionId as `m${number}`)
        ? value.questionId
        : getVisibleMoneyQuestions(answers)[0]?.id ?? null;
    const calibration = isRecord(value.calibration)
      ? Object.fromEntries(Object.entries(value.calibration).filter(([key, answer]) => /^hypothesis-[a-z0-9-]+$/u.test(key) && calibrationValues.has(answer as MoneyCalibrationValue))) as Record<string, MoneyCalibrationValue>
      : {};
    return {
      schemaVersion: 1,
      phase: value.phase as PersistedMoneyProfileState["phase"],
      questionId,
      answers,
      calibration,
      updatedAt: value.updatedAt,
      ...(typeof value.completedAt === "string" && !Number.isNaN(Date.parse(value.completedAt)) ? { completedAt: value.completedAt } : {}),
    };
  } catch {
    return null;
  }
}

export function serializeMoneyProfileState(state: PersistedMoneyProfileState): string {
  const serialized = JSON.stringify({ ...state, schemaVersion: 1 });
  if (serialized.length > maximumStorageCharacters) throw new Error("Money Profile state exceeds the local storage boundary");
  return serialized;
}

export function readMoneyProfileState(): PersistedMoneyProfileState | null {
  if (typeof window === "undefined") return null;
  return parsePersistedMoneyProfileState(window.localStorage.getItem(moneyProfileStorageKey));
}

export function writeMoneyProfileState(state: PersistedMoneyProfileState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(moneyProfileStorageKey, serializeMoneyProfileState(state));
}

export function clearMoneyProfileState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(moneyProfileStorageKey);
}
