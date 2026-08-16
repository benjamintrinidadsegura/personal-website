import type { Metadata } from "next";

import { LifeAlignmentHub } from "@/components/life-alignment/life-alignment-hub";
import { lifeAlignmentHub } from "@/data/life-alignment-modules";
import { lifeAlignmentScene } from "@/data/life-alignment";

export const metadata: Metadata = {
  title: "Life Alignment | bts.online",
  description: lifeAlignmentHub.description,
  alternates: { canonical: lifeAlignmentHub.href },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: lifeAlignmentHub.href,
    siteName: "bts.online",
    title: "Life Alignment | bts.online",
    description: lifeAlignmentHub.description,
    images: [{ url: lifeAlignmentScene.src, width: 1600, height: 900, alt: lifeAlignmentScene.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Life Alignment | bts.online",
    description: lifeAlignmentHub.description,
    images: [lifeAlignmentScene.src],
  },
};

export default function LifeAlignmentHubPage() {
  return <LifeAlignmentHub />;
}
