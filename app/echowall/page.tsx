import type { Metadata } from "next";
import "@/app/community.css";
import { EchoWall } from "@/components/echowall/echo-wall";
import { issueEchoFormToken } from "@/app/echowall/actions";
import { getApprovedEchoes } from "@/lib/echowall/queries";
import { isEchoCountryContextEnabled } from "@/lib/echowall/country-configuration";
import { getEchoDictionary } from "@/data/i18n/echowall";
import { parseEchoFeed } from "@/lib/echowall/feed";
import { readPublicEchoFeed } from "@/lib/echowall/public-feed";
import { reactionSecret } from "@/lib/echowall/reaction-identity";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return createLocalizedMetadata({ locale, pathname: "/echowall", title: "EchoWall | btshq.online", description: getEchoDictionary(locale).page.description });
}

export const dynamic = "force-dynamic";

export default async function EchoWallPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [values, locale, formToken] = await Promise.all([searchParams, getLocale(), issueEchoFormToken()]);
  const query = parseEchoFeed(values, !!reactionSecret());
  const [feed, country] = await Promise.all([
    readPublicEchoFeed(query),
    formToken && isEchoCountryContextEnabled() ? getApprovedEchoes(1, true) : null,
  ]);
  return <EchoWall locale={locale} feed={feed} query={query} formToken={formToken} countryReady={!!country?.countryContextAvailable} />;
}
