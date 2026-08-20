import { permanentRedirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { getLocalizedPathname } from "@/lib/i18n/routing";

export default async function LegacyCareerSpotlightPage() {
  permanentRedirect(getLocalizedPathname("/people", await getLocale()));
}
