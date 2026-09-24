import type { Metadata } from "next";

import { issueFeedbackFormToken } from "@/app/feedback/actions";
import { PersonalAdvantageExperience } from "@/components/personal-advantage/personal-advantage-experience";
import { getPersonalAdvantageUiCopy } from "@/data/personal-advantage-locales";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getPersonalAdvantageUiCopy(locale);
  return createLocalizedMetadata({ locale, pathname: "/tools/personal-advantage", title: "What's Your Unfair Advantage? | bts.online", description: copy.metadataDescription });
}

export default async function PersonalAdvantageRoute() {
  const locale = await getLocale();
  return <PersonalAdvantageExperience formToken={await issueFeedbackFormToken()} locale={locale} />;
}
