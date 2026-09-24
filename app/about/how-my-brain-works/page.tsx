import type { Metadata } from "next";

import { BrainManualPage } from "@/components/brain-manual/brain-manual-page";
import { getBrainManualUiCopy } from "@/data/brain-manual-locales";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getBrainManualUiCopy(locale);
  return createLocalizedMetadata({ locale, pathname: "/about/how-my-brain-works", title: copy.metadataTitle, description: copy.description });
}

export default async function BrainManualRoute() {
  const locale = await getLocale();
  return <BrainManualPage locale={locale} />;
}
