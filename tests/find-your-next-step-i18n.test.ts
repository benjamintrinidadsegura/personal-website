import assert from "node:assert/strict";
import test from "node:test";

import {
  careerDirections,
  careerJobTitles,
  careerQuestions,
  getCareerDirections,
  getCareerIntro,
  getCareerJobTitles,
  getCareerQuestions,
} from "../data/find-your-next-step-career";
import { getFindYourNextStep, getNextStepJourneys } from "../data/find-your-next-step";
import { getIdeaIntro, getIdeaQuestions, ideaQuestions } from "../data/find-your-next-step-idea";
import { getProblemIntro, getProblemQuestions, problemQuestions } from "../data/find-your-next-step-problem";
import {
  getSelfHandbookActivityDefinitions,
  getSelfHandbookExperimentDefinitions,
  getSelfHandbookPatterns,
  getSelfHandbookTextDefinitions,
} from "../data/find-your-next-step-self-handbook";
import { getSelfProfileDefinitions, getSelfProfileSecondaryCopy } from "../data/find-your-next-step-self-profile";
import {
  getSelfReflectionIntro,
  getSelfReflectionQuestions,
  selfReflectionQuestions,
} from "../data/find-your-next-step-self";
import { buildCareerResult } from "../lib/find-your-next-step-career";
import {
  buildCareerResultText,
  CAREER_RESULT_DISCLAIMER_EN,
} from "../lib/find-your-next-step-career-export";
import { buildIdeaResult } from "../lib/find-your-next-step-idea";
import { buildIdeaResultText, IDEA_RESULT_DISCLAIMER_EN } from "../lib/find-your-next-step-idea-export";
import { buildProblemResult } from "../lib/find-your-next-step-problem";
import {
  buildProblemResultText,
  PROBLEM_RESULT_DISCLAIMER_EN,
} from "../lib/find-your-next-step-problem-export";
import { buildSelfReflectionResult } from "../lib/find-your-next-step-self";
import { buildSelfResultText, SELF_RESULT_DISCLAIMER_EN } from "../lib/find-your-next-step-self-export";
import { localizeHref } from "../lib/i18n/routing";
import { locales, type Locale } from "../lib/i18n/config";
import type { CareerAnswers, SelfReflectionAnswers } from "../types/find-your-next-step";
import type { IdeaAnswers } from "../types/find-your-next-step-idea";
import type { ProblemAnswers } from "../types/find-your-next-step-problem";

function selfQuestionSemantics(locale: Locale) {
  return getSelfReflectionQuestions(locale).map((question) => ({
    id: question.id,
    sectionId: question.sectionId,
    format: question.format,
    evidenceRole: question.evidenceRole,
    minSelections: question.minSelections,
    maxSelections: question.maxSelections,
    options: question.options.map(({ id, signals, contextualDimensions, exclusive }) => ({ id, signals, contextualDimensions, exclusive })),
  }));
}

function careerQuestionSemantics(locale: Locale) {
  return getCareerQuestions(locale).map((question) => ({
    id: question.id,
    sectionId: question.sectionId,
    format: question.format,
    purpose: question.purpose,
    minSelections: question.minSelections,
    maxSelections: question.maxSelections,
    matchingWeight: question.matchingWeight,
    options: question.options.map(({ id, signals, constraints, qualificationScope, nextStepMode, exclusive }) => ({
      id, signals, constraints, qualificationScope, nextStepMode, exclusive,
    })),
  }));
}

function problemQuestionSemantics(locale: Locale) {
  return getProblemQuestions(locale).map((question) => ({
    id: question.id,
    sectionId: question.sectionId,
    format: question.format,
    minSelections: question.minSelections,
    maxSelections: question.maxSelections,
    maxLength: question.maxLength,
    options: question.options.map(({ id, exclusive }) => ({ id, exclusive })),
  }));
}

function ideaQuestionSemantics(locale: Locale) {
  return getIdeaQuestions(locale).map((question) => ({
    id: question.id,
    sectionId: question.sectionId,
    format: question.format,
    resultRole: question.resultRole,
    minLength: question.format === "short-text" ? question.minLength : undefined,
    maxLength: question.format === "short-text" ? question.maxLength : undefined,
    minSelections: question.format === "short-text" ? undefined : question.minSelections,
    maxSelections: question.format === "short-text" ? undefined : question.maxSelections,
    options: question.format === "short-text" ? [] : question.options.map(({ id, exclusive }) => ({ id, exclusive })),
  }));
}

