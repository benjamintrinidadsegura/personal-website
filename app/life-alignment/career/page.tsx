import { PersonalAlignmentJourney } from "@/components/life-alignment/personal/personal-alignment-journey";
import { careerModule } from "@/data/life-alignment-personal";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const locale = await getLocale();
  return createLocalizedMetadata({ locale, pathname: "/life-alignment/career", title: `${careerModule.title[locale]} | Life Alignment | bts.online`, description: careerModule.description[locale] });
}

export default function CareerAlignmentPage() { return <PersonalAlignmentJourney definition={careerModule}/>; }
