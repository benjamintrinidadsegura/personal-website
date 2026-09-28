import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { WritingDocument } from "../components/writing/writing-document";
import { isNativeShareCancellation, writingCarouselFileName, writingCarouselPreparationFailureCode } from "../components/writing/share/carousel-file-actions";
import { ShareCard } from "../components/writing/share/share-card";
import { WritingSocialPostCard } from "../components/writing/share/social-post-card";
import { writingShareDictionaries } from "../data/i18n/writing-share";
import { locales } from "../lib/i18n/config";
import { validateWritingDocument, writingDocumentToPlainText, writingDocumentToShareBlocks } from "../lib/writing/document";
import { classifyNativeShareFailure, hasKnownNativeMultiFileShareFailure, shareCardFiles, supportsNativeFileShare, type NativeMultiFileShareDiagnostic } from "../lib/sharing/native-card-share";
import { availableCarouselBodyHeight, carouselLayoutByFormat, carouselTypographyByComposition } from "../lib/writing/carousel-layout";
import { estimatedCarouselBlocksHeight, writingCarouselSegmentFits } from "../lib/writing/carousel-pagination";
import {
  MAX_WRITING_SHARE_CARDS,
  normalizeWritingThought,
  reconstructWritingThought,
  segmentWritingThought,
  writingCarouselIsComplete,
} from "../lib/writing/share-segmentation";
import { writingShareFormats, writingShareVariants, type WritingCarouselBlock, type WritingDocumentV1, type WritingShareBlock, type WritingShareComposition, type WritingShareSource } from "../types/writing";

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

function sentence(word: string, count: number): string {
  const words = Array.from({ length: count }, () => word);
  words[0] = `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`;
  return `${words.join(" ")}.`;
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
  const input = `${paragraph.repeat(5)}\n\n${paragraph.repeat(5)}`;
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
  const result = segmentWritingThought("A deliberately bounded authored thought. ".repeat(1800), "story", "editorial", "en");
  assert.equal(result.status, "tooLong");
  assert.deepEqual(result.segments, []);
  if (result.status === "tooLong") assert.ok((result.requiredSlides ?? 0) > MAX_WRITING_SHARE_CARDS);
});

test("medium and long text create only the adaptive slides each format requires", () => {
  const medium = sentence("measured", 70);
  const mediumResult = segmentWritingThought(medium, "square", "editorial", "en");
  assert.equal(mediumResult.status, "ready");
  if (mediumResult.status === "ready") assert.equal(mediumResult.segments.length, 2);

  const long = Array.from({ length: 18 }, (_, index) => sentence(`section${index}`, 24)).join("\n\n");
  const counts = writingShareFormats.map((format) => {
    const result = segmentWritingThought(long, format, "editorial", "en");
    assert.equal(result.status, "ready", format);
    return result.status === "ready" ? result.segments.length : 0;
  });
  assert.ok(counts[0] > 1);
  assert.ok(counts[2] > counts[0], `format counts: ${counts.join(",")}`);
  assert.ok(counts[2] >= counts[1]);
});

test("paragraphs and list items stay intact whenever they fit a slide", () => {
  const blocks: WritingShareBlock[] = [
    { kind: "paragraph", text: sentence("paragraph-one", 18) },
    { kind: "paragraph", text: sentence("paragraph-two", 18) },
    { kind: "listItem", text: sentence("list-item-alpha", 11) },
    { kind: "listItem", text: sentence("list-item-beta", 11) },
  ];
  const text = blocks.map(({ text: value }) => value).join("\n\n");
  const result = segmentWritingThought(text, "square", "editorial", "en", { blocks });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  for (const block of blocks) assert.equal(result.segments.some((segment) => segment.text.includes(block.text)), true, block.text.slice(0, 20));
  assert.equal(writingCarouselIsComplete(result.canonicalText, result.segments), true);
});

test("a heading moves forward to keep the beginning of its following paragraph", () => {
  const blocks: WritingShareBlock[] = [
    { kind: "paragraph", text: sentence("opening", 42) },
    { kind: "heading", text: "A necessary heading" },
    { kind: "paragraph", text: sentence("following", 24) },
  ];
  const result = segmentWritingThought(blocks.map(({ text }) => text).join("\n\n"), "square", "editorial", "en", { blocks });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  const headingSlide = result.segments.find(({ text }) => text.includes("A necessary heading"));
  assert.ok(headingSlide?.text.includes("following"));
});