function selectedIds<T extends { id: string; exclusive?: boolean }>(options: readonly T[], minimum: number) {
  return options.filter(({ exclusive }) => !exclusive).slice(0, minimum).map(({ id }) => id);
}

function selfAnswers(): SelfReflectionAnswers {
  return Object.fromEntries(selfReflectionQuestions.map((question) => [question.id, selectedIds(question.options, question.minSelections)]));
}

function careerAnswers(): CareerAnswers {
  return Object.fromEntries(careerQuestions.map((question) => [question.id, selectedIds(question.options, question.minSelections)]));
}

const problemAnswers: ProblemAnswers = {
  "situation-area": ["area-work"],
  "situation-change": ["A small user-authored change that remains identical in both languages."],
  "urgency-pressure": ["pressure-soon"],
  "urgency-safety": ["safety-no"],
  "experience-tried": ["tried-reflect", "tried-talk"],
  "experience-effect": ["effect-partly"],
  "experience-influence": ["influence-shared"],
  "next-support": ["support-trusted", "support-information"],
  "next-mode": ["mode-facts"],
};

function ideaAnswers(): IdeaAnswers {
  return Object.fromEntries(ideaQuestions.map((question) => [
    question.id,
    question.format === "short-text"
      ? `User-authored ${question.resultRole} context with enough concrete detail.`
      : selectedIds(question.options, question.minSelections),
  ]));
}

test("FYNS locale factories translate copy while preserving every question's semantic payload", () => {
  assert.strictEqual(getSelfReflectionQuestions("de"), selfReflectionQuestions);
  assert.strictEqual(getCareerQuestions("de"), careerQuestions);
  assert.strictEqual(getProblemQuestions("de"), problemQuestions);
  assert.strictEqual(getIdeaQuestions("de"), ideaQuestions);

  assert.deepEqual(selfQuestionSemantics("en"), selfQuestionSemantics("de"));
  assert.deepEqual(careerQuestionSemantics("en"), careerQuestionSemantics("de"));
  assert.deepEqual(problemQuestionSemantics("en"), problemQuestionSemantics("de"));
  assert.deepEqual(ideaQuestionSemantics("en"), ideaQuestionSemantics("de"));

  assert.equal(getSelfReflectionIntro("en").title, "A calm look at what is helping you right now.");
  assert.equal(getCareerIntro("en").title, "Build a map of possible career directions.");
  assert.equal(getProblemIntro("en").title, "Make sense of a problem before choosing your next step.");
  assert.equal(getIdeaIntro("en").title, "Turn your idea into a small, testable next move.");
});

test("Career direction and job localization cannot alter matching topology", () => {
  assert.strictEqual(getCareerDirections("de"), careerDirections);
  assert.strictEqual(getCareerJobTitles("de"), careerJobTitles);
  assert.deepEqual(
    getCareerDirections("en").map(({ id, profile, coreActivitySignals, fields, constraintNotes }) => ({
      id,
      profile,
      coreActivitySignals,
      fieldQualifications: fields.map(({ qualification }) => qualification),
      constraintIds: constraintNotes.map(({ constraintId }) => constraintId),
    })),
    getCareerDirections("de").map(({ id, profile, coreActivitySignals, fields, constraintNotes }) => ({
      id,
      profile,
      coreActivitySignals,
      fieldQualifications: fields.map(({ qualification }) => qualification),
      constraintIds: constraintNotes.map(({ constraintId }) => constraintId),
    })),
  );
  assert.deepEqual(
    getCareerJobTitles("en").map(({ id, directionIds, hybridDirectionIds, constraintHints }) => ({
      id, directionIds, hybridDirectionIds, constraintIds: constraintHints?.map(({ constraintId }) => constraintId),
    })),
    getCareerJobTitles("de").map(({ id, directionIds, hybridDirectionIds, constraintHints }) => ({
      id, directionIds, hybridDirectionIds, constraintIds: constraintHints?.map(({ constraintId }) => constraintId),
    })),
  );
  assert.equal(getCareerJobTitles("en").find(({ id }) => id === "qa-engineer")?.title, "QA Engineer");
  assert.equal(getCareerJobTitles("en").find(({ id }) => id === "ux-researcher")?.title, "UX Researcher");
  assert.equal(getCareerJobTitles("en").find(({ id }) => id === "online-editor")?.title, "Online Editor");
});

