import type { CSSProperties } from "react";

import { availableCarouselBodyHeight, carouselExportLength, carouselLayoutByFormat, carouselListMarkerWidth, carouselTitleFontSize, carouselTypographyByComposition } from "@/lib/writing/carousel-layout";
import { writingShareTextScale } from "@/lib/writing/share-segmentation";
import type { WritingCarouselBlock, WritingShareFormat, WritingShareSource, WritingShareVariant } from "@/types/writing";

/** Shared only by the two Writing compositions; decorations are real DOM for PNG capture. */
export function WritingCardBlocks({ blocks }: { blocks: WritingCarouselBlock[] }) {
  return <div className="writing-card-blocks">{blocks.map((block, index) => {
    const Heading = block.headingLevel === 3 ? "h3" : "h2";
    const content = block.kind === "heading"
      ? <Heading className="writing-card-heading" data-heading-level={block.headingLevel ?? 2}>{block.text}</Heading>
      : block.kind === "quote"
        ? <blockquote className="writing-card-quote" data-editorial-type={block.editorialType}>{block.text}</blockquote>
        : block.kind === "listItem"
          ? <p className="writing-card-list" data-list-style={block.listStyle ?? "unordered"} style={{ "--writing-card-list-marker-width": carouselExportLength(carouselListMarkerWidth(block)) } as CSSProperties}><span aria-hidden="true">{block.continuation ? "" : block.listStyle === "ordered" ? `${block.listNumber ?? 1}.` : "•"}</span><span>{block.text}</span></p>
          : <p className="writing-share-card-article-body" data-editorial-type={block.editorialType}>{block.text}</p>;
    return <div key={index} className="writing-card-block" data-block-kind={block.kind} data-depth={block.depth ?? 0} data-highlight={block.editorialType} style={{ marginLeft: carouselExportLength((block.depth ?? 0) * 28) }}>
      {block.dividersBefore?.map((depth, divider) => <hr key={`before-${divider}`} className="writing-card-divider" style={{ marginLeft: carouselExportLength((depth - (block.depth ?? 0)) * 28) }} />)}
      {content}
      {block.dividersAfter?.map((depth, divider) => <hr key={`after-${divider}`} className="writing-card-divider" style={{ marginLeft: carouselExportLength((depth - (block.depth ?? 0)) * 28) }} />)}
    </div>;
  })}</div>;
}

export function ShareCard({
  blocks,
  cardIndex,
  cardTotal,
  format,
  source,
  sourceLabel,
  text,
  variant,
}: {
  blocks?: WritingCarouselBlock[];
  cardIndex: number;
  cardTotal: number;
  format: WritingShareFormat;
  source: WritingShareSource;
  sourceLabel: string;
  text: string;
  variant: WritingShareVariant;
}) {
  const scale = writingShareTextScale(text, variant, source.language);
  const progression = cardTotal > 1 ? `${String(cardIndex + 1).padStart(2, "0")} / ${String(cardTotal).padStart(2, "0")}` : null;
  const firstSlide = cardIndex === 0;
  const articleBlocks: WritingCarouselBlock[] = blocks?.length ? blocks : [{ kind: "paragraph", separatorBefore: "", text }];
  const layout = carouselLayoutByFormat[format];
  const typography = carouselTypographyByComposition[variant];
  const fitStyle = {
    "--writing-carousel-safe-margin": carouselExportLength(layout.safeMargin),
    "--writing-carousel-body-width": carouselExportLength(layout.bodyWidth),
    "--writing-carousel-title-font-size": carouselExportLength(carouselTitleFontSize(source.articleTitle, source.language)),
    "--writing-carousel-header-height": carouselExportLength(layout.headerHeight),
    "--writing-carousel-body-zone-height": carouselExportLength(availableCarouselBodyHeight(format, cardIndex, source.language, source.articleTitle, source.kind === "article")),
    "--writing-carousel-footer-height": carouselExportLength(layout.footerHeight),
    "--writing-carousel-title-body-gap": carouselExportLength(layout.titleBodyGap),
    "--writing-carousel-body-font-size": carouselExportLength(typography.bodyFontSize),
    "--writing-carousel-body-line-height": carouselExportLength(typography.bodyLineHeight),
    "--writing-carousel-body-weight": typography.bodyWeight,
    "--writing-carousel-heading-font-size": carouselExportLength(typography.headingFontSize),
    "--writing-carousel-heading-line-height": carouselExportLength(typography.headingLineHeight),
    "--writing-carousel-heading-weight": typography.headingWeight,
    "--writing-carousel-block-gap": carouselExportLength(typography.blockGap),
    "--writing-carousel-heading-gap": carouselExportLength(typography.headingGap),
    "--writing-carousel-list-gap": carouselExportLength(typography.listGap),
    "--writing-carousel-quote-gap": carouselExportLength(typography.quoteGap),
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className="writing-share-card"
      data-format={format}
      data-writing-card="true"
      data-content={source.kind ?? "thought"}
      data-continuation={firstSlide ? undefined : "true"}
      data-scale={scale}
      data-title-scale={source.kind === "article" ? writingShareTextScale(source.articleTitle, variant, source.language) : undefined}
      data-variant={variant}
      style={fitStyle}
    >
      <div className="writing-share-card-safe-area">
        <header className="writing-share-card-header">
          <span className="writing-share-card-marker">BTS / {sourceLabel}</span>
          {progression ? <span className="writing-share-card-progress">{progression}</span> : null}
        </header>
        <div className="writing-share-card-content" data-zone="content">
          {variant === "marginNote" ? <span className="writing-share-card-note-label">FIELD NOTE</span> : null}
          {source.kind === "article" && firstSlide ? (
            <>
              <p className="writing-share-card-article-kicker">A BTS WRITING</p>
              <p className="writing-share-card-article-title" data-zone="title">{source.articleTitle}</p>
            </>
          ) : null}
          <div className="writing-share-card-article-content" data-zone="body"><WritingCardBlocks blocks={articleBlocks} /></div>
        </div>
        <footer className="writing-share-card-footer" data-zone="footer">
          <div className="min-w-0">
            <p className="writing-share-card-author">{source.authorName}</p>
            <p className="writing-share-card-title">{source.kind === "article" ? sourceLabel : source.articleTitle}</p>
          </div>
          <p className="writing-share-card-domain">{source.domain}</p>
        </footer>
      </div>
    </div>
  );
}
