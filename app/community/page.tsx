import type { Metadata } from "next";
import "@/app/community.css";
import { CommunityOverview } from "@/components/community/community-overview";
import { communityCopy } from "@/data/i18n/community";
import { inactiveReach } from "@/lib/analytics/reach-periods";
import { parseEchoFeed } from "@/lib/echowall/feed";
import { readPublicEchoFeed } from "@/lib/echowall/public-feed";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { echoSubmissionsConfigured } from "@/lib/echowall/submission-configuration";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return createLocalizedMetadata({ locale, pathname: "/community", title: communityCopy[locale].community, description: communityCopy[locale].intro });
}

export const dynamic = "force-dynamic";
export default async function CommunityPage() {
  const [locale, feed] = await Promise.all([getLocale(), readPublicEchoFeed(parseEchoFeed({}, false), 2, false)]);
  return <CommunityOverview locale={locale} feed={feed} dataset={inactiveReach()} participation={echoSubmissionsConfigured() && feed.status !== "unavailable"} />;
}
