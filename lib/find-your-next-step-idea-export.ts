import type { IdeaResult } from "@/types/find-your-next-step-idea";
import type { Locale } from "@/lib/i18n/config";
import { ideaGeneratedCopy, type IdeaGeneratedCopy } from "@/data/find-your-next-step-idea-locales";

export const IDEA_RESULT_DISCLAIMER =
  "Diese Arbeitskarte ordnet deine eigenen Angaben. Sie ist kein Businessplan, keine Marktvalidierung und keine Erfolgsprognose.";
export const IDEA_RESULT_DISCLAIMER_EN =
  "This working map organises your own answers. It is not a business plan, market validation or a prediction of success.";

type IdeaExportCopy = {
  working: string;
  idea: string;
  problem: string;
  people: string;
  value: string;
  evidence: string;
  known: string;
  open: string;
  assumptions: string;
  boundaries: string;
  experiment: string;
  next: string;
  openQuestion: string;
  experimentTitle: string;
  disclaimer: string;
  shareDisclaimer: string;
};

function makeIdeaExportCopy(copy: IdeaGeneratedCopy): IdeaExportCopy {
  return {
    working: `${copy.labels.known}:`,
    idea: copy.labels.idea,
    problem: copy.labels.problem,
    people: copy.labels.audience,
    value: copy.labels.value,
    evidence: `${copy.labels.known}:`,
    known: `${copy.labels.known}:`,
    open: `${copy.labels.open}:`,
    assumptions: `${copy.labels.assumptions}:`,
    boundaries: `${copy.labels.constraints}:`,
    experiment: `${copy.labels.method}:`,
    next: `${copy.labels.next}:`,
    openQuestion: copy.openQuestion,
    experimentTitle: copy.experimentTitle,
    disclaimer: copy.disclaimer,
    shareDisclaimer: copy.shareDisclaimer,
  };
}

const ideaExportCopy: Record<Locale, IdeaExportCopy> = {
  de: {
    working: "Arbeitsstand:", idea: "Idee", problem: "Problem", people: "Menschen", value: "Möglicher Nutzen",
    evidence: "Heutige Evidenzbasis:", known: "Was derzeit als bekannt markiert ist:", open: "Was bewusst offen bleibt:",
    assumptions: "Priorisierte Annahmen:", boundaries: "Grenzen für den Versuch:", experiment: "Erster Lernversuch:", next: "Nächster Schritt:",
    openQuestion: "Offene Lernfrage", experimentTitle: "Erster Lernversuch", disclaimer: IDEA_RESULT_DISCLAIMER,
    shareDisclaimer: "Arbeitsnotiz, keine Marktvalidierung oder Erfolgsprognose.",
  },
  en: {
    working: "Current working view:", idea: "Idea", problem: "Problem", people: "People", value: "Possible value",
    evidence: "Today’s evidence base:", known: "What is currently marked as known:", open: "What deliberately remains open:",
    assumptions: "Prioritised assumptions:", boundaries: "Boundaries for the experiment:", experiment: "First learning experiment:", next: "Next step:",
    openQuestion: "Open learning question", experimentTitle: "First learning experiment", disclaimer: IDEA_RESULT_DISCLAIMER_EN,
    shareDisclaimer: "A working note, not market validation or a prediction of success.",
  },
  es: makeIdeaExportCopy(ideaGeneratedCopy.es),
  tr: makeIdeaExportCopy(ideaGeneratedCopy.tr),
  pl: makeIdeaExportCopy(ideaGeneratedCopy.pl),
  el: makeIdeaExportCopy(ideaGeneratedCopy.el),
  ru: makeIdeaExportCopy(ideaGeneratedCopy.ru),
};

export function getIdeaResultDisclaimer(locale: Locale): string {
  return ideaExportCopy[locale].disclaimer;
}

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

export function buildIdeaResultText(result: IdeaResult, locale: Locale = "de"): string {
  const labels = ideaExportCopy[locale];
  return withinLimit([
    `FYNS – Idea\n${result.title}`,
    [
      labels.working,
      `${labels.idea}: ${result.snapshot.idea}`,
      `${labels.problem}: ${result.snapshot.problem}`,
      `${labels.people}: ${result.snapshot.audience}`,
      `${labels.value}: ${result.snapshot.value}`,
    ].join("\n"),
    `${labels.evidence}\n${result.evidenceStatus}`,
    list(labels.known, result.known),
    list(labels.open, result.uncertain),
    list(labels.assumptions, result.assumptions),
    list(labels.boundaries, result.constraints),
    [labels.experiment, result.experiment.method, result.experiment.observe, result.experiment.boundary].join("\n"),
    `${labels.next}\n${result.nextStep}`,
    result.authorityNote,
  ], getIdeaResultDisclaimer(locale), COPY_LIMIT);
}

export function buildIdeaShareText(result: IdeaResult, locale: Locale = "de"): string {
  const copy = ideaExportCopy[locale];
  return withinLimit([
    `FYNS – Idea\n${result.title}`,
    `${copy.idea}: ${result.snapshot.idea}`,
    `${copy.openQuestion}: ${result.uncertain[0] ?? result.assumptions[0]}`,
    `${copy.experimentTitle}: ${result.experiment.method}`,
  ], copy.shareDisclaimer, SHARE_LIMIT);
}
