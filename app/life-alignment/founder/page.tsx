import { RelationshipModulePage } from "@/components/life-alignment/relationship/relationship-module-page";
import { getRelationshipModule, relationshipText } from "@/data/life-alignment-relationship";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() { const locale = await getLocale(); const definition = getRelationshipModule("founder"); return createLocalizedMetadata({ locale, pathname: "/life-alignment/founder", title: `${relationshipText(definition.title, locale)} | Life Alignment | bts.online`, description: relationshipText(definition.shortDescription, locale) }); }
export default function FounderAlignmentPage() { return <RelationshipModulePage moduleId="founder"/>; }
