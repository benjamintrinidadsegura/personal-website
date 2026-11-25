import "server-only";
import { createHash } from "node:crypto";
import { discoveryIndex } from "@/data/discovery-index";
import { projects } from "@/data/projects";
import { publishedSpotlights } from "@/data/spotlights";
import { locales } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import type { InsightTarget } from "./contract";

/** Content identity only, never a visitor hash. Stable across locales/order/title edits. */
export function insightContentId(area: string, sourceId: string) { return area + ":" + createHash("sha256").update(sourceId).digest("hex").slice(0, 32); }
export function staticInsightsCatalog(): InsightTarget[] {
  const tools = discoveryIndex.filter((item) => item.group === "Tools" && item.href && /^(?:\/tools\/|\/find-your-next-step(?:\/|$)|\/life-alignment(?:\/|$))/u.test(item.href) && ["Live", "Beta"].includes(item.status));
  const targets: InsightTarget[] = [
    ...tools.map((tool) => ({ id: insightContentId("tool", tool.id), title: tool.title, href: tool.href!, event: "tool_view" as const, area: "Tools" as const, lifecycle: ["/tools/personal-advantage", "/tools/money-profile"].includes(tool.href!) })),
    ...projects.map((project) => ({ id: insightContentId("project", project.slug), title: project.name, href: "/projects/" + project.slug, event: "project_view" as const, area: "Projects" as const, lifecycle: false })),
    ...publishedSpotlights.map((person) => ({ id: insightContentId("interview", person.id), title: person.title, href: "/people/" + person.slug, event: "interview_view" as const, area: "People" as const, lifecycle: false })),
    { id: "community:overview", title: "Community", href: "/community", event: "community_view", area: "Community", lifecycle: false },
    { id: "community:connection-map", title: "Connection Map", href: "/world", event: "public_content_open", area: "Community", lifecycle: false },
    { id: "community:echowall", title: "EchoWall", href: "/echowall", event: "public_content_open", area: "Community", lifecycle: false },
    { id: "community:global-reach", title: "Global Reach", href: "/community#global-reach", event: "public_content_open", area: "Community", lifecycle: false },
  ];
  return [...new Map(targets.map((target) => [target.href, target])).values()];
}
export function localizedInsightTargets() {
  return staticInsightsCatalog().flatMap((target) => locales.map((locale) => ({ ...target, href: localizeHref(target.href, locale) })));
}
