import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { WritingSocialPostCard } from "../components/writing/share/social-post-card";
import { ShareCard } from "../components/writing/share/share-card";
import { writingShareDictionaries } from "../data/i18n/writing-share";
import { availableCarouselBodyHeight, carouselExportLength, carouselLayoutByFormat, estimatedBlockLineCount, writingSocialPostLayout, writingSocialPostReadabilityByFormat, writingSocialStory, writingStoryBalance } from "../lib/writing/carousel-layout";
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
    assert.equal(continuation.contentOffset, format === "story" ? writingSocialStory.contentOffset : 0);
    assert.equal(continuation.bodyTop, continuation.identityTop + (format === "story" ? writingSocialStory.headerHeight : layout.headerHeight) + continuation.gap + continuation.contentOffset);
    assert.ok(Math.abs(first.bodyTop - continuation.bodyTop - first.titleHeight - first.gap) < 0.001);
    for (const region of [first, continuation]) {
      assert.equal(region.bodyTop + region.contentHeight + region.gap, region.footerTop);
      assert.equal(region.footerTop + (format === "story" ? writingSocialStory.footerHeight + writingSocialStory.bottom : layout.footerHeight + region.inset), layout.height);
      assert.equal(region.bodyHeight, region.contentHeight);
      assert.equal(region.gap, format === "story" ? writingSocialStory.gap : 24);
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
      const region = writingSocialPostLayout(format, index, "de", source.articleTitle, true, segment.blocks);
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
    if (format === "portrait") assert.deepEqual(result.segments.flatMap((segment) => segment.blocks).map((block) => block.text), blocks.map((block) => block.text), "real authored Feed paragraphs remain whole");
    if (format === "square") assert.equal(result.segments.length, 12);
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

test("Story has a modestly higher reading budget while Feed and Square retain their accepted profiles", () => {
  assert.deepEqual(writingSocialPostReadabilityByFormat.story, { maxBodyHeight: 1150, blockGap: 64, highlightGap: 64, maxWords: 100, maxBlocks: 8, paragraphMaxLines: 6, highlightBodyMaxLines: 6, preferredHighlightBodyBlocks: 1 });
  assert.deepEqual(writingSocialPostReadabilityByFormat.portrait, { maxBodyHeight: 800, blockGap: 30, highlightGap: 44, maxWords: 80, maxBlocks: 7, paragraphMaxLines: 7, highlightBodyMaxLines: 5, preferredHighlightBodyBlocks: 1 });
  assert.equal(writingSocialPostReadabilityByFormat.square, null);
  for (const format of ["story", "portrait"] as const) {
    const physical = writingSocialPostLayout(format, 1, "de", source.articleTitle, true);
    const reading = physical.readability;
    assert.ok(reading);
    if (format === "portrait") assert.ok(physical.bodyHeight > reading.maxBodyHeight);
    else assert.equal(physical.bodyHeight, 1140);
    assert.equal(physical.bodyBottom + physical.gap, physical.footerTop);
    const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { blocks: blocks.slice(0, 1).map((block) => ({ ...block, separatorBefore: "" })), cardIndex: 1, cardTotal: 2, copy: writingShareDictionaries.de, format, source, text: blocks[0].text }));
    assert.ok(html.includes(`--writing-carousel-block-gap:${carouselExportLength(reading.blockGap)}`));
    assert.ok(html.includes(`--writing-social-highlight-gap:${carouselExportLength(reading.highlightGap)}`));
  }
});

