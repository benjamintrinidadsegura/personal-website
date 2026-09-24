export const moneyProfileEvents = [
  "money_profile_started",
  "money_profile_chapter_completed",
  "money_profile_resumed",
  "money_profile_completed",
  "money_profile_result_viewed",
  "money_profile_onepager_opened",
  "money_profile_share_opened",
  "money_profile_share_completed",
  "money_profile_experiment_selected",
  "money_profile_feedback_opened",
  "money_profile_feedback_submitted",
] as const;

export type MoneyProfileEvent = (typeof moneyProfileEvents)[number];

/** Emits only a payload-free product event. Answers, result labels and financial patterns never leave the browser. */
export function emitMoneyProfileEvent(name: MoneyProfileEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bts:product-event", { detail: { name } }));
}
