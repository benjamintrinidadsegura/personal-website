import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createElement, createRef, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LocaleProvider } from "../components/i18n/locale-context";
import { FynsResultFigure } from "../components/find-your-next-step/result-figure";
import { SelfPrintDocument } from "../components/find-your-next-step/self-reflection-journey";
import {
  fynsCharacterConstellationCopy,
  fynsCharacterArtworkRegistry,
  fynsCharacterIds,
  fynsCharacterRegistry,
  getFynsCharacterArtwork,
  getFynsCharacter,
} from "../data/find-your-next-step-characters";
import { selfReflectionQuestions } from "../data/find-your-next-step-self";
import { fynsFigureRepresentations } from "../data/find-your-next-step-figures";
import {
  buildSelfCharacterConstellation,
  fynsExplicitFacetSignalDimensions,
  fynsSelfCharacterMappings,
} from "../lib/find-your-next-step-constellation";
import { buildSelfHandbook } from "../lib/find-your-next-step-self-handbook";
import { buildSelfProfileIdentity } from "../lib/find-your-next-step-self-profile";
import {
  buildSelfReflectionResult,
  calculateSelfReflectionScores,
  orderVisibleSelfReflectionEvaluations,
} from "../lib/find-your-next-step-self";
import { locales } from "../lib/i18n/config";
import type {
  SelfReflectionAnswers,
  SelfReflectionDimensionId,
  SelfReflectionQuestion,
} from "../types/find-your-next-step";

function optionSupport(option: SelfReflectionQuestion["options"][number], targets: readonly SelfReflectionDimensionId[]) {
  return (option.signals ?? []).filter(({ dimension }) => targets.includes(dimension)).length
    + (option.contextualDimensions ?? []).filter((dimension) => targets.includes(dimension)).length;
}

function createCompleteAnswers(targets: readonly SelfReflectionDimensionId[]): SelfReflectionAnswers {
  return Object.fromEntries(selfReflectionQuestions.map((question) => {
    const exclusiveFallback = question.options.find(({ exclusive }) => exclusive);
    if (exclusiveFallback && !question.options.some((option) => optionSupport(option, targets) > 0)) {
      return [question.id, [exclusiveFallback.id]];
    }
    const ranked = question.options
      .map((option, index) => ({ option, index, support: optionSupport(option, targets) }))
      .filter(({ option }) => !option.exclusive)
      .sort((left, right) => right.support - left.support || left.index - right.index);
    const selected = ranked.filter(({ support }) => support > 0).slice(0, question.maxSelections);
    for (const candidate of ranked) {
      if (selected.length >= question.minSelections) break;
      if (!selected.some(({ option }) => option.id === candidate.option.id)) selected.push(candidate);
    }
    return [question.id, selected.slice(0, question.maxSelections).map(({ option }) => option.id)];
  }));
}

function createExplicitFacetAnswers(dimension: (typeof fynsExplicitFacetSignalDimensions)[number]): SelfReflectionAnswers {
  return {
    "priorities-everyday": ["everyday-variety", "everyday-recovery"],
    "priorities-now": ["priority-agency", "priority-connection"],
    "priorities-good-day": [`good-day-${dimension}`],
    "decisions-new-beginning": ["beginning-variety-growth"],
    "decisions-uncertainty": ["uncertainty-reliability-purpose"],
    "decisions-rhythm": ["rhythm-depth-orientation"],
    "energy-recharge": ["recharge-connection-feedback"],
    "energy-sustaining": ["sustaining-variety-growth"],
    "energy-drains": ["drain-agency-orientation"],
    "conditions-change": ["change-growth-purpose"],
    "conditions-habitat": ["habitat-connection", "habitat-recovery"],
    "conditions-combinations": ["combination-purpose-feedback"],
    "conditions-facet-signals": [`facet-condition-${dimension}`],
    "self-view-strengths": ["strength-overview"],
    "self-view-context": ["context-open"],
    "self-view-synthesis": [`synthesis-${dimension}`],
  };
}