test("locked Social Story leaves the accepted Editorial balance and every other format intact", () => {
  assert.deepEqual(writingStoryBalance, { contentOffset: 160, highlightMaxOffset: 240, editorialArticleBodyHeight: 950, editorialTitlePreludeHeight: 42 });
  const selected = blocks.slice(0, 1).map((block) => ({ ...block, separatorBefore: "" }));
  for (const cardIndex of [0, 1]) {
    const props = { blocks: selected, cardIndex, cardTotal: 2, format: "story" as const, source, text: selected[0].text };
    const editorial = renderToStaticMarkup(createElement(ShareCard, { ...props, sourceLabel: "Writing", variant: "editorial" }));
    const social = renderToStaticMarkup(createElement(WritingSocialPostCard, { ...props, copy: writingShareDictionaries.de }));
    assert.ok(editorial.includes(`--writing-carousel-content-start-gap:${carouselExportLength(48 + 160)}`));
    assert.ok(editorial.includes(`--writing-carousel-body-zone-height:${carouselExportLength(availableCarouselBodyHeight("story", cardIndex, "de", source.articleTitle, true, "editorial"))}`));
    assert.ok(social.includes(`--writing-social-header-region-height:${carouselExportLength(writingSocialStory.headerHeight + writingSocialStory.contentOffset)}`));
    const region = writingSocialPostLayout("story", cardIndex, "de", source.articleTitle, true);
    assert.equal(region.identityTop, 176);
    assert.equal(region.footerTop, 1608);
    assert.equal(region.bodyBottom, 1568);
  }
  assert.equal(availableCarouselBodyHeight("story", 1, "de", source.articleTitle, true, "editorial"), 950);
  for (const format of writingShareFormats) for (const variant of ["editorial", "marginNote", "statement"] as const) {
    if (format === "story" && variant === "editorial") continue;
    const html = renderToStaticMarkup(createElement(ShareCard, { blocks: selected, cardIndex: 1, cardTotal: 2, format, source, sourceLabel: "Writing", text: selected[0].text, variant }));
    assert.ok(!html.includes("--writing-carousel-content-start-gap"));
    assert.equal(availableCarouselBodyHeight(format, 1, "de", source.articleTitle, true, variant), carouselLayoutByFormat[format].bodyHeight - carouselLayoutByFormat[format].bodyBottomSafety);
  }
  const css = readFileSync(new URL("../components/writing/share/social-post-card.css", import.meta.url), "utf8");
  assert.match(css, /data-format="story"\]\[data-variant="editorial"\][^}]*padding-top: var\(--writing-carousel-content-start-gap\)/u);
  assert.match(css, /data-format="story"\] \.social-post-identity \{ align-self: start; height: var\(--social-post-header-zone-min-height\)/u);
});

test("Story highlights start in the consistent reading region and retain footer protection", () => {
  const highlight = { kind: "paragraph" as const, editorialType: "keyThought" as const, text: "A short authored thought.", separatorBefore: "" };
  const short = writingSocialPostLayout("story", 1, "de", source.articleTitle, true, [highlight]);
  assert.equal(short.contentOffset, 112);
  assert.equal(short.bodyTop, 428);
  assert.equal(short.bodyBottom, 1568);
  assert.equal(writingSocialPostLayout("story", 0, "de", source.articleTitle, true, [highlight]).contentOffset, 112, "title cards use the same intentional prelude");
  const height = estimatedCarouselBlocksHeight([highlight], "story", "socialPost", "de");
  assert.ok(height <= short.bodyHeight);
  const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { blocks: [highlight], cardIndex: 1, cardTotal: 2, format: "story", source, copy: writingShareDictionaries.de, text: highlight.text }));
  assert.ok(html.includes(`--writing-social-header-region-height:${carouselExportLength(100 + short.contentOffset)}`));
  const real = segmentWritingThought(text, "story", "socialPost", "de", source);
  assert.equal(real.status, "ready");
  if (real.status !== "ready") return;
  real.segments.forEach((segment, index) => {
    const region = writingSocialPostLayout("story", index, "de", source.articleTitle, true, segment.blocks);
    const occupied = estimatedCarouselBlocksHeight(segment.blocks, "story", "socialPost", "de");
    assert.ok(occupied <= region.bodyHeight);
    assert.equal(region.contentOffset, 112);
    assert.equal(availableCarouselBodyHeight("story", index, "de", source.articleTitle, true, "socialPost", segment.blocks), region.bodyHeight);
    assert.ok(writingCarouselSegmentFits(segment.blocks, "story", "socialPost", "de", index, source));
  });
  for (const format of ["portrait", "square"] as const) assert.equal(writingSocialPostLayout(format, 1, "de", source.articleTitle, true, [highlight]).contentOffset, 0);
});

