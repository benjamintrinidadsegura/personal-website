import type { CareerResult } from "@/types/find-your-next-step";
import type { Locale } from "@/lib/i18n/config";

export const CAREER_RESULT_DISCLAIMER =
  "Die genannten Richtungen und Jobtitel dienen der Orientierung und sind keine Eignungsbewertung oder Aussage über aktuelle Stellenangebote.";
export const CAREER_RESULT_DISCLAIMER_EN =
  "The directions and job titles are for orientation and are not an aptitude assessment or a statement about current vacancies.";

const careerExportCopy: Record<Locale, { summary: string; primary: string; additional: string; jobs: string; conditions: string; tensions: string; next: string; directions: string; terms: string; disclaimer: string; shareDisclaimer: string }> = {
  de: { summary: "Zusammenfassung:", primary: "Besonders interessant zum Erkunden:", additional: "Weitere Richtungen:", jobs: "Jobtitel zum Erkunden:", conditions: "Bedingungen:", tensions: "Spannungsfelder:", next: "Nächster Schritt:", directions: "Richtungen zum Erkunden:", terms: "Mögliche Suchbegriffe:", disclaimer: CAREER_RESULT_DISCLAIMER, shareDisclaimer: "Diese Orientierung ist keine Eignungsbewertung und keine Aussage über aktuelle Stellenangebote." },
  en: { summary: "Summary:", primary: "Especially interesting to explore:", additional: "Further directions:", jobs: "Job titles to explore:", conditions: "Conditions:", tensions: "Tensions:", next: "Next step:", directions: "Directions to explore:", terms: "Possible search terms:", disclaimer: CAREER_RESULT_DISCLAIMER_EN, shareDisclaimer: "This orientation is not an aptitude assessment or a statement about current vacancies." },
  es: { summary: "Resumen:", primary: "Especialmente interesante para explorar:", additional: "Otras direcciones:", jobs: "Puestos para explorar:", conditions: "Condiciones:", tensions: "Tensiones:", next: "Siguiente paso:", directions: "Direcciones para explorar:", terms: "Posibles términos de búsqueda:", disclaimer: "Las direcciones y los puestos sirven para orientarte; no evalúan tu aptitud ni afirman que existan vacantes actuales.", shareDisclaimer: "Esta orientación no es una evaluación de aptitud ni una afirmación sobre vacantes actuales." },
  tr: { summary: "Özet:", primary: "Keşfetmek için özellikle ilgi çekici:", additional: "Diğer yönler:", jobs: "Keşfedilecek iş unvanları:", conditions: "Koşullar:", tensions: "Gerilimler:", next: "Sonraki adım:", directions: "Keşfedilecek yönler:", terms: "Olası arama terimleri:", disclaimer: "Belirtilen yönler ve iş unvanları yön bulma içindir; uygunluk değerlendirmesi veya güncel ilan beyanı değildir.", shareDisclaimer: "Bu yönelim uygunluk değerlendirmesi veya güncel iş ilanları hakkında bir beyan değildir." },
  pl: { summary: "Podsumowanie:", primary: "Szczególnie ciekawe do sprawdzenia:", additional: "Dalsze kierunki:", jobs: "Stanowiska do sprawdzenia:", conditions: "Warunki:", tensions: "Napięcia:", next: "Następny krok:", directions: "Kierunki do sprawdzenia:", terms: "Możliwe hasła wyszukiwania:", disclaimer: "Wymienione kierunki i stanowiska służą orientacji; nie są oceną predyspozycji ani informacją o aktualnych ofertach.", shareDisclaimer: "Ta orientacja nie jest oceną predyspozycji ani informacją o aktualnych ofertach pracy." },
  el: { summary: "Σύνοψη:", primary: "Ιδιαίτερα ενδιαφέρον για διερεύνηση:", additional: "Πρόσθετες κατευθύνσεις:", jobs: "Τίτλοι θέσεων για διερεύνηση:", conditions: "Συνθήκες:", tensions: "Εντάσεις:", next: "Επόμενο βήμα:", directions: "Κατευθύνσεις για διερεύνηση:", terms: "Πιθανοί όροι αναζήτησης:", disclaimer: "Οι κατευθύνσεις και οι τίτλοι θέσεων προσφέρουν προσανατολισμό· δεν αξιολογούν καταλληλότητα ούτε δηλώνουν τρέχουσες κενές θέσεις.", shareDisclaimer: "Αυτός ο προσανατολισμός δεν είναι αξιολόγηση καταλληλότητας ούτε δήλωση για τρέχουσες κενές θέσεις." },
  ru: { summary: "Краткий итог:", primary: "Особенно интересно исследовать:", additional: "Другие направления:", jobs: "Названия ролей для исследования:", conditions: "Условия:", tensions: "Противоречия:", next: "Следующий шаг:", directions: "Направления для исследования:", terms: "Возможные поисковые запросы:", disclaimer: "Указанные направления и роли служат ориентиром; это не оценка способностей и не сведения об актуальных вакансиях.", shareDisclaimer: "Эта ориентация не является оценкой способностей или сведением об актуальных вакансиях." },
};

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

export function buildCareerResultText(result: CareerResult, locale: Locale = "de"): string {
  const copy = careerExportCopy[locale];
  const blocks: string[] = [
    ["FYNS – Career", result.title.trim()].filter(nonEmpty).join("\n"),
  ];

  const summary = result.summary.map((sentence) => sentence.trim()).filter(nonEmpty);
  if (summary.length > 0) blocks.push([copy.summary, ...summary].join("\n"));

  const primary = directionBlock(copy.primary, result.primaryDirections);
  if (primary) blocks.push(primary);
  const additional = directionBlock(copy.additional, result.additionalDirections);
  if (additional) blocks.push(additional);

  const jobTitles = result.jobTitles.map(({ title }) => title.trim()).filter(nonEmpty);
  if (jobTitles.length > 0) {
    blocks.push([copy.jobs, ...jobTitles.map((title) => `- ${title}`)].join("\n"));
  }

  const conditions = result.conditions.map(({ text }) => text.trim()).filter(nonEmpty);
  if (conditions.length > 0) {
    blocks.push([copy.conditions, ...conditions.map((condition) => `- ${condition}`)].join("\n"));
  }

  const tensions = result.tensions
    .slice(0, 2)
    .filter(({ title, text }) => nonEmpty(title) && nonEmpty(text))
    .map(({ title, text }) => `- ${title.trim()}: ${text.trim()}`);
  if (tensions.length > 0) blocks.push([copy.tensions, ...tensions].join("\n"));

  const nextStepTitle = result.nextStep.title.trim();
  const nextStepText = result.nextStep.text.trim();
  if (nextStepTitle || nextStepText) {
    blocks.push([copy.next, nextStepTitle, nextStepText].filter(nonEmpty).join("\n"));
  }

  return joinWithinLimit(blocks, copy.disclaimer, CAREER_COPY_LIMIT);
}

export function buildCareerShareText(result: CareerResult, locale: Locale = "de"): string {
  const copy = careerExportCopy[locale];
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
    blocks.push([copy.directions, ...directions.map((title) => `- ${title}`)].join("\n"));
  }

  const jobTitles = result.jobTitles.slice(0, 3).map(({ title }) => title.trim()).filter(nonEmpty);
  if (jobTitles.length > 0) {
    blocks.push([copy.terms, ...jobTitles.map((title) => `- ${title}`)].join("\n"));
  }

  return joinWithinLimit(
    blocks,
    copy.shareDisclaimer,
    CAREER_SHARE_LIMIT,
  );
}
