import type { Metadata } from "next";

import { LifeVisionJourney } from "@/components/life-alignment/life-vision/life-vision-journey";
import { lifeVision, lifeVisionScene } from "@/data/life-alignment-life-vision";

export const metadata: Metadata = {
  title: "Life Vision | Life Alignment | bts.online",
  description: lifeVision.description,
  alternates: { canonical: lifeVision.href },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: lifeVision.href,
    siteName: "bts.online",
    title: "Life Vision | Life Alignment | bts.online",
    description: lifeVision.description,
    images: [{ url: lifeVisionScene.src, width: 1600, height: 900, alt: lifeVisionScene.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Life Vision | Life Alignment | bts.online",
    description: lifeVision.description,
    images: [lifeVisionScene.src],
  },
};

export default function LifeAlignmentLifeVisionPage() {
  return <LifeVisionJourney />;
}
