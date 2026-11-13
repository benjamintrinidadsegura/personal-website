/** A date only: no interests, identifier, answers or visitor profile. */
export const welcomeStorageKey = "btshq:welcome-dismissed:v1";
type StorageAccess = () => Pick<Storage, "getItem" | "setItem">;
export function localWelcomeDay(now = new Date()): string {
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}
/** The memory guard survives client navigation even when browser storage is blocked. */
export function createWelcomeGate() {
  let dismissedDay = "";
  return {
    visible(storage: StorageAccess, hash: string, now = new Date()) {
      if (hash && hash !== "#home") return false;
      const day = localWelcomeDay(now);
      if (dismissedDay === day) return false;
      try { return storage().getItem(welcomeStorageKey) !== day; } catch { return true; }
    },
    dismiss(storage: StorageAccess, now = new Date()) {
      dismissedDay = localWelcomeDay(now);
      try { storage().setItem(welcomeStorageKey, dismissedDay); } catch { /* Current session remains quiet. */ }
    },
  };
}
export const welcomeGate = createWelcomeGate();
