"use client";

import { HumanContextResultActions } from "@/components/human-context/result-actions";

export function LifeAlignmentResultActions({ copyText }: { copyText: string }) {
  return <HumanContextResultActions copyText={copyText} printTitle="Life Alignment – persönliche Momentaufnahme" accent="#f5b971" eyebrow="Nur auf deine Initiative" title="Momentaufnahme mitnehmen" description="Das Ergebnis wird nicht gespeichert. Beim Kopieren entsteht bewusst eine reduzierte Kurzfassung ohne deine freie Notiz und ohne detaillierte Bedingungen." copyLabel="Private Kurzfassung kopieren" copiedMessage="Private Kurzfassung kopiert." manualCopyLabel="Text zum manuellen Kopieren" printMarker="life-alignment" />;
}