test("long paragraphs fall back to sentences, then safe word boundaries without mid-word splits", () => {
  const input = `${sentence("sentencealpha", 30)} ${sentence("sentencebeta", 30)} ${sentence("sentencegamma", 30)}`;
  const result = segmentWritingThought(input, "square", "statement", "en");
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.ok(result.segments.length > 1);
  for (const segment of result.segments) {
    assert.doesNotMatch(segment.text, /^\p{L}+(?:alpha|beta|gamma)$/u);
    assert.equal(/\s$/u.test(segment.text), false);
  }
  assert.equal(reconstructWritingThought(result.segments), normalizeWritingThought(input));
});

test("bounded balancing avoids a tiny final sentence orphan", () => {
  const input = `${sentence("substantial", 30)} ${sentence("supporting", 15)} ${sentence("end", 7)}`;
  const result = segmentWritingThought(input, "square", "editorial", "en");
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.segments.length, 2);
  assert.ok(result.segments[1].text.length > 100, result.segments[1].text);
  assert.equal(reconstructWritingThought(result.segments), normalizeWritingThought(input));
});

test("content is never dropped, duplicated, or reordered", () => {
  const blocks = Array.from({ length: 14 }, (_, index): WritingShareBlock => ({ kind: index % 4 === 0 ? "quote" : "paragraph", text: `UNIQUE_${String(index).padStart(2, "0")} ${sentence("ordered", 20)}` }));
  const input = blocks.map(({ text }) => text).join("\n\n");
  const result = segmentWritingThought(input, "square", "socialPost", "en", { blocks });
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  const reconstructed = reconstructWritingThought(result.segments);
  assert.equal(reconstructed, normalizeWritingThought(input));
  for (let index = 0; index < blocks.length; index += 1) {
    assert.equal((reconstructed.match(new RegExp(`UNIQUE_${String(index).padStart(2, "0")}`, "gu")) ?? []).length, 1);
  }
  assert.deepEqual([...reconstructed.matchAll(/UNIQUE_(\d{2})/gu)].map((match) => Number(match[1])), Array.from({ length: blocks.length }, (_, index) => index));
});

