import { PartnerPage } from "@/components/life-alignment/partner/partner-page";
import { getPartnerAlignmentContent } from "@/data/i18n/life-alignment";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const locale = await getLocale();
  return createLocalizedMetadata({ locale, pathname: "/life-alignment/partner", title: "Partner / Relationship | Life Alignment | bts.online", description: getPartnerAlignmentContent(locale).module.description });
}

export default function LifeAlignmentPartnerPage() {
  return <PartnerPage />;
}
