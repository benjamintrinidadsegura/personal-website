import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createSourceFile,
  forEachChild,
  isCallExpression,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isStringLiteral,
  ScriptKind,
  ScriptTarget,
  type Node,
} from "typescript";

import {
  assertLifeVisionUiVisionCopyCompleteness,
  LIFE_VISION_UI_SOURCE_KEYS,
  lifeVisionUiVisionCopy,
} from "../data/i18n/life-alignment-ui-vision-copy";

const sourceFiles = [
  "app/life-alignment/life-vision/page.tsx",
  "app/life-alignment/life-vision/error.tsx",
  "components/life-alignment/life-vision/life-vision-journey.tsx",
  "components/life-alignment/life-vision/future-direction-landscape.tsx",
  "components/life-alignment/life-vision/life-vision-result-actions.tsx",
] as const;

const sharedLifeUiSourceKeys = new Set([
  "Back",
  "Breadcrumb",
  "Continue",
  "Desired direction",
  "interrupted",
  "Only on your initiative",
  "Reload journey",
  "Reversibility",
  "Short version for manual copying",
  "To the hub",
]);

function visionLifeUiEnglishStrings(): readonly string[] {
  const values: string[] = [];

  for (const relativePath of sourceFiles) {
    const sourceText = readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
    const sourceFile = createSourceFile(
      relativePath,
      sourceText,
      ScriptTarget.Latest,
      true,
      ScriptKind.TSX,
    );

    const visit = (node: Node): void => {
      if (
        isCallExpression(node)
        && isIdentifier(node.expression)
        && node.expression.text === "lifeUiValue"
      ) {
        const englishArgument = node.arguments[1];
        assert.ok(
          englishArgument
          && (isStringLiteral(englishArgument) || isNoSubstitutionTemplateLiteral(englishArgument)),
          `${relativePath} must pass a literal English source string to lifeUiValue`,
        );
        values.push(englishArgument.text);
      }
      forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return values;
}

const templateTokenPattern = /\{\{[^{}]+\}\}|\$\{[^{}]+\}|\{[^{}]+\}|%[sdif]/g;

function templateTokens(value: string): readonly string[] {
  return value.match(templateTokenPattern) ?? [];
}

test("Life Vision UI English sources have a complete explicit Vision-only registry", () => {
  const allSources = [...new Set(visionLifeUiEnglishStrings())].sort();
  const visionSources = allSources.filter((source) => !sharedLifeUiSourceKeys.has(source));
  const encounteredSharedSources = allSources.filter((source) => sharedLifeUiSourceKeys.has(source));

  assert.equal(visionSources.length, 99);
  assert.deepEqual(visionSources, [...LIFE_VISION_UI_SOURCE_KEYS].sort());
  assert.deepEqual(encounteredSharedSources, [...sharedLifeUiSourceKeys].sort());
  assert.doesNotThrow(assertLifeVisionUiVisionCopyCompleteness);
});

test("every added locale has full-depth non-English Vision UI copy", () => {
  assert.deepEqual(Object.keys(lifeVisionUiVisionCopy).sort(), ["el", "es", "pl", "ru", "tr"]);

  for (const [locale, copy] of Object.entries(lifeVisionUiVisionCopy)) {
    assert.deepEqual(Object.keys(copy).sort(), [...LIFE_VISION_UI_SOURCE_KEYS].sort());

    const values = LIFE_VISION_UI_SOURCE_KEYS.map((source) => copy[source]);
    assert.ok(values.every((value) => value.trim().length > 0));
    assert.deepEqual(
      LIFE_VISION_UI_SOURCE_KEYS.filter((source) => copy[source] === source),
      [],
      `${locale} must not fall back to an English source string`,
    );
    assert.ok(
      new Set(values).size >= 97,
      `${locale} must not collapse distinct Vision source strings into generic repeated copy`,
    );

    for (const source of LIFE_VISION_UI_SOURCE_KEYS) {
      assert.deepEqual(
        templateTokens(copy[source]),
        templateTokens(source),
        `${locale} must preserve the template tokens in: ${source}`,
      );
    }
  }

  assert.match(Object.values(lifeVisionUiVisionCopy.es).join(" "), /[áéíóúñ¿¡]/iu);
  assert.match(Object.values(lifeVisionUiVisionCopy.tr).join(" "), /[çğıİöşü]/u);
  assert.match(Object.values(lifeVisionUiVisionCopy.pl).join(" "), /[ąćęłńóśźż]/iu);
  assert.match(Object.values(lifeVisionUiVisionCopy.el).join(" "), /[Α-Ωα-ω]/u);
  assert.match(Object.values(lifeVisionUiVisionCopy.ru).join(" "), /[А-Яа-яЁё]/u);
});
