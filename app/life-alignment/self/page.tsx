import type { Metadata } from "next";

import { LifeAlignmentPage as LifeAlignmentExperience } from "@/components/life-alignment/life-alignment-page";
import { lifeAlignment, lifeAlignmentScene } from "@/data/life-alignment";

const selfHref = "/life-alignment/self";

export const metadata: Metadata = {
  title: "Self | Life Alignment | bts.online",
  description: lifeAlignment.description,
  alternates: { canonical: selfHref },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: selfHref,
    siteName: "bts.online",
    title: "Self | Life Alignment | bts.online",
    description: lifeAlignment.description,
    images: [{ url: lifeAlignmentScene.src, width: 1600, height: 900, alt: lifeAlignmentScene.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Self | Life Alignment | bts.online",
    description: lifeAlignment.description,
    images: [lifeAlignmentScene.src],
  },
};

export default function LifeAlignmentSelfPage() {
  return <LifeAlignmentExperience />;
}
