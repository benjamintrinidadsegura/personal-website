import type { Metadata } from "next";

import { FindYourNextStepOverview } from "@/components/find-your-next-step/find-your-next-step-overview";
import { findYourNextStep } from "@/data/find-your-next-step";

const description = findYourNextStep.introduction;

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
    images: [{ url: "/og.png", width: 1732, height: 909, alt: "Benjamin Trinidad Segura – Digital HQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your Next Step | bts.online",
    description,
    images: ["/og.png"],
  },
};

export default function FindYourNextStepPage() {
  return <FindYourNextStepOverview />;
}
