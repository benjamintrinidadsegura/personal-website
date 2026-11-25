import type { InsightsData } from "../../lib/insights/read";
import type { InsightTarget } from "../../lib/insights/contract";

// Isolated synthetic presentation fixtures. Never a Production data source.
export const empty: InsightsData = { status: "available", startedAt: null, lastEventAt: null, maintainedAt: null,
  asOf: "2026-11-25T12:00:00Z", periodStart: "2026-11-19T00:00:00Z", periodEnd: "2026-11-26T00:00:00Z", metrics: [], daily: [] };
export const catalog: InsightTarget[] = [
  { id: "article:fixture", title: "Ein langer Gedanke über Begegnungen, Veränderungen und die Frage, was uns auch über viele Jahre miteinander verbindet", href: "/writing/fixture", event: "article_view", area: "Writing", lifecycle: false },
  { id: "article:second", title: "Zweite synthetische Geschichte", href: "/writing/second", event: "article_view", area: "Writing", lifecycle: false },
  { id: "tool:pa", title: "Personal Advantage", href: "/tools/personal-advantage", event: "tool_view", area: "Tools", lifecycle: true },
  { id: "tool:other", title: "Weiteres Tool", href: "/tools/fixture", event: "tool_view", area: "Tools", lifecycle: false },
];
export const populated: InsightsData = { ...empty, startedAt: "2026-11-20T09:00:00Z", lastEventAt: "2026-11-25T11:00:00Z", maintainedAt: "2026-11-25T00:07:00Z", metrics: [
  { name: "article_view", contentId: "article:second", count: 3 }, { name: "article_view", contentId: "article:fixture", count: 21 },
  { name: "tool_view", contentId: "tool:pa", count: 9 }, { name: "tool_start", contentId: "tool:pa", count: 4 },
  { name: "tool_complete", contentId: "tool:pa", count: 2 }, { name: "tool_view", contentId: "tool:other", count: 7 },
  { name: "community_view", contentId: "community:overview", count: 5 }, { name: "public_content_open", contentId: "community:echowall", count: 6 },
], daily: [{ day: "2026-11-24", count: 26 }, { day: "2026-11-25", count: 31 }] };
