"use client";

import { useLocale } from "@/components/i18n/locale-context";
import { HumanContextScene } from "@/components/human-context/context-scene";
import { getSelfAlignmentContent } from "@/data/i18n/life-alignment";

export function LifeAlignmentContext({ priority = false }: { priority?: boolean }) {
  const locale = useLocale();
  return <HumanContextScene scene={getSelfAlignmentContent(locale).scene} accent="#f5b971" priority={priority} />;
}