function buildFixture(locale: (typeof locales)[number] = "de") {
  const answers = createCompleteAnswers(["agency", "orientation", "reliability", "variety", "connection", "depth"]);
  const resultState = buildSelfReflectionResult(answers, locale);
  assert.equal(resultState.status, "complete");
  if (resultState.status !== "complete") throw new Error("Expected a complete Self result fixture");
  const result = resultState.result;
  const profileIdentity = buildSelfProfileIdentity(answers, result, locale);
  const handbook = buildSelfHandbook(answers, locale);
  const constellation = buildSelfCharacterConstellation({ answers, result, profileIdentity, handbook, locale });
  assert.ok(constellation);
  return { answers, result, profileIdentity, handbook, constellation };
}

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    collectKeys(child, keys);
  }
  return keys;
}

test("FYNS-CHAR-01: the V1 registry contains exactly the twelve frozen character facets", () => {
  assert.deepEqual(fynsCharacterIds, [
    "explorer", "builder", "connector", "independent", "thinker", "stabilizer",
    "challenger", "caregiver", "creator", "organizer", "harmonizer", "achiever",
  ]);
  assert.equal(fynsCharacterRegistry.length, 12);
  assert.equal(new Set(fynsCharacterRegistry.map(({ id }) => id)).size, 12);
  assert.deepEqual(fynsCharacterRegistry.map(({ name }) => name), [
    "Explorer", "Builder", "Connector", "Independent", "Thinker", "Stabilizer",
    "Challenger", "Caregiver", "Creator", "Organizer", "Harmonizer", "Achiever",
  ]);
  assert.deepEqual(fynsCharacterRegistry.map(({ subtitle }) => subtitle), [
    "Neugier & Entdeckung", "Gestaltung & Umsetzung", "Verbindung & Zugehörigkeit", "Autonomie",
    "Tiefe & Verständnis", "Sicherheit & Beständigkeit", "Herausforderung & Entwicklung",
    "Fürsorge & Beitrag", "Ausdruck & Originalität", "Struktur & Klarheit",
    "Balance & gutes Miteinander", "Fortschritt & Wirksamkeit",
  ]);
});

test("FYNS-CHAR-02: framing is contextual rather than a personality or permanent identity claim in all locales", () => {
  assert.deepEqual(locales, ["de", "en", "es", "tr", "pl", "el", "ru"]);
  for (const locale of locales) {
    const copy = fynsCharacterConstellationCopy[locale];
    assert.ok(copy.eyebrow.length > 15, locale);
    assert.ok(copy.currentFacet("Explorer").includes("Explorer"), locale);
    assert.ok(copy.evidenceMeaning(["A", "B"], "Meaning", true).includes("A"), locale);
    assert.doesNotMatch(copy.currentFacet("Explorer"), /you are|du bist|eres|sen bir|jesteś|είσαι|ты —|personality type|persönlichkeitstyp|diagnos/iu, locale);
    assert.equal(new Set(fynsCharacterIds.map((id) => getFynsCharacter(id, locale).subtitle)).size, 12, locale);
  }
});

test("FYNS-CHAR-06/07: every locale explains meaning from selected evidence without questionnaire mechanics", () => {
  for (const locale of locales) {
    const { constellation, profileIdentity } = buildFixture(locale);
    if (profileIdentity.status === "profile") {
      assert.doesNotMatch(profileIdentity.why, /\d+\s*(?:sections?|abschnitten|secciones|bölüm|sekcji|ενότητες|раздел)/iu, locale);
    }
    for (const character of [constellation.dominant, ...constellation.supporting]) {
      assert.ok(character.why.length > 60, `${locale}:${character.id}`);
      assert.doesNotMatch(character.why, /(?:visible|sichtbar|visible|görünür|widocz|ορατ|видн).{0,20}\d+|\d+\s*(?:answers?|choices?|decisions?|sections?|antworten|entscheidungen|abschnitten|respuestas|secciones|yanıt|bölüm|odpowiedzi|sekcj|απαντήσεις|ενότητες|ответ|раздел)/iu, `${locale}:${character.id}`);
    }
  }
});

