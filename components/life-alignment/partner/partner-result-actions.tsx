"use client";

import { HumanContextResultActions } from "@/components/human-context/result-actions";

export function PartnerResultActions({ copyText }: { copyText: string }) {
  return <HumanContextResultActions copyText={copyText} printTitle="Life Alignment – Partner Comparison Landscape" accent="#f5b971" eyebrow="Nur auf eure Initiative" title="Gemeinsame Übersicht mitnehmen" description="Die Kopierfassung enthält keine persönlichen Einzelnachweise und lässt sensible Themen vollständig aus. Prüft vor dem Weitergeben gemeinsam, was ihr teilen möchtet." copyLabel="Datensparsame Kurzfassung kopieren" copiedMessage="Datensparsame Kurzfassung kopiert." manualCopyLabel="Kurzfassung zum manuellen Kopieren" printMarker="life-alignment-partner" />;
}
