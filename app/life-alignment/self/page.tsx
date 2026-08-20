import { LifeAlignmentPage as LifeAlignmentExperience } from "@/components/life-alignment/life-alignment-page";
import { getSelfAlignmentContent } from "@/data/i18n/life-alignment";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const locale = await getLocale();
  return createLocalizedMetadata({ locale, pathname: "/life-alignment/self", title: "Self | Life Alignment | bts.online", description: getSelfAlignmentContent(locale).lifeAlignment.description });
}

export default function LifeAlignmentSelfPage() {
  return <LifeAlignmentExperience />;
}
