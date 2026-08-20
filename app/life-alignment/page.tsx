import { LifeAlignmentHub } from "@/components/life-alignment/life-alignment-hub";
import { getLifeAlignmentHubContent } from "@/data/i18n/life-alignment-modules";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const locale = await getLocale();
  return createLocalizedMetadata({ locale, pathname: "/life-alignment", title: "Life Alignment | bts.online", description: getLifeAlignmentHubContent(locale).hub.description });
}

export default function LifeAlignmentHubPage() {
  return <LifeAlignmentHub />;
}
