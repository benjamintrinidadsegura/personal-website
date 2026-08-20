import type { SelfReflectionResult } from "@/types/find-your-next-step";
import type { Locale } from "@/lib/i18n/config";

export const SELF_RESULT_DISCLAIMER =
  "Diese Auswertung ist eine Orientierung auf Basis deiner Antworten und keine psychologische Diagnose.";
export const SELF_RESULT_DISCLAIMER_EN =
  "This reflection offers orientation based on your answers and is not a psychological diagnosis.";

const selfExportCopy: Record<Locale, { summary: string; tensions: string; patterns: string; disclaimer: string; shareDisclaimer: string }> = {
  de: { summary: "Zusammenfassung", tensions: "Spannungsfelder", patterns: "Zentrale Muster", disclaimer: SELF_RESULT_DISCLAIMER, shareDisclaimer: "Diese Auswertung dient der Orientierung und ist keine psychologische Diagnose." },
  en: { summary: "Summary", tensions: "Tensions", patterns: "Central patterns", disclaimer: SELF_RESULT_DISCLAIMER_EN, shareDisclaimer: "This reflection is for orientation and is not a psychological diagnosis." },
  es: { summary: "Resumen", tensions: "Tensiones", patterns: "Patrones centrales", disclaimer: "Esta reflexión orienta a partir de tus respuestas y no es un diagnóstico psicológico.", shareDisclaimer: "Esta reflexión orienta a partir de tus respuestas y no es un diagnóstico psicológico." },
  tr: { summary: "Özet", tensions: "Gerilim alanları", patterns: "Merkezî örüntüler", disclaimer: "Bu yansıma yanıtlarına göre yön verir; psikolojik tanı değildir.", shareDisclaimer: "Bu yansıma yanıtlarına göre yön verir; psikolojik tanı değildir." },
  pl: { summary: "Podsumowanie", tensions: "Napięcia", patterns: "Główne wzorce", disclaimer: "Ta refleksja daje orientację na podstawie odpowiedzi i nie jest diagnozą psychologiczną.", shareDisclaimer: "Ta refleksja daje orientację na podstawie odpowiedzi i nie jest diagnozą psychologiczną." },
  el: { summary: "Σύνοψη", tensions: "Πεδία έντασης", patterns: "Κεντρικά μοτίβα", disclaimer: "Αυτός ο αναστοχασμός προσφέρει προσανατολισμό με βάση τις απαντήσεις σου και δεν αποτελεί ψυχολογική διάγνωση.", shareDisclaimer: "Αυτός ο αναστοχασμός προσφέρει προσανατολισμό με βάση τις απαντήσεις σου και δεν αποτελεί ψυχολογική διάγνωση." },
  ru: { summary: "Краткий итог", tensions: "Зоны напряжения", patterns: "Основные паттерны", disclaimer: "Это осмысление даёт ориентир на основе твоих ответов и не является психологическим диагнозом.", shareDisclaimer: "Это осмысление даёт ориентир на основе твоих ответов и не является психологическим диагнозом." },
};

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

export function buildSelfResultText(result: SelfReflectionResult, locale: Locale = "de"): string {
  const copy = selfExportCopy[locale];
  const blocks: string[] = [
    ["FYNS – Self", result.title.trim()].filter(nonEmpty).join("\n"),
  ];

  const summary = result.summary.map((sentence) => sentence.trim()).filter(nonEmpty);
  if (summary.length > 0) blocks.push([`${copy.summary}:`, ...summary].join("\n"));

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
  if (tensions.length > 0) blocks.push([`${copy.tensions}:`, ...tensions].join("\n"));

  return joinWithinLimit(blocks, copy.disclaimer, SELF_COPY_LIMIT);
}

export function buildSelfShareText(result: SelfReflectionResult, locale: Locale = "de"): string {
  const copy = selfExportCopy[locale];
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
    blocks.push([`${copy.patterns}:`, ...centralPatterns.map((pattern) => `- ${pattern}`)].join("\n"));
  }

  return joinWithinLimit(
    blocks,
    copy.shareDisclaimer,
    SELF_SHARE_LIMIT,
  );
}