test("the complete English FYNS data surface contains no residual German UI vocabulary", () => {
  const englishSurface = JSON.stringify([
    getFindYourNextStep("en"),
    getNextStepJourneys("en"),
    getSelfReflectionIntro("en"),
    getSelfReflectionQuestions("en"),
    getSelfProfileDefinitions("en"),
    getSelfProfileSecondaryCopy("en"),
    getSelfHandbookPatterns("en"),
    getSelfHandbookTextDefinitions("en"),
    getSelfHandbookActivityDefinitions("en"),
    getSelfHandbookExperimentDefinitions("en"),
    getCareerIntro("en"),
    getCareerQuestions("en"),
    getCareerDirections("en"),
    getCareerJobTitles("en"),
    getProblemIntro("en"),
    getProblemQuestions("en"),
    getIdeaIntro("en"),
    getIdeaQuestions("en"),
  ]);
  assert.equal(/\b(?:dein|deine|und|oder|nicht|wähle|antwort|frage|ergebnis|zurück|weiter|abschnitt|sichtbar|mehrfach|ausgewählt|umfeld|lernen|arbeiten|entscheiden|ausprobieren)\b/iu.test(englishSurface), false);
});

test("Self and Career generate the same structural result from the same semantic answers", () => {
  const selfDe = buildSelfReflectionResult(selfAnswers(), "de");
  const selfEn = buildSelfReflectionResult(selfAnswers(), "en");
  assert.equal(selfDe.status, "complete");
  assert.equal(selfEn.status, "complete");
  if (selfDe.status !== "complete" || selfEn.status !== "complete") return;
  const projectSelf = (result: typeof selfDe.result) => ({
    sections: result.sections.map(({ id, statements }) => ({
      id,
      statements: statements.map(({ id: statementId, visibility, contextual, evidence }) => ({
        id: statementId,
        visibility,
        contextual,
        evidence: evidence.map(({ questionId, optionId, sectionId }) => ({ questionId, optionId, sectionId })),
      })),
    })),
    tensions: result.tensions.map(({ id, evidence }) => ({ id, evidence: evidence.map(({ questionId, optionId }) => ({ questionId, optionId })) })),
  });
  assert.deepEqual(projectSelf(selfEn.result), projectSelf(selfDe.result));
  assert.ok(buildSelfResultText(selfEn.result, "en").endsWith(SELF_RESULT_DISCLAIMER_EN));

  const careerDe = buildCareerResult(careerAnswers(), "de");
  const careerEn = buildCareerResult(careerAnswers(), "en");
  assert.equal(careerDe.status, "complete");
  assert.equal(careerEn.status, "complete");
  if (careerDe.status !== "complete" || careerEn.status !== "complete") return;
  const projectCareer = (result: typeof careerDe.result) => ({
    primary: result.primaryDirections.map(({ id, evidence }) => ({ id, evidence: evidence.map(({ questionId, optionId }) => ({ questionId, optionId })) })),
    additional: result.additionalDirections.map(({ id, evidence }) => ({ id, evidence: evidence.map(({ questionId, optionId }) => ({ questionId, optionId })) })),
    jobs: result.jobTitles.map(({ id, directions }) => ({
      id,
      directions: directions.map(({ id: directionId, tier }) => ({ id: directionId, tier })),
    })),
    conditions: result.conditions.map(({ id, kind }) => ({ id, kind })),
    tensions: result.tensions.map(({ id }) => id),
    nextStepMode: result.nextStep.mode,
  });
  assert.deepEqual(projectCareer(careerEn.result), projectCareer(careerDe.result));
  assert.ok(buildCareerResultText(careerEn.result, "en").endsWith(CAREER_RESULT_DISCLAIMER_EN));
});

