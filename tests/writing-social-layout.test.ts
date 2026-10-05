import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { WritingSocialPostCard } from "../components/writing/share/social-post-card";
import { writingShareDictionaries } from "../data/i18n/writing-share";
import { carouselExportLength, carouselLayoutByFormat, writingSocialPostLayout } from "../lib/writing/carousel-layout";
import { estimatedCarouselBlocksHeight, writingCarouselSegmentFits } from "../lib/writing/carousel-pagination";
import { writingDocumentToShareBlocks } from "../lib/writing/document";
import { normalizeWritingThought, reconstructWritingThought, segmentWritingThought } from "../lib/writing/share-segmentation";
import { writingShareFormats, type WritingDocumentV1, type WritingShareSource } from "../types/writing";

// Public, authored document captured from /writing/versteh-mich-richtig on 2026-10-05.
// Includes the real long paragraphs, line breaks and all intentional highlight blocks.
const document = JSON.parse(readFileSync(new URL("./fixtures/writing-share/versteh-mich-richtig.json", import.meta.url), "utf8")) as WritingDocumentV1;
const blocks = writingDocumentToShareBlocks(document);
const text = blocks.map((block) => block.text).join("\n\n");
const source: WritingShareSource = {
  articleId: "real-layout-regression", articleSlug: "versteh-mich-richtig", articleTitle: "Versteh mich richtig",
  authorName: "Benjamin Trinidad Segura", canonicalUrl: "https://btshq.online/writing/versteh-mich-richtig",
  domain: "btshq.online", kind: "article", language: "de", readingMinutes: 4, blocks, text,
};

test("Social Post regions partition the actual card and continuation cards reclaim the entire title region", () => {
  for (const format of writingShareFormats) {
    const layout = carouselLayoutByFormat[format];
    const first = writingSocialPostLayout(format, 0, "de", source.articleTitle, true);
    const continuation = writingSocialPostLayout(format, 1, "de", source.articleTitle, true);
    assert.equal(continuation.titleHeight, 0);
    assert.equal(continuation.bodyTop, layout.safeMargin * 2 + layout.headerHeight + continuation.gap);
    assert.ok(Math.abs(first.bodyTop - continuation.bodyTop - first.titleHeight - first.gap) < 0.001);
    for (const region of [first, continuation]) {
      assert.equal(region.bodyTop + region.contentHeight + region.gap, region.footerTop);
      assert.equal(region.footerTop + layout.footerHeight + region.inset, layout.height);
      assert.equal(region.bodyHeight, region.contentHeight);
      assert.equal(region.gap, 24);
    }
    assert.equal(writingSocialPostLayout(format, 0, "de", "", true).titleHeight, 0);
    const thought = writingSocialPostLayout(format, 0, "de", source.articleTitle, false);
    assert.equal(thought.bodyHeight + thought.referenceHeight, thought.contentHeight);
    const withoutReference = writingSocialPostLayout(format, 0, "de", "", false);
    assert.equal(withoutReference.referenceHeight, 0);
    assert.equal(withoutReference.bodyHeight, withoutReference.contentHeight);
  }
});

