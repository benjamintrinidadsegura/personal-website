import { HumanContextScene } from "@/components/human-context/context-scene";
import { lifeAlignmentScene } from "@/data/life-alignment";

export function LifeAlignmentContext({ priority = false }: { priority?: boolean }) {
  return <HumanContextScene scene={lifeAlignmentScene} accent="#f5b971" priority={priority} />;
}
