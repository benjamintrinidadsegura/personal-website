import { RelationshipModuleJourney } from "@/components/life-alignment/relationship/relationship-module-journey";
import { getRelationshipModule } from "@/data/life-alignment-relationship";
import { getAccountState } from "@/lib/account/state";
import type { RelationshipModuleId } from "@/types/life-alignment-relationship";

export async function RelationshipModulePage({ moduleId }: { moduleId: RelationshipModuleId }) {
  const account = await getAccountState();
  return <RelationshipModuleJourney module={getRelationshipModule(moduleId)} authenticated={account.kind !== "anonymous"}/>;
}
