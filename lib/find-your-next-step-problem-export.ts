import type { ProblemResult } from "@/types/find-your-next-step-problem";

export const PROBLEM_RESULT_DISCLAIMER =
  "Diese Situationsskizze ist keine Diagnose, Risikobewertung oder medizinische, psychologische, rechtliche oder finanzielle Beratung. Bei unmittelbarer Gefahr wende dich an den örtlichen Notruf oder eine geeignete unmittelbar erreichbare Anlaufstelle.";

function joinWithinLimit(blocks: readonly string[], finalBlock: string, limit: number): string {
  const included: string[] = [];
  for (const block of blocks) {
    const normalized = block.trim();
    if (!normalized) continue;
    if ([...included, normalized, finalBlock].join("\n\n").length <= limit) included.push(normalized);
  }
  return [...included, finalBlock].join("\n\n");
}

export function buildProblemResultText(result: ProblemResult): string {
  const blocks = [
    `FYNS – Problem\n${result.title}`,
    ["Zusammenfassung:", ...result.summary].join("\n"),
    `Wichtige Grenze:\n${result.boundary.title}\n${result.boundary.text}`,
    result.userNote ? `Woran du eine kleine Verbesserung erkennen würdest:\n${result.userNote}` : "",
    ["Was die Situation gerade prägt:", ...result.situation.map(({ title, text }) => `- ${title}: ${text}`)].join("\n"),
    ["Ressourcen und Grenzen:", ...result.resources.map(({ title, text }) => `- ${title}: ${text}`)].join("\n"),
    ["Fragen zum Mitnehmen:", ...result.questionsToCarry.map((question) => `- ${question}`)].join("\n"),
    `Nächster Schritt:\n${result.nextStep.title}\n${result.nextStep.text}`,
  ];
  return joinWithinLimit(blocks, PROBLEM_RESULT_DISCLAIMER, 5_000);
}

export function buildProblemShareText(result: ProblemResult): string {
  const blocks = [
    `FYNS – Problem\n${result.title}`,
    result.summary.slice(0, 2).join(" "),
    `Nächster Schritt: ${result.nextStep.title}. ${result.nextStep.text}`,
  ];
  return joinWithinLimit(blocks, PROBLEM_RESULT_DISCLAIMER, 1_200);
}
