import type { Metadata } from "next";

import { FindYourNextStepOverview } from "@/components/find-your-next-step/find-your-next-step-overview";
import { findYourNextStep } from "@/data/find-your-next-step";
import { getFynsContextScene } from "@/data/find-your-next-step-figures";

const description = findYourNextStep.introduction;
const overviewScene = getFynsContextScene("overview");

export const metadata: Metadata = {
  title: "Find Your Next Step | bts.online",
  description,
  alternates: { canonical: findYourNextStep.href },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: findYourNextStep.href,
    siteName: "bts.online",
    title: "Find Your Next Step | bts.online",
    description,
    images: [{ url: overviewScene.src, width: 1600, height: 900, alt: overviewScene.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your Next Step | bts.online",
    description,
    images: [overviewScene.src],
  },
};

export default function FindYourNextStepPage() {
  return <FindYourNextStepOverview />;
}