test("locked Story branding is bounded across the whole real carousel with five truthful windowed dots", () => {
  const result = segmentWritingThought(text, "story", "socialPost", "de", source);
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(reconstructWritingThought(result.segments), text);
  for (const [index, segment] of result.segments.entries()) {
    const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { blocks: segment.blocks, cardIndex: index, cardTotal: result.segments.length, copy: writingShareDictionaries.de, format: "story", source, text: segment.text }));
    assert.equal((html.match(/data-story-bubble=/gu) ?? []).length, 2);
    assert.equal((html.match(/data-active="true"/gu) ?? []).length, 1, `active dot on page ${index + 1}`);
    assert.equal((html.match(/<i(?: |\/|>)/gu) ?? []).length, 5, "compact five-position window");
    assert.ok(html.includes(`${String(index + 1).padStart(2, "0")} / ${String(result.segments.length).padStart(2, "0")}`));
    assert.ok(html.includes(`--writing-carousel-body-font-size:${carouselExportLength(46)}`));
    assert.ok(html.includes(`--writing-story-right:${carouselExportLength(144)}`));
    assert.doesNotMatch(html, /writing-post-frame|writing-post-accent/u);
    const region = writingSocialPostLayout("story", index, "de", source.articleTitle, true, segment.blocks);
    assert.equal(region.identityTop, 176);
    assert.equal(region.bodyBottom, 1568);
    assert.equal(region.footerTop + 184, 1920 - 128);
    assert.ok(estimatedCarouselBlocksHeight(segment.blocks, "story", "socialPost", "de") <= region.bodyHeight);
  }
  for (const format of ["portrait", "square"] as const) {
    const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { cardIndex: 0, cardTotal: 2, copy: writingShareDictionaries.de, format, source, text: blocks[0].text }));
    assert.doesNotMatch(html, /writing-story-(?:bubble|dots|right)/u);
    assert.match(html, /writing-post-frame/u);
  }
  const single = renderToStaticMarkup(createElement(WritingSocialPostCard, { cardIndex: 0, cardTotal: 1, copy: writingShareDictionaries.de, format: "story", source, text: "Short authored copy." }));
  assert.doesNotMatch(single, /writing-story-dots|data-zone="indicator"/u);
});

test("every Story card uses the existing localized article reading time, with other formats unchanged", () => {
  for (const [language, copy] of Object.entries(writingShareDictionaries)) {
    const result = segmentWritingThought(text, "story", "socialPost", source.language, source);
    assert.equal(result.status, "ready");
    if (result.status !== "ready") continue;
    for (const [index, segment] of result.segments.entries()) {
      const props = { blocks: segment.blocks, cardIndex: index, cardTotal: result.segments.length, copy, format: "story" as const, source, text: segment.text };
      const html = renderToStaticMarkup(createElement(WritingSocialPostCard, props));
      const expected = copy.readingTime.replace("{minutes}", String(source.readingMinutes));
      assert.ok(html.includes(`<div class="social-post-metadata"><span>${expected}</span></div>`), `${language} reading time on Story page ${index + 1}`);
      const absent = renderToStaticMarkup(createElement(WritingSocialPostCard, { ...props, source: { ...source, readingMinutes: undefined } }));
      assert.doesNotMatch(absent, /class="social-post-metadata"/u, "no invented reading time when source has none");
      assert.equal(html.replace(/<div class="social-post-metadata">.*?<\/div>/u, '<span aria-hidden="true"></span>'), absent, "reading time changes only footer metadata");
    }
    for (const format of ["portrait", "square"] as const) for (const cardIndex of [0, 1, 15]) {
      const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { cardIndex, cardTotal: 16, copy, format, source, text: blocks[0].text }));
      assert.equal(html.includes('class="social-post-metadata"'), cardIndex === 0, `${language}/${format} retains first-card-only reading time`);
    }
  }
  const css = readFileSync(new URL("../components/writing/share/social-post-card.css", import.meta.url), "utf8");
  const selector = '.social-post-card[data-writing-card="true"][data-style="social-post"][data-format="story"]';
  const metadata = css.split(`${selector} .social-post-metadata {`)[1]?.split("}")[0];
  assert.ok(metadata);
  assert.match(metadata, /position: absolute; left: 0; bottom: 0;/u);
  assert.match(metadata, /line-height: 2\.962963cqw/u, "same footer line height as domain");
  assert.match(metadata, /white-space: nowrap/u);
});