test("the actual production article has fuller deterministic Social Post pages without losing semantics or authored breaks", () => {
  const maximumCounts = { story: 6, portrait: 9, square: 12 };
  assert.ok(blocks.some((block) => block.text.length > 200), "real long paragraph fixture");
  assert.ok(blocks.some((block) => block.text.includes("\n")), "authored multiline fixture");
  for (const format of writingShareFormats) {
    const result = segmentWritingThought(text, format, "socialPost", "de", source);
    assert.equal(result.status, "ready");
    if (result.status !== "ready") continue;
    assert.deepEqual(segmentWritingThought(text, format, "socialPost", "de", source), result);
    assert.equal(reconstructWritingThought(result.segments), normalizeWritingThought(text));
    assert.ok(result.segments.length > 1 && result.segments.length <= maximumCounts[format]);
    for (const type of ["keyThought", "pullQuote", "shareable"] as const) {
      assert.deepEqual(result.segments.flatMap((segment) => segment.blocks).filter((block) => block.editorialType === type).map((block) => block.text), blocks.filter((block) => block.editorialType === type).map((block) => block.text));
    }
    result.segments.forEach((segment, index) => {
      const region = writingSocialPostLayout(format, index, "de", source.articleTitle, true);
      const height = estimatedCarouselBlocksHeight(segment.blocks, format, "socialPost", "de");
      assert.ok(height <= region.bodyHeight);
      assert.equal(writingCarouselSegmentFits(segment.blocks, format, "socialPost", "de", index, source), true);
      // Authored atomic highlights can leave a little room; full non-final cards
      // must still consume most of their content budget rather than be balanced down.
      if (index < result.segments.length - 1) assert.ok(height / region.bodyHeight > 0.7, `${format}/${index}: density ${height / region.bodyHeight}`);
      const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { blocks: segment.blocks, cardIndex: index, cardTotal: result.segments.length, copy: writingShareDictionaries.de, format, source, text: segment.text }));
      assert.equal(html.includes('data-zone="title"'), index === 0);
      assert.ok(html.includes(`--social-post-body-zone-max-height:${carouselExportLength(region.bodyHeight)}`));
      assert.ok(html.includes(`--writing-social-title-height:${carouselExportLength(region.titleHeight)}`));
      assert.ok(html.includes(`--writing-carousel-title-body-gap:${carouselExportLength(region.gap)}`));
    });
  }
});

test("ordinary real paragraphs may continue at sentence boundaries and reconstruct exactly", () => {
  const paragraph = blocks.filter((block) => block.kind === "paragraph" && !block.editorialType).sort((a, b) => b.text.length - a.text.length)[0];
  const authored = { ...source, blocks: [paragraph], text: paragraph.text };
  for (const format of writingShareFormats) {
    // Repeat the same real authored paragraph to exercise filled continuation pages.
    const longText = Array.from({ length: 14 }, () => paragraph.text).join(" ");
    const long = { ...authored, blocks: [{ ...paragraph, text: longText }], text: longText };
    const result = segmentWritingThought(long.text, format, "socialPost", "de", long);
    assert.equal(result.status, "ready");
    if (result.status !== "ready") continue;
    assert.equal(reconstructWritingThought(result.segments), long.text);
    assert.ok(result.segments.length > 1);
    assert.ok(result.segments.some((segment) => segment.blocks.some((block) => block.continuation)), `${format}: sentences use the preceding page's space`);
  }
});

test("the lazy Writing composer owns a scoped stylesheet with explicit rows, top alignment and a protected footer", () => {
  const composer = readFileSync(new URL("../components/writing/share/share-composer.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../components/writing/share/social-post-card.css", import.meta.url), "utf8");
  assert.ok(composer.includes('import "./social-post-card.css"'));
  assert.match(css, /grid-template-areas: "identity" "body" "footer"/u);
  assert.match(css, /grid-template-areas: "identity" "title" "body" "footer"/u);
  assert.match(css, /grid-template-rows: var\(--social-post-header-zone-min-height\) var\(--writing-social-title-height\) minmax\(0,1fr\) var\(--social-post-footer-zone-min-height\)/u);
  assert.match(css, /\.social-post-body \{[^}]*justify-content: flex-start[^}]*margin: 0[^}]*height: 100%/u);
  assert.doesNotMatch(css, /align-self: center|justify-content: center/u);
  assert.match(css, /\.social-post-progress \{[^}]*white-space: nowrap/u);
  assert.ok(css.includes('.social-post-card[data-writing-card="true"][data-style="social-post"]'));
});

test("a title which consumes the whole Social Post content region refuses safely instead of throwing", () => {
  for (const format of writingShareFormats) {
    const result = segmentWritingThought("The authored body remains intact.", format, "socialPost", "de", { kind: "article", articleTitle: "Kontext ".repeat(180) });
    assert.equal(result.status, "tooLong");
    assert.equal(result.canonicalText, "The authored body remains intact.");
    assert.deepEqual(result.segments, []);
  }
});