test("FYNS-CHAR-15/FYNS-REACH-01: Self maps all twelve facets through direct dimension meanings", () => {
  assert.deepEqual(fynsSelfCharacterMappings, {
    variety: "explorer",
    connection: "connector",
    agency: "independent",
    depth: "thinker",
    reliability: "stabilizer",
    growth: "challenger",
    orientation: "organizer",
    making: "builder",
    care: "caregiver",
    expression: "creator",
    harmony: "harmonizer",
    effectiveness: "achiever",
  });
  for (const unsupported of ["recovery", "purpose", "feedback"] as const) {
    assert.equal(unsupported in fynsSelfCharacterMappings, false, unsupported);
  }
  assert.deepEqual(fynsExplicitFacetSignalDimensions, ["making", "care", "expression", "harmony", "effectiveness"]);
  assert.deepEqual(new Set(Object.values(fynsSelfCharacterMappings)), new Set(fynsCharacterIds));
});

test("FYNS-REACH-01: each new facet requires and becomes visible through its own explicit evidence", () => {
  for (const dimension of fynsExplicitFacetSignalDimensions) {
    const signalOptions = selfReflectionQuestions.flatMap((question) => question.options
      .filter((option) => option.signals?.some((signal) => signal.dimension === dimension))
      .map((option) => ({ questionId: question.id, optionId: option.id })));
    assert.deepEqual(signalOptions, [
      { questionId: "priorities-good-day", optionId: `good-day-${dimension}` },
      { questionId: "conditions-facet-signals", optionId: `facet-condition-${dimension}` },
      { questionId: "self-view-synthesis", optionId: `synthesis-${dimension}` },
    ], dimension);

    const answers = createExplicitFacetAnswers(dimension);
    const evaluation = calculateSelfReflectionScores(answers).find((item) => item.dimension === dimension);
    assert.equal(evaluation?.visibility, "clear", dimension);
    assert.equal(evaluation?.evidenceQuestionCount, 3, dimension);
    assert.equal(evaluation?.evidenceSectionCount, 3, dimension);

    const resultState = buildSelfReflectionResult(answers);
    assert.equal(resultState.status, "complete", dimension);
    if (resultState.status !== "complete") continue;
    const profileIdentity = buildSelfProfileIdentity(answers, resultState.result);
    const handbook = buildSelfHandbook(answers);
    const constellation = buildSelfCharacterConstellation({ answers, result: resultState.result, profileIdentity, handbook });
    assert.ok(constellation, dimension);
    assert.equal(constellation.dominant.sourceDimension, dimension);
    assert.equal(constellation.dominant.id, fynsSelfCharacterMappings[dimension]);
    assert.ok(constellation.application.reflection?.includes(resultState.result.sections.flatMap(({ statements }) => statements).find(({ id }) => id.endsWith(`-${dimension}`))?.evidence[0]?.answer ?? "missing"));
    assert.ok(constellation.application.experiment?.length);

    const withoutOwnEvidence = Object.fromEntries(Object.entries(answers).map(([questionId, optionIds]) => [
      questionId,
      optionIds.filter((optionId) => !optionId.endsWith(`-${dimension}`)),
    ]));
    const unsupported = calculateSelfReflectionScores(withoutOwnEvidence).find((item) => item.dimension === dimension);
    assert.equal(unsupported?.visibility, null, dimension);
    assert.equal(unsupported?.score, 0, dimension);
  }
});

