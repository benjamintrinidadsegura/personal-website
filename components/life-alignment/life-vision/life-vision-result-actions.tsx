"use client";

import { HumanContextResultActions } from "@/components/human-context/result-actions";
import { useLocale } from "@/components/i18n/locale-context";
import { getLifePrintTitle, lifeUiValue } from "@/data/i18n/life-alignment-ui";

export function LifeVisionResultActions({ copyText }: { copyText: string }) {
  const locale = useLocale();

  return (
    <HumanContextResultActions
      copyText={copyText}
      printTitle={getLifePrintTitle(locale, "vision")}
      accent="#9dd9c5"
      eyebrow={lifeUiValue(locale, "Only on your initiative", "Nur auf deine Initiative")}
      title={lifeUiValue(locale, "Take your reflection with you", "Deine Reflexion mitnehmen")}
      description={lifeUiValue(locale, "The printable version contains your full landscape. The clipboard version intentionally omits source signals, specific constraints, detailed trade-offs and evidence.", "Die Druckfassung enthält deine vollständige Landschaft. Die kopierbare Kurzfassung lässt Herkunftssignale, konkrete Grenzen, detaillierte Abwägungen und Evidenz bewusst aus.")}
      copyLabel={lifeUiValue(locale, "Copy reduced short version", "Reduzierte Kurzfassung kopieren")}
      copiedMessage={lifeUiValue(locale, "Reduced short version copied.", "Reduzierte Kurzfassung kopiert.")}
      manualCopyLabel={lifeUiValue(locale, "Short version for manual copying", "Kurzfassung zum manuellen Kopieren")}
      printMarker="life-vision"
    />
  );
}
