import type { IdeaResult } from "@/types/find-your-next-step-idea";

export const IDEA_RESULT_DISCLAIMER =
  "Diese Arbeitskarte ordnet deine eigenen Angaben. Sie ist kein Businessplan, keine Marktvalidierung und keine Erfolgsprognose.";

const COPY_LIMIT = 5_000;
const SHARE_LIMIT = 1_000;

function withinLimit(blocks: readonly string[], finalBlock: string, limit: number): string {
  const included: string[] = [];
  for (const block of blocks) {
    const normalized = block.trim();
    if (!normalized) continue;
    if ([...included, normalized, finalBlock].join("\n\n").length <= limit) included.push(normalized);
  }
  return [...included, finalBlock].join("\n\n");
}

function list(title: string, items: readonly string[]): string {
  return [title, ...items.filter(Boolean).map((item) => `- ${item.trim()}`)].join("\n");
}

export function buildIdeaResultText(result: IdeaResult): string {
  return withinLimit([
    `FYNS – Idea\n${result.title}`,
    [
      "Arbeitsstand:",
      `Idee: ${result.snapshot.idea}`,
      `Problem: ${result.snapshot.problem}`,
      `Menschen: ${result.snapshot.audience}`,
      `Möglicher Nutzen: ${result.snapshot.value}`,
    ].join("\n"),
    `Heutige Evidenzbasis:\n${result.evidenceStatus}`,
    list("Was derzeit als bekannt markiert ist:", result.known),
    list("Was bewusst offen bleibt:", result.uncertain),
    list("Priorisierte Annahmen:", result.assumptions),
    list("Grenzen für den Versuch:", result.constraints),
    ["Erster Lernversuch:", result.experiment.method, result.experiment.observe, result.experiment.boundary].join("\n"),
    `Nächster Schritt:\n${result.nextStep}`,
    result.authorityNote,
  ], IDEA_RESULT_DISCLAIMER, COPY_LIMIT);
}

export function buildIdeaShareText(result: IdeaResult): string {
  return withinLimit([
    `FYNS – Idea\n${result.title}`,
    `Idee: ${result.snapshot.idea}`,
    `Offene Lernfrage: ${result.uncertain[0] ?? result.assumptions[0]}`,
    `Erster Lernversuch: ${result.experiment.method}`,
  ], "Arbeitsnotiz, keine Marktvalidierung oder Erfolgsprognose.", SHARE_LIMIT);
}