test("article cards preserve semantic typography instead of turning body copy into display text", () => {
  const shareSource: WritingShareSource = {
    articleId: "article", articleSlug: "article", articleTitle: "A strong article title", authorName: "Benjamin Trinidad Segura",
    canonicalUrl: "https://bts.online/writing/article", domain: "bts.online", kind: "article", language: "en", text: "Section heading\n\nA calm paragraph.\n\nA list item.\n\nA quote.",
  };
  const blocks: WritingCarouselBlock[] = [
    { kind: "heading", separatorBefore: "", text: "Section heading" },
    { kind: "paragraph", separatorBefore: "\n\n", text: "A calm paragraph." },
    { kind: "listItem", separatorBefore: "\n\n", text: "A list item." },
    { kind: "quote", separatorBefore: "\n\n", text: "A quote." },
  ];
  const editorial = renderToStaticMarkup(createElement(ShareCard, { blocks, cardIndex: 1, cardTotal: 2, format: "square", source: shareSource, sourceLabel: "Writing", text: shareSource.text, variant: "editorial" }));
  const editorialFirst = renderToStaticMarkup(createElement(ShareCard, { blocks, cardIndex: 0, cardTotal: 2, format: "square", source: shareSource, sourceLabel: "Writing", text: shareSource.text, variant: "editorial" }));
  const social = renderToStaticMarkup(createElement(WritingSocialPostCard, { blocks, cardIndex: 1, cardTotal: 2, copy: writingShareDictionaries.en, format: "square", source: shareSource, text: shareSource.text }));
  for (const html of [editorial, social]) {
    assert.match(html, /<h2[^>]+article-heading/u);
    assert.match(html, /<p[^>]+article-(?:body|paragraph)/u);
    assert.match(html, /article-(?:list|listItem)/u);
    assert.match(html, /<blockquote/u);
  }
  assert.match(editorialFirst, /writing-share-card-article-title[^>]*>A strong article title/u);
  assert.match(editorialFirst, /writing-share-card-article-content/u);
  const css = source("../app/globals.css");
  assert.match(css, /writing-share-card-article-body \{[^}]*color: #bec9d3[^}]*font-weight: inherit/iu);
  assert.match(css, /writing-share-card-article-heading \{[^}]*color: white[^}]*font-weight: var\(--writing-carousel-heading-weight\)/iu);
  assert.match(css, /social-post-article-content \{[^}]*color: #bec9d3[^}]*font-weight: var\(--writing-carousel-body-weight\)/iu);
  assert.doesNotMatch(css, /writing-share-card-article-(?:body|list) \{[^}]*color:\s*(?:white|#fff(?:fff)?)/iu);
  assert.match(css, /:not\(\[data-continuation="true"\]\) \.writing-share-card-article-content \{ margin-top: var\(--writing-carousel-title-body-gap\)/u);
  assert.doesNotMatch(css, /data-scale="(?:short|medium)"[^}]*writing-share-card-article-body/iu);
  assert.ok(carouselTypographyByComposition.editorial.bodyWeight < carouselTypographyByComposition.editorial.headingWeight);
  assert.equal(carouselTypographyByComposition.editorial.bodyWeight, 520);
  assert.deepEqual(
    writingShareFormats.map((format) => carouselLayoutByFormat[format].titleBodyGap),
    [48, 44, 30],
  );
});

test("Story and Feed reserve a conservative body-bottom buffer while Square geometry stays unchanged", () => {
  assert.deepEqual(
    {
      bodyBottomSafety: carouselLayoutByFormat.square.bodyBottomSafety,
      bodyHeight: carouselLayoutByFormat.square.bodyHeight,
      titleBodyGap: carouselLayoutByFormat.square.titleBodyGap,
    },
    { bodyBottomSafety: 0, bodyHeight: 440, titleBodyGap: 30 },
  );

  for (const [format, expectedBuffer] of [["story", 120], ["portrait", 96]] as const) {
    const layout = carouselLayoutByFormat[format];
    const safeHeight = availableCarouselBodyHeight(format, 1, "en", "", true);
    assert.equal(layout.bodyBottomSafety, expectedBuffer);
    assert.equal(safeHeight, layout.bodyHeight - expectedBuffer);

    let boundaryBlock: WritingCarouselBlock | undefined;
    for (let wordCount = 1; wordCount <= 500; wordCount += 1) {
      const candidate: WritingCarouselBlock = { kind: "paragraph", separatorBefore: "", text: sentence("buffer", wordCount) };
      const estimated = estimatedCarouselBlocksHeight([candidate], format, "editorial", "en");
      if (estimated > safeHeight && estimated <= layout.bodyHeight) {
        boundaryBlock = candidate;
        break;
      }
    }
    assert.ok(boundaryBlock, `${format}: fixture occupies the former optimistic footer-adjacent zone`);
    if (!boundaryBlock) continue;
    assert.equal(
      writingCarouselSegmentFits([boundaryBlock], format, "editorial", "en", 1, { articleTitle: "Buffer fixture", blocks: [boundaryBlock], kind: "article" }),
      false,
      `${format}: the safety zone forces overflow onto another slide`,
    );
    const result = segmentWritingThought(boundaryBlock.text, format, "editorial", "en", { articleTitle: "Buffer fixture", blocks: [boundaryBlock], kind: "article" });
    assert.equal(result.status, "ready");
    if (result.status === "ready") assert.ok(result.segments.length > 1, `${format}: buffer may increase slide count`);
  }

  const css = source("../app/globals.css");
  assert.match(css, /writing-share-card\[data-content="article"\] \.writing-share-card-content \{ overflow: visible; \}/u);
  assert.match(css, /writing-share-card-article-content \{[^}]*overflow: visible/iu);
  assert.match(css, /social-post-card\[data-post-kind="article"\] \.social-post-body \{[^}]*overflow: visible/iu);
  assert.match(css, /social-post-article-content \{[^}]*overflow: visible/iu);
});

test("the final fit guard keeps every semantic slide inside the rendered body zone", () => {
  const blocks: WritingShareBlock[] = Array.from({ length: 16 }, (_, index) => ({
    kind: index % 5 === 1 ? "heading" : index % 5 === 4 ? "quote" : index % 5 === 3 ? "listItem" : "paragraph",
    text: `BLOCK_${index} ${sentence("readable", index % 5 === 1 ? 8 : 30)}`,
  }));
  const text = blocks.map(({ text: value }) => value).join("\n\n");
  const compositions: WritingShareComposition[] = [...writingShareVariants, "socialPost"];
  for (const format of writingShareFormats) {
    const layout = carouselLayoutByFormat[format];
    assert.ok(layout.height - (4 * layout.safeMargin) - layout.headerHeight - layout.footerHeight >= layout.bodyHeight, `${format}: body zone clears framed footer`);
    for (const composition of compositions) {
      const options = { articleTitle: "Why a truthful article needs a real fit contract", blocks, kind: "article" as const };
      const result = segmentWritingThought(text, format, composition, "en", options);
      assert.equal(result.status, "ready", `${format}/${composition}`);
      if (result.status !== "ready") continue;
      assert.ok(result.segments.length > 1, `${format}/${composition}: overflow creates another slide`);
      result.segments.forEach((segment, index) => {
        const height = estimatedCarouselBlocksHeight(segment.blocks, format, composition, "en");
        const available = availableCarouselBodyHeight(format, index, "en", options.articleTitle, true);
        assert.ok(height <= available, `${format}/${composition}/${index}: ${height} <= ${available}`);
        assert.equal(writingCarouselSegmentFits(segment.blocks, format, composition, "en", index, options), true, `${format}/${composition}/${index}`);
      });
    }
  }
});

test("a legitimate long article may exceed 30 slides while the 50-slide abuse guard remains bounded", () => {
  const blocks = Array.from({ length: 34 }, (_, index): WritingShareBlock => ({ kind: "paragraph", text: `BLOCK_${index} ${sentence("measured", 26)}` }));
  const text = blocks.map(({ text: value }) => value).join("\n\n");
  const result = segmentWritingThought(text, "square", "socialPost", "en", { articleTitle: "A normal long-form article", blocks, kind: "article" });
  assert.equal(MAX_WRITING_SHARE_CARDS, 50);
  assert.equal(result.status, "ready");
  if (result.status === "ready") assert.ok(result.segments.length > 30 && result.segments.length <= MAX_WRITING_SHARE_CARDS, String(result.segments.length));
  const absurd = segmentWritingThought("A deliberately bounded authored thought. ".repeat(1800), "square", "socialPost", "en", { kind: "article", articleTitle: "Bounded" });
  assert.equal(absurd.status, "tooLong");
  if (absurd.status === "tooLong") assert.ok((absurd.requiredSlides ?? 0) > MAX_WRITING_SHARE_CARDS);
});

test("the maximum slide boundary refuses honestly rather than truncating", () => {
  const input = Array.from({ length: 8 }, (_, index) => `BLOCK_${index} ${sentence("bounded", 25)}`).join("\n\n");
  const refused = segmentWritingThought(input, "square", "editorial", "en", { maxSlides: 2 });
  assert.equal(refused.status, "tooLong");
  if (refused.status === "tooLong") {
    assert.equal(refused.maxSlides, 2);
    assert.ok((refused.requiredSlides ?? 0) > 2);
  }
  const accepted = segmentWritingThought(input, "square", "editorial", "en", { maxSlides: 20 });
  assert.equal(accepted.status, "ready");
});

test("grapheme clusters survive pagination and an unsplittable oversized word is refused", () => {
  const family = "👨‍👩‍👧‍👦";
  const input = Array.from({ length: 180 }, () => `${family} together`).join(" ");
  const result = segmentWritingThought(input, "square", "statement", "en");
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.equal(reconstructWritingThought(result.segments), input);
    assert.equal(result.segments.some(({ text }) => text.includes("�")), false);
  }
  const oversized = segmentWritingThought("x".repeat(600), "square", "statement", "en");
  assert.equal(oversized.status, "tooLong");
  if (oversized.status === "tooLong") assert.equal(oversized.requiredSlides, null);
});

test("structured Writing extraction preserves safe semantic order", () => {
  const blocks = writingDocumentToShareBlocks(editorialDocument);
  assert.deepEqual(blocks.map(({ kind }) => kind), ["paragraph", "paragraph", "quote", "paragraph"]);
  assert.equal(blocks.map(({ text }) => text).join("\n\n"), writingDocumentToPlainText(editorialDocument));
});

test("carousel filenames and native multi-file feature detection are deterministic", () => {
  assert.equal(writingCarouselFileName("bts-writing-article", 0, 6), "bts-writing-article-01-of-06");
  assert.equal(writingCarouselFileName("bts-writing-article", 5, 6), "bts-writing-article-06-of-06");
  assert.equal(writingCarouselFileName("bts-writing-thought", 0, 1), "bts-writing-thought");
  const twoFiles = [{ name: "one.png" }, { name: "two.png" }] as File[];
  assert.equal(supportsNativeFileShare({ share: async () => undefined, canShare: (data) => data?.files?.length === 2 }, twoFiles), true);
  assert.equal(supportsNativeFileShare({ share: async () => undefined, canShare: () => false }, twoFiles), false);
  assert.equal(supportsNativeFileShare({ canShare: () => true }, twoFiles), false);
});

test("native carousel sharing prefers files-only when adding the canonical URL is unsupported", async () => {
  const files = [new File(["one"], "01.png", { type: "image/png" }), new File(["two"], "02.png", { type: "image/png" })];
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let payload: ShareData | undefined;
  try {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
      canShare: (candidate: ShareData) => !("url" in candidate),
      share: async (candidate: ShareData) => { payload = candidate; },
    } });
    await shareCardFiles(files, { url: "https://bts.online/writing/article" });
    assert.deepEqual(payload?.files, files);
    assert.equal(payload?.url, undefined);
    assert.equal(payload?.title, undefined);
    assert.equal(payload?.text, undefined);
    assert.equal(payload && "caption" in payload, false);

    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
      canShare: (candidate: ShareData) => candidate.files?.length === 2 && candidate.files[0] === files[0] && candidate.files[1] === files[1],
      share: async (candidate: ShareData) => { payload = candidate; },
    } });
    await shareCardFiles(files, { url: "https://bts.online/writing/article" });
    assert.deepEqual(payload?.files, files);
    assert.equal(payload?.url, "https://bts.online/writing/article");
    assert.equal(payload?.title, undefined);
    assert.equal(payload?.text, undefined);
    assert.equal(payload && "caption" in payload, false);
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});

