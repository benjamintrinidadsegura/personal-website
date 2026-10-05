import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { WritingSocialPostCard } from "../components/writing/share/social-post-card";
import { writingShareDictionaries } from "../data/i18n/writing-share";
import { carouselExportLength, carouselLayoutByFormat, estimatedBlockLineCount, writingSocialPostLayout, writingSocialPostReadabilityByFormat } from "../lib/writing/carousel-layout";
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

test("the actual production article respects format reading budgets without losing semantics or authored breaks", () => {
  const maximumCounts = { story: 18, portrait: 20, square: 12 };
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
      const reading = region.readability;
      if (reading) {
        assert.ok(height <= reading.maxBodyHeight);
        assert.ok(segment.text.split(/\s+/u).length <= reading.maxWords);
        assert.ok(segment.blocks.length <= reading.maxBlocks);
        const highlights = segment.blocks.filter((block) => block.editorialType);
        assert.ok(highlights.length <= 1);
        if (highlights.length) {
          const ordinary = segment.blocks.filter((block) => !block.editorialType && block.kind !== "heading");
          assert.ok(ordinary.reduce((lines, block) => lines + estimatedBlockLineCount(block.text, block.kind, format, "socialPost", "de", block), 0) <= reading.highlightBodyMaxLines);
          const highlightIndex = segment.blocks.findIndex((block) => block.editorialType);
          assert.ok(highlightIndex === 0 || highlightIndex === segment.blocks.length - 1, "ordinary context stays on one side of the highlight");
        }
      } else if (index < result.segments.length - 1) {
        assert.ok(height / region.bodyHeight > 0.7, `${format}/${index}: accepted Square density`);
      }
      const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { blocks: segment.blocks, cardIndex: index, cardTotal: result.segments.length, copy: writingShareDictionaries.de, format, source, text: segment.text }));
      assert.equal(html.includes('data-zone="title"'), index === 0);
      assert.ok(html.includes(`--social-post-body-zone-max-height:${carouselExportLength(region.bodyHeight)}`));
      assert.ok(html.includes(`--writing-social-title-height:${carouselExportLength(region.titleHeight)}`));
      assert.ok(html.includes(`--writing-carousel-title-body-gap:${carouselExportLength(region.gap)}`));
    });
    if (format !== "square") assert.deepEqual(result.segments.flatMap((segment) => segment.blocks).map((block) => block.text), blocks.map((block) => block.text), "real authored paragraphs remain whole");
    else assert.equal(result.segments.length, 12);
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

test("Story and Feed use explicit reading profiles while physical regions and Square stay unchanged", () => {
  assert.deepEqual(writingSocialPostReadabilityByFormat.story, { maxBodyHeight: 1050, blockGap: 38, highlightGap: 56, maxWords: 90, maxBlocks: 8, paragraphMaxLines: 6, highlightBodyMaxLines: 6, preferredHighlightBodyBlocks: 1 });
  assert.deepEqual(writingSocialPostReadabilityByFormat.portrait, { maxBodyHeight: 800, blockGap: 30, highlightGap: 44, maxWords: 80, maxBlocks: 7, paragraphMaxLines: 7, highlightBodyMaxLines: 5, preferredHighlightBodyBlocks: 1 });
  assert.equal(writingSocialPostReadabilityByFormat.square, null);
  for (const format of ["story", "portrait"] as const) {
    const physical = writingSocialPostLayout(format, 1, "de", source.articleTitle, true);
    const reading = physical.readability;
    assert.ok(reading);
    assert.ok(physical.bodyHeight > reading.maxBodyHeight);
    assert.equal(physical.bodyBottom + 24, physical.footerTop);
    const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { blocks: blocks.slice(0, 1).map((block) => ({ ...block, separatorBefore: "" })), cardIndex: 1, cardTotal: 2, copy: writingShareDictionaries.de, format, source, text: blocks[0].text }));
    assert.ok(html.includes(`--writing-carousel-block-gap:${carouselExportLength(reading.blockGap)}`));
    assert.ok(html.includes(`--writing-social-highlight-gap:${carouselExportLength(reading.highlightGap)}`));
  }
});

test("each highlight has a strict six-line/five-line context limit and cannot be surrounded by ordinary copy", () => {
  for (const format of ["story", "portrait"] as const) {
    const reading = writingSocialPostReadabilityByFormat[format];
    for (const editorialType of ["keyThought", "pullQuote", "shareable"] as const) {
      const highlight = { kind: editorialType === "pullQuote" ? "quote" as const : "paragraph" as const, editorialType, text: "An authored highlight.", separatorBefore: "" };
      const context = { kind: "paragraph" as const, text: Array(reading.highlightBodyMaxLines).fill("Context.").join("\n"), separatorBefore: "\n\n" };
      assert.equal(writingCarouselSegmentFits([highlight, context], format, "socialPost", "de", 1, source), true);
      assert.equal(writingCarouselSegmentFits([highlight, { ...context, text: context.text + "\nOne more line." }], format, "socialPost", "de", 1, source), false);
      assert.equal(writingCarouselSegmentFits([{ ...context, text: "Before." }, highlight, { ...context, text: "After." }], format, "socialPost", "de", 1, source), false);
      assert.equal(writingCarouselSegmentFits([highlight, { ...highlight, separatorBefore: "\n\n" }], format, "socialPost", "de", 1, source), false);
    }
  }
});

test("equally sized reading carousels prefer one adjacent short context block per highlight", () => {
  const authored = [{ kind: "paragraph" as const, text: "Opening context." }, { kind: "paragraph" as const, text: "Another context." }, { kind: "paragraph" as const, editorialType: "keyThought" as const, text: "The authored thought." }, { kind: "paragraph" as const, text: "Following context." }];
  const canonical = authored.map((block) => block.text).join("\n\n");
  for (const format of ["story", "portrait"] as const) {
    const result = segmentWritingThought(canonical, format, "socialPost", "de", { ...source, blocks: authored });
    assert.equal(result.status, "ready");
    if (result.status !== "ready") continue;
    assert.equal(reconstructWritingThought(result.segments), canonical);
    assert.equal(result.segments.length, 2);
    const highlight = result.segments.find((segment) => segment.blocks.some((block) => block.editorialType));
    assert.equal(highlight?.blocks.filter((block) => !block.editorialType).length, 1);
  }
});

test("long uninterrupted paragraphs split losslessly within the reading limit", () => {
  const canonical = "Kontext verstehen und Entscheidungen erklären. ".repeat(35).trim() + "\nEin bewusst gesetzter Umbruch bleibt erhalten.";
  for (const format of ["story", "portrait"] as const) {
    const result = segmentWritingThought(canonical, format, "socialPost", "de", { ...source, blocks: [{ kind: "paragraph", text: canonical }] });
    assert.equal(result.status, "ready");
    if (result.status !== "ready") continue;
    assert.equal(reconstructWritingThought(result.segments), canonical);
    assert.ok(result.segments.length > 1);
    for (const segment of result.segments) for (const block of segment.blocks) for (const line of block.text.split("\n")) {
      assert.ok(estimatedBlockLineCount(line, block.kind, format, "socialPost", "de", block) <= writingSocialPostReadabilityByFormat[format].paragraphMaxLines);
    }
  }
});
