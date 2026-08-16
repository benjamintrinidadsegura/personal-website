import { permanentRedirect } from "next/navigation";
import { publishedSpotlights } from "@/data/spotlights";

interface LegacySpotlightPageProps { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return publishedSpotlights.map(({ slug }) => ({ slug }));
}

export default async function LegacySpotlightPage({ params }: LegacySpotlightPageProps) {
  permanentRedirect(`/people/${(await params).slug}`);
}
