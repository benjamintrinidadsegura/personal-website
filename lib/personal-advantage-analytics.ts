export const personalAdvantageEvents = [
  "advantage_started",
  "advantage_chapter_completed",
  "advantage_resumed",
  "advantage_completed",
  "advantage_result_viewed",
  "advantage_onepager_opened",
  "advantage_share_opened",
  "advantage_share_completed",
  "advantage_experiment_selected",
] as const;

export type PersonalAdvantageEvent = (typeof personalAdvantageEvents)[number];

/**
 * Emits a product-level, payload-free event only. No vendor is installed and no
 * answers, result labels, constraints, access details or free text leave the browser.
 */
export function emitPersonalAdvantageEvent(name: PersonalAdvantageEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bts:product-event", { detail: { name } }));
}
