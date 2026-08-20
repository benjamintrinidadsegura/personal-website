import { LifeVisionJourney } from "@/components/life-alignment/life-vision/life-vision-journey";
import { getLifeVisionContent } from "@/data/i18n/life-alignment";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const locale = await getLocale();
  return createLocalizedMetadata({ locale, pathname: "/life-alignment/life-vision", title: "Life Vision | Life Alignment | bts.online", description: getLifeVisionContent(locale).lifeVision.description });
}

export default function LifeAlignmentLifeVisionPage() {
  return <LifeVisionJourney />;
}
