import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FindYourNextStepJourney } from "@/components/find-your-next-step/find-your-next-step-journey";
import { FindYourNextStepCareer } from "@/components/find-your-next-step/find-your-next-step-career";
import { FindYourNextStepIdea } from "@/components/find-your-next-step/find-your-next-step-idea";
import { FindYourNextStepProblem } from "@/components/find-your-next-step/find-your-next-step-problem";
import { FindYourNextStepSelf } from "@/components/find-your-next-step/find-your-next-step-self";
import { getLocalizedNextStepJourney, nextStepJourneys } from "@/data/find-your-next-step";
import { getLocalizedFynsContextScene } from "@/data/find-your-next-step-figures";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

interface NextStepJourneyPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return nextStepJourneys.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: NextStepJourneyPageProps): Promise<Metadata> {
  const locale = await getLocale();
  const journey = getLocalizedNextStepJourney((await params).slug, locale);
  if (!journey) return {};

  const title = `${journey.title} | Find Your Next Step`;
  const contextScene = getLocalizedFynsContextScene(journey.slug, locale);
  const metadata = createLocalizedMetadata({ locale, pathname: journey.href, title, description: journey.description });
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, images: [{ url: contextScene.src, width: 1600, height: 900, alt: contextScene.alt }] },
    twitter: { ...metadata.twitter, images: [contextScene.src] },
  };
}

export default async function NextStepJourneyPage({ params }: NextStepJourneyPageProps) {
  const locale = await getLocale();
  const journey = getLocalizedNextStepJourney((await params).slug, locale);
  if (!journey) notFound();

  if (journey.slug === "self") return <FindYourNextStepSelf journey={journey} locale={locale} />;
  if (journey.slug === "career") return <FindYourNextStepCareer journey={journey} locale={locale} />;
  if (journey.slug === "problem") return <FindYourNextStepProblem journey={journey} locale={locale} />;
  if (journey.slug === "idea") return <FindYourNextStepIdea journey={journey} locale={locale} />;

  return <FindYourNextStepJourney journey={journey} locale={locale} />;
}
