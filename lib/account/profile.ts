import type { Locale } from "@/lib/i18n/config";
import { getAccountDictionary } from "@/data/i18n/account";

const CONTROL_OR_BIDI_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
const RESERVED_DISPLAY_NAMES = new Set([
  "guest",
  "author",
  "admin",
  "administrator",
  "moderator",
  "staff",
  "support",
  "bts.online",
  "bts studio",
]);

export type DisplayNameValidation =
  | { success: true; displayName: string }
  | { success: false };

export function normalizeAccountDisplayName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}

export function validateAccountDisplayName(value: unknown): DisplayNameValidation {
  if (typeof value !== "string" || /[\r\n]/u.test(value)) return { success: false };
  const displayName = normalizeAccountDisplayName(value);
  const length = Array.from(displayName).length;
  if (
    length < 2
    || length > 40
    || CONTROL_OR_BIDI_CHARACTERS.test(displayName)
    || RESERVED_DISPLAY_NAMES.has(displayName.toLocaleLowerCase("en-US"))
  ) return { success: false };
  return { success: true, displayName };
}

export async function processDisplayNameSetup(
  value: unknown,
  actorUserId: string | null,
  requestIsValid: boolean,
  save: (actorUserId: string, displayName: string) => Promise<boolean>,
  locale: Locale = "en",
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getAccountDictionary(locale);
  const saveFailure = copy.profileSaveFailure;
  const validation = validateAccountDisplayName(value);
  if (!requestIsValid || !actorUserId) return { ok: false, message: saveFailure };
  if (!validation.success) return { ok: false, message: copy.profileInvalid };
  try {
    return await save(actorUserId, validation.displayName)
      ? { ok: true }
      : { ok: false, message: saveFailure };
  } catch {
    return { ok: false, message: saveFailure };
  }
}