test("native share error taxonomy keeps cancellation silent and known capability failures recoverable", () => {
  assert.equal(isNativeShareCancellation(new DOMException("Canceled", "AbortError")), true);
  assert.equal(isNativeShareCancellation(new Error("Unexpected")), false);
  for (const name of ["NotAllowedError", "SecurityError", "DataError", "NotSupportedError", "InvalidStateError"]) {
    assert.equal(classifyNativeShareFailure(new DOMException(`${name} message`, name)), "unsupported", name);
  }
  assert.equal(classifyNativeShareFailure(new TypeError("Share failed")), "unsupported");
  assert.equal(classifyNativeShareFailure(new Error("Unexpected")), "unexpected");
});

test("AbortError from navigator.share remains a silent user cancellation", async () => {
  const files = [new File(["one"], "01.png", { type: "image/png" }), new File(["two"], "02.png", { type: "image/png" })];
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const cancellation = new DOMException("The user canceled the share", "AbortError");
  try {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
      canShare: () => true,
      share: async () => { throw cancellation; },
    } });
    const result = await shareCardFiles(files, {}).then(() => null, (error: unknown) => error);
    assert.equal(result, cancellation);
    assert.equal(isNativeShareCancellation(result), true);
    assert.equal(hasKnownNativeMultiFileShareFailure(navigator), false);
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});

