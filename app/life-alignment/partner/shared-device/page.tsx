import { PartnerPage } from "@/components/life-alignment/partner/partner-page";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() { const locale = await getLocale(); return createLocalizedMetadata({ locale, pathname: "/life-alignment/partner/shared-device", title: "Partner shared-device reflection | Life Alignment | bts.online", description: "The accepted local-only Partner reflection for two people using one trusted shared device." }); }
export default function PartnerSharedDevicePage() { return <PartnerPage/>; }
