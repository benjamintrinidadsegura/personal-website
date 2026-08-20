import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createSourceFile,
  forEachChild,
  isCallExpression,
  isNoSubstitutionTemplateLiteral,
  isStringLiteral,
  ScriptKind,
  ScriptTarget,
  type Node,
} from "typescript";

import {
  assertLifeAlignmentUiSelfCopyCompleteness,
  lifeAlignmentUiSelfCopy,
  lifeAlignmentUiSelfSourceStrings,
} from "../data/i18n/life-alignment-ui-self-copy";

const sourceFiles = [
  "components/life-alignment/life-alignment-hub.tsx",
  "components/life-alignment/life-alignment-context.tsx",
  "components/life-alignment/life-alignment-journey.tsx",
  "components/life-alignment/alignment-landscape.tsx",
  "components/life-alignment/life-alignment-result-actions.tsx",
  "components/life-alignment/self-depth/self-depth-sections.tsx",
  "app/life-alignment/page.tsx",
  "app/life-alignment/error.tsx",
  "app/life-alignment/self/page.tsx",
  "app/life-alignment/self/error.tsx",
  "lib/life-alignment.ts",
  "lib/life-alignment-export.ts",
] as const;

function lifeUiEnglishStrings(): readonly string[] {
  const values: string[] = [];

  for (const relativePath of sourceFiles) {
    const url = new URL(`../${relativePath}`, import.meta.url);
    const sourceText = readFileSync(url, "utf8");
    const sourceFile = createSourceFile(
      relativePath,
      sourceText,
      ScriptTarget.Latest,
      true,
      ScriptKind.TSX,
    );

    const collectStrings = (node: Node): void => {
      if (isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) {
        values.push(node.text);
        return;
      }
      forEachChild(node, collectStrings);
    };

    const visit = (node: Node): void => {
      if (isCallExpression(node)) {
        const callee = node.expression.getText(sourceFile);
        const englishArgument = callee === "lifeUiValue"
          ? node.arguments[1]
          : relativePath === "lib/life-alignment.ts" && callee === "message"
            ? node.arguments[0]
            : undefined;
        if (englishArgument) collectStrings(englishArgument);
      }
      forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return values;
}

test("Self, hub, validator and export English sources have a complete explicit registry", () => {
  const uses = lifeUiEnglishStrings();
  const uniqueSources = [...new Set(uses)].sort();

  assert.equal(uses.length, 176);
  assert.equal(uniqueSources.length, 161);
  assert.deepEqual([...lifeAlignmentUiSelfSourceStrings].sort(), uniqueSources);
  assert.doesNotThrow(assertLifeAlignmentUiSelfCopyCompleteness);
});

test("every added locale has natural non-baseline copy for every Self UI source", () => {
  for (const [locale, copy] of Object.entries(lifeAlignmentUiSelfCopy)) {
    assert.deepEqual(Object.keys(copy).sort(), [...lifeAlignmentUiSelfSourceStrings].sort());

    const values = lifeAlignmentUiSelfSourceStrings.map((source) => copy[source]);
    assert.ok(values.every((value) => value.trim().length > 0));
    const unchanged = lifeAlignmentUiSelfSourceStrings.filter((source) => copy[source] === source);
    assert.deepEqual(
      unchanged,
      locale === "es" ? ["Reversible"] : [],
      `${locale} must not fall back to an English source string`,
    );
    assert.ok(
      new Set(values).size >= 159,
      `${locale} must not collapse distinct source strings into generic repeated copy`,
    );
  }

  assert.match(Object.values(lifeAlignmentUiSelfCopy.es).join(" "), /[áéíóúñ¿¡]/iu);
  assert.match(Object.values(lifeAlignmentUiSelfCopy.tr).join(" "), /[çğıİöşü]/u);
  assert.match(Object.values(lifeAlignmentUiSelfCopy.pl).join(" "), /[ąćęłńóśźż]/iu);
  assert.match(Object.values(lifeAlignmentUiSelfCopy.el).join(" "), /[Α-Ωα-ω]/u);
  assert.match(Object.values(lifeAlignmentUiSelfCopy.ru).join(" "), /[А-Яа-яЁё]/u);
});
