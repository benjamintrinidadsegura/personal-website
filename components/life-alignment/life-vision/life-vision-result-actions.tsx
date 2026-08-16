"use client";

import { HumanContextResultActions } from "@/components/human-context/result-actions";

export function LifeVisionResultActions({ copyText }: { copyText: string }) {
  return <HumanContextResultActions copyText={copyText} printTitle="Life Alignment – Life Vision" accent="#9dd9c5" eyebrow="Nur auf deine Initiative" title="Deine Reflexion mitnehmen" description="Die Druckfassung enthält deine vollständige Landschaft. Die kopierbare Kurzfassung lässt Herkunftssignale, konkrete Grenzen, detaillierte Abwägungen und Evidenz bewusst aus." copyLabel="Reduzierte Kurzfassung kopieren" copiedMessage="Reduzierte Kurzfassung kopiert." manualCopyLabel="Kurzfassung zum manuellen Kopieren" printMarker="life-vision" />;
}
