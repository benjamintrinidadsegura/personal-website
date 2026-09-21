import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { WritingDocument } from "../components/writing/writing-document";
import { writingShareDictionaries } from "../data/i18n/writing-share";
import { locales } from "../lib/i18n/config";
import { validateWritingDocument, writingDocumentToPlainText } from "../lib/writing/document";
import {
  MAX_WRITING_SHARE_CARDS,
  normalizeWritingThought,
  reconstructWritingThought,
  segmentWritingThought,
} from "../lib/writing/share-segmentation";
import { writingShareFormats, writingShareVariants, type WritingDocumentV1 } from "../types/writing";

const editorialDocument: WritingDocumentV1 = {
  version: 1,
  blocks: [
    { id: "opening_a1", type: "paragraph", content: [{ type: "text", text: "A calm opening thought that is long enough to remain meaningful." }] },
    { id: "key_a2", type: "keyThought", content: [{ type: "text", text: "The work becomes more honest when the words stay in charge." }] },
    { id: "pull_a3", type: "pullQuote", content: [{ type: "text", text: "A pull quote should interrupt the rhythm without replacing the article." }] },
    { id: "share_a4", type: "shareable", content: [{ type: "text", text: "A recommended thought can remain an ordinary paragraph inside Writing." }] },
  ],
};

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("editorial blocks are backward-compatible, strictly validated, and retain canonical text", () => {
  const validated = validateWritingDocument(editorialDocument);
  assert.equal(validated.success, true);
  if (validated.success) assert.equal(validated.plainText, writingDocumentToPlainText(editorialDocument));
  assert.equal(validateWritingDocument({ version: 1, blocks: [{ id: "bad id", type: "keyThought", content: [] }] }).success, false);
  assert.equal(validateWritingDocument({ version: 1, blocks: [{ type: "paragraph", content: [{ type: "text", text: "Historical content remains valid." }] }] }).success, true);
});

test("editorial renderer produces distinct semantic treatments without unsafe HTML", () => {
  const html = renderToStaticMarkup(createElement(WritingDocument, { document: editorialDocument }));
  assert.match(html, /writing-key-thought/u);
  assert.match(html, /writing-pull-quote/u);
  assert.match(html, /<blockquote/u);
  assert.match(html, /writing-shareable-thought/u);
  assert.doesNotMatch(html, /dangerouslySetInnerHTML/u);
});

test("all three formats and variants produce a valid immediate preview for short text", () => {
  for (const format of writingShareFormats) {
    for (const variant of writingShareVariants) {
      const result = segmentWritingThought("A precise thought worth carrying forward.", format, variant, "en");
      assert.equal(result.status, "ready", `${format}/${variant}`);
      if (result.status === "ready") assert.equal(result.segments.length, 1);
    }
  }
});

test("segmentation prefers sentence and paragraph boundaries and reconstructs canonical text exactly", () => {
  const paragraph = "Build slowly enough to notice what matters. Keep the words intact, even when the format changes. ";
  const input = `${paragraph.repeat(3)}\n\n${paragraph.repeat(3)}`;
  const result = segmentWritingThought(input, "portrait", "editorial", "en");
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.ok(result.segments.length > 1);
  assert.ok(result.segments.length <= MAX_WRITING_SHARE_CARDS);
  assert.equal(reconstructWritingThought(result.segments), normalizeWritingThought(input));
  assert.equal(result.segments.slice(0, -1).every(({ text }) => /[.!?]$/u.test(text)), true);
});

