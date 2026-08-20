import { permanentRedirect } from "next/navigation";
import { publishedSpotlights } from "@/data/spotlights";
import { getLocale } from "@/lib/i18n/server";
import { getLocalizedPathname } from "@/lib/i18n/routing";

interface LegacySpotlightPageProps { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return publishedSpotlights.map(({ slug }) => ({ slug }));
}

export default async function LegacySpotlightPage({ params }: LegacySpotlightPageProps) {
  permanentRedirect(getLocalizedPathname(`/people/${(await params).slug}`, await getLocale()));
}
