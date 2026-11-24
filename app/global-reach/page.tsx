import type { Metadata } from "next";
import "@/app/community.css";
import { CommunityNav } from "@/components/community/community-nav";
import { ReachDashboard } from "@/components/community/reach-dashboard";
import { communityCopy } from "@/data/i18n/community";
import { reachCopy } from "@/data/i18n/reach-dashboard";
import { inactiveReach } from "@/lib/analytics/reach-periods";
import { getReachShapes } from "@/lib/analytics/reach-geometry";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return createLocalizedMetadata({ locale, pathname: "/global-reach", title: communityCopy[locale].reach, description: reachCopy[locale][0] });
}

export default async function GlobalReachPage() {
  const locale = await getLocale();
  return <article className="community-page min-h-svh px-4 pb-20 pt-24 sm:px-7 sm:pt-28">
    <div className="community-wrap">
      <CommunityNav locale={locale} current="/global-reach" />
      <ReachDashboard locale={locale} shapes={getReachShapes(false)} dataset={inactiveReach()} />
    </div>
  </article>;
}
