"use client";

import { HumanContextResultActions } from "@/components/human-context/result-actions";
import { useLocale } from "@/components/i18n/locale-context";
import { getLifePrintTitle, lifeUiValue } from "@/data/i18n/life-alignment-ui";

export function LifeAlignmentResultActions({ copyText }: { copyText: string }) {
  const locale = useLocale();

  return (
    <HumanContextResultActions
      copyText={copyText}
      printTitle={getLifePrintTitle(locale, "self")}
      accent="#f5b971"
      eyebrow={lifeUiValue(locale, "Only on your initiative", "Nur auf deine Initiative")}
      title={lifeUiValue(locale, "Take your snapshot with you", "Momentaufnahme mitnehmen")}
      description={lifeUiValue(locale, "The result is not stored. Copying intentionally creates a reduced short version without your free-text note or detailed conditions.", "Das Ergebnis wird nicht gespeichert. Beim Kopieren entsteht bewusst eine reduzierte Kurzfassung ohne deine freie Notiz und ohne detaillierte Bedingungen.")}
      copyLabel={lifeUiValue(locale, "Copy private short version", "Private Kurzfassung kopieren")}
      copiedMessage={lifeUiValue(locale, "Private short version copied.", "Private Kurzfassung kopiert.")}
      manualCopyLabel={lifeUiValue(locale, "Text for manual copying", "Text zum manuellen Kopieren")}
      printMarker="life-alignment"
    />
  );
}
