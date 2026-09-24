import { advantageQuestions } from "@/data/personal-advantage-questions";
import { advantageSignalById } from "@/data/personal-advantage-signals";
import type { AdvantageAnswer, AdvantageCalibrationValue, PersistedAdvantageState } from "@/types/personal-advantage";

export const personalAdvantageStorageKey = "bts.personal-advantage.v1";
export const personalAdvantageSchemaVersion = 1 as const;
const maxStorageCharacters = 64_000;
const phases = new Set<PersistedAdvantageState["phase"]>(["questions", "probes", "calibration", "reveal", "result"]);
const calibrationValues = new Set<AdvantageCalibrationValue>(["very-true", "sometimes-true", "not-really"]);
const questionsById = new Map(advantageQuestions.map((question) => [question.id, question]));

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeAnswer(questionId: string, value: unknown): AdvantageAnswer | null {
  const question = questionsById.get(questionId as `q${number}`);
  if (!question || !isRecord(value)) return null;
  if (value.skipped === true) return { value: "", skipped: true };
  const raw = value.value;
  const allowedIds = new Set(question.options.map(({ id }) => id));
  const validDynamic = (candidate: string) => question.type === "adaptive-signals" && advantageSignalById.has(candidate);
  if (Array.isArray(raw)) {
    const values = [...new Set(raw.filter((item): item is string => typeof item === "string" && (allowedIds.has(item) || validDynamic(item))))]
      .slice(0, question.maxSelections ?? question.options.length ?? 1);
    return { value: values };
  }
  if (typeof raw === "string" && (allowedIds.has(raw) || validDynamic(raw) || (question.type === "text" && raw === ""))) return { value: raw };
  return question.type === "text" ? { value: "" } : null;
}

export function parsePersistedAdvantageState(raw: string | null): PersistedAdvantageState | null {
  if (!raw || raw.length > maxStorageCharacters) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.schemaVersion !== personalAdvantageSchemaVersion || !phases.has(value.phase as PersistedAdvantageState["phase"])) return null;
    if (typeof value.updatedAt !== "string" || Number.isNaN(Date.parse(value.updatedAt))) return null;
    if (value.questionId !== null && (typeof value.questionId !== "string" || !questionsById.has(value.questionId as `q${number}`))) return null;
    const answers: Record<string, AdvantageAnswer> = {};
    if (isRecord(value.answers)) {
      for (const [questionId, answer] of Object.entries(value.answers)) {
        const sanitized = sanitizeAnswer(questionId, answer);
        if (sanitized) answers[questionId] = sanitized;
      }
    }
    const probeAnswers = (isRecord(value.probeAnswers)
      ? Object.fromEntries(Object.entries(value.probeAnswers).filter(([key, answer]) => /^probe-\d+-[a-z0-9-]+$/u.test(key) && typeof answer === "string" && answer.length <= 40))
      : {}) as Record<string, string>;
    const calibration = isRecord(value.calibration)
      ? Object.fromEntries(Object.entries(value.calibration).filter(([key, answer]) => /^[a-z0-9-]+$/u.test(key) && calibrationValues.has(answer as AdvantageCalibrationValue))) as Record<string, AdvantageCalibrationValue>
      : {};
    return {
      schemaVersion: 1,
      phase: value.phase as PersistedAdvantageState["phase"],
      questionId: value.questionId as string | null,
      answers,
      probeAnswers,
      calibration,
      updatedAt: value.updatedAt,
      ...(typeof value.completedAt === "string" && !Number.isNaN(Date.parse(value.completedAt)) ? { completedAt: value.completedAt } : {}),
    };
  } catch {
    return null;
  }
}

/** Optional free text is intentionally excluded from browser persistence. */
export function serializeAdvantageState(state: PersistedAdvantageState): string {
  const answers = Object.fromEntries(Object.entries(state.answers).map(([questionId, answer]) => [questionId, {
    value: answer.value,
    ...(answer.skipped ? { skipped: true } : {}),
  }]));
  const serialized = JSON.stringify({ ...state, schemaVersion: 1, answers });
  if (serialized.length > maxStorageCharacters) throw new Error("Personal Advantage state exceeds the local storage boundary");
  return serialized;
}

export function readAdvantageState(): PersistedAdvantageState | null {
  if (typeof window === "undefined") return null;
  return parsePersistedAdvantageState(window.localStorage.getItem(personalAdvantageStorageKey));
}

export function writeAdvantageState(state: PersistedAdvantageState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(personalAdvantageStorageKey, serializeAdvantageState(state));
}

export function clearAdvantageState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(personalAdvantageStorageKey);
}
