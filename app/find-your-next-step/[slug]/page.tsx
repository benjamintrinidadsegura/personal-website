import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FindYourNextStepJourney } from "@/components/find-your-next-step/find-your-next-step-journey";
import { FindYourNextStepCareer } from "@/components/find-your-next-step/find-your-next-step-career";
import { FindYourNextStepIdea } from "@/components/find-your-next-step/find-your-next-step-idea";
import { FindYourNextStepProblem } from "@/components/find-your-next-step/find-your-next-step-problem";
import { FindYourNextStepSelf } from "@/components/find-your-next-step/find-your-next-step-self";
import { getNextStepJourney, nextStepJourneys } from "@/data/find-your-next-step";
import { getFynsContextScene } from "@/data/find-your-next-step-figures";

interface NextStepJourneyPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return nextStepJourneys.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: NextStepJourneyPageProps): Promise<Metadata> {
  const journey = getNextStepJourney((await params).slug);
  if (!journey) return {};

  const title = `${journey.title} | Find Your Next Step`;
  const contextScene = getFynsContextScene(journey.slug);

  return {
    title,
    description: journey.description,
    alternates: { canonical: journey.href },
    openGraph: {
      type: "website",
      locale: "de_DE",
      url: journey.href,
      siteName: "bts.online",
      title,
      description: journey.description,
      images: [{ url: contextScene.src, width: 1600, height: 900, alt: contextScene.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: journey.description,
      images: [contextScene.src],
    },
  };
}

export default async function NextStepJourneyPage({ params }: NextStepJourneyPageProps) {
  const journey = getNextStepJourney((await params).slug);
  if (!journey) notFound();

  if (journey.slug === "self") return <FindYourNextStepSelf journey={journey} />;
  if (journey.slug === "career") return <FindYourNextStepCareer journey={journey} />;
  if (journey.slug === "problem") return <FindYourNextStepProblem journey={journey} />;
  if (journey.slug === "idea") return <FindYourNextStepIdea journey={journey} />;

  return <FindYourNextStepJourney journey={journey} />;
}
