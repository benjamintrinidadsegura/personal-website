import type { ProblemResult } from "@/types/find-your-next-step-problem";
import type { Locale } from "@/lib/i18n/config";
import { problemGeneratedCopy, type ProblemGeneratedCopy } from "@/data/find-your-next-step-problem-locales";

export const PROBLEM_RESULT_DISCLAIMER =
  "Diese Situationsskizze ist keine Diagnose, Risikobewertung oder medizinische, psychologische, rechtliche oder finanzielle Beratung. Bei unmittelbarer Gefahr wende dich an den örtlichen Notruf oder eine geeignete unmittelbar erreichbare Anlaufstelle.";

export const PROBLEM_RESULT_DISCLAIMER_EN =
  "This situation sketch is not a diagnosis, risk assessment, or medical, psychological, legal or financial advice. If anyone is in immediate danger, contact your local emergency services or another appropriate source of immediate help.";

type ProblemExportCopy = {
  summary: string;
  boundary: string;
  improvement: string;
  situation: string;
  resources: string;
  questions: string;
  next: string;
  disclaimer: string;
};

function makeProblemExportCopy(copy: ProblemGeneratedCopy): ProblemExportCopy {
  return {
    summary: `${copy.export.summary}:`,
    boundary: `${copy.boundary.professional}:`,
    improvement: `${copy.export.improvement}:`,
    situation: `${copy.export.situation}:`,
    resources: `${copy.export.resources}:`,
    questions: `${copy.export.questions}:`,
    next: `${copy.export.nextStep}:`,
    disclaimer: copy.export.disclaimer,
  };
}

const problemExportCopy: Record<Locale, ProblemExportCopy> = {
  de: {
    summary: "Zusammenfassung:",
    boundary: "Wichtige Grenze:",
    improvement: "Woran du eine kleine Verbesserung erkennen würdest:",
    situation: "Was die Situation gerade prägt:",
    resources: "Ressourcen und Grenzen:",
    questions: "Fragen zum Mitnehmen:",
    next: "Nächster Schritt:",
    disclaimer: PROBLEM_RESULT_DISCLAIMER,
  },
  en: {
    summary: "Summary:",
    boundary: "Important boundary:",
    improvement: "What would show you a small improvement:",
    situation: "What is shaping the situation right now:",
    resources: "Resources and boundaries:",
    questions: "Questions to carry with you:",
    next: "Next step:",
    disclaimer: PROBLEM_RESULT_DISCLAIMER_EN,
  },
  es: makeProblemExportCopy(problemGeneratedCopy.es),
  tr: makeProblemExportCopy(problemGeneratedCopy.tr),
  pl: makeProblemExportCopy(problemGeneratedCopy.pl),
  el: makeProblemExportCopy(problemGeneratedCopy.el),
  ru: makeProblemExportCopy(problemGeneratedCopy.ru),
};

export function getProblemResultDisclaimer(locale: Locale): string {
  return problemExportCopy[locale].disclaimer;
}

function joinWithinLimit(blocks: readonly string[], finalBlock: string, limit: number): string {
  const included: string[] = [];
  for (const block of blocks) {
    const normalized = block.trim();
    if (!normalized) continue;
    if ([...included, normalized, finalBlock].join("\n\n").length <= limit) included.push(normalized);
  }
  return [...included, finalBlock].join("\n\n");
}

export function buildProblemResultText(result: ProblemResult, locale: Locale = "de"): string {
  const labels = problemExportCopy[locale];
  const blocks = [
    `FYNS – Problem\n${result.title}`,
    [labels.summary, ...result.summary].join("\n"),
    `${labels.boundary}\n${result.boundary.title}\n${result.boundary.text}`,
    result.userNote ? `${labels.improvement}\n${result.userNote}` : "",
    [labels.situation, ...result.situation.map(({ title, text }) => `- ${title}: ${text}`)].join("\n"),
    [labels.resources, ...result.resources.map(({ title, text }) => `- ${title}: ${text}`)].join("\n"),
    [labels.questions, ...result.questionsToCarry.map((question) => `- ${question}`)].join("\n"),
    `${labels.next}\n${result.nextStep.title}\n${result.nextStep.text}`,
  ];
  return joinWithinLimit(blocks, getProblemResultDisclaimer(locale), 5_000);
}

export function buildProblemShareText(result: ProblemResult, locale: Locale = "de"): string {
  const copy = problemExportCopy[locale];
  const blocks = [
    `FYNS – Problem\n${result.title}`,
    result.summary.slice(0, 2).join(" "),
    `${copy.next} ${result.nextStep.title}. ${result.nextStep.text}`,
  ];
  return joinWithinLimit(blocks, copy.disclaimer, 1_200);
}
