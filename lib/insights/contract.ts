export const insightEvents = ["article_view", "tool_view", "tool_start", "tool_complete", "interview_view", "project_view", "community_view", "public_content_open"] as const;
export type InsightEvent = typeof insightEvents[number];
export type InsightArea = "Writing" | "Tools" | "People" | "Projects" | "Community";
export type InsightTarget = { id: string; title: string; href: string; event: InsightEvent; area: InsightArea; lifecycle: boolean };
export const insightsChoiceEvent = "btshq-insights-choice";
export const insightsOptInKey = "btshq-insights-opt-in-v1";
export const insightPeriods = ["7d", "30d", "all"] as const;
export type InsightPeriod = typeof insightPeriods[number];
export function isInsightEvent(value: unknown): value is InsightEvent { return insightEvents.includes(value as InsightEvent); }
export const lifecycleSignals: Readonly<Record<string, { name: InsightEvent; path: string }>> = {
  advantage_started: { name: "tool_start", path: "/tools/personal-advantage" },
  advantage_completed: { name: "tool_complete", path: "/tools/personal-advantage" },
  money_profile_started: { name: "tool_start", path: "/tools/money-profile" },
  money_profile_completed: { name: "tool_complete", path: "/tools/money-profile" },
};
