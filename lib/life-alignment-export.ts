import type { LifeAlignmentResult } from "@/types/life-alignment";

export const LIFE_ALIGNMENT_DISCLAIMER =
  "Diese Momentaufnahme ordnet deine eigenen Angaben. Sie ist keine Bewertung deines Lebens und keine medizinische, psychologische, rechtliche, finanzielle oder sonstige fachliche Beratung.";

function withinLimit(blocks: readonly string[], finalBlock: string, limit: number): string {
  const included: string[] = [];
  for (const block of blocks) {
    const normalized = block.trim();
    if (!normalized) continue;
    if ([...included, normalized, finalBlock].join("\n\n").length <= limit) included.push(normalized);
  }
  return [...included, finalBlock].join("\n\n");
}

export function buildLifeAlignmentResultText(result: LifeAlignmentResult): string {
  const landscape = result.areas.map((area) =>
    `- ${area.title}: ${area.currentLabel}; ${area.capacityLabel}; gewünschte Richtung: ${area.directionLabel}; ${area.signalLabel}.`,
  );
  const insights = result.insights.map((insight) =>
    `- ${insight.title}\n  ${insight.explanation}\n  Im Alltag: ${insight.everydayInterpretation}`,
  );
  const paths = result.actionPaths.map((path) =>
    `- ${path.title}\n  Warum: ${path.why}\n  Erster Schritt: ${path.firstStep}\n  Beispiel: ${path.example}\n  Lernmöglichkeit: ${path.learning}\n  Trade-off: ${path.tradeoff}\n  Umkehrbar: ${path.reversible ? "ja" : "nicht vollständig"}.`,
  );
  return withinLimit([
    `Life Alignment · bts.online\n${result.title}`,
    ["Momentaufnahme:", ...result.summary].join("\n"),
    ["Alignment Landscape:", ...landscape].join("\n"),
    ["Bereichsübergreifende Zusammenhänge:", ...insights].join("\n"),
    result.constraints.length > 0 ? ["Gegenwärtige Bedingungen:", ...result.constraints.map((item) => `- ${item}`)].join("\n") : "",
    ["Gewählter Fokus:", result.focus.title, result.tradeoffLabel].join("\n"),
    ["Quelle und eigene Deutung:", ...result.authorityLabels.map((item) => `- ${item}`), result.entanglementLabel].join("\n"),
    result.focusIntention ? `Was du schützen oder ermöglichen möchtest:\n${result.focusIntention}` : "",
    ["Kleiner nächster Versuch:", result.experiment.title, result.experiment.action, `Beobachtungsfrage: ${result.experiment.observe}`, result.experiment.boundary].join("\n"),
    ["Mögliche Wege:", ...paths].join("\n"),
    ["Kleine Werkzeuge:", ...result.tools.map((tool) => `- ${tool.title} (${tool.duration}): ${tool.prompt}`)].join("\n"),
    [result.closing.title, result.closing.body, ...result.closing.reminders.map((item) => `- ${item}`)].join("\n"),
  ], LIFE_ALIGNMENT_DISCLAIMER, 6_000);
}

export function buildLifeAlignmentClipboardSummary(result: LifeAlignmentResult): string {
  return withinLimit([
    `Life Alignment · bts.online\n${result.title}`,
    result.summary.slice(0, 3).join(" "),
    `Fokus: ${result.focus.title}. ${result.tradeoffLabel}`,
    `Möglicher Versuch: ${result.experiment.title}. ${result.experiment.action}`,
  ], "Private Kurzfassung ohne deine freie Notiz oder detaillierte Bedingungen. Keine Bewertung oder fachliche Beratung.", 1_200);
}