test("Problem and Idea preserve user text and structural outcomes across locales", () => {
  const problemDe = buildProblemResult(problemAnswers, "de");
  const problemEn = buildProblemResult(problemAnswers, "en");
  assert.equal(problemDe.status, "complete");
  assert.equal(problemEn.status, "complete");
  if (problemDe.status !== "complete" || problemEn.status !== "complete") return;
  const projectProblem = (result: typeof problemDe.result) => ({
    boundary: result.boundary.level,
    situation: result.situation.map(({ id, evidence }) => ({ id, evidence: evidence.map(({ questionId, optionId }) => ({ questionId, optionId })) })),
    resources: result.resources.map(({ id, evidence }) => ({ id, evidence: evidence.map(({ questionId, optionId }) => ({ questionId, optionId })) })),
    nextStepEvidence: result.nextStep.evidence.map(({ questionId, optionId }) => ({ questionId, optionId })),
    userNote: result.userNote,
  });
  assert.deepEqual(projectProblem(problemEn.result), projectProblem(problemDe.result));
  assert.equal(problemEn.result.userNote, problemAnswers["situation-change"][0]);
  assert.ok(buildProblemResultText(problemEn.result, "en").endsWith(PROBLEM_RESULT_DISCLAIMER_EN));

  const answers = ideaAnswers();
  const ideaDe = buildIdeaResult(answers, "de");
  const ideaEn = buildIdeaResult(answers, "en");
  assert.equal(ideaDe.status, "complete");
  assert.equal(ideaEn.status, "complete");
  if (ideaDe.status !== "complete" || ideaEn.status !== "complete") return;
  assert.deepEqual(ideaEn.result.snapshot, ideaDe.result.snapshot);
  assert.deepEqual(
    [ideaEn.result.known.length, ideaEn.result.uncertain.length, ideaEn.result.assumptions.length, ideaEn.result.constraints.length],
    [ideaDe.result.known.length, ideaDe.result.uncertain.length, ideaDe.result.assumptions.length, ideaDe.result.constraints.length],
  );
  assert.ok(buildIdeaResultText(ideaEn.result, "en").endsWith(IDEA_RESULT_DISCLAIMER_EN));
});

test("FYNS routes remain German-unprefixed and every other locale is prefixed", () => {
  for (const slug of ["self", "career", "problem", "idea"]) {
    const href = `/find-your-next-step/${slug}`;
    assert.equal(localizeHref(href, "de"), href);
    for (const locale of locales.filter((candidate) => candidate !== "de")) assert.equal(localizeHref(href, locale), `/${locale}${href}`);
  }
});

test("all seven FYNS locales preserve semantics and generate deterministic locale-aware output", () => {
  assert.deepEqual(locales, ["de", "en", "es", "tr", "pl", "el", "ru"]);
  const scripts: Partial<Record<Locale, RegExp>> = { tr: /[çğıİöşü]/u, pl: /[ąćęłńóśźż]/iu, el: /[Α-ω]/u, ru: /[А-яЁё]/u };
  const answers = ideaAnswers();
  const baseline = {
    self: selfQuestionSemantics("de"), career: careerQuestionSemantics("de"), problem: problemQuestionSemantics("de"), idea: ideaQuestionSemantics("de"),
  };
  for (const locale of locales) {
    assert.deepEqual(selfQuestionSemantics(locale), baseline.self, `Self semantics changed in ${locale}`);
    assert.deepEqual(careerQuestionSemantics(locale), baseline.career, `Career semantics changed in ${locale}`);
    assert.deepEqual(problemQuestionSemantics(locale), baseline.problem, `Problem semantics changed in ${locale}`);
    assert.deepEqual(ideaQuestionSemantics(locale), baseline.idea, `Idea semantics changed in ${locale}`);

    const self = buildSelfReflectionResult(selfAnswers(), locale);
    const career = buildCareerResult(careerAnswers(), locale);
    const problem = buildProblemResult(problemAnswers, locale);
    const idea = buildIdeaResult(answers, locale);
    assert.equal(self.status, "complete", `Self result incomplete in ${locale}`);
    assert.equal(career.status, "complete", `Career result incomplete in ${locale}`);
    assert.equal(problem.status, "complete", `Problem result incomplete in ${locale}`);
    assert.equal(idea.status, "complete", `Idea result incomplete in ${locale}`);
    if (self.status !== "complete" || career.status !== "complete" || problem.status !== "complete" || idea.status !== "complete") continue;
    const output = [buildSelfResultText(self.result, locale), buildCareerResultText(career.result, locale), buildProblemResultText(problem.result, locale), buildIdeaResultText(idea.result, locale)].join("\n");
    assert.ok(output.length > 1_500, `${locale} generated output lost depth`);
    if (scripts[locale]) assert.match(output, scripts[locale]!, `${locale} output does not contain its native script/diacritics`);
    assert.equal(output.includes("undefined"), false);
  }
});