test("FYNS-CHAR-03/07: dominant and supporting facets preserve evidence ordering and expose grounded meaning", () => {
  const { answers, result, constellation } = buildFixture();
  const expected = orderVisibleSelfReflectionEvaluations(calculateSelfReflectionScores(answers))
    .filter(({ dimension }) => dimension in fynsSelfCharacterMappings)
    .slice(0, 4)
    .map(({ dimension }) => fynsSelfCharacterMappings[dimension as keyof typeof fynsSelfCharacterMappings]);

  assert.equal(constellation.dominant.id, expected[0]);
  assert.deepEqual(constellation.supporting.map(({ id }) => id), expected.slice(1));
  assert.ok(constellation.supporting.length >= 2 && constellation.supporting.length <= 3);
  assert.deepEqual(
    [constellation.dominant, ...constellation.supporting].map(({ sourceDimension }) => sourceDimension),
    ["orientation", "agency", "depth", "variety"],
  );

  const resultIds = new Set(result.sections.flatMap(({ statements }) => statements.map(({ id }) => id)));
  for (const character of [constellation.dominant, ...constellation.supporting]) {
    assert.ok(character.semanticIds.length > 0, character.id);
    assert.ok(character.semanticIds.every((id) => resultIds.has(id)), character.id);
    assert.ok(character.why.length > 40, character.id);
    assert.ok(character.contribution.length > 25, character.id);
    assert.ok(character.conditions.length > 25, character.id);
    assert.ok(character.friction.length > 25, character.id);
    assert.ok(character.notice.length > 25, character.id);
  }
});

test("FYNS-CHAR-08/09/10/11/12: relational synthesis remains traceable to supported Self output", () => {
  const { result, profileIdentity, handbook, constellation } = buildFixture();
  assert.equal(profileIdentity.status, "profile");
  assert.ok(constellation.combination);
  assert.equal(constellation.combination.title, profileIdentity.status === "profile" ? profileIdentity.definition.name : "");
  assert.ok(constellation.combination.evidence.length > 5);
  assert.ok(constellation.combination.interpretation.length > 40);
  assert.ok(constellation.combination.possibility.length > 30);
  assert.doesNotMatch(constellation.combination.evidence, /\d+|entscheidungen|choices|abschnitt|section/iu);
  assert.ok(result.summary.every((sentence) => constellation.synthesis.includes(sentence)));
  assert.ok(constellation.synthesis.includes(constellation.dominant.name));
  for (const supporting of constellation.supporting) assert.ok(constellation.synthesis.includes(supporting.name));
  assert.equal(constellation.relationships.reinforcement, constellation.combination.interpretation);
  assert.ok(constellation.relationships.condition);
  assert.ok(constellation.relationships.application);
  assert.deepEqual(constellation.tensions.map(({ id }) => id), ["orientation-agency"]);
  assert.ok(constellation.tensions.every(({ text, sourceText }) => text.includes(sourceText)));
  assert.ok(constellation.application.environments);
  assert.equal(constellation.application.energy, handbook?.energySupports[0]?.text);
  assert.equal(constellation.application.friction, handbook?.energyWatchouts[0]?.text);
  assert.ok(constellation.application.needs);
  assert.ok(constellation.application.reflection);
  assert.ok(constellation.application.experiment);
});

test("FYNS-CHAR-02/06/15: constellation leaves semantics unchanged and exposes neither mechanics nor a type claim", () => {
  const { answers, result, profileIdentity, handbook } = buildFixture();
  const before = structuredClone({ answers, result, profileIdentity, handbook });
  const constellation = buildSelfCharacterConstellation({ answers, result, profileIdentity, handbook });
  assert.deepEqual({ answers, result, profileIdentity, handbook }, before);
  assert.ok(constellation);
  const keys = collectKeys(constellation);
  for (const forbidden of ["score", "maximum", "percentage", "rank", "type", "diagnosis"]) {
    assert.equal(keys.has(forbidden), false, forbidden);
  }
  assert.doesNotMatch(JSON.stringify(constellation), /you are|du bist|personality type|persönlichkeitstyp|diagnos|\d+%|\d+ (?:answers|choices|decisions|sections|antworten|entscheidungen|abschnitten)/iu);
});

