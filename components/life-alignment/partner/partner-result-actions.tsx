"use client";

import { HumanContextResultActions } from "@/components/human-context/result-actions";
import { useLocale } from "@/components/i18n/locale-context";
import { getLifePrintTitle, lifeUiValue } from "@/data/i18n/life-alignment-ui";

export function PartnerResultActions({ copyText }: { copyText: string }) {
  const locale = useLocale();

  return (
    <HumanContextResultActions
      copyText={copyText}
      printTitle={getLifePrintTitle(locale, "partner")}
      accent="#f5b971"
      eyebrow={lifeUiValue(locale, "Only on your initiative", "Nur auf eure Initiative")}
      title={lifeUiValue(locale, "Take the shared overview with you", "Gemeinsame Übersicht mitnehmen")}
      description={lifeUiValue(locale, "The clipboard version contains no personal evidence and omits sensitive topics entirely. Decide together what you want to share before forwarding it.", "Die Kopierfassung enthält keine persönlichen Einzelnachweise und lässt sensible Themen vollständig aus. Prüft vor dem Weitergeben gemeinsam, was ihr teilen möchtet.")}
      copyLabel={lifeUiValue(locale, "Copy data-minimised short version", "Datensparsame Kurzfassung kopieren")}
      copiedMessage={lifeUiValue(locale, "Data-minimised short version copied.", "Datensparsame Kurzfassung kopiert.")}
      manualCopyLabel={lifeUiValue(locale, "Short version for manual copying", "Kurzfassung zum manuellen Kopieren")}
      printMarker="life-alignment-partner"
    />
  );
}
