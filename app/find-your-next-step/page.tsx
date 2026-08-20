import type { Metadata } from "next";

import { FindYourNextStepOverview } from "@/components/find-your-next-step/find-your-next-step-overview";
import { getFindYourNextStep } from "@/data/find-your-next-step";
import { getLocalizedFynsContextScene } from "@/data/find-your-next-step-figures";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const content = getFindYourNextStep(locale);
  const overviewScene = getLocalizedFynsContextScene("overview", locale);
  const metadata = createLocalizedMetadata({
    locale,
    pathname: content.href,
    title: "Find Your Next Step | bts.online",
    description: content.introduction,
  });
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, images: [{ url: overviewScene.src, width: 1600, height: 900, alt: overviewScene.alt }] },
    twitter: { ...metadata.twitter, images: [overviewScene.src] },
  };
}

export default async function FindYourNextStepPage() {
  const locale = await getLocale();
  return <FindYourNextStepOverview locale={locale} />;
}