test("segmentation is Unicode-safe across BTS source languages, emoji, compounds, and URLs", () => {
  const values = [
    ["de", "Donaudampfschifffahrtsgesellschaft und Verantwortung."],
    ["tr", "İnsan değişirken düşüncesini kaybetmemeli."],
    ["pl", "Zażółć gęślą jaźń — myśl pozostaje cała."],
    ["el", "Η σκέψη παραμένει ακέραιη και καθαρή."],
    ["ru", "Мысль остаётся целой и читаемой."],
    ["en", "A family 👨‍👩‍👧‍👦 and a link https://bts.online/writing/context stay intact."],
  ] as const;
  for (const [locale, value] of values) {
    const result = segmentWritingThought(value.repeat(5), "square", "marginNote", locale);
    assert.equal(result.status, "ready", locale);
    if (result.status === "ready") assert.equal(reconstructWritingThought(result.segments), normalizeWritingThought(value.repeat(5)));
  }
});

test("overly long thoughts refuse instead of shrinking into unlimited cards", () => {
  const result = segmentWritingThought("A deliberately bounded authored thought. ".repeat(400), "story", "editorial", "en");
  assert.equal(result.status, "tooLong");
  assert.deepEqual(result.segments, []);
});

test("all seven UI locales expose the identical share-control contract", () => {
  const expected = Object.keys(writingShareDictionaries.en).sort();
  assert.deepEqual(Object.keys(writingShareDictionaries).sort(), [...locales].sort());
  for (const locale of locales) {
    const dictionary = writingShareDictionaries[locale];
    assert.deepEqual(Object.keys(dictionary).sort(), expected, locale);
    assert.deepEqual(Object.keys(dictionary.formats).sort(), [...writingShareFormats].sort(), `${locale}/formats`);
    assert.deepEqual(Object.keys(dictionary.variants).sort(), [...writingShareVariants].sort(), `${locale}/variants`);
    assert.equal(Object.values(dictionary).some((value) => typeof value === "string" && value.trim() === ""), false, locale);
  }
});

test("composer is lazy, keyboard-addressable, progressive, and does not add a rendering endpoint", () => {
  const trigger = source("../components/writing/share/share-thought-trigger.tsx");
  const composer = source("../components/writing/share/share-composer.tsx");
  const page = source("../app/writing/[slug]/page.tsx");
  const queries = source("../lib/writing/queries.ts");
  const fileActions = source("../components/sharing/share-file-actions.tsx");
  const nativeShare = source("../lib/sharing/native-card-share.ts");
  assert.equal(trigger.includes("dynamic(() => import"), true);
  assert.equal(trigger.includes("ssr: false"), true);
  for (const behavior of ["showModal()", "onCancel", "aria-pressed", "navigator.clipboard.writeText", "Screenshot", "ShareFileActions"]) assert.equal(composer.includes(behavior), true, behavior);
  for (const behavior of ["supportsNativeFileShare", "downloadShareCardFile", "copyShareCardFile", "AbortError"]) assert.equal(fileActions.includes(behavior), true, behavior);
  assert.equal(nativeShare.includes("navigator.share({ files: [file]"), true, "native file share");
  assert.equal(page.includes("getPublishedWritingBySlug"), true);
  assert.equal(queries.includes('.eq("status", "published")'), true);
  assert.equal(existsSync(new URL("../app/api/writing/share/route.ts", import.meta.url)), false);
  assert.equal(composer.includes("dangerouslySetInnerHTML"), false);
  assert.equal(composer.includes("fetch("), false);
});

test("editor integration persists curated markers in body_json without a migration or new dependency", () => {
  const editor = source("../components/admin/writing-editor.tsx");
  const adapter = source("../lib/writing/blocknote-adapter.ts");
  const packageJson = JSON.parse(source("../package.json"));
  for (const marker of ["keyThought", "pullQuote", "shareable"]) {
    assert.equal(editor.includes(marker), true, marker);
    assert.equal(adapter.includes(marker), true, marker);
  }
  assert.equal(existsSync(new URL("../supabase/migrations/20260919000000_writing_social_share.sql", import.meta.url)), false);
  assert.equal(packageJson.dependencies["html-to-image"], undefined);
  assert.equal(packageJson.dependencies["dom-to-image"], undefined);
  assert.equal(packageJson.dependencies["html2canvas"], undefined);
});