test("FYNS-CHAR-04/13/FYNS-ASSET-01: all 36 approved assets are locally mapped without Context Scene substitution", () => {
  let assetCount = 0;
  for (const character of fynsCharacterIds) {
    for (const representation of ["neutral", "masculine", "feminine"] as const) {
      const src = getFynsCharacterArtwork(character, representation);
      assert.match(src, new RegExp(`/characters/v1/${character}-(?:nonbinary|masculine|feminine)\\.png$`));
      const file = join(process.cwd(), "public", src);
      assert.equal(existsSync(file), true, `${character}:${representation}`);
      assert.ok(statSync(file).size > 40_000, `${character}:${representation}`);
      assetCount += 1;
    }
    assert.equal(new Set(fynsFigureRepresentations.map((representation) => getFynsCharacterArtwork(character, representation))).size, 3, character);
  }
  assert.equal(assetCount, 36);
  assert.doesNotMatch(JSON.stringify(fynsCharacterArtworkRegistry), /context-scenes/);
});

test("FYNS-CHAR-14: V1 artwork architecture is facet plus representation only, with no deeper avatar personalization", () => {
  assert.deepEqual(fynsFigureRepresentations, ["neutral", "masculine", "feminine"]);
  const registryShape = JSON.stringify(fynsCharacterArtworkRegistry);
  assert.doesNotMatch(registryShape, /wardrobe|cosmetic|avatar|appearance|procedural/i);
});

test("FYNS-CHAR-03/05/07-13: real component renders dominant/supporting artwork and every qualitative layer", () => {
  const { result, constellation } = buildFixture();
  const markup = renderToStaticMarkup(
    createElement(
      LocaleProvider,
      { locale: "de" } as ComponentProps<typeof LocaleProvider>,
      createElement(FynsResultFigure, {
        journey: "self",
        accent: "#35d0e5",
        headingId: "self-constellation-title",
        headingRef: createRef<HTMLHeadingElement>(),
        title: result.title,
        description: result.description,
        summary: result.summary,
        semanticIds: constellation.dominant.semanticIds,
        constellation,
      }),
    ),
  );

  assert.match(markup, /data-fyns-character-constellation="true"/);
  assert.match(markup, /data-fyns-visual-status="complete"/);
  assert.match(markup, /data-fyns-visual-dominant="organizer"/);
  assert.equal((markup.match(/data-fyns-visual-supporting=/g) ?? []).length, 3);
  assert.equal((markup.match(/data-fyns-character-role="dominant"/g) ?? []).length, 1);
  assert.equal((markup.match(/data-fyns-character-role="supporting"/g) ?? []).length, 3);
  for (const content of [
    "Warum sichtbar", "Was sie beiträgt", "Welche Bedingungen helfen", "Mögliche Reibung", "Worauf du achten kannst",
    "Was in der Kombination sichtbar wird", "Deine Konstellation im Zusammenhang", "Mögliche Dynamiken", "Damit weiterarbeiten",
    "Passende Situationen", "Mögliche Energiequelle", "Was sie praktisch braucht", "Reflexionsfrage", "Kleines Experiment",
  ]) assert.match(markup, new RegExp(content));
  assert.match(markup, /data-fyns-figure-representation="neutral"/);
  assert.equal((markup.match(/type="radio"/g) ?? []).length, 3);
  assert.equal((markup.match(/type="radio"[^>]*disabled=""/g) ?? []).length, 0);
  assert.doesNotMatch(markup, /akzeptierten Character-Artworks/);
  assert.doesNotMatch(markup, /Sichtbar durch \d|Entscheidungen in \d|Abschnitten/);
});

