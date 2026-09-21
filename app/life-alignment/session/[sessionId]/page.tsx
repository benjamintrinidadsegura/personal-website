import { notFound } from "next/navigation";

import { RelationshipSessionExperience } from "@/components/life-alignment/relationship/relationship-session-experience";
import { getRelationshipModule } from "@/data/life-alignment-relationship";
import { getRelationshipSessionView } from "@/lib/life-alignment-relationship-server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Private Alignment session | bts.online", robots: { index: false, follow: false } };

export default async function RelationshipSessionPage({ params }: { params: Promise<{ sessionId: string }> }) { const { sessionId } = await params; const view = await getRelationshipSessionView(sessionId); if (!view) notFound(); return <RelationshipSessionExperience module={getRelationshipModule(view.moduleId)} view={view}/>; }
