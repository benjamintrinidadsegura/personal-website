import { writingContentTypes, writingLanguages, type WritingContentType, type WritingLanguage } from "@/types/writing";

// Private, browser-local drafts only. Nothing is uploaded or shared with telemetry.
export const WRITING_RECOVERY_PREFIX = "btshq.writing.recovery.v1.";
export const WRITING_RECOVERY_TTL_MS = 24 * 60 * 60 * 1_000;
export const WRITING_RECOVERY_MAX_BYTES = 512 * 1024;
export const WRITING_RECOVERY_MAX_ENTRIES = 8;
const MAX_TOTAL_BYTES = 2 * 1024 * 1024;

export type WritingRecoveryFields = {
  title: string; deck: string; excerpt: string;
  contentType: WritingContentType; sourceLocale: WritingLanguage; topics: string[];
};
export type WritingRecoveryEntry = {
  version: 1; articleId: string; owner: string; capturedAt: number;
  baseUpdatedAt: string; fields: WritingRecoveryFields; raw: unknown;
};
export type WritingRecoveryCandidate = { entry: WritingRecoveryEntry; token: string };
type RecoveryStorage = Pick<Storage, "length" | "key" | "getItem" | "setItem" | "removeItem">;
type RecoveryResult = { ok: true } | { ok: false; message: string };

/** Serialize the complete check/write/delete operation across same-origin tabs.
 * Storage helpers below are synchronous and must run inside this lock in browsers.
 * Without Web Locks, retain the live editor and offer a download instead of unsafe cleanup.
 */
export async function withWritingRecoveryLock<T>(operation: () => T): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) throw new Error("Safe local recovery storage is unavailable.");
  return navigator.locks.request(WRITING_RECOVERY_PREFIX, operation);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function entryKey(entry: Pick<WritingRecoveryEntry, "articleId" | "owner">): string {
  if (![entry.articleId, entry.owner].every((value) => /^[A-Za-z0-9_-]{1,64}$/u.test(value))) throw new Error("Invalid recovery identity.");
  return `${WRITING_RECOVERY_PREFIX}${entry.articleId}.${entry.owner}`;
}
function bytes(value: string): number { return new TextEncoder().encode(value).byteLength; }
function storageKeys(storage: RecoveryStorage): string[] {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => !!key?.startsWith(WRITING_RECOVERY_PREFIX));
}
function parseEntry(token: string, key: string): WritingRecoveryEntry | null {
  const value: unknown = JSON.parse(token);
  if (!record(value) || value.version !== 1 || typeof value.articleId !== "string" || typeof value.owner !== "string"
    || typeof value.capturedAt !== "number" || !Number.isFinite(value.capturedAt) || typeof value.baseUpdatedAt !== "string"
    || !record(value.fields) || !Array.isArray(value.raw) || value.raw.length === 0) return null;
  if (!Object.keys(value).every((key) => ["version", "articleId", "owner", "capturedAt", "baseUpdatedAt", "fields", "raw"].includes(key))) return null;
  const fields = value.fields;
  // Only display metadata may be merged into the editor snapshot on restore.
  // A malformed fields.document must never replace the validated raw document.
  if (!Object.keys(fields).every((key) => ["title", "deck", "excerpt", "contentType", "sourceLocale", "topics"].includes(key))) return null;
  if (![fields.title, fields.deck, fields.excerpt].every((field) => typeof field === "string")
    || !writingContentTypes.includes(fields.contentType as WritingContentType)
    || !writingLanguages.includes(fields.sourceLocale as WritingLanguage)
    || !Array.isArray(fields.topics) || !fields.topics.every((topic) => typeof topic === "string")) return null;
  const entry = value as WritingRecoveryEntry;
  return entryKey(entry) === key ? entry : null;
}

export function readWritingRecovery(storage: RecoveryStorage, articleId: string, now = Date.now()): { candidates: WritingRecoveryCandidate[]; error: string | null } {
  const candidates: WritingRecoveryCandidate[] = [];
  let error: string | null = null;
  try {
    for (const key of storageKeys(storage)) {
      const token = storage.getItem(key);
      if (!token) continue;
      try {
        const entry = parseEntry(token, key);
        if (!entry) throw new Error("Invalid recovery record.");
        if (now - entry.capturedAt >= WRITING_RECOVERY_TTL_MS) {
          storage.removeItem(key);
          continue;
        }
        if (entry.articleId === articleId) candidates.push({ entry, token });
      } catch {
        // Do not destroy an unreadable backup or replace it with a parsed snapshot.
        if (key.startsWith(`${WRITING_RECOVERY_PREFIX}${articleId}.`)) error = "A local recovery copy could not be read. It has not been overwritten.";
      }
    }
  } catch {
    error = "Local recovery storage is unavailable. Keep this tab open or download a recovery copy before leaving.";
  }
  candidates.sort((a, b) => b.entry.capturedAt - a.entry.capturedAt || a.entry.owner.localeCompare(b.entry.owner));
  return { candidates, error };
}

export function writeWritingRecovery(storage: RecoveryStorage, entry: WritingRecoveryEntry): RecoveryResult {
  try {
    const key = entryKey(entry);
    const token = JSON.stringify(entry);
    if (bytes(token) > WRITING_RECOVERY_MAX_BYTES) return { ok: false, message: "This draft exceeds the local recovery limit (512 KiB). Download a recovery copy before leaving." };
    const keys = storageKeys(storage);
    // Each open editor owns a separate slot; one tab can never overwrite another.
    if (!keys.includes(key) && keys.length >= WRITING_RECOVERY_MAX_ENTRIES) return { ok: false, message: "Local recovery storage is full (8 copies). Existing copies were kept. Download this draft before leaving." };
    const total = keys.filter((other) => other !== key).reduce((sum, other) => sum + bytes(storage.getItem(other) ?? ""), bytes(token));
    if (total > MAX_TOTAL_BYTES) return { ok: false, message: "Local recovery storage is full (2 MiB). Existing copies were kept. Download this draft before leaving." };
    storage.setItem(key, token);
    return { ok: true };
  } catch {
    return { ok: false, message: "Local recovery could not be saved. Keep this tab open or download a recovery copy before leaving." };
  }
}

export function removeWritingRecovery(storage: RecoveryStorage, candidate: WritingRecoveryCandidate): RecoveryResult {
  try {
    const key = entryKey(candidate.entry);
    // An active tab may have updated a selected backup since it was displayed.
    if (storage.getItem(key) !== candidate.token) return { ok: false, message: "That recovery copy changed in another tab. It was not deleted. Reload to review it." };
    storage.removeItem(key);
    return { ok: true };
  } catch {
    return { ok: false, message: "The local recovery copy could not be removed." };
  }
}
