import { LIFE_VISION_DISCLAIMER } from "@/data/life-alignment-life-vision";
import type { LifeVisionResult } from "@/types/life-alignment-life-vision";

export function buildLifeVisionResultText(result: LifeVisionResult): string {
  const lines = [
    "LIFE ALIGNMENT · LIFE VISION",
    result.title,
    result.description,
    `Zukunftsrahmen: ${result.horizonLabel}`,
    "",
    "DESKRIPTIVE MOMENTAUFNAHME",
    result.visualSnapshot.headline,
    result.visualSnapshot.description,
    result.visualSnapshot.directionSummary,
    result.visualSnapshot.protectionSummary,
    result.visualSnapshot.contextSummary,
    "",
    "FUTURE DIRECTION LANDSCAPE",
    ...result.areas.flatMap((area) => [
      `${area.title}: ${area.emphasisLabel}${area.protected ? " · geschützt" : ""}`,
      ...area.sourceLabels.map((source) => `  Herkunftssignal: ${source}`),
    ]),
    "",
    "GESCHÜTZTE BEDINGUNGEN",
    ...(result.protectedLabels.length ? result.protectedLabels.map((label) => `- ${label}`) : ["- Keine festgehalten"]),
    "",
    "REALE BEDINGUNGEN UND ABWÄGUNG",
    ...(result.constraintLabels.length ? result.constraintLabels.map((label) => `- ${label}`) : ["- Keine konkrete Grenze festgehalten"]),
    result.tradeoffLabel,
    "",
    "EVIDENZVERKNÜPFTE BEOBACHTUNGEN",
    ...result.insights.flatMap((insight) => [insight.title, insight.finding, `Warum: ${insight.why}`, insight.illustrativeExample, ...insight.evidence.map((item) => `  ${item.label}: ${item.detail}`), ""]),
    "MÖGLICHE WEGE",
    ...result.actionPaths.flatMap((path) => [path.title, `Warum passend: ${path.whyItMayFit}`, `Erster Schritt: ${path.firstStep}`, `Abwägung: ${path.tradeoff}`, `Lernfrage: ${path.learningQuestion}`, `Reversibilität: ${path.reversibility}`, ...path.tools.map((tool) => `  Hilfe – ${tool.title}: ${tool.use}`), ...path.evidence.map((item) => `  Grundlage – ${item.label}: ${item.detail}`), ""]),
    "ABSCHLIESSENDE ORIENTIERUNG",
    result.closingOrientation.headline,
    result.closingOrientation.orientation,
    ...result.closingOrientation.questions.map((question) => `- ${question}`),
    ...result.closingOrientation.evidence.map((item) => `  Grundlage – ${item.label}: ${item.detail}`),
    "",
    LIFE_VISION_DISCLAIMER,
  ];
  return lines.join("\n").slice(0, 16_000);
}

export function buildLifeVisionClipboardSummary(result: LifeVisionResult): string {
  const lines = [
    "LIFE ALIGNMENT · LIFE VISION · REDUZIERTE KURZFASSUNG",
    `Zukunftsrahmen: ${result.horizonLabel}`,
    "",
    "Gewählte Richtungen:",
    ...result.areas.map((area) => `- ${area.title}: ${area.emphasisLabel}`),
    "",
    "Von mir gewählte mögliche Wege:",
    ...result.actionPaths.map((path) => `- ${path.title}`),
    "",
    "Bewusst weggelassen: Herkunftssignale, konkrete Grenzen, detaillierte Abwägungen und Evidenz.",
    "Diese Kurzfassung ist eine qualitative Selbstreflexion, keine Empfehlung oder Beratung.",
  ];
  return lines.join("\n").slice(0, 1_800);
}
