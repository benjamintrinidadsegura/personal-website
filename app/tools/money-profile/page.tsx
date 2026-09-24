import type { Metadata } from "next";

import { issueFeedbackFormToken } from "@/app/feedback/actions";
import { MoneyProfileExperience } from "@/components/money-profile/money-profile-experience";
import { getMoneyProfileUiCopy } from "@/data/money-profile-locales";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getMoneyProfileUiCopy(locale);
  return createLocalizedMetadata({ locale, pathname: "/tools/money-profile", title: `${copy.publicTitle} | bts.online`, description: copy.metadataDescription });
}

export default async function MoneyProfileRoute() {
  const locale = await getLocale();
  return <MoneyProfileExperience formToken={await issueFeedbackFormToken()} locale={locale} />;
}
