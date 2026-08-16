import type { PartnerComparisonResult } from "@/types/life-alignment-partner";

const FULL_LIMIT = 8_000;
const CLIPBOARD_LIMIT = 1_600;

function bounded(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function buildPartnerResultText(result: PartnerComparisonResult): string {
  const findings = result.findings.map((finding) => {
    const perspectiveOrder = [...new Set(finding.evidence.map(({ participant }) => participant))];
    const evidence = finding.evidence.map((item) => {
      const perspective = perspectiveOrder.length === 1 ? "Eine freigegebene Perspektive" : perspectiveOrder.indexOf(item.participant) === 0 ? "Eine Perspektive" : "Die andere Perspektive";
      return `  - ${perspective}: ${item.label}`;
    }).join("\n");
    const steps = finding.possibleNextSteps.map((step, index) => `  ${index + 1}. ${step}`).join("\n");
    const examples = finding.everydayExamples.map((example) => `  - ${example}`).join("\n");
    return `${finding.categoryLabel}\n${finding.headline}\n${finding.explanation}\nIm Alltag: ${finding.everydayTranslation}\nMögliche Beispiele – keine Aussagen über euren Alltag:\n${examples}\nMögliche nächste Schritte:\n${steps}\nWas ihr lernen könntet: ${finding.whatCouldBeLearned}\nGrenze dieser Lesart: ${finding.boundary}\nAntwortgrundlage:\n${evidence}`;
  }).join("\n\n");
  const paths = result.paths.map((path) => `${path.title}\nWarum dieser Weg sichtbar ist: ${path.why}\nMöglicher Ansatz: ${path.approach}\nWas ihr lernen könntet: ${path.whatCouldBeLearned}\nTrade-off: ${path.tradeoffs}\nReversibilität: ${path.reversibility}`).join("\n\n");
  const experiments = result.experiments.map((experiment) => `${experiment.title}\n${experiment.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\nWas ihr lernen könntet: ${experiment.whatCouldBeLearned}`).join("\n\n");
  const sharedOverview = result.sharedOverview.map((signal) => `${signal.label}\n${signal.headline}\n${signal.explanation}`).join("\n\n");
  return bounded(`Life Alignment · Partner / Relationship\n${result.title}\n\nGEMEINSAMER BEZIEHUNGSKONTEXT\n${sharedOverview}\n\nKONKRETE HINWEISE\n${findings}\n\nDREI REVERSIBLE ERKUNDUNGEN\n${experiments}\n\nMÖGLICHE WEGE\n${paths}\n\nDie neutralen Perspektivbezeichnungen stammen aus den zwei nacheinander freigegebenen Durchgängen. Sie sind keine technische Anonymisierung.\n\n${result.disclaimer}\n\nLokal erstellt. Nicht gespeichert oder übertragen.`, FULL_LIMIT);
}

export function buildPartnerClipboardSummary(result: PartnerComparisonResult): string {
  const safeFindings = result.findings.filter((finding) => !finding.dimensionIds.some((dimensionId) => result.sensitiveDimensionIds.includes(dimensionId)));
  const safeOverview = result.sharedOverview.filter((signal) => !signal.dimensionIds.some((dimensionId) => result.sensitiveDimensionIds.includes(dimensionId)));
  const overview = safeOverview.slice(0, 4).map(({ label, headline }) => `- ${label}: ${headline}`).join("\n");
  const insights = safeFindings.slice(0, 3).map(({ headline }) => `- ${headline}`).join("\n");
  const paths = result.paths.slice(0, 4).map(({ title }) => `- ${title}`).join("\n");
  const sensitiveNote = result.sensitiveDimensionIds.length ? "\nSensible Themen und persönliche Einzelnachweise wurden bewusst ausgelassen." : "\nPersönliche Einzelnachweise wurden bewusst ausgelassen.";
  return bounded(`Life Alignment · Partner / Relationship\nDatensparsame gemeinsame Kurzfassung\n\nQualitative gemeinsame Übersicht:\n${overview || "- Aus den nicht-sensiblen Themen ist keine gemeinsame Übersicht ableitbar."}\n\nKonkrete Hinweise:\n${insights || "- Keine nicht-sensiblen Hinweise für diese Kurzfassung."}\n\nMögliche, frei wählbare Wege:\n${paths || "- Das Ergebnis zunächst offenlassen"}${sensitiveNote}\n\nKeine Kompatibilitätsmessung, kein A:B-Vergleich und keine Empfehlung, wer recht hat. Nur lokal erstellt; nicht gespeichert.`, CLIPBOARD_LIMIT);
}
