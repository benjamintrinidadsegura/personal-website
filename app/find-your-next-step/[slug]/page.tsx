import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FindYourNextStepJourney } from "@/components/find-your-next-step/find-your-next-step-journey";
import { FindYourNextStepSelf } from "@/components/find-your-next-step/find-your-next-step-self";
import { getNextStepJourney, nextStepJourneys } from "@/data/find-your-next-step";

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
      images: [{ url: "/og.png", width: 1732, height: 909, alt: "Benjamin Trinidad Segura – Digital HQ" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: journey.description,
      images: ["/og.png"],
    },
  };
}

export default async function NextStepJourneyPage({ params }: NextStepJourneyPageProps) {
  const journey = getNextStepJourney((await params).slug);
  if (!journey) notFound();

  if (journey.slug === "self") return <FindYourNextStepSelf journey={journey} />;

  return <FindYourNextStepJourney journey={journey} />;
}
