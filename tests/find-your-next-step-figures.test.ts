import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createElement, createRef, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FynsResultFigure } from "../components/find-your-next-step/result-figure";
import { LocaleProvider } from "../components/i18n/locale-context";

import {
  createFynsResultFigureModel,
  defaultFynsFigureRepresentation,
  fynsContextScenes,
  fynsFigureRepresentations,
  getFynsResultFigureCopy,
} from "../data/find-your-next-step-figures";
import type { FynsResultFigureModel } from "../data/find-your-next-step-figures";
import { locales } from "../lib/i18n/config";

const root = process.cwd();

test("Context Scenes cover the overview and all four journeys with real optimized assets", () => {
  assert.deepEqual(Object.keys(fynsContextScenes), ["overview", "self", "career", "problem", "idea"]);

  for (const scene of Object.values(fynsContextScenes)) {
    assert.match(scene.src, /^\/images\/find-your-next-step\/context-scenes\/.+\.webp$/);
    assert.ok(readFileSync(join(root, "public", scene.src)).byteLength < 200_000, scene.key);
    assert.ok(scene.alt.length > 20, scene.key);
  }
});

test("scene language preserves context, revisability, and user interpretive authority", () => {
  const content = Object.values(fynsContextScenes)
    .flatMap((scene) => [scene.title, scene.description])
    .join(" ");

  assert.match(content, /Situationen|Situation/);
  assert.match(content, /Rollen wechseln|verändern/);
  assert.match(content, /nicht.*Typ|nicht.*Zuordnung|nicht.*Gründertyp/);
  assert.doesNotMatch(content, /Persönlichkeitstyp|Typ-Code|Prozent|Du bist Figur|gehört zu dir/i);
});

test("Context Scenes are static presentation, never selected from answers or account identity", () => {
  const component = readFileSync(join(root, "components/find-your-next-step/context-scene.tsx"), "utf8");
  const data = readFileSync(join(root, "data/find-your-next-step-figures.ts"), "utf8");

  assert.match(component, /<figure/);
  assert.match(component, /<figcaption/);
  assert.match(component, /alt=\{scene\.alt\}/);
  assert.doesNotMatch(`${component}\n${data}`, /useState|answers|score|percentage|account|profileId|userId|localStorage|fetch\(/i);
});

test("result figures support every explicit representation with a neutral default", () => {
  assert.deepEqual(fynsFigureRepresentations, ["neutral", "masculine", "feminine"]);
  assert.equal(defaultFynsFigureRepresentation, "neutral");

  for (const journey of ["self", "career", "problem", "idea"] as const) {
    const semanticIds = [`${journey}-primary`, `${journey}-secondary`, `${journey}-primary`];
    const models: FynsResultFigureModel[] = fynsFigureRepresentations.map((representation) =>
      createFynsResultFigureModel({ journey, representation, semanticIds }),
    );

    assert.equal(new Set(models.map(({ src }) => src)).size, 1, journey);
    assert.equal(new Set(models.map(({ objectPosition }) => objectPosition)).size, 3, journey);
    assert.deepEqual(models.map(({ semanticIds: ids }) => ids), models.map(() => semanticIds.slice(0, 2)), journey);
    assert.ok(models.every(({ id }) => id.startsWith(`fyns-result-figure-${journey}-`)), journey);
    assert.equal(createFynsResultFigureModel({ journey, semanticIds }).representation, "neutral", journey);
  }
});

test("representation changes visual framing without accepting or changing result semantics", () => {
  const resultSnapshot = Object.freeze({
    title: "Career Map",
    semanticIds: Object.freeze(["direction-analysis-clarity", "direction-research-understanding"]),
  });
  const before = structuredClone(resultSnapshot);
  const models = fynsFigureRepresentations.map((representation) =>
    createFynsResultFigureModel({ journey: "career", representation, semanticIds: resultSnapshot.semanticIds }),
  );

  assert.deepEqual(resultSnapshot, before);
  assert.deepEqual(models.map(({ semanticIds: ids }) => ids), models.map(() => before.semanticIds));
  assert.equal(new Set(models.map(({ representation }) => representation)).size, 3);
});

test("figure selection copy is complete and explicit in all seven locales", () => {
  assert.deepEqual(locales, ["de", "en", "es", "tr", "pl", "el", "ru"]);
  for (const locale of locales) {
    const copy = getFynsResultFigureCopy(locale);
    assert.ok(copy.eyebrow.length > 12, locale);
    assert.ok(copy.legend.length > 8, locale);
    assert.ok(copy.explanation.length > 45, locale);
    assert.deepEqual(Object.keys(copy.options), fynsFigureRepresentations, locale);
    assert.equal(new Set(Object.values(copy.options)).size, 3, locale);
    for (const label of Object.values(copy.options)) {
      assert.ok(copy.visualLabel(label).includes(label), `${locale}:${label}`);
    }
  }
});

test("result figure selection is accessible, changeable, local-only and rendered by all journeys", () => {
  const component = readFileSync(join(root, "components/find-your-next-step/result-figure.tsx"), "utf8");
  const journeySources = [
    "self-reflection-journey.tsx",
    "career-exploration-journey.tsx",
    "problem-journey.tsx",
    "idea-journey.tsx",
  ].map((file) => readFileSync(join(root, "components/find-your-next-step", file), "utf8"));

  assert.match(component, /<fieldset/);
  assert.match(component, /<legend/);
  assert.match(component, /type="radio"/);
  assert.match(component, /peer-focus-visible:outline/);
  assert.match(component, /min-h-12/);
  assert.match(component, /useState\(defaultFynsFigureRepresentation\)/);
  assert.match(component, /onChange=\{\(\) => setRepresentation\(candidate\)\}/);
  assert.match(component, /data-fyns-result-figure/);
  assert.doesNotMatch(component, /localStorage|sessionStorage|fetch\(|analytics|profileId|userId|account/i);
  for (const source of journeySources) assert.match(source, /<FynsResultFigure/);
});

test("all four result figures render through React without reaching a route recovery boundary", () => {
  for (const journey of ["self", "career", "problem", "idea"] as const) {
    const headingRef = createRef<HTMLHeadingElement>();
    const markup = renderToStaticMarkup(
      createElement(
        LocaleProvider,
        { locale: "de" } as ComponentProps<typeof LocaleProvider>,
        createElement(FynsResultFigure, {
          journey,
          accent: "#77e5b5",
          headingId: `${journey}-runtime-result-title`,
          headingRef,
          title: `${journey} runtime result`,
          description: "A deterministic runtime rendering check.",
          summary: ["The qualitative result remains present."],
          semanticIds: [`${journey}-primary`, `${journey}-secondary`],
        }),
      ),
    );

    assert.match(markup, new RegExp(`data-fyns-result-figure="${journey}"`), journey);
    assert.match(markup, /data-fyns-figure-representation="neutral"/, journey);
    assert.match(markup, /type="radio"/, journey);
    assert.doesNotMatch(markup, /Diese Journey konnte gerade nicht weiter angezeigt werden/, journey);
  }
});
