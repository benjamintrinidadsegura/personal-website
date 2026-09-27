import type { Metadata } from "next";

import { issueFeedbackFormToken } from "@/app/feedback/actions";
import { DiscoveryLandingObserver } from "@/components/discovery/discovery-landing-observer";
import { DiscoveryPrimer } from "@/components/discovery/discovery-primer";
import { MoneyProfileExperience } from "@/components/money-profile/money-profile-experience";
import { getMoneyProfileUiCopy } from "@/data/money-profile-locales";
import { getDiscoverySurface } from "@/data/search-discovery";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";
import { createToolStructuredData } from "@/lib/search-discovery";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getMoneyProfileUiCopy(locale);
  return createLocalizedMetadata({ locale, pathname: "/tools/money-profile", title: `${copy.publicTitle} | bts.online`, description: copy.metadataDescription });
}

export default async function MoneyProfileRoute() {
  const locale = await getLocale();
  const copy = getMoneyProfileUiCopy(locale);
  const surface = getDiscoverySurface("money-profile", locale);
  const structuredData = createToolStructuredData({
    applicationCategory: surface.applicationCategory,
    description: copy.metadataDescription,
    locale,
    name: copy.publicTitle,
    pathname: surface.path,
  });
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</gu, "\\u003c") }} />
    <DiscoveryLandingObserver locale={locale} surface="money-profile" />
    <MoneyProfileExperience
      formToken={await issueFeedbackFormToken()}
      introPrimer={<DiscoveryPrimer locale={locale} surface="money-profile" />}
      locale={locale}
    />
  </>;
}
