import type { Metadata } from "next";

import { PartnerPage } from "@/components/life-alignment/partner/partner-page";
import { partnerModule, partnerScene } from "@/data/life-alignment-partner";

export const metadata: Metadata = {
  title: "Partner / Relationship | Life Alignment | bts.online",
  description: partnerModule.description,
  alternates: { canonical: partnerModule.href },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: partnerModule.href,
    siteName: "bts.online",
    title: "Partner / Relationship | Life Alignment | bts.online",
    description: partnerModule.description,
    images: [{ url: partnerScene.src, width: 1600, height: 900, alt: partnerScene.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner / Relationship | Life Alignment | bts.online",
    description: partnerModule.description,
    images: [partnerScene.src],
  },
};

export default function LifeAlignmentPartnerPage() {
  return <PartnerPage />;
}