test("Story's larger typography reserves proportionate space for three-digit authored list markers", () => {
  const list = { kind: "listItem" as const, listStyle: "ordered" as const, listNumber: 123, depth: 2, text: "Die Reihenfolge und Verschachtelung bleiben erhalten.", separatorBefore: "" };
  const html = renderToStaticMarkup(createElement(WritingSocialPostCard, { blocks: [list], cardIndex: 1, cardTotal: 2, copy: writingShareDictionaries.de, format: "story", source, text: list.text }));
  assert.ok(html.includes(`--writing-story-list-marker-scale:${46 / 34}`));
  assert.match(html, />123\.<\/span>/u);
  assert.match(html, /data-depth="2"/u);
  assert.ok(writingCarouselSegmentFits([list], "story", "socialPost", "de", 1, source));
  const css = readFileSync(new URL("../components/writing/share/social-post-card.css", import.meta.url), "utf8");
  assert.match(css, /grid-template-columns: calc\(var\(--writing-card-list-marker-width\) \* var\(--writing-story-list-marker-scale\)\)/u);
});

test("real Feed/Square pagination keeps every accepted boundary in both Writing styles", () => {
  const accepted = {
    portrait: {
      editorial: [219,254,231,304,294,317,257,232,246,317,324,173,279,295,266,232,254],
      socialPost: [376,330,322,414,179,361,362,91,437,408,126,340,266,232,254],
    },
    square: {
      editorial: [219,254,110,251,209,257,249,181,246,145,229,264,250,180,214,139,230,339,206,317],
      socialPost: [376,370,382,428,372,275,477,379,355,340,500,254],
    },
  };
  for (const format of ["portrait", "square"] as const) for (const composition of ["editorial", "socialPost"] as const) {
    const result = segmentWritingThought(text, format, composition, "de", source);
    assert.equal(result.status, "ready");
    if (result.status !== "ready") continue;
    assert.equal(reconstructWritingThought(result.segments), text);
    assert.deepEqual(result.segments.map((segment) => segment.text.length), accepted[format][composition]);
  }
});

test("the rebalance modestly increases Editorial occupancy without losing authored semantics", () => {
  const result = segmentWritingThought(text, "story", "editorial", "de", source);
  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;
  assert.equal(result.segments.length, 9, "accepted readable baseline had eleven Editorial Story cards");
  assert.equal(reconstructWritingThought(result.segments), text);
  assert.deepEqual(segmentWritingThought(text, "story", "editorial", "de", source), result);
  result.segments.forEach((segment, index) => assert.ok(writingCarouselSegmentFits(segment.blocks, "story", "editorial", "de", index, source)));
  for (const type of ["keyThought", "pullQuote", "shareable"] as const) assert.deepEqual(result.segments.flatMap((segment) => segment.blocks).filter((block) => block.editorialType === type).map((block) => block.text), blocks.filter((block) => block.editorialType === type).map((block) => block.text));
});

test("the larger Editorial Story budget also reserves the actual height of very long titles", () => {
  const title = Array(17).fill("WWWWWWWWWWWWWWW").join(" ");
  const first = availableCarouselBodyHeight("story", 0, "de", title, true, "editorial");
  assert.ok(first > 46 && first < 552, "the real title reduces the nominal reading budget before the protected footer");
  const body = "Der vollständige Text bleibt erhalten. ".repeat(24).trim();
  const result = segmentWritingThought(body, "story", "editorial", "de", { kind: "article", articleTitle: title });
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.equal(reconstructWritingThought(result.segments), body);
    assert.ok(result.segments.length > 1, "the safe first-page capacity paginates the authored paragraph");
    result.segments.forEach((segment, index) => assert.ok(writingCarouselSegmentFits(segment.blocks, "story", "editorial", "de", index, { kind: "article", articleTitle: title })));
  }
  const impossible = segmentWritingThought(body, "story", "editorial", "de", { kind: "article", articleTitle: title.repeat(5) });
  assert.equal(impossible.status, "tooLong");
  assert.equal(impossible.canonicalText, body);
  assert.deepEqual(impossible.segments, []);
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