test("a known native multi-file capability failure suppresses the broken action for the page session", async () => {
  const files = [new File(["one"], "01.png", { type: "image/png" }), new File(["two"], "02.png", { type: "image/png" })];
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let shareCalls = 0;
  try {
    const target = {
      canShare: () => true,
      share: async () => { shareCalls += 1; throw new DOMException("Permission denied by desktop share target", "NotAllowedError"); },
    };
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: target });
    await assert.rejects(shareCardFiles(files, {}), { name: "NotAllowedError" });
    assert.equal(hasKnownNativeMultiFileShareFailure(target), true);
    assert.equal(supportsNativeFileShare(target, files), false);
    await assert.rejects(shareCardFiles(files, {}), { name: "NativeFileShareUnsupportedError" });
    assert.equal(shareCalls, 1, "the known-broken native share action is not invoked twice");
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});

test("DEV native-share diagnostics contain capability metadata and the exact sanitized runtime error", async () => {
  const files = [new File(["one"], "01.png", { type: "image/png" }), new File(["two"], "02.png", { type: "image/png" })];
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const originalNodeEnv = process.env.NODE_ENV;
  const originalConsoleInfo = console.info;
  let captured: NativeMultiFileShareDiagnostic | undefined;
  try {
    Object.defineProperty(process.env, "NODE_ENV", { configurable: true, enumerable: true, value: "development", writable: true });
    console.info = (_label: unknown, diagnostic: NativeMultiFileShareDiagnostic) => { captured = diagnostic; };
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
      canShare: (candidate: ShareData) => !("url" in candidate),
      share: async () => { throw new DOMException("Permission denied by desktop share target", "SecurityError"); },
    } });
    await assert.rejects(shareCardFiles(files, { url: "https://bts.online/writing/article" }), { name: "SecurityError" });
    assert.deepEqual(captured, {
      canShareFiles: true,
      canShareFilesWithUrl: false,
      canSharePresent: true,
      errorMessage: "Permission denied by desktop share target",
      errorName: "SecurityError",
      failureStage: "inside_navigator_share",
      fileCount: 2,
      mimeTypes: ["image/png"],
      navigatorShareInvoked: true,
      navigatorSharePresent: true,
      totalBytes: 6,
      urlInclusionChangesSupport: true,
    });
  } finally {
    if (originalNodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.defineProperty(process.env, "NODE_ENV", { configurable: true, enumerable: true, value: originalNodeEnv, writable: true });
    console.info = originalConsoleInfo;
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});