test("FYNS-CHAR-05/15: representation remains presentation-only and does not enter the constellation engine", () => {
  const source = buildSelfCharacterConstellation.toString();
  assert.doesNotMatch(source, /representation|masculine|feminine|neutral/i);
  const fixture = buildFixture();
  const before = structuredClone(fixture.constellation);
  for (const locale of locales) {
    assert.ok(fynsCharacterConstellationCopy[locale].currentFacet(fixture.constellation.dominant.name));
  }
  assert.deepEqual(fixture.constellation, before);
});

test("FYNS Character export preserves the current visual constellation and qualitative result", () => {
  const fixture = buildFixture();
  const before = structuredClone({
    result: fixture.result,
    constellation: fixture.constellation,
  });
  const renderPrint = (representation: "neutral" | "feminine") => renderToStaticMarkup(
    createElement(
      LocaleProvider,
      { locale: "de" } as ComponentProps<typeof LocaleProvider>,
      createElement(SelfPrintDocument, {
        result: fixture.result,
        constellation: fixture.constellation,
        representation,
      }),
    ),
  );

  const neutralMarkup = renderPrint("neutral");
  const feminineMarkup = renderPrint("feminine");
  const visibleCharacters = [fixture.constellation.dominant, ...fixture.constellation.supporting];

  assert.match(neutralMarkup, /data-fyns-print-document="self"/);
  assert.match(neutralMarkup, /data-fyns-print-representation="neutral"/);
  assert.equal((neutralMarkup.match(/data-fyns-print-character-role="dominant"/g) ?? []).length, 1);
  assert.equal((neutralMarkup.match(/data-fyns-print-character-role="supporting"/g) ?? []).length, fixture.constellation.supporting.length);
  assert.equal((neutralMarkup.match(/class="fyns-print-character-image"/g) ?? []).length, visibleCharacters.length);

  for (const character of visibleCharacters) {
    assert.match(neutralMarkup, new RegExp(`/characters/v1/${character.id}-nonbinary\\.png`));
    assert.match(feminineMarkup, new RegExp(`/characters/v1/${character.id}-feminine\\.png`));
    assert.match(neutralMarkup, new RegExp(character.name));
    assert.ok(neutralMarkup.includes(character.subtitle.replaceAll("&", "&amp;")), character.subtitle);
  }
  assert.match(feminineMarkup, /data-fyns-print-representation="feminine"/);
  assert.equal((feminineMarkup.match(/data-fyns-print-character=/g) ?? []).length, visibleCharacters.length);

  for (const content of [
    fixture.constellation.synthesis,
    fixture.constellation.combination?.title,
    fixture.constellation.application.environments,
    fixture.constellation.application.energy,
    fixture.constellation.application.friction,
    fixture.constellation.application.needs,
    fixture.constellation.application.reflection,
    fixture.constellation.application.experiment,
    fixture.constellation.tensions[0]?.title,
    fixture.result.sections.find(({ statements }) => statements.length > 0)?.title,
  ].filter((value): value is string => Boolean(value))) {
    assert.ok(neutralMarkup.includes(content.replaceAll("&", "&amp;")), content);
  }

  assert.doesNotMatch(neutralMarkup, /Sichtbar durch \d|\d+ Entscheidungen|\d+ Abschnitte|score|percentage|\d+%/iu);
  assert.deepEqual({ result: fixture.result, constellation: fixture.constellation }, before);

  const printStyles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(printStyles, /\.fyns-print-character-stage\s*\{[\s\S]*?display: flex;[\s\S]*?break-inside: avoid-page;/u);
  assert.match(printStyles, /\.fyns-print-character\s*\{[\s\S]*?min-width: 0;[\s\S]*?break-inside: avoid-page;/u);
  assert.match(printStyles, /\.fyns-print-character-image\s*\{[\s\S]*?width: 100%;[\s\S]*?height: auto;[\s\S]*?object-fit: contain;/u);
  assert.match(printStyles, /\.fyns-print-character-dominant\s*\{[\s\S]*?flex: 1\.3 1 0;/u);
  assert.match(printStyles, /\.fyns-print-character-supporting\s*\{[\s\S]*?flex: 1 1 0;/u);
});
