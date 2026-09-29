import type { Metadata } from "next";

import { issueFeedbackFormToken } from "@/app/feedback/actions";
import { DiscoveryLandingObserver } from "@/components/discovery/discovery-landing-observer";
import { DiscoveryPrimer } from "@/components/discovery/discovery-primer";
import { PersonalAdvantageExperience } from "@/components/personal-advantage/personal-advantage-experience";
import { getPersonalAdvantageUiCopy } from "@/data/personal-advantage-locales";
import { getDiscoverySurface } from "@/data/search-discovery";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";
import { createToolStructuredData } from "@/lib/search-discovery";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getPersonalAdvantageUiCopy(locale);
  const surface = getDiscoverySurface("personal-advantage", locale);
  return createLocalizedMetadata({ locale, pathname: surface.path, title: `${surface.copy.question} | btshq.online`, description: copy.metadataDescription });
}

export default async function PersonalAdvantageRoute() {
  const locale = await getLocale();
  const copy = getPersonalAdvantageUiCopy(locale);
  const surface = getDiscoverySurface("personal-advantage", locale);
  const structuredData = createToolStructuredData({
    applicationCategory: surface.applicationCategory,
    description: copy.metadataDescription,
    locale,
    name: surface.copy.question,
    pathname: surface.path,
  });
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</gu, "\\u003c") }} />
    <DiscoveryLandingObserver locale={locale} surface="personal-advantage" />
    <PersonalAdvantageExperience
      formToken={await issueFeedbackFormToken()}
      introPrimer={<DiscoveryPrimer locale={locale} surface="personal-advantage" />}
      introTitle={surface.copy.question}
      locale={locale}
    />
  </>;
}