test("only genuinely unexpected navigator.share failures stay technical", async () => {
  const files = [new File(["one"], "01.png", { type: "image/png" }), new File(["two"], "02.png", { type: "image/png" })];
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const unexpectedShareFailure = new Error("Desktop broker crashed unexpectedly");
  try {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
      canShare: () => true,
      share: async () => { throw unexpectedShareFailure; },
    } });
    const rejectedByShare = await shareCardFiles(files, {}).then(() => null, (error: unknown) => error);
    assert.equal(rejectedByShare, unexpectedShareFailure);
    assert.equal(classifyNativeShareFailure(rejectedByShare), "unexpected");
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});

test("carousel preparation failures expose only a specific sanitized diagnostic class", () => {
  assert.equal(writingCarouselPreparationFailureCode(new Error("Writing carousel slide is unavailable.")), "slide_unavailable");
  assert.equal(writingCarouselPreparationFailureCode(new Error("Share card fonts timed out before capture.")), "font_timeout");
  assert.equal(writingCarouselPreparationFailureCode(new Error("Share card image failed to load.")), "image_failure");
  assert.equal(writingCarouselPreparationFailureCode(new Error("Share card layout timed out before capture.")), "layout_timeout");
  assert.equal(writingCarouselPreparationFailureCode(new Error("Canvas is unavailable.")), "canvas_unavailable");
  assert.equal(writingCarouselPreparationFailureCode(new Error("Share card could not be encoded as a PNG blob.")), "encode_failure");
  assert.equal(writingCarouselPreparationFailureCode(new Error("Sensitive implementation detail")), "unknown");

  const fileActions = source("../components/writing/share/carousel-file-actions.tsx");
  const composer = source("../components/writing/share/share-composer.tsx");
  assert.match(fileActions, /failure === "renderFailed"[\s\S]*PNG preparation failed[\s\S]*writingCarouselPreparationFailureCode\(error\)/u);
  assert.doesNotMatch(fileActions, /error\.stack|String\(error\)|console\.(?:error|warn)\([^\n]*,\s*error\s*\)/u);
  assert.match(fileActions, /feedback === "renderFailed" \? total > 1 \? copy\.carouselPreparationFailed/u);
  assert.match(fileActions, /classifyNativeShareFailure\(error\) === "unsupported"[\s\S]*setCarouselShareCapability\("unsupported"\)/u);
  assert.match(fileActions, /!isNativeShareCancellation\(error\)\) setFeedback\(failure\)/u);
  assert.match(fileActions, /carouselShareCapability === "unsupported"[\s\S]*copy\.saveAllImages/u);
  assert.match(composer, /source\.canonicalUrl \? <button[^>]*>[\s\S]*copy\.copyLink/u);
  assert.equal(writingShareDictionaries.de.carouselShareUnavailable, "Mehrere Bilder können in diesem Browser nicht direkt geteilt werden. Speichere das Karussell und öffne es anschließend in deiner gewünschten App.");
  assert.equal(writingShareDictionaries.de.saveAllImages, "Alle Bilder speichern");
  assert.equal(writingShareDictionaries.de.copyLink, "Link kopieren");
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
  const fileActions = source("../components/writing/share/carousel-file-actions.tsx");
  const nativeShare = source("../lib/sharing/native-card-share.ts");
  assert.equal(trigger.includes("dynamic(() => import"), true);
  assert.equal(trigger.includes("ssr: false"), true);
  for (const behavior of ["showModal()", "onCancel", "aria-pressed", "navigator.clipboard.writeText", "Screenshot", "WritingCarouselFileActions", "ArrowLeft", "slideProgress"]) assert.equal(composer.includes(behavior), true, behavior);
  for (const behavior of ["supportsNativeFileShare", "downloadShareCardFile", "copyShareCardFile", "shareCardFiles", "renderAll", "classifyNativeShareFailure"]) assert.equal(fileActions.includes(behavior), true, behavior);
  assert.match(fileActions, /const files = await renderAll\(\);[\s\S]*supportsNativeFileShare\(navigator, files\)/u, "real generated PNG files gate native carousel sharing");
  assert.match(fileActions, /carouselShareCapability === "supported"[\s\S]*copy\.shareCarousel/u);
  assert.match(fileActions, /carouselShareCapability === "unsupported"[\s\S]*copy\.saveAllImages/u);
  assert.match(fileActions, /if \(!supportsNativeFileShare\(navigator, files\)\) \{[\s\S]*setCarouselShareCapability\("unsupported"\);[\s\S]*return;/u);
  assert.match(fileActions, /isNativeShareCancellation\(error\)/u);
  assert.match(fileActions, /files\.forEach\(\(file, index\) => window\.setTimeout\(\(\) => downloadShareCardFile\(file\), index \* 140\)\)/u);
  assert.equal(nativeShare.includes("navigator.share({ files: [file]"), true, "native file share");
  assert.equal(nativeShare.includes("const filesOnly: ShareData = { files: [...files] }"), true, "native carousel share");
  assert.doesNotMatch(nativeShare, /shareCardFiles[\s\S]*?title: input\.title|shareCardFiles[\s\S]*?text:/u, "carousel share stays files-first");
  assert.equal(page.includes("getPublishedWritingBySlug"), true);
  assert.equal(page.includes("writingDocumentToShareBlocks"), true);
  assert.equal(page.includes("articleShareBlocks.map(({ text }) => text).join"), true);
  assert.equal(queries.includes('.eq("status", "published")'), true);
  assert.equal(existsSync(new URL("../app/api/writing/share/route.ts", import.meta.url)), false);
  assert.equal(composer.includes("dangerouslySetInnerHTML"), false);
  assert.equal(composer.includes("fetch("), false);
  assert.equal(fileActions.includes("useEffect"), false, "PNG generation is action-driven, not preview-driven");
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
