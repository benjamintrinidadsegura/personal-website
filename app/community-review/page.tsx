import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/app/community.css";
import { CommunityNav } from "@/components/community/community-nav";
import { CommunityOverview } from "@/components/community/community-overview";
import { ReachDashboard } from "@/components/community/reach-dashboard";
import { EchoWall } from "@/components/echowall/echo-wall";
import { getReachShapes } from "@/lib/analytics/reach-geometry";
import { isCommunityReviewEnabled } from "@/lib/community/local-review";
import { parseEchoFeed } from "@/lib/echowall/feed";
import { readPublicEchoFeed } from "@/lib/echowall/public-feed";
import { reactionSecret } from "@/lib/echowall/reaction-identity";
import { getLocale } from "@/lib/i18n/server";
import { localizeHref } from "@/lib/i18n/routing";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CommunityReview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!await isCommunityReviewEnabled()) notFound();
  const [{ reviewReach }, values, locale] = await Promise.all([import("@/lib/community/review-fixtures"), searchParams, getLocale()]);
  const view = typeof values.view === "string" ? values.view : "overview";
  const dataset = reviewReach(typeof values.state === "string" ? values.state : undefined);
  const query = parseEchoFeed(values, !!reactionSecret());
  if (view === "reach") return <article className="community-page min-h-svh px-4 pb-20 pt-24 sm:px-7 sm:pt-28">
    <div className="community-wrap"><CommunityNav locale={locale} current="/community" />
      <ReachDashboard locale={locale} shapes={getReachShapes()} dataset={dataset} demo />
    </div>
  </article>;
  if (view === "echo") {
    const feed = await readPublicEchoFeed(query);
    return <EchoWall locale={locale} query={query} feed={feed} formToken="local-review-only" demo
      pathname={localizeHref("/community-review", locale)} />;
  }
  const feed = await readPublicEchoFeed(parseEchoFeed({}, false), 2, false);
  return <CommunityOverview locale={locale} feed={feed} dataset={dataset} demo participation />;
}
