import type { CareerResult } from "@/types/find-your-next-step";

export const CAREER_RESULT_DISCLAIMER =
  "Die genannten Richtungen und Jobtitel dienen der Orientierung und sind keine Eignungsbewertung oder Aussage über aktuelle Stellenangebote.";

const CAREER_COPY_LIMIT = 5_000;
const CAREER_SHARE_LIMIT = 1_000;

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

function directionBlock(
  heading: string,
  directions: CareerResult["primaryDirections"],
): string | null {
  const items = directions
    .map(({ title, why }) => {
      const normalizedTitle = title.trim();
      const normalizedWhy = why.trim();
      if (!normalizedTitle) return null;
      return normalizedWhy ? `- ${normalizedTitle}: ${normalizedWhy}` : `- ${normalizedTitle}`;
    })
    .filter(nonEmpty);
  return items.length > 0 ? [heading, ...items].join("\n") : null;
}

export function buildCareerResultText(result: CareerResult): string {
  const blocks: string[] = [
    ["FYNS – Career", result.title.trim()].filter(nonEmpty).join("\n"),
  ];

  const summary = result.summary.map((sentence) => sentence.trim()).filter(nonEmpty);
  if (summary.length > 0) blocks.push(["Zusammenfassung:", ...summary].join("\n"));

  const primary = directionBlock("Besonders interessant zum Erkunden:", result.primaryDirections);
  if (primary) blocks.push(primary);
  const additional = directionBlock("Weitere Richtungen:", result.additionalDirections);
  if (additional) blocks.push(additional);

  const jobTitles = result.jobTitles.map(({ title }) => title.trim()).filter(nonEmpty);
  if (jobTitles.length > 0) {
    blocks.push(["Jobtitel zum Erkunden:", ...jobTitles.map((title) => `- ${title}`)].join("\n"));
  }

  const conditions = result.conditions.map(({ text }) => text.trim()).filter(nonEmpty);
  if (conditions.length > 0) {
    blocks.push(["Bedingungen:", ...conditions.map((condition) => `- ${condition}`)].join("\n"));
  }

  const tensions = result.tensions
    .slice(0, 2)
    .filter(({ title, text }) => nonEmpty(title) && nonEmpty(text))
    .map(({ title, text }) => `- ${title.trim()}: ${text.trim()}`);
  if (tensions.length > 0) blocks.push(["Spannungsfelder:", ...tensions].join("\n"));

  const nextStepTitle = result.nextStep.title.trim();
  const nextStepText = result.nextStep.text.trim();
  if (nextStepTitle || nextStepText) {
    blocks.push(["Nächster Schritt:", nextStepTitle, nextStepText].filter(nonEmpty).join("\n"));
  }

  return joinWithinLimit(blocks, CAREER_RESULT_DISCLAIMER, CAREER_COPY_LIMIT);
}

export function buildCareerShareText(result: CareerResult): string {
  const blocks: string[] = [
    ["FYNS – Career", result.title.trim()].filter(nonEmpty).join("\n"),
  ];
  const summary = result.summary.slice(0, 2).map((sentence) => sentence.trim()).filter(nonEmpty);
  if (summary.length > 0) blocks.push(summary.join(" "));

  const directions = [...result.primaryDirections, ...result.additionalDirections]
    .slice(0, 3)
    .map(({ title }) => title.trim())
    .filter(nonEmpty);
  if (directions.length > 0) {
    blocks.push(["Richtungen zum Erkunden:", ...directions.map((title) => `- ${title}`)].join("\n"));
  }

  const jobTitles = result.jobTitles.slice(0, 3).map(({ title }) => title.trim()).filter(nonEmpty);
  if (jobTitles.length > 0) {
    blocks.push(["Mögliche Suchbegriffe:", ...jobTitles.map((title) => `- ${title}`)].join("\n"));
  }

  return joinWithinLimit(
    blocks,
    "Diese Orientierung ist keine Eignungsbewertung und keine Aussage über aktuelle Stellenangebote.",
    CAREER_SHARE_LIMIT,
  );
}
