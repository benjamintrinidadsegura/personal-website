import type { SelfReflectionResult } from "@/types/find-your-next-step";

export const SELF_RESULT_DISCLAIMER =
  "Diese Auswertung ist eine Orientierung auf Basis deiner Antworten und keine psychologische Diagnose.";

const SELF_COPY_LIMIT = 5_000;
const SELF_SHARE_LIMIT = 1_000;

function nonEmpty(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function joinWithinLimit(
  blocks: readonly string[],
  finalBlock: string,
  limit: number,
): string {
  const normalizedFinalBlock = finalBlock.trim();
  const included: string[] = [];

  for (const block of blocks) {
    const normalized = block.trim();
    if (!normalized) continue;
    const candidate = [...included, normalized, normalizedFinalBlock].join("\n\n");
    if (candidate.length > limit) continue;
    included.push(normalized);
  }

  return [...included, normalizedFinalBlock].join("\n\n");
}

export function buildSelfResultText(result: SelfReflectionResult): string {
  const blocks: string[] = [
    ["FYNS – Self", result.title.trim()].filter(nonEmpty).join("\n"),
  ];

  const summary = result.summary.map((sentence) => sentence.trim()).filter(nonEmpty);
  if (summary.length > 0) blocks.push(["Zusammenfassung:", ...summary].join("\n"));

  for (const section of result.sections) {
    const statements = section.statements
      .slice(0, 3)
      .map(({ text }) => text.trim())
      .filter(nonEmpty);
    if (statements.length > 0) {
      blocks.push([`${section.title.trim()}:`, ...statements.map((statement) => `- ${statement}`)].join("\n"));
    }
  }

  const tensions = result.tensions
    .slice(0, 2)
    .filter(({ title, text }) => nonEmpty(title) && nonEmpty(text))
    .map(({ title, text }) => `- ${title.trim()}: ${text.trim()}`);
  if (tensions.length > 0) blocks.push(["Spannungsfelder:", ...tensions].join("\n"));

  return joinWithinLimit(blocks, SELF_RESULT_DISCLAIMER, SELF_COPY_LIMIT);
}

export function buildSelfShareText(result: SelfReflectionResult): string {
  const blocks: string[] = [
    ["FYNS – Self", result.title.trim()].filter(nonEmpty).join("\n"),
  ];
  const summary = result.summary.slice(0, 2).map((sentence) => sentence.trim()).filter(nonEmpty);
  if (summary.length > 0) blocks.push(summary.join(" "));

  const centralPatterns = result.sections
    .flatMap(({ statements }) => statements.map(({ text }) => text.trim()))
    .filter(nonEmpty)
    .slice(0, 3);
  if (centralPatterns.length > 0) {
    blocks.push(["Zentrale Muster:", ...centralPatterns.map((pattern) => `- ${pattern}`)].join("\n"));
  }

  return joinWithinLimit(
    blocks,
    "Diese Auswertung dient der Orientierung und ist keine psychologische Diagnose.",
    SELF_SHARE_LIMIT,
  );
}
